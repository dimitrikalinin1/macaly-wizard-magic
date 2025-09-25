import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Smartphone, 
  MessageSquare, 
  Shield, 
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { TelegramAccount } from "@/hooks/useTelegramAccounts";

interface TelegramAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: TelegramAccount | null;
  onSuccess: () => void;
}

type AuthStep = 'send_code' | 'verify_code' | 'verify_2fa' | 'completed';

const TelegramAuthDialog = ({ isOpen, onClose, account, onSuccess }: TelegramAuthDialogProps) => {
  const [step, setStep] = useState<AuthStep>('send_code');
  const [loading, setLoading] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const { toast } = useToast();

  const resetDialog = () => {
    setStep('send_code');
    setPhoneCode('');
    setTwoFactorPassword('');
    setLoading(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const callTelegramAuth = async (action: string, extraData = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: {
          action,
          accountId: account?.id,
          ...extraData
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Telegram auth error:', error);
      throw error;
    }
  };

  const handleSendCode = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const result = await callTelegramAuth('send_code');
      
      if (result.success) {
        setStep('verify_code');
        toast({
          title: "Код отправлен!",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Ошибка отправки кода');
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить SMS код",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!phoneCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите SMS код",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await callTelegramAuth('verify_code', { phoneCode });
      
      if (result.success) {
        if (result.nextStep === 'verify_2fa') {
          setStep('verify_2fa');
        } else if (result.nextStep === 'completed') {
          setStep('completed');
          onSuccess();
        }
        
        toast({
          title: "Успех!",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Ошибка проверки кода');
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось проверить SMS код",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorPassword.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите пароль двухфакторной аутентификации",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await callTelegramAuth('verify_2fa', { twoFactorPassword });
      
      if (result.success) {
        setStep('completed');
        onSuccess();
        toast({
          title: "Успех!",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Ошибка проверки 2FA');
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось проверить пароль 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const result = await callTelegramAuth('test_connection');
      
      if (result.success) {
        toast({
          title: "Тест успешно выполнен!",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Ошибка тестирования');
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить тест",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'send_code':
        return <Smartphone className="h-8 w-8 text-telegram-blue" />;
      case 'verify_code':
        return <MessageSquare className="h-8 w-8 text-telegram-warning" />;
      case 'verify_2fa':
        return <Shield className="h-8 w-8 text-telegram-error" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-telegram-success" />;
      default:
        return <AlertCircle className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'send_code':
        return 'Авторизация Telegram аккаунта';
      case 'verify_code':
        return 'Подтверждение SMS кода';
      case 'verify_2fa':
        return 'Двухфакторная аутентификация';
      case 'completed':
        return 'Авторизация завершена';
      default:
        return 'Авторизация';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'send_code':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-telegram bg-telegram-blue/5 border border-telegram-blue/20">
              <div className="flex items-center space-x-3 mb-3">
                <Smartphone className="h-5 w-5 text-telegram-blue" />
                <div>
                  <p className="font-medium text-foreground">Аккаунт: {account?.phone_number}</p>
                  <p className="text-sm text-muted-foreground">API ID: {account?.api_id}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Мы отправим SMS код для авторизации этого аккаунта в Telegram
              </p>
              <div className="p-2 bg-background rounded border text-xs text-muted-foreground">
                📱 <strong>Реальная интеграция:</strong> SMS код будет отправлен на указанный номер телефона через Telegram API
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Отмена
              </Button>
              <Button 
                onClick={handleSendCode} 
                disabled={loading}
                className="bg-gradient-telegram shadow-telegram"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить SMS код'
                )}
              </Button>
            </div>
          </div>
        );

      case 'verify_code':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-telegram bg-telegram-warning/5 border border-telegram-warning/20">
              <MessageSquare className="h-5 w-5 text-telegram-warning mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                SMS код отправлен на номер {account?.phone_number}. Введите полученный код:
              </p>
            </div>
            
            <div>
              <Label htmlFor="phoneCode">SMS код</Label>
              <Input
                id="phoneCode"
                type="text"
                placeholder="12345"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="text-center text-lg font-mono"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Отмена
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={loading || phoneCode.length !== 5}
                className="bg-gradient-telegram shadow-telegram"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Подтвердить код'
                )}
              </Button>
            </div>
          </div>
        );

      case 'verify_2fa':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-telegram bg-telegram-error/5 border border-telegram-error/20">
              <Shield className="h-5 w-5 text-telegram-error mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Для завершения авторизации введите пароль двухфакторной аутентификации:
              </p>
            </div>
            
            <div>
              <Label htmlFor="twoFactorPassword">Пароль 2FA</Label>
              <Input
                id="twoFactorPassword"
                type="password"
                placeholder="Введите пароль 2FA"
                value={twoFactorPassword}
                onChange={(e) => setTwoFactorPassword(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Отмена
              </Button>
              <Button 
                onClick={handleVerify2FA} 
                disabled={loading || !twoFactorPassword.trim()}
                className="bg-gradient-telegram shadow-telegram"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Подтвердить пароль'
                )}
              </Button>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-telegram bg-telegram-success/5 border border-telegram-success/20 text-center">
              <CheckCircle className="h-8 w-8 text-telegram-success mx-auto mb-3" />
              <p className="font-medium text-telegram-success mb-2">Авторизация успешно завершена!</p>
              <p className="text-sm text-muted-foreground">
                Аккаунт {account?.phone_number} готов к работе
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleTestConnection} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Тест @dimitarius'
                )}
              </Button>
              <Button 
                onClick={handleClose}
                className="bg-gradient-telegram shadow-telegram"
              >
                Готово
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {getStepIcon()}
            <span>{getStepTitle()}</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 'send_code' && 'Настройка подключения к Telegram аккаунту'}
            {step === 'verify_code' && 'Введите код подтверждения из SMS'}
            {step === 'verify_2fa' && 'Введите пароль двухфакторной аутентификации'}
            {step === 'completed' && 'Процесс авторизации успешно завершен'}
          </DialogDescription>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default TelegramAuthDialog;