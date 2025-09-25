import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { 
  BarChart3,
  TrendingUp,
  MessageCircle,
  Users,
  PhoneCall,
  Target,
  Calendar,
  Download,
  Filter,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { useTelegramAccounts } from "@/hooks/useTelegramAccounts";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContactLists } from "@/hooks/useContactLists";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const { accounts } = useTelegramAccounts();
  const { campaigns } = useCampaigns();
  const { contactLists } = useContactLists();
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("messages");

  // Генерируем данные для графиков
  const generateChartData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        messages: Math.floor(Math.random() * 500) + 100,
        contacts: Math.floor(Math.random() * 200) + 50,
        campaigns: Math.floor(Math.random() * 10) + 1,
        conversion: Math.floor(Math.random() * 30) + 60,
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  // Данные для круговой диаграммы статусов аккаунтов
  const accountStatusData = [
    { name: 'Активные', value: accounts.filter(acc => acc.status === 'active').length, color: '#10B981' },
    { name: 'Ожидают', value: accounts.filter(acc => acc.status === 'waiting').length, color: '#F59E0B' },
    { name: 'Заблокированные', value: accounts.filter(acc => acc.status === 'blocked').length, color: '#EF4444' },
  ];

  // Данные для диаграммы кампаний
  const campaignStatusData = [
    { name: 'Активные', value: campaigns.filter(c => c.status === 'running').length, color: '#3B82F6' },
    { name: 'Завершенные', value: campaigns.filter(c => c.status === 'completed').length, color: '#10B981' },
    { name: 'Черновики', value: campaigns.filter(c => c.status === 'draft').length, color: '#6B7280' },
    { name: 'Приостановленные', value: campaigns.filter(c => c.status === 'paused').length, color: '#F59E0B' },
  ];

  // Статистика за период
  const totalMessages = chartData.reduce((sum, day) => sum + day.messages, 0);
  const totalContacts = contactLists.reduce((sum, list) => sum + list.verified_numbers, 0);
  const totalTelegramUsers = contactLists.reduce((sum, list) => sum + list.telegram_users, 0);
  const avgConversion = chartData.reduce((sum, day) => sum + day.conversion, 0) / chartData.length;

  const stats = [
    {
      title: "Сообщений отправлено",
      value: totalMessages.toLocaleString(),
      change: "+12.5%",
      icon: MessageCircle,
      color: "telegram-blue",
    },
    {
      title: "Контактов проверено",
      value: totalContacts.toLocaleString(),
      change: "+8.2%",
      icon: PhoneCall,
      color: "telegram-success",
    },
    {
      title: "Telegram пользователей",
      value: totalTelegramUsers.toLocaleString(),
      change: "+15.3%",
      icon: Users,
      color: "telegram-warning",
    },
    {
      title: "Средняя конверсия",
      value: `${avgConversion.toFixed(1)}%`,
      change: "+2.1%",
      icon: Target,
      color: "telegram-blue",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Аналитика</h2>
          <p className="text-muted-foreground">Подробная статистика и метрики</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="90d">90 дней</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-telegram-blue" />
                <span>Динамика отправки</span>
              </CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="messages">Сообщения</SelectItem>
                  <SelectItem value="contacts">Контакты</SelectItem>
                  <SelectItem value="conversion">Конверсия</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-telegram-warning" />
              <span>Ежедневная активность</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="messages" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Status Distribution */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-telegram-success" />
              <span>Статусы аккаунтов</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={accountStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {accountStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {accountStatusData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Status Distribution */}
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-telegram-blue" />
              <span>Статусы кампаний</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={campaignStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {campaignStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {campaignStatusData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-telegram-warning" />
            <span>Последние события</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                icon: CheckCircle,
                color: "telegram-success",
                text: "Кампания 'Весенняя акция' успешно завершена",
                time: "2 минуты назад",
                details: "Отправлено 245 из 892 сообщений"
              },
              {
                icon: Users,
                color: "telegram-blue", 
                text: "Добавлен новый список контактов",
                time: "15 минут назад",
                details: "1,240 номеров загружено и проверено"
              },
              {
                icon: AlertTriangle,
                color: "telegram-warning",
                text: "Аккаунт +7 999 123-45-67 приближается к лимиту",
                time: "1 час назад",
                details: "Отправлено 45 из 50 сообщений"
              },
              {
                icon: MessageCircle,
                color: "telegram-blue",
                text: "Запущена новая кампания 'VIP предложение'",
                time: "3 часа назад",
                details: "Таргетинг на 256 VIP клиентов"
              }
            ].map((event, index) => {
              const IconComponent = event.icon;
              return (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-telegram bg-gradient-subtle border border-border/50">
                  <div className={`p-2 rounded-telegram bg-${event.color}/10`}>
                    <IconComponent className={`h-4 w-4 text-${event.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{event.text}</p>
                    <p className="text-xs text-muted-foreground">{event.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;