import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Client, StorageMemory } from "https://esm.sh/jsr/@mtkruto/mtkruto@0.71.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accountId, phoneCode, twoFactorPassword } = await req.json();
    
    console.log('Telegram auth request:', { action, accountId });

    // Получаем аккаунт из базы данных
    const { data: account, error: accountError } = await supabase
      .from('telegram_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('Account not found:', accountError);
      return new Response(
        JSON.stringify({ error: 'Аккаунт не найден' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем наличие API ID и Hash
    if (!account.api_id || !account.api_hash) {
      return new Response(
        JSON.stringify({ error: 'API ID и API Hash не заданы для аккаунта' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    switch (action) {
      case 'send_code':
        result = await sendCode(account);
        break;
      case 'verify_code':
        result = await verifyCode(account, phoneCode);
        break;
      case 'verify_2fa':
        result = await verify2FA(account, twoFactorPassword);
        break;
      case 'test_connection':
        result = await testConnection(account);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Неизвестное действие' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const status = result && result.error && result.error !== 'FLOOD_WAIT' ? 400 : 200;
    return new Response(
      JSON.stringify(result),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in telegram-auth function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера: ' + errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createTelegramClient(account: any): Promise<Client> {
  console.log('Creating Telegram client for account:', account.phone_number);
  
  const client = new Client({
    storage: new StorageMemory(),
    apiId: account.api_id,
    apiHash: account.api_hash,
  });

  return client;
}

async function sendCode(account: any) {
  try {
    console.log('Initiating auth for account:', account.phone_number);

    const client = await createTelegramClient(account);
    await client.connect();

    try {
      // Явно запрашиваем код и сохраняем phone_code_hash, чтобы потом не отправлять код повторно
      const sent: any = await client.invoke({
        _: 'auth.sendCode',
        phone_number: account.phone_number,
        api_id: account.api_id,
        api_hash: account.api_hash,
        settings: { _: 'codeSettings' }
      });

      // Если неожиданно вернулась готовая авторизация
      if (sent && sent.authorization) {
        const me = await client.getMe();
        await supabase
          .from('telegram_accounts')
          .update({
            status: 'active',
            session_data: JSON.stringify({
              step: 'authorized',
              user_id: me?.id ?? null,
              username: me?.username ?? null,
              first_name: me?.firstName ?? null,
              timestamp: Date.now()
            })
          })
          .eq('id', account.id);

        await supabase.from('activities').insert([{
          user_id: account.user_id,
          type: 'account_authorized',
          description: `Аккаунт ${account.phone_number} уже авторизован`
        }]);

        return { success: true, message: 'Аккаунт уже авторизован', nextStep: 'completed' };
      }

      const phoneCodeHash = sent?.phone_code_hash;

      await supabase
        .from('telegram_accounts')
        .update({
          status: 'waiting',
          last_auth_attempt: new Date().toISOString(),
          session_data: JSON.stringify({
            step: 'code_sent',
            phone: account.phone_number,
            phone_code_hash: phoneCodeHash,
            timestamp: Date.now()
          })
        })
        .eq('id', account.id);

      await supabase.from('activities').insert([{
        user_id: account.user_id,
        type: 'auth_code_sent',
        description: `SMS код отправлен на ${account.phone_number}`
      }]);

      return {
        success: true,
        message: `Код отправлен на номер ${account.phone_number}. Введите SMS код.`,
        nextStep: 'verify_code'
      };
    } catch (startError) {
      const msg = startError instanceof Error ? startError.message : String(startError);
      console.log('sendCode error:', msg);

      const flood = /FLOOD_WAIT_(\d+)/.exec(msg);
      if (flood) {
        const waitSeconds = parseInt(flood[1], 10);
        return {
          error: 'FLOOD_WAIT',
          waitSeconds,
          message: `Слишком много попыток. Подождите ${Math.ceil(waitSeconds / 60)} мин. и попробуйте снова.`
        };
      }

      if (msg.includes('PHONE_NUMBER_INVALID')) {
        return { error: 'Неверный номер телефона' };
      }

      throw startError;
    }
  } catch (error) {
    console.error('Error in sendCode:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const flood = /FLOOD_WAIT_(\d+)/.exec(errorMessage);
    if (flood) {
      const waitSeconds = parseInt(flood[1], 10);
      return {
        error: 'FLOOD_WAIT',
        waitSeconds,
        message: `Слишком много попыток. Подождите ${Math.ceil(waitSeconds / 60)} мин. и попробуйте снова.`
      };
    }
    return { error: 'Не удалось инициировать авторизацию: ' + errorMessage };
  }
}

async function verifyCode(account: any, phoneCode: string) {
  try {
    console.log('Verifying code for account:', account.phone_number, 'Code:', phoneCode);
    
    if (!phoneCode || phoneCode.length !== 5) {
      return {
        error: 'Введите правильный SMS код (5 цифр)'
      };
    }

    // Проверяем, что процесс авторизации был инициирован
    let sessionData: any = {};
    try {
      sessionData = JSON.parse(account.session_data || '{}');
    } catch {
      return {
        error: 'Данные сессии повреждены. Начните авторизацию заново.'
      };
    }

    if (sessionData.step !== 'code_sent' || !sessionData.phone_code_hash) {
      return {
        error: 'Неверное состояние авторизации. Сначала запросите код.'
      };
    }

    // Создаем клиент 
    const client = await createTelegramClient(account);
    await client.connect();

    try {
      // Авторизуемся напрямую без повторной отправки SMS
      const signIn: any = await client.invoke({
        _: 'auth.signIn',
        phone_number: account.phone_number,
        phone_code_hash: sessionData.phone_code_hash,
        phone_code: phoneCode,
      });

      // Проверяем успешность авторизации
      const me = await client.getMe();
      
      if (me) {
        // Авторизация успешна
        await supabase
          .from('telegram_accounts')
          .update({ 
            status: 'active',
            session_data: JSON.stringify({
              step: 'authorized',
              user_id: me.id,
              username: me.username || null,
              first_name: me.firstName,
              timestamp: Date.now()
            })
          })
          .eq('id', account.id);

        await supabase.from('activities').insert([{
          user_id: account.user_id,
          type: 'account_authorized',
          description: `Аккаунт ${account.phone_number} успешно авторизован`
        }]);

        return {
          success: true,
          message: 'Аккаунт успешно авторизован!',
          nextStep: 'completed'
        };
      }
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : String(authError);
      console.log('Auth error:', errorMessage);
      
      if (
        errorMessage.includes('SESSION_PASSWORD_NEEDED') ||
        errorMessage.toLowerCase().includes('password')
      ) {
        // Требуется 2FA — сохраняем состояние
        await supabase
          .from('telegram_accounts')
          .update({ 
            session_data: JSON.stringify({
              step: 'awaiting_2fa',
              phone: account.phone_number,
              code: phoneCode,
              phone_code_hash: sessionData.phone_code_hash,
              timestamp: Date.now()
            })
          })
          .eq('id', account.id);

        return {
          success: true,
          message: 'SMS код подтвержден. Введите пароль двухфакторной аутентификации',
          nextStep: 'verify_2fa'
        };
      }

      // Обрабатываем ограничение FLOOD_WAIT
      const flood = /FLOOD_WAIT_(\d+)/.exec(errorMessage);
      if (flood) {
        const waitSeconds = parseInt(flood[1], 10);
        return {
          error: 'FLOOD_WAIT',
          waitSeconds,
          message: `Слишком много попыток. Подождите ${Math.ceil(waitSeconds / 60)} мин. и попробуйте снова.`
        };
      }

      // Проверяем на неверный код
      if (
        errorMessage.includes('PHONE_CODE_INVALID') ||
        errorMessage.includes('PHONE_CODE_EXPIRED') ||
        errorMessage.toLowerCase().includes('invalid')
      ) {
        return {
          error: 'Неверный или просроченный SMS код. Проверьте код и попробуйте снова.'
        };
      }
      
      throw authError;
    }

    return {
      error: 'Не удалось завершить авторизацию'
    };

  } catch (error) {
    console.error('Error verifying code:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: 'Ошибка при проверке кода: ' + errorMessage
    };
  }
}

async function verify2FA(account: any, twoFactorPassword: string) {
  try {
    console.log('Verifying 2FA for account:', account.phone_number);
    
    if (!twoFactorPassword || twoFactorPassword.length < 4) {
      return {
        error: 'Введите пароль двухфакторной аутентификации'
      };
    }

    // Получаем сохраненные данные сессии
    let sessionData;
    try {
      sessionData = JSON.parse(account.session_data || '{}');
    } catch {
      return {
        error: 'Данные сессии повреждены. Начните авторизацию заново.'
      };
    }

    if (sessionData.step !== 'awaiting_2fa') {
      return {
        error: 'Неверное состояние авторизации. Начните заново.'
      };
    }

    // Создаем новый клиент
    const client = await createTelegramClient(account);
    await client.connect();

    try {
      await client.start({
        phone: () => account.phone_number,
        code: () => sessionData.code,
        password: () => twoFactorPassword
      });

      const me = await client.getMe();
      
      if (me) {
        await supabase
          .from('telegram_accounts')
          .update({ 
            status: 'active',
            session_data: JSON.stringify({
              step: 'authorized',
              user_id: me.id,
              username: me.username || null,
              first_name: me.firstName,
              timestamp: Date.now()
            })
          })
          .eq('id', account.id);

        await supabase.from('activities').insert([{
          user_id: account.user_id,
          type: 'account_authorized',
          description: `Аккаунт ${account.phone_number} успешно авторизован с 2FA`
        }]);

        return {
          success: true,
          message: 'Аккаунт успешно авторизован с двухфакторной аутентификацией!',
          nextStep: 'completed'
        };
      }
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : String(authError);
      console.error('2FA auth error:', errorMessage);
      
      if (errorMessage.includes('password') || errorMessage.includes('invalid')) {
        return {
          error: 'Неверный пароль двухфакторной аутентификации'
        };
      }

      // Обрабатываем ограничение FLOOD_WAIT как ожидаемую ситуацию (200 OK)
      const flood = /FLOOD_WAIT_(\d+)/.exec(errorMessage);
      if (flood) {
        const waitSeconds = parseInt(flood[1], 10);
        return {
          error: 'FLOOD_WAIT',
          waitSeconds,
          message: `Слишком много попыток. Подождите ${Math.ceil(waitSeconds / 60)} мин. и попробуйте снова.`
        };
      }
      
      throw authError;
    }

    return {
      error: 'Не удалось завершить авторизацию с 2FA'
    };

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: 'Ошибка при проверке 2FA: ' + errorMessage
    };
  }
}

async function testConnection(account: any) {
  try {
    console.log('Testing connection for account:', account.phone_number);
    
    // Проверяем, что аккаунт авторизован
    if (account.status !== 'active') {
      return {
        error: 'Аккаунт не авторизован. Пройдите авторизацию сначала.'
      };
    }

    // Создаем клиент для отправки сообщения
    const client = await createTelegramClient(account);
    await client.connect();

    try {
      // Пытаемся восстановить сессию из сохраненных данных
      let sessionData;
      try {
        sessionData = JSON.parse(account.session_data || '{}');
      } catch {
        return {
          error: 'Данные сессии повреждены. Пройдите авторизацию заново.'
        };
      }

      if (sessionData.step !== 'authorized') {
        return {
          error: 'Аккаунт не авторизован. Пройдите авторизацию заново.'
        };
      }

      // Отправляем тестовое сообщение
      const message = await client.sendMessage('@dimitarius', 
        `🤖 Тестовое сообщение от аккаунта ${account.phone_number}\n\nВремя: ${new Date().toLocaleString('ru-RU')}\nСтатус: Авторизован через MTKruto`
      );

      await supabase.from('activities').insert([{
        user_id: account.user_id,
        type: 'test_message_sent',
        description: `Тестовое сообщение отправлено с аккаунта ${account.phone_number} для @dimitarius`
      }]);

      return {
        success: true,
        message: `Тестовое сообщение успешно отправлено! ID: ${message.id}`,
      };

    } catch (sendError) {
      console.error('Error sending test message:', sendError);
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
      
      // Если ошибка авторизации, предлагаем авторизоваться заново
      if (errorMessage.includes('AUTH') || errorMessage.includes('UNAUTHORIZED')) {
        await supabase
          .from('telegram_accounts')
          .update({ status: 'waiting' })
          .eq('id', account.id);
          
        return {
          error: 'Сессия истекла. Пройдите авторизацию заново.'
        };
      }
      
      return {
        error: `Не удалось отправить сообщение: ${errorMessage}`
      };
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: 'Ошибка при тестировании соединения: ' + errorMessage
    };
  }
}