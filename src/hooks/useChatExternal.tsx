/**
 * Hook para obter URL do chat externo com tokens da sessão atual
 */

import { supabase } from "@/integrations/supabase/client";
import { buildChatUrl, PropertyLite } from "@/lib/chatExternal";

export function useChatExternal() {
  /**
   * Gera URL do chat externo com tokens da sessão atual
   * @param property - Dados do imóvel (opcional) para pré-preencher mensagem
   * @returns URL do chat externo ou URL base se não houver sessão
   */
  const getChatUrl = async (property?: PropertyLite): Promise<string> => {
    try {
      const { data } = await supabase.auth.getSession();
      const access = data.session?.access_token;
      const refresh = data.session?.refresh_token;
      const userId = data.session?.user?.id ?? "";

      // Se não houver tokens, retornar URL base do chat
      if (!access || !refresh) {
        console.warn("⚠️ Sessão não encontrada, abrindo chat sem autenticação");
        return "https://chat.conectaios.com.br/";
      }

      return buildChatUrl(access, refresh, {
        property,
        corretorId: userId,
        originBaseUrl: window.location.origin,
      });
    } catch (error) {
      console.error("❌ Erro ao gerar URL do chat:", error);
      return "https://chat.conectaios.com.br/";
    }
  };

  /**
   * Abre o chat externo em nova aba
   * @param property - Dados do imóvel (opcional)
   */
  const openChat = async (property?: PropertyLite): Promise<void> => {
    const url = await getChatUrl(property);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return { getChatUrl, openChat };
}
