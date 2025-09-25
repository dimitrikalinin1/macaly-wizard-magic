import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { MessageCircle, Mail, Lock, Loader2 } from "lucide-react";
import heroImage from "@/assets/telegram-hero.jpg";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ email: "", password: "", confirmPassword: "" });
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error) {
      toast({
        title: "Ошибка входа",
        description: error.message === "Invalid login credentials" 
          ? "Неверный email или пароль" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешный вход!",
        description: "Добро пожаловать в Telegram Менеджер",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpData.email || !signUpData.password || !signUpData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(signUpData.email, signUpData.password);
    
    if (error) {
      if (error.message.includes("User already registered")) {
        toast({
          title: "Ошибка регистрации",
          description: "Пользователь с таким email уже зарегистрирован",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка регистрации",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Регистрация успешна!",
        description: "Проверьте email для подтверждения аккаунта",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero */}
        <div className="hidden lg:block">
          <div className="relative rounded-telegram overflow-hidden shadow-elevated">
            <div 
              className="h-96 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${heroImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-telegram/80"></div>
              <div className="relative z-10 p-8 text-white h-full flex flex-col justify-center">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-telegram">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl font-bold">Telegram Менеджер</h1>
                </div>
                <p className="text-lg opacity-90 mb-6">
                  Профессиональное управление аккаунтами и массовыми рассылками в Telegram
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Управление множественными аккаунтами</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Автоматическая проверка контактов</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Умные кампании рассылок</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-elevated">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-telegram-blue/10 rounded-telegram">
                  <MessageCircle className="h-8 w-8 text-telegram-blue" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Добро пожаловать
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Вход</TabsTrigger>
                  <TabsTrigger value="signup">Регистрация</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-telegram shadow-telegram"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Войти
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Подтвердите пароль</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-telegram shadow-telegram"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Зарегистрироваться
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;