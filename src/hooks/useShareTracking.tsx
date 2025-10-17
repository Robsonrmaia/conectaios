import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ShareLinkData {
  shareId: string;
  trackableUrl: string;
}

export function useShareTracking() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { session } = useAuth();

  /**
   * Gera um link rastreável único para compartilhamento
   */
  const generateTrackableLink = async (
    propertyId: string,
    channel: 'whatsapp' | 'email' | 'sms' = 'whatsapp'
  ): Promise<ShareLinkData | null> => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado');
      return null;
    }

    setIsGenerating(true);
    
    try {
      // Gerar ID único para rastreamento
      const shareId = `${propertyId.slice(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      
      // Inserir no banco de dados
      const { error } = await supabase
        .from('property_share_links')
        .insert({
          share_id: shareId,
          property_id: propertyId,
          broker_id: session.user.id,
          share_channel: channel,
        });

      if (error) {
        console.error('Erro ao criar link rastreável:', error);
        throw error;
      }

      // Construir URL rastreável
      const trackableUrl = `${window.location.origin}/imovel/${propertyId}?share=${shareId}`;

      return {
        shareId,
        trackableUrl,
      };
    } catch (error) {
      console.error('Erro ao gerar link rastreável:', error);
      toast.error('Erro ao gerar link de compartilhamento');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Registra uma visualização quando o link é aberto
   */
  const recordView = async (shareId: string) => {
    try {
      console.log('📊 [recordView] Iniciando registro para shareId:', shareId);
      
      // Buscar o link compartilhado - USAR .maybeSingle() ao invés de .single()
      const { data: shareLink, error: shareLinkError } = await supabase
        .from('property_share_links')
        .select('id')
        .eq('share_id', shareId)
        .maybeSingle(); // ✅ Não falha se não encontrar

      if (shareLinkError) {
        console.error('❌ [recordView] Erro ao buscar shareLink:', shareLinkError);
        return;
      }

      if (!shareLink) {
        console.warn('⚠️ [recordView] ShareId não encontrado:', shareId);
        return;
      }

      console.log('✅ [recordView] ShareLink encontrado:', shareLink.id);

      // Registrar visualização - RLS permite INSERT público
      const { data: viewData, error: viewError } = await supabase
        .from('property_link_views')
        .insert({
          share_link_id: shareLink.id,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        })
        .select()
        .single();

      if (viewError) {
        console.error('❌ [recordView] Erro ao inserir view:', viewError);
        return;
      }

      console.log('✅ [recordView] View registrada com sucesso:', viewData);
    } catch (error) {
      console.error('💥 [recordView] Erro fatal:', error);
    }
  };

  /**
   * Registra uma interação (ex: clique em WhatsApp, foto aberta, etc)
   */
  const recordInteraction = async (
    shareId: string,
    interactionType: string,
    interactionData?: Record<string, any>
  ) => {
    try {
      const { data: shareLink, error: shareLinkError } = await supabase
        .from('property_share_links')
        .select('id')
        .eq('share_id', shareId)
        .single();

      if (shareLinkError || !shareLink) return;

      await supabase
        .from('property_interactions')
        .insert({
          share_link_id: shareLink.id,
          interaction_type: interactionType,
          interaction_data: interactionData || {},
        });
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
    }
  };

  /**
   * Busca estatísticas de compartilhamento do corretor
   */
  const getShareStats = async () => {
    if (!session?.user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('property_share_links')
        .select(`
          *,
          imoveis!property_share_links_property_id_fkey (
            id,
            titulo,
            valor,
            bairro
          ),
          property_link_views (
            id,
            viewed_at
          ),
          property_interactions (
            id,
            interaction_type,
            interaction_data,
            created_at
          )
        `)
        .eq('broker_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return data;

      // Buscar fotos de capa separadamente
      const propertyIds = [...new Set(data.map(s => s.property_id))];
      
      const { data: coverImages } = await supabase
        .from('imovel_images')
        .select('imovel_id, url')
        .in('imovel_id', propertyIds)
        .eq('is_cover', true);
      
      // Criar mapa de fotos de capa
      const coverMap: Record<string, string> = {};
      coverImages?.forEach(img => {
        coverMap[img.imovel_id] = img.url;
      });
      
      // Adicionar cover_url aos dados
      const enrichedData = data.map(share => ({
        ...share,
        imoveis: share.imoveis ? {
          ...share.imoveis,
          cover_url: coverMap[share.property_id] || null
        } : null
      }));

      return enrichedData;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  };

  return {
    generateTrackableLink,
    recordView,
    recordInteraction,
    getShareStats,
    isGenerating,
  };
}
