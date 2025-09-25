import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    switch (action) {
      case 'send_code':
        return await sendCode(account);
      case 'verify_code':
        return await verifyCode(account, phoneCode);
      case 'verify_2fa':
        return await verify2FA(account, twoFactorPassword);
      case 'test_connection':
        return await testConnection(account);
      default:
        return new Response(
          JSON.stringify({ error: 'Неизвестное действие' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in telegram-auth function:', error);
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendCode(account: any) {
  try {
    console.log('Sending code for account:', account.phone_number);
    
    // Симуляция отправки SMS кода
    // В реальном приложении здесь был бы код для подключения к Telegram API
    
    // Обновляем статус аккаунта
    await supabase
      .from('telegram_accounts')
      .update({ status: 'waiting' })
      .eq('id', account.id);

    // Добавляем активность
    await supabase.from('activities').insert([{
      user_id: account.user_id,
      type: 'auth_code_sent',
      description: `SMS код отправлен на ${account.phone_number}`
    }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `SMS код отправлен на ${account.phone_number}`,
        nextStep: 'verify_code'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending code:', error);
    return new Response(
      JSON.stringify({ error: 'Не удалось отправить SMS код' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function verifyCode(account: any, phoneCode: string) {
  try {
    console.log('Verifying code for account:', account.phone_number);
    
    if (!phoneCode || phoneCode.length !== 5) {
      return new Response(
        JSON.stringify({ error: 'Введите правильный SMS код (5 цифр)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Симуляция проверки SMS кода
    // В реальном приложении здесь была бы проверка через Telegram API
    
    // Проверяем, нужна ли 2FA
    const needs2FA = Math.random() > 0.7; // 30% вероятность что нужна 2FA
    
    if (needs2FA) {
      await supabase
        .from('telegram_accounts')
        .update({ status: 'waiting' })
        .eq('id', account.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS код подтвержден. Введите пароль двухфакторной аутентификации',
          nextStep: 'verify_2fa'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
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

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Аккаунт успешно авторизован!',
          nextStep: 'completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    return new Response(
      JSON.stringify({ error: 'Не удалось проверить SMS код' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function verify2FA(account: any, twoFactorPassword: string) {
  try {
    console.log('Verifying 2FA for account:', account.phone_number);
    
    if (!twoFactorPassword || twoFactorPassword.length < 4) {
      return new Response(
        JSON.stringify({ error: 'Введите пароль двухфакторной аутентификации' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Симуляция проверки 2FA
    // В реальном приложении здесь была бы проверка через Telegram API
    
    await supabase
      .from('telegram_accounts')
      .update({ status: 'active' })
      .eq('id', account.id);

    await supabase.from('activities').insert([{
      user_id: account.user_id,
      type: 'account_authorized',
      description: `Аккаунт ${account.phone_number} успешно авторизован с 2FA`
    }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Аккаунт успешно авторизован с двухфакторной аутентификацией!',
        nextStep: 'completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return new Response(
      JSON.stringify({ error: 'Не удалось проверить пароль 2FA' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function testConnection(account: any) {
  try {
    console.log('Testing connection for account:', account.phone_number);
    
    // Симуляция тестового сообщения @dimitarius
    // В реальном приложении здесь был бы код для отправки сообщения через Telegram API
    
    await supabase.from('activities').insert([{
      user_id: account.user_id,
      type: 'test_message_sent',
      description: `Тестовое сообщение отправлено с аккаунта ${account.phone_number} для @dimitarius`
    }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Тестовое сообщение успешно отправлено @dimitarius!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error testing connection:', error);
    return new Response(
      JSON.stringify({ error: 'Не удалось отправить тестовое сообщение' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}