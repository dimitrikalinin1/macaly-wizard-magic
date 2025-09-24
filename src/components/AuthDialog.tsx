import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { 
  MessageCircle, 
  Key, 
  Phone, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthStep = "credentials" | "phone" | "sms" | "2fa" | "success";

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>("credentials");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    apiId: "",
    apiHash: "",
    phone: "",
    smsCode: "",
    twoFactorPassword: "",
  });
  const { toast } = useToast();

  const handleNext = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    switch (currentStep) {
      case "credentials":
        if (!formData.apiId || !formData.apiHash) {
          toast({
            title: "Ошибка",
            description: "Заполните все поля API",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setCurrentStep("phone");
        break;
      case "phone":
        if (!formData.phone) {
          toast({
            title: "Ошибка",
            description: "Введите номер телефона",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setCurrentStep("sms");
        toast({
          title: "SMS отправлена",
          description: "Проверьте входящие сообщения",
        });
        break;
      case "sms":
        if (!formData.smsCode) {
          toast({
            title: "Ошибка",
            description: "Введите код из SMS",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        // Check if 2FA is required (simulate)
        if (Math.random() > 0.5) {
          setCurrentStep("2fa");
        } else {
          setCurrentStep("success");
        }
        break;
      case "2fa":
        if (!formData.twoFactorPassword) {
          toast({
            title: "Ошибка",
            description: "Введите пароль двухфакторной аутентификации",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        setCurrentStep("success");
        break;
      case "success":
        onOpenChange(false);
        toast({
          title: "Успех!",
          description: "Аккаунт Telegram успешно добавлен",
        });
        // Reset form
        setCurrentStep("credentials");
        setFormData({
          apiId: "",
          apiHash: "",
          phone: "",
          smsCode: "",
          twoFactorPassword: "",
        });
        break;
    }
    
    setLoading(false);
  };

  const getStepIcon = (step: AuthStep) => {
    switch (step) {
      case "credentials":
        return <Key className="h-5 w-5" />;
      case "phone":
        return <Phone className="h-5 w-5" />;
      case "sms":
        return <MessageCircle className="h-5 w-5" />;
      case "2fa":
        return <Shield className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getStepTitle = (step: AuthStep) => {
    switch (step) {
      case "credentials":
        return "API данные";
      case "phone":
        return "Номер телефона";
      case "sms":
        return "SMS код";
      case "2fa":
        return "Двухфакторная аутентификация";
      case "success":
        return "Готово!";
    }
  };

  const getStepDescription = (step: AuthStep) => {
    switch (step) {
      case "credentials":
        return "Введите API ID и Hash из my.telegram.org";
      case "phone":
        return "Введите номер телефона аккаунта Telegram";
      case "sms":
        return "Введите код, полученный в SMS";
      case "2fa":
        return "Введите пароль двухфакторной аутентификации";
      case "success":
        return "Аккаунт успешно добавлен и готов к работе";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "credentials":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiId">API ID</Label>
              <Input
                id="apiId"
                value={formData.apiId}
                onChange={(e) => setFormData({ ...formData, apiId: e.target.value })}
                placeholder="Введите API ID"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="apiHash">API Hash</Label>
              <Input
                id="apiHash"
                value={formData.apiHash}
                onChange={(e) => setFormData({ ...formData, apiHash: e.target.value })}
                placeholder="Введите API Hash"
                className="mt-1"
              />
            </div>
            <Card className="bg-telegram-light-blue/10 border-telegram-blue/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-telegram-blue mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Как получить API данные?</p>
                    <ol className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>1. Перейдите на my.telegram.org</li>
                      <li>2. Войдите с помощью номера телефона</li>
                      <li>3. Создайте новое приложение</li>
                      <li>4. Скопируйте API ID и API Hash</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "phone":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 999 123 45 67"
                className="mt-1"
              />
            </div>
            <Card className="bg-telegram-warning/10 border-telegram-warning/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-telegram-warning mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">
                      Убедитесь, что указанный номер телефона зарегистрирован в Telegram.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "sms":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="smsCode">SMS код</Label>
              <Input
                id="smsCode"
                value={formData.smsCode}
                onChange={(e) => setFormData({ ...formData, smsCode: e.target.value })}
                placeholder="12345"
                className="mt-1 text-center text-lg tracking-wider"
                maxLength={5}
              />
            </div>
            <Card className="bg-telegram-blue/10 border-telegram-blue/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-telegram-blue" />
                  <p className="text-sm text-foreground">
                    Код отправлен на номер {formData.phone}. Проверьте входящие сообщения.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "2fa":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="twoFactorPassword">Пароль 2FA</Label>
              <Input
                id="twoFactorPassword"
                type="password"
                value={formData.twoFactorPassword}
                onChange={(e) => setFormData({ ...formData, twoFactorPassword: e.target.value })}
                placeholder="Введите пароль"
                className="mt-1"
              />
            </div>
            <Card className="bg-telegram-warning/10 border-telegram-warning/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-telegram-warning mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">
                      На вашем аккаунте включена двухфакторная аутентификация. 
                      Введите пароль, который вы установили в настройках Telegram.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-telegram-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-telegram-success" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Аккаунт добавлен!</p>
              <p className="text-sm text-muted-foreground">
                Номер {formData.phone} готов к использованию
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Badge className="bg-telegram-success/10 text-telegram-success border-telegram-success/20">
                Активен
              </Badge>
              <Badge variant="outline">
                Лимит: 50 сообщений/день
              </Badge>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-telegram rounded-telegram">
              {getStepIcon(currentStep)}
            </div>
            <div>
              <div className="text-lg">{getStepTitle(currentStep)}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {getStepDescription(currentStep)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-gradient-telegram shadow-telegram"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {currentStep === "success" ? "Готово" : "Далее"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;