import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Smartphone,
  Globe,
  Database,
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  Mail,
  Lock,
  Zap
} from "lucide-react";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    displayName: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    timezone: 'Europe/Moscow',
    language: 'ru'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    accountAlerts: true,
    systemUpdates: false,
    dailyReports: true
  });

  const [telegram, setTelegram] = useState({
    defaultDelay: { min: 30, max: 60 },
    dailyLimit: 50,
    autoRestart: true,
    useProxy: false,
    proxySettings: {
      host: '',
      port: '',
      username: '',
      password: ''
    }
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    ipWhitelist: [],
    loginAlerts: true
  });

  const [system, setSystem] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    logLevel: 'info',
    apiRateLimit: 100
  });

  const handleSaveProfile = async () => {
    // В реальном приложении здесь был бы запрос к API
    toast({
      title: "Профиль обновлен",
      description: "Настройки профиля успешно сохранены",
    });
  };

  const handleSaveNotifications = async () => {
    toast({
      title: "Настройки уведомлений сохранены",
      description: "Изменения вступят в силу немедленно",
    });
  };

  const handleSaveTelegram = async () => {
    toast({
      title: "Настройки Telegram сохранены", 
      description: "Новые настройки применятся к следующим кампаниям",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Экспорт начат",
      description: "Файл с данными будет готов через несколько минут",
    });
  };

  const handleDeleteAccount = async () => {
    toast({
      title: "Подтверждение требуется",
      description: "Эта операция необратима. Обратитесь в поддержку для удаления аккаунта.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Настройки</h2>
          <p className="text-muted-foreground">Управление профилем и системными настройками</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт данных
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Профиль</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Уведомления</span>
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Telegram</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Безопасность</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <SettingsIcon className="h-4 w-4" />
            <span>Система</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-telegram-blue" />
                  <span>Информация профиля</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Отображаемое имя</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    placeholder="Ваше имя"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email нельзя изменить. Обратитесь в поддержку для смены email.
                  </p>
                </div>
                <div>
                  <Label htmlFor="timezone">Часовой пояс</Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Moscow">Москва (UTC+3)</SelectItem>
                      <SelectItem value="Europe/Kiev">Киев (UTC+2)</SelectItem>
                      <SelectItem value="Asia/Almaty">Алматы (UTC+6)</SelectItem>
                      <SelectItem value="America/New_York">Нью-Йорк (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Язык интерфейса</Label>
                  <Select value={profile.language} onValueChange={(value) => setProfile({ ...profile, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="uk">Українська</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveProfile} className="w-full bg-gradient-telegram shadow-telegram">
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить профиль
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-telegram-warning" />
                  <span>Смена пароля</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Текущий пароль</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Введите текущий пароль"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Введите новый пароль"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Повторите новый пароль"
                  />
                </div>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Изменить пароль
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-telegram-blue" />
                <span>Настройки уведомлений</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email уведомления</Label>
                  <p className="text-sm text-muted-foreground">Получать уведомления на email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="campaignUpdates">Обновления кампаний</Label>
                  <p className="text-sm text-muted-foreground">Уведомления о статусе кампаний</p>
                </div>
                <Switch
                  id="campaignUpdates"
                  checked={notifications.campaignUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, campaignUpdates: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="accountAlerts">Предупреждения аккаунтов</Label>
                  <p className="text-sm text-muted-foreground">Уведомления о проблемах с аккаунтами</p>
                </div>
                <Switch
                  id="accountAlerts"
                  checked={notifications.accountAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, accountAlerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemUpdates">Системные обновления</Label>
                  <p className="text-sm text-muted-foreground">Информация о обновлениях системы</p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={notifications.systemUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dailyReports">Ежедневные отчеты</Label>
                  <p className="text-sm text-muted-foreground">Получать ежедневную сводку активности</p>
                </div>
                <Switch
                  id="dailyReports"
                  checked={notifications.dailyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, dailyReports: checked })}
                />
              </div>
              <Button onClick={handleSaveNotifications} className="bg-gradient-telegram shadow-telegram">
                <Save className="h-4 w-4 mr-2" />
                Сохранить настройки уведомлений
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Settings */}
        <TabsContent value="telegram">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-telegram-blue" />
                  <span>Настройки отправки</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Задержка между сообщениями (секунды)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      placeholder="Мин"
                      type="number"
                      value={telegram.defaultDelay.min}
                      onChange={(e) => setTelegram({
                        ...telegram,
                        defaultDelay: { ...telegram.defaultDelay, min: parseInt(e.target.value) || 30 }
                      })}
                    />
                    <Input
                      placeholder="Макс"
                      type="number"
                      value={telegram.defaultDelay.max}
                      onChange={(e) => setTelegram({
                        ...telegram,
                        defaultDelay: { ...telegram.defaultDelay, max: parseInt(e.target.value) || 60 }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dailyLimit">Дневной лимит по умолчанию</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={telegram.dailyLimit}
                    onChange={(e) => setTelegram({ ...telegram, dailyLimit: parseInt(e.target.value) || 50 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoRestart">Автоперезапуск</Label>
                    <p className="text-sm text-muted-foreground">Автоматически перезапускать после ошибок</p>
                  </div>
                  <Switch
                    id="autoRestart"
                    checked={telegram.autoRestart}
                    onCheckedChange={(checked) => setTelegram({ ...telegram, autoRestart: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-telegram-warning" />
                  <span>Proxy настройки</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="useProxy">Использовать proxy</Label>
                    <p className="text-sm text-muted-foreground">Подключение через proxy сервер</p>
                  </div>
                  <Switch
                    id="useProxy"
                    checked={telegram.useProxy}
                    onCheckedChange={(checked) => setTelegram({ ...telegram, useProxy: checked })}
                  />
                </div>
                {telegram.useProxy && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="proxyHost">Хост</Label>
                        <Input
                          id="proxyHost"
                          placeholder="proxy.example.com"
                          value={telegram.proxySettings.host}
                          onChange={(e) => setTelegram({
                            ...telegram,
                            proxySettings: { ...telegram.proxySettings, host: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="proxyPort">Порт</Label>
                        <Input
                          id="proxyPort"
                          placeholder="8080"
                          value={telegram.proxySettings.port}
                          onChange={(e) => setTelegram({
                            ...telegram,
                            proxySettings: { ...telegram.proxySettings, port: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="proxyUsername">Логин</Label>
                        <Input
                          id="proxyUsername"
                          placeholder="username"
                          value={telegram.proxySettings.username}
                          onChange={(e) => setTelegram({
                            ...telegram,
                            proxySettings: { ...telegram.proxySettings, username: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="proxyPassword">Пароль</Label>
                        <Input
                          id="proxyPassword"
                          type="password"
                          placeholder="password"
                          value={telegram.proxySettings.password}
                          onChange={(e) => setTelegram({
                            ...telegram,
                            proxySettings: { ...telegram.proxySettings, password: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <div className="lg:col-span-2">
              <Button onClick={handleSaveTelegram} className="bg-gradient-telegram shadow-telegram">
                <Save className="h-4 w-4 mr-2" />
                Сохранить настройки Telegram
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-telegram-success" />
                  <span>Безопасность входа</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactor">Двухфакторная аутентификация</Label>
                    <p className="text-sm text-muted-foreground">Дополнительная защита аккаунта</p>
                  </div>
                  <Switch
                    id="twoFactor"
                    checked={security.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Таймаут сессии (минуты)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="loginAlerts">Уведомления о входе</Label>
                    <p className="text-sm text-muted-foreground">Уведомлять о новых входах</p>
                  </div>
                  <Switch
                    id="loginAlerts"
                    checked={security.loginAlerts}
                    onCheckedChange={(checked) => setSecurity({ ...security, loginAlerts: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-telegram-error" />
                  <span>Опасная зона</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-telegram bg-telegram-error/10 border border-telegram-error/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-telegram-error" />
                    <span className="font-medium text-telegram-error">Удаление аккаунта</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Это действие удалит все ваши данные без возможности восстановления.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить аккаунт
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="w-full"
                >
                  Выйти из всех устройств
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-telegram-blue" />
                  <span>Резервное копирование</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Автоматическое резервирование</Label>
                    <p className="text-sm text-muted-foreground">Регулярное создание резервных копий</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={system.autoBackup}
                    onCheckedChange={(checked) => setSystem({ ...system, autoBackup: checked })}
                  />
                </div>
                <div>
                  <Label htmlFor="backupFrequency">Частота резервирования</Label>
                  <Select value={system.backupFrequency} onValueChange={(value) => setSystem({ ...system, backupFrequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Ежедневно</SelectItem>
                      <SelectItem value="weekly">Еженедельно</SelectItem>
                      <SelectItem value="monthly">Ежемесячно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Создать резервную копию
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-telegram-warning" />
                  <span>Системная информация</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Версия</span>
                  <span className="text-sm font-medium">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">База данных</span>
                  <span className="text-sm font-medium">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Регион</span>
                  <span className="text-sm font-medium">EU-Central</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Статус</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-telegram-success" />
                    <span className="text-sm font-medium text-telegram-success">Онлайн</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Проверить обновления
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;