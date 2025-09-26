import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, User, Phone, MessageSquare, Calendar } from 'lucide-react';
import { useIncomingMessages } from '@/hooks/useIncomingMessages';
import { useToast } from '@/hooks/use-toast';

export const IncomingMessages: React.FC = () => {
  const { messages, loading, deleteMessage } = useIncomingMessages();
  const { toast } = useToast();

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await deleteMessage(messageId);
    
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить сообщение",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Сообщение удалено",
        description: "Сообщение успешно удалено",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-800';
      case 'photo':
        return 'bg-green-100 text-green-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'document':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayName = (message: any) => {
    if (message.from_first_name || message.from_last_name) {
      return `${message.from_first_name || ''} ${message.from_last_name || ''}`.trim();
    }
    if (message.from_username) {
      return `@${message.from_username}`;
    }
    return message.from_phone;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Входящие сообщения</h2>
        </div>
        
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Входящие сообщения</h2>
        <Badge variant="outline" className="ml-2">
          {messages.length}
        </Badge>
      </div>

      {messages.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет входящих сообщений</h3>
            <p className="text-muted-foreground text-center">
              Когда начнут поступать ответы на ваши кампании, они появятся здесь
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card key={message.id} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {getDisplayName(message)}
                    </CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={getMessageTypeColor(message.message_type)}
                    >
                      {message.message_type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardDescription className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {message.from_phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(message.received_at)}
                  </div>
                </CardDescription>
              </CardHeader>
              
              {message.message_text && (
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{message.message_text}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};