/**
 * Hook para obter URL do chat externo com tokens da sessão atual
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildChatUrl, PropertyLite } from "@/lib/chatExternal";

export function useChatExternal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [chatUrl, setChatUrl] = useState("");
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

      // Validação rigorosa dos tokens
      if (!access || access.length < 100) {
        console.error("❌ Access token inválido:", access?.length, "chars");
        return "https://chat.conectaios.com.br/";
      }

      if (!refresh || refresh.length < 100) {
        console.error("❌ Refresh token inválido:", refresh?.length, "chars");
        console.error("📦 Token recebido:", refresh);
        return "https://chat.conectaios.com.br/";
      }

      console.log("✅ Tokens válidos!", {
        accessLength: access.length,
        refreshLength: refresh.length,
        userId: userId || "sem userId"
      });

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

  /**
   * Abre o chat externo em modal (URL fica oculta)
   * @param property - Dados do imóvel (opcional)
   */
  const openChatModal = async (property?: PropertyLite): Promise<void> => {
    const url = await getChatUrl(property);
    setChatUrl(url);
    setModalOpen(true);
  };

  /**
   * Fecha o modal do chat
   */
  const closeChatModal = () => {
    setModalOpen(false);
    setChatUrl("");
  };

  return { 
    getChatUrl, 
    openChat, 
    openChatModal, 
    closeChatModal,
    modalOpen,
    chatUrl
  };
}
