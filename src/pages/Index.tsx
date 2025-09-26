import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import ContactsManager from "@/components/ContactsManager";
import CampaignManager from "@/components/CampaignManager";
import AccountsManager from "@/components/AccountsManager";
import Analytics from "@/components/Analytics";
import Settings from "@/components/Settings";
import { IncomingMessages } from "@/components/IncomingMessages";

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
        return <Dashboard setActiveTab={setActiveTab} />;
      case "accounts":
        return <AccountsManager />;
      case "contacts":
        return <ContactsManager />;
      case "campaigns":
        return <CampaignManager />;
      case "messages":
        return <IncomingMessages />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
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