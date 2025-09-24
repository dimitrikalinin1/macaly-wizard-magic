import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import ContactsManager from "@/components/ContactsManager";
import CampaignManager from "@/components/CampaignManager";
import AuthDialog from "@/components/AuthDialog";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

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
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};

export default Index;
