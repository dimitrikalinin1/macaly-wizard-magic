import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Campaign {
  id: string;
  name: string;
  message: string;
  contact_list_id: string;
  contact_list_name?: string;
  total_targets: number;
  sent: number;
  delivered: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCampaigns = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        contact_lists!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      const campaignsWithListName = data?.map(campaign => ({
        ...campaign,
        contact_list_name: (campaign as any).contact_lists?.name
      })) || [];
      setCampaigns(campaignsWithListName as Campaign[]);
    }
    setLoading(false);
  };

  const createCampaign = async (
    name: string,
    message: string,
    contactListId: string,
    scheduledFor?: string
  ) => {
    if (!user) return { error: 'Not authenticated' };

    // Получаем информацию о списке контактов
    const { data: contactList } = await supabase
      .from('contact_lists')
      .select('telegram_users, name')
      .eq('id', contactListId)
      .single();

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        user_id: user.id,
        contact_list_id: contactListId,
        name,
        message,
        total_targets: contactList?.telegram_users || 0,
        scheduled_for: scheduledFor || null,
        status: 'draft'
      }])
      .select()
      .single();

    if (!error && data) {
      const campaignWithListName = {
        ...data,
        contact_list_name: contactList?.name
      } as Campaign;
      setCampaigns(prev => [campaignWithListName, ...prev]);
      
      // Добавить активность
      await supabase.from('activities').insert([{
        user_id: user.id,
        type: 'campaign_created',
        description: `Кампания "${name}" создана`
      }]);
    }

    return { data, error };
  };

  const updateCampaignStatus = async (
    id: string, 
    status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped'
  ) => {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === id ? { ...campaign, status } : campaign
      ));
      
      // Добавить активность
      if (user) {
        const campaign = campaigns.find(c => c.id === id);
        const statusText = status === 'running' ? 'запущена' : 
                          status === 'paused' ? 'приостановлена' : 
                          status === 'stopped' ? 'остановлена' : 'завершена';
        
        await supabase.from('activities').insert([{
          user_id: user.id,
          type: 'campaign_status_changed',
          description: `Кампания "${campaign?.name}" ${statusText}`
        }]);
      }
    }

    return { data, error };
  };

  const deleteCampaign = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (!error) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      
      // Добавить активность
      if (user && campaign) {
        await supabase.from('activities').insert([{
          user_id: user.id,
          type: 'campaign_deleted',
          description: `Кампания "${campaign.name}" удалена`
        }]);
      }
    }

    return { error };
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaignStatus,
    deleteCampaign,
    refetch: fetchCampaigns
  };
};