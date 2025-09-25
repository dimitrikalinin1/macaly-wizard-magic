import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  PhoneCall, 
  Upload, 
  CheckCircle,
  Clock,
  Users,
  FileText,
  Trash2,
  Download,
  Loader2
} from "lucide-react";
import { useContactLists } from "@/hooks/useContactLists";

const ContactsManager = () => {
  const { contactLists, loading, createContactList, deleteContactList } = useContactLists();
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUploadContacts = async () => {
    if (!phoneNumbers.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите номера телефонов",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    const numbers = phoneNumbers.split('\n').filter(n => n.trim().length > 0);
    const listName = `Список ${contactLists.length + 1}`;
    
    const { error } = await createContactList(listName, numbers);
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать список контактов",
        variant: "destructive",
      });
    } else {
      setPhoneNumbers("");
      toast({
        title: "Успех!",
        description: `Загружен список из ${numbers.length} номеров. Начинается проверка...`,
      });
    }
    
    setUploading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-telegram-success/10 text-telegram-success border-telegram-success/20">Завершено</Badge>;
      case "processing":
        return <Badge className="bg-telegram-warning/10 text-telegram-warning border-telegram-warning/20">Обработка</Badge>;
      case "error":
        return <Badge className="bg-telegram-error/10 text-telegram-error border-telegram-error/20">Ошибка</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const handleDeleteList = async (id: string) => {
    const { error } = await deleteContactList(id);
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить список",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Удалено",
        description: "Список контактов удален",
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
          <p className="text-muted-foreground">Загрузка контактов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-telegram-blue" />
            <span>Загрузить контакты</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Номера телефонов (по одному на строку)
              </label>
              <Textarea
                placeholder="+7 999 123 45 67&#10;+7 999 876 54 32&#10;+7 999 555 44 33"
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={uploading}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {phoneNumbers.split('\n').filter(n => n.trim().length > 0).length} номеров готово к загрузке
              </p>
              <Button 
                onClick={handleUploadContacts}
                disabled={uploading || !phoneNumbers.trim()}
                className="bg-gradient-telegram shadow-telegram"
              >
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Upload className="h-4 w-4 mr-2" />
                Загрузить и проверить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Lists */}
      <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-card-soft">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-telegram-blue" />
            <span>Списки контактов</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactLists.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Нет загруженных списков контактов</p>
                <p className="text-sm text-muted-foreground mt-2">Загрузите свой первый список для начала работы</p>
              </div>
            ) : (
              contactLists.map((list) => (
                <div 
                  key={list.id}
                  className="p-4 rounded-telegram bg-gradient-subtle border border-border/50 hover:shadow-card-soft transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-telegram-blue/10 rounded-telegram">
                        <PhoneCall className="h-4 w-4 text-telegram-blue" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{list.name}</h3>
                        <p className="text-sm text-muted-foreground">Создан {formatDate(list.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(list.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                        className="text-telegram-error hover:text-telegram-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 rounded-telegram bg-card border border-border/30">
                      <p className="text-2xl font-bold text-foreground">{list.total_numbers.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Всего номеров</p>
                    </div>
                    <div className="text-center p-3 rounded-telegram bg-card border border-border/30">
                      <p className="text-2xl font-bold text-telegram-warning">{list.verified_numbers.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Проверено</p>
                    </div>
                    <div className="text-center p-3 rounded-telegram bg-card border border-border/30">
                      <p className="text-2xl font-bold text-telegram-success">{list.telegram_users.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Telegram пользователей</p>
                    </div>
                  </div>

                  {list.status === "processing" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Проверка номеров...</span>
                        <span className="text-foreground">{Math.round((list.verified_numbers / list.total_numbers) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(list.verified_numbers / list.total_numbers) * 100} 
                        className="h-2"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-telegram-success" />
                          <span>Конверсия: {Math.round((list.telegram_users / list.total_numbers) * 100)}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-telegram-blue" />
                          <span>Готово к рассылке</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Экспорт
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsManager;