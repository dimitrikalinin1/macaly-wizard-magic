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

// Хранилище активных клиентов
const activeClients = new Map<string, Client>();

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

    const status = result.error ? 400 : 200;
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

async function getOrCreateClient(account: any): Promise<Client> {
  const clientKey = account.id;
  
  if (activeClients.has(clientKey)) {
    return activeClients.get(clientKey)!;
  }

  // Создаем новый клиент MTKruto
  const client = new Client({
    storage: new StorageMemory(),
    apiId: account.api_id,
    apiHash: account.api_hash,
  });

  activeClients.set(clientKey, client);
  return client;
}

async function sendCode(account: any) {
  try {
    console.log('Sending code for account:', account.phone_number);
    
    const client = await getOrCreateClient(account);
    
    // Подключаемся к Telegram и запрашиваем код
    await client.connect();
    
    // Начинаем процесс авторизации
    const authPromise = client.start({
      phone: () => account.phone_number,
      code: () => {
        // Возвращаем Promise, который будет резолвиться когда придет код
        return new Promise((resolve) => {
          // Сохраняем resolver для последующего использования
          (client as any)._codeResolver = resolve;
        });
      },
      password: () => {
        return new Promise((resolve) => {
          (client as any)._passwordResolver = resolve;
        });
      }
    });

    // Запускаем авторизацию в фоне и сразу возвращаем результат
    authPromise.catch((error) => {
      // Ошибка ожидается - это означает что нужен код
      console.log('Code requested, error expected:', error);
    });

    // Даем небольшую задержку для инициализации
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Обновляем статус аккаунта
    await supabase
      .from('telegram_accounts')
      .update({ 
        status: 'waiting',
        last_auth_attempt: new Date().toISOString(),
        session_data: JSON.stringify({ step: 'code_requested' })
      })
      .eq('id', account.id);

    // Добавляем активность
    await supabase.from('activities').insert([{
      user_id: account.user_id,
      type: 'auth_code_sent',
      description: `SMS код запрошен для ${account.phone_number}`
    }]);

    return {
      success: true,
      message: `SMS код запрошен для ${account.phone_number}`,
      nextStep: 'verify_code'
    };

  } catch (error) {
    console.error('Error sending code:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: 'Не удалось запросить SMS код: ' + errorMessage
    };
  }
}

async function verifyCode(account: any, phoneCode: string) {
  try {
    console.log('Verifying code for account:', account.phone_number);
    
    if (!phoneCode || phoneCode.length !== 5) {
      return {
        error: 'Введите правильный SMS код (5 цифр)'
      };
    }

    const client = activeClients.get(account.id);
    if (!client) {
      return {
        error: 'Сессия авторизации истекла. Начните заново.'
      };
    }

    // Передаем код в MTKruto
    if ((client as any)._codeResolver) {
      (client as any)._codeResolver(phoneCode);
      delete (client as any)._codeResolver;

      // Ждем результат авторизации
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Даем время на обработку
        
        const me = await client.getMe().catch(() => null);
        
        if (me) {
          // Авторизация успешна
          await supabase
            .from('telegram_accounts')
            .update({ status: 'active' })
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
        } else {
          // Возможно нужен пароль 2FA
          return {
            success: true,
            message: 'SMS код подтвержден. Введите пароль двухфакторной аутентификации',
            nextStep: 'verify_2fa'
          };
        }
      } catch (error) {
        // Возможно нужен пароль 2FA
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('password') || errorMessage.includes('2FA')) {
          return {
            success: true,
            message: 'SMS код подтвержден. Введите пароль двухфакторной аутентификации',
            nextStep: 'verify_2fa'
          };
        }
        throw error;
      }
    } else {
      return {
        error: 'Неверное состояние авторизации'
      };
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: 'Не удалось проверить SMS код: ' + errorMessage
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

    const client = activeClients.get(account.id);
    if (!client) {
      return {
        error: 'Сессия авторизации истекла. Начните заново.'
      };
    }

    // Передаем пароль 2FA в MTKruto
    if ((client as any)._passwordResolver) {
      (client as any)._passwordResolver(twoFactorPassword);
      delete (client as any)._passwordResolver;

      // Ждем результат авторизации
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      const me = await client.getMe().catch(() => null);
      
      if (me) {
        await supabase
          .from('telegram_accounts')
          .update({ status: 'active' })
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
      } else {
        return {
          error: 'Не удалось авторизоваться с предоставленным паролем'
        };
      }
    } else {
      return {
        error: 'Неверное состояние авторизации'
      };
    }
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: 'Не удалось проверить пароль 2FA: ' + errorMessage
    };
  }
}

async function testConnection(account: any) {
  try {
    console.log('Testing connection for account:', account.phone_number);
    
    const client = activeClients.get(account.id);
    if (!client) {
      return {
        error: 'Аккаунт не авторизован. Пройдите авторизацию сначала.'
      };
    }

    // Проверяем, что клиент авторизован
    const me = await client.getMe().catch(() => null);
    if (!me) {
      return {
        error: 'Аккаунт не авторизован'
      };
    }

    // Отправляем тестовое сообщение @dimitarius
    try {
      const message = await client.sendMessage('@dimitarius', 
        `🤖 Тестовое сообщение от аккаунта ${account.phone_number}\n\nВремя: ${new Date().toLocaleString('ru-RU')}`
      );

      await supabase.from('activities').insert([{
        user_id: account.user_id,
        type: 'test_message_sent',
        description: `Тестовое сообщение отправлено с аккаунта ${account.phone_number} для @dimitarius`
      }]);

      return {
        success: true,
        message: `Тестовое сообщение успешно отправлено @dimitarius! ID сообщения: ${message.id}`,
      };
    } catch (sendError) {
      console.error('Error sending test message:', sendError);
      const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
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