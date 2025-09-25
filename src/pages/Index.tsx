import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import ContactsManager from "@/components/ContactsManager";
import CampaignManager from "@/components/CampaignManager";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-telegram-blue"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "contacts":
        return <ContactsManager />;
      case "campaigns":
        return <CampaignManager />;
      case "accounts":
      case "analytics":
      case "settings":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {activeTab === "accounts" && "Управление аккаунтами"}
                {activeTab === "analytics" && "Аналитика"}
                {activeTab === "settings" && "Настройки"}
              </h2>
              <p className="text-muted-foreground">
                Раздел в разработке
              </p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-subtle">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;