import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  MessageCircle, 
  PhoneCall, 
  BarChart3, 
  Settings,
  Plus,
  Bell
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const [notifications] = useState(3);

  const navItems = [
    {
      id: "dashboard",
      label: "Панель управления",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "accounts",
      label: "Аккаунты",
      icon: Users,
      badge: "12",
    },
    {
      id: "contacts",
      label: "Контакты",
      icon: PhoneCall,
      badge: null,
    },
    {
      id: "campaigns",
      label: "Кампании",
      icon: MessageCircle,
      badge: "3",
    },
    {
      id: "analytics",
      label: "Аналитика",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "settings",
      label: "Настройки",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <nav className="w-64 bg-card/80 backdrop-blur-sm border-r border-border/50 h-full">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-telegram p-2 rounded-telegram shadow-telegram">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Telegram Manager</h1>
            <p className="text-xs text-muted-foreground">v2.1.0</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border/50">
        <Button className="w-full bg-gradient-telegram shadow-telegram mb-2">
          <Plus className="h-4 w-4 mr-2" />
          Добавить аккаунт
        </Button>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Уведомления</span>
          {notifications > 0 && (
            <Badge className="bg-telegram-error/10 text-telegram-error border-telegram-error/20">
              <Bell className="h-3 w-3 mr-1" />
              {notifications}
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start transition-all duration-200 ${
                isActive 
                  ? "bg-gradient-telegram shadow-telegram text-white" 
                  : "hover:bg-secondary/80"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <IconComponent className="h-4 w-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={isActive ? "secondary" : "outline"}
                  className={`text-xs ${
                    isActive 
                      ? "bg-white/20 text-white border-white/30" 
                      : "bg-telegram-blue/10 text-telegram-blue border-telegram-blue/20"
                  }`}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Status Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-telegram-success rounded-full animate-pulse"></div>
            <span>Онлайн</span>
          </div>
          <span>12 активных</span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;