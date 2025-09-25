import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Loader2,
  Smartphone,
  Shield,
  Users,
  MessageSquare
} from "lucide-react";
import { useTelegramAccounts } from "@/hooks/useTelegramAccounts";
import TelegramAuthDialog from "./TelegramAuthDialog";

const AccountsManager = () => {
  const { accounts, loading, addAccount, updateAccountStatus, deleteAccount, refetch } = useTelegramAccounts();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [authAccount, setAuthAccount] = useState<any>(null);
  const [newAccount, setNewAccount] = useState({
    phoneNumber: "",
    apiId: "",
    apiHash: "",
    dailyLimit: 50
  });
  const [accountSettings, setAccountSettings] = useState({
    delays: {
      min: "30",
      max: "60"
    },
    proxy: {
      enabled: false,
      host: "",
      port: "",
      username: "",
      password: ""
    }
  });
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-telegram-success/10 text-telegram-success border-telegram-success/20">Активен</Badge>;
      case "waiting":
        return <Badge className="bg-telegram-warning/10 text-telegram-warning border-telegram-warning/20">Ожидает</Badge>;
      case "blocked":
        return <Badge className="bg-telegram-error/10 text-telegram-error border-telegram-error/20">Заблокирован</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-telegram-success" />;
      case "waiting":
        return <Clock className="h-4 w-4 text-telegram-warning" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-telegram-error" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.phoneNumber.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите номер телефона",
        variant: "destructive",
      });
      return;
    }

    if (!newAccount.apiId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите API ID",
        variant: "destructive",
      });
      return;
    }

    if (!newAccount.apiHash.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите API Hash",
        variant: "destructive",
      });
      return;
    }

    const apiId = parseInt(newAccount.apiId.trim());
    if (isNaN(apiId)) {
      toast({
        title: "Ошибка",
        description: "API ID должен быть числом",
        variant: "destructive",
      });
      return;
    }

    const { error } = await addAccount(newAccount.phoneNumber.trim(), apiId, newAccount.apiHash.trim());
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить аккаунт",
        variant: "destructive",
      });
    } else {
      setNewAccount({ phoneNumber: "", apiId: "", apiHash: "", dailyLimit: 50 });
      setShowAddDialog(false);
      toast({
        title: "Успех!",
        description: "Аккаунт добавлен. Дождитесь активации.",
      });
    }
  };

  const handleStatusChange = async (accountId: string, newStatus: 'active' | 'waiting' | 'blocked') => {
    const { error } = await updateAccountStatus(accountId, newStatus);
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус аккаунта",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    const { error } = await deleteAccount(accountId);
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить аккаунт",
        variant: "destructive",
      });
    }
  };

  const handleAuthAccount = (account: any) => {
    setAuthAccount(account);
    setShowAuthDialog(true);
  };

  const handleAuthSuccess = () => {
    refetch();
    setShowAuthDialog(false);
    setAuthAccount(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-telegram-blue" />
          <p className="text-muted-foreground">Загрузка аккаунтов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Управление аккаунтами</h2>
          <p className="text-muted-foreground">Добавление и настройка Telegram аккаунтов</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Глобальные настройки</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Задержки между сообщениями (сек)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      placeholder="Мин"
                      value={accountSettings.delays.min}
                      onChange={(e) => setAccountSettings({
                        ...accountSettings,
                        delays: { ...accountSettings.delays, min: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="Макс"
                      value={accountSettings.delays.max}
                      onChange={(e) => setAccountSettings({
                        ...accountSettings,
                        delays: { ...accountSettings.delays, max: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <Button className="w-full bg-gradient-telegram shadow-telegram">
                  Сохранить настройки
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-telegram shadow-telegram">
                <Plus className="h-4 w-4 mr-2" />
                Добавить аккаунт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить Telegram аккаунт</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiId">API ID</Label>
                  <Input
                    id="apiId"
                    placeholder="Получите на my.telegram.org"
                    value={newAccount.apiId}
                    onChange={(e) => setNewAccount({ ...newAccount, apiId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="apiHash">API Hash</Label>
                  <Input
                    id="apiHash"
                    placeholder="Получите на my.telegram.org"
                    value={newAccount.apiHash}
                    onChange={(e) => setNewAccount({ ...newAccount, apiHash: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Номер телефона</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+7 999 123 45 67"
                    value={newAccount.phoneNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dailyLimit">Дневной лимит сообщений</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    placeholder="50"
                    value={newAccount.dailyLimit}
                    onChange={(e) => setNewAccount({ ...newAccount, dailyLimit: parseInt(e.target.value) || 50 })}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleAddAccount} className="bg-gradient-telegram shadow-telegram">
                    Добавить аккаунт
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего аккаунтов</p>
                <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              </div>
              <div className="p-3 rounded-telegram bg-telegram-blue/10">
                <Smartphone className="h-6 w-6 text-telegram-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активные</p>
                <p className="text-2xl font-bold text-telegram-success">
                  {accounts.filter(acc => acc.status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-telegram bg-telegram-success/10">
                <CheckCircle className="h-6 w-6 text-telegram-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Заблокированные</p>
                <p className="text-2xl font-bold text-telegram-error">
                  {accounts.filter(acc => acc.status === 'blocked').length}
                </p>
              </div>
              <div className="p-3 rounded-telegram bg-telegram-error/10">
                <Shield className="h-6 w-6 text-telegram-error" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Отправлено сегодня</p>
                <p className="text-2xl font-bold text-telegram-warning">
                  {accounts.reduce((sum, acc) => sum + acc.sent_today, 0)}
                </p>
              </div>
              <div className="p-3 rounded-telegram bg-telegram-warning/10">
                <MessageSquare className="h-6 w-6 text-telegram-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-telegram-blue" />
            <span>Список аккаунтов</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Нет добавленных аккаунтов</p>
                <p className="text-sm text-muted-foreground mt-2">Добавьте свой первый аккаунт для начала работы</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-telegram bg-gradient-subtle border border-border/50 hover:shadow-card-soft transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(account.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground">{account.phone_number}</p>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Отправлено: {account.sent_today}/{account.daily_limit} сообщений • 
                        Добавлен {formatDate(account.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-telegram h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(account.sent_today / account.daily_limit) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground w-10">
                        {Math.round((account.sent_today / account.daily_limit) * 100)}%
                      </span>
                    </div>
                    
                    {account.status === 'waiting' && account.api_id && account.api_hash && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAuthAccount(account)}
                        className="text-telegram-blue hover:text-telegram-blue border-telegram-blue/20"
                      >
                        Авторизовать
                      </Button>
                    )}
                    
                    <Select onValueChange={(value) => handleStatusChange(account.id, value as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Активен</SelectItem>
                        <SelectItem value="waiting">Ожидает</SelectItem>
                        <SelectItem value="blocked">Заблокирован</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-telegram-error hover:text-telegram-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Telegram Auth Dialog */}
      <TelegramAuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        account={authAccount}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default AccountsManager;