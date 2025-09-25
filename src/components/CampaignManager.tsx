import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  MessageCircle, 
  Plus, 
  Play,
  Pause,
  Square,
  Settings,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Send,
  Loader2
} from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContactLists } from "@/hooks/useContactLists";

const CampaignManager = () => {
  const { campaigns, loading, createCampaign, updateCampaignStatus, deleteCampaign } = useCampaigns();
  const { contactLists } = useContactLists();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    contactList: "",
    schedule: "",
  });
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-telegram-blue/10 text-telegram-blue border-telegram-blue/20">Активна</Badge>;
      case "completed":
        return <Badge className="bg-telegram-success/10 text-telegram-success border-telegram-success/20">Завершена</Badge>;
      case "paused":
        return <Badge className="bg-telegram-warning/10 text-telegram-warning border-telegram-warning/20">Приостановлена</Badge>;
      case "draft":
        return <Badge variant="outline">Черновик</Badge>;
      case "stopped":
        return <Badge className="bg-telegram-error/10 text-telegram-error border-telegram-error/20">Остановлена</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4 text-telegram-blue" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-telegram-success" />;
      case "paused":
        return <Pause className="h-4 w-4 text-telegram-warning" />;
      case "draft":
        return <Settings className="h-4 w-4 text-muted-foreground" />;
      case "stopped":
        return <Square className="h-4 w-4 text-telegram-error" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message || !newCampaign.contactList) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    const { error } = await createCampaign(
      newCampaign.name,
      newCampaign.message,
      newCampaign.contactList,
      newCampaign.schedule
    );

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать кампанию",
        variant: "destructive",
      });
    } else {
      setNewCampaign({ name: "", message: "", contactList: "", schedule: "" });
      setShowCreateForm(false);
      toast({
        title: "Успех!",
        description: "Кампания создана и сохранена как черновик",
      });
    }
  };

  const controlCampaign = async (id: string, action: "start" | "pause" | "stop") => {
    const statusMap = {
      start: "running" as const,
      pause: "paused" as const,
      stop: "stopped" as const
    };

    const { error } = await updateCampaignStatus(id, statusMap[action]);
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус кампании",
        variant: "destructive",
      });
    } else {
      const actionText = action === "start" ? "запущена" : action === "pause" ? "приостановлена" : "остановлена";
      toast({
        title: "Кампания " + actionText,
        description: `Статус кампании изменен`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-telegram-blue" />
          <p className="text-muted-foreground">Загрузка кампаний...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Кампании</h2>
          <p className="text-muted-foreground">Управление массовыми рассылками</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-telegram shadow-telegram"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать кампанию
        </Button>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-telegram-blue" />
              <span>Новая кампания</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Название кампании</Label>
                  <Input
                    id="campaignName"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Например: Летняя акция"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactList">Список контактов</Label>
                  <Select onValueChange={(value) => setNewCampaign({ ...newCampaign, contactList: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите список" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name} ({list.telegram_users} контактов)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schedule">Время запуска (опционально)</Label>
                  <Input
                    id="schedule"
                    type="datetime-local"
                    value={newCampaign.schedule}
                    onChange={(e) => setNewCampaign({ ...newCampaign, schedule: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="message">Сообщение</Label>
                <Textarea
                  id="message"
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                  placeholder="Напишите текст сообщения..."
                  className="mt-1 min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {newCampaign.message.length}/4096 символов
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateCampaign} className="bg-gradient-telegram shadow-telegram">
                <Send className="h-4 w-4 mr-2" />
                Создать кампанию
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
            <CardContent className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет созданных кампаний</p>
              <p className="text-sm text-muted-foreground mt-2">Создайте свою первую кампанию для начала работы</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-telegram-blue/10 rounded-telegram">
                      {getStatusIcon(campaign.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Список: {campaign.contact_list_name} • Создана {formatDate(campaign.created_at)}
                      </p>
                      <p className="text-sm text-foreground bg-secondary/50 p-2 rounded-md">
                        {campaign.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(campaign.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 rounded-telegram bg-gradient-subtle border border-border/30">
                    <p className="text-xl font-bold text-foreground">{campaign.total_targets}</p>
                    <p className="text-xs text-muted-foreground">Целевых контактов</p>
                  </div>
                  <div className="text-center p-3 rounded-telegram bg-gradient-subtle border border-border/30">
                    <p className="text-xl font-bold text-telegram-blue">{campaign.sent}</p>
                    <p className="text-xs text-muted-foreground">Отправлено</p>
                  </div>
                  <div className="text-center p-3 rounded-telegram bg-gradient-subtle border border-border/30">
                    <p className="text-xl font-bold text-telegram-success">{campaign.delivered}</p>
                    <p className="text-xs text-muted-foreground">Доставлено</p>
                  </div>
                  <div className="text-center p-3 rounded-telegram bg-gradient-subtle border border-border/30">
                    <p className="text-xl font-bold text-telegram-warning">
                      {campaign.total_targets > 0 ? Math.round((campaign.delivered / campaign.total_targets) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Конверсия</p>
                  </div>
                </div>

                {campaign.status === "running" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Прогресс рассылки</span>
                      <span className="text-foreground">{Math.round((campaign.sent / campaign.total_targets) * 100)}%</span>
                    </div>
                    <Progress value={(campaign.sent / campaign.total_targets) * 100} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{campaign.total_targets} получателей</span>
                    </div>
                    {campaign.scheduled_for && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Запланировано: {new Date(campaign.scheduled_for).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {campaign.status === "draft" || campaign.status === "paused" ? (
                      <Button
                        size="sm"
                        onClick={() => controlCampaign(campaign.id, "start")}
                        className="bg-gradient-telegram shadow-telegram"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {campaign.status === "draft" ? "Запустить" : "Возобновить"}
                      </Button>
                    ) : campaign.status === "running" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlCampaign(campaign.id, "pause")}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Пауза
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlCampaign(campaign.id, "stop")}
                          className="text-telegram-error hover:text-telegram-error"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Остановить
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Статистика
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignManager;