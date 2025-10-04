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
      console.log("🔗 Gerando URL do chat externo...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("❌ Erro ao obter sessão:", error);
        return "https://chat.conectaios.com.br/";
      }

      const access = data.session?.access_token;
      const refresh = data.session?.refresh_token;
      const userId = data.session?.user?.id ?? "";

      console.log("🔐 Sessão encontrada:", {
        hasAccess: !!access,
        hasRefresh: !!refresh,
        userId: userId || "sem userId"
      });

      // Se não houver tokens, retornar URL base do chat
      if (!access || !refresh) {
        console.warn("⚠️ Tokens não encontrados, abrindo chat sem autenticação");
        console.warn("⚠️ Faça login em https://www.conectaios.com.br primeiro");
        return "https://chat.conectaios.com.br/";
      }

      const chatUrl = buildChatUrl(access, refresh, {
        property,
        corretorId: userId,
        originBaseUrl: window.location.origin,
      });

      console.log("✅ URL do chat gerada:", chatUrl.replace(/token=[^&]+/, "token=***").replace(/refresh=[^&]+/, "refresh=***"));
      return chatUrl;
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
