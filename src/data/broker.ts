import { supabase } from '@/integrations/supabase/client';

export interface BrokerData {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  creci?: string;
  whatsapp?: string;
  minisite_slug?: string;
  username?: string;
}

export const brokerService = {
  async getCurrent(): Promise<BrokerData | null> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return null;

      // Buscar dados do profile e broker
      const [profileResult, brokerResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, email, phone, avatar_url, cover_url, bio')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('brokers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (profileResult.error) throw profileResult.error;
      if (brokerResult.error) throw brokerResult.error;

      const profile = profileResult.data;
      let broker = brokerResult.data;

      // Se broker não existe, criar um
      if (!broker) {
        const { data: brokerId, error: createError } = await supabase.rpc('ensure_broker_for_user', {
          p_user: user.id
        });
        
        if (createError) throw createError;

        // Buscar o broker criado
        const { data: newBroker, error: fetchError } = await supabase
          .from('brokers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;
        broker = newBroker;
      }

      // Combinar dados do profile e broker
      return {
        id: broker.id,
        user_id: broker.user_id,
        name: profile?.name || user.email || 'Usuário',
        email: profile?.email || user.email || '',
        phone: profile?.phone || broker.whatsapp,
        avatar_url: profile?.avatar_url,
        cover_url: profile?.cover_url,
        bio: profile?.bio || broker.bio,
        creci: broker.creci,
        whatsapp: broker.whatsapp,
        minisite_slug: broker.minisite_slug
      };
    } catch (error) {
      console.error('Error getting current broker:', error);
      throw error;
    }
  },

  async update(updates: Partial<BrokerData>): Promise<BrokerData> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Separar atualizações para profile e broker
      const profileUpdates: any = {};
      const brokerUpdates: any = {};

      if (updates.name !== undefined) profileUpdates.name = updates.name;
      if (updates.email !== undefined) profileUpdates.email = updates.email;
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
      if (updates.cover_url !== undefined) profileUpdates.cover_url = updates.cover_url;
      if (updates.bio !== undefined) {
        profileUpdates.bio = updates.bio;
        brokerUpdates.bio = updates.bio;
      }

      if (updates.creci !== undefined) brokerUpdates.creci = updates.creci;
      if (updates.whatsapp !== undefined) brokerUpdates.whatsapp = updates.whatsapp;
      if (updates.minisite_slug !== undefined) brokerUpdates.minisite_slug = updates.minisite_slug;

      // Atualizar em paralelo
      const promises = [];

      if (Object.keys(profileUpdates).length > 0) {
        promises.push(
          supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id)
        );
      }

      if (Object.keys(brokerUpdates).length > 0) {
        promises.push(
          supabase
            .from('brokers')
            .update(brokerUpdates)
            .eq('user_id', user.id)
        );
      }

      if (promises.length > 0) {
        const results = await Promise.all(promises);
        for (const result of results) {
          if (result.error) throw result.error;
        }
      }

      // Retornar dados atualizados
      return await this.getCurrent() as BrokerData;
    } catch (error) {
      console.error('Error updating broker:', error);
      throw error;
    }
  }
};