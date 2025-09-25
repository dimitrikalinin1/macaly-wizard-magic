import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageCircle, 
  Activity, 
  Plus,
  PhoneCall,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { useTelegramAccounts } from "@/hooks/useTelegramAccounts";
import { useContactLists } from "@/hooks/useContactLists";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useActivities } from "@/hooks/useActivities";
import { useToast } from "@/components/ui/use-toast";
import heroImage from "@/assets/telegram-hero.jpg";

const Dashboard = () => {
  const { accounts } = useTelegramAccounts();
  const { contactLists } = useContactLists();
  const { campaigns } = useCampaigns();
  const { activities } = useActivities();
  const { toast } = useToast();

  // Подсчитываем статистику
  const totalContacts = contactLists.reduce((sum, list) => sum + list.verified_numbers, 0);
  const totalTelegramUsers = contactLists.reduce((sum, list) => sum + list.telegram_users, 0);
  const totalMessagesSent = campaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'running').length;

  const stats = [
    {
      title: "Активные аккаунты",
      value: accounts.filter(acc => acc.status === 'active').length.toString(),
      change: `+${accounts.length}`,
      icon: Users,
      color: "telegram-success",
    },
    {
      title: "Контактов проверено",
      value: totalContacts.toLocaleString(),
      change: `+${totalTelegramUsers}`,
      icon: PhoneCall,
      color: "telegram-blue",
    },
    {
      title: "Сообщений отправлено",
      value: totalMessagesSent.toLocaleString(),
      change: "+0",
      icon: MessageCircle,
      color: "telegram-warning",
    },
    {
      title: "Активных кампаний",
      value: activeCampaigns.toString(),
      change: "0",
      icon: Activity,
      color: "telegram-success",
    },
  ];

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} минут назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} часов назад`;
    return `${Math.floor(diffInMinutes / 1440)} дней назад`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-telegram overflow-hidden shadow-elevated">
        <div 
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-telegram/80"></div>
          <div className="relative z-10 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Менеджер Telegram</h1>
            <p className="text-lg opacity-90">
              Комплексное управление аккаунтами и массовыми рассылками
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <Plus className="h-4 w-4 mr-2" />
                Добавить аккаунт
              </Button>
              <Badge className="bg-white/20 text-white border-white/20">
                {accounts.length} аккаунтов
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs bg-${stat.color}/10 text-${stat.color} border-${stat.color}/20`}
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-telegram bg-${stat.color}/10`}>
                    <IconComponent className={`h-6 w-6 text-${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Accounts Overview */}
        <div className="lg:col-span-2">
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-telegram-blue" />
                  <span>Аккаунты Telegram</span>
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Нет добавленных аккаунтов</p>
                    <p className="text-sm text-muted-foreground mt-2">Добавьте свой первый аккаунт для начала работы</p>
                  </div>
                ) : (
                  accounts.slice(0, 4).map((account) => (
                    <div 
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-telegram bg-gradient-subtle border border-border/50 hover:shadow-card-soft transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(account.status)}
                        <div>
                          <p className="font-medium text-foreground">{account.phone_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Отправлено: {account.sent_today}/{account.daily_limit} сообщений
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(account.status)}
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-gradient-telegram h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(account.sent_today / account.daily_limit) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((account.sent_today / account.daily_limit) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-telegram-warning" />
                <span>Быстрые действия</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-telegram shadow-telegram">
                  <Plus className="h-4 w-4 mr-3" />
                  Создать кампанию
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <PhoneCall className="h-4 w-4 mr-3" />
                  Загрузить контакты
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Статистика
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-telegram-success" />
                <span>Последние активности</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет активностей
                  </p>
                ) : (
                  activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-telegram-blue rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;