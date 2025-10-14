/**
 * Hook para integração segura com chat externo via PostMessage Bridge
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildChatUrl, PropertyLite } from "@/lib/chatExternal";

const CHAT_ORIGIN = "https://chat.conectaios.com.br";
const HANDSHAKE_TIMEOUT = 15000; // 15s

export function useChatExternal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [chatUrl, setChatUrl] = useState("");

  /**
   * Gera URL do bridge (sem tokens)
   */
  const getChatUrl = useCallback(async (property?: PropertyLite): Promise<string> => {
    return buildChatUrl({
      property,
      originBaseUrl: window.location.origin
    });
  }, []);

  /**
   * Envia sessão via postMessage para o bridge
   */
  const sendSessionToChat = useCallback(async (
    target: Window,
    targetOrigin: string
  ): Promise<void> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error("❌ Erro ao obter sessão para chat:", error);
      throw new Error("Sessão inválida");
    }

    const { access_token, refresh_token, user } = session;

    // Validação sem logar tokens completos!
    if (!access_token || access_token.length < 100) {
      console.error("❌ Access token inválido (tamanho:", access_token?.length, ")");
      throw new Error("Token de acesso inválido");
    }

    if (!refresh_token || refresh_token.length < 100) {
      console.error("❌ Refresh token inválido (tamanho:", refresh_token?.length, ")");
      throw new Error("Token de refresh inválido");
    }

    console.log("✅ Enviando sessão ao chat (tokens OK)");

    // Enviar sessão via postMessage
    target.postMessage({
      type: "CHAT_SET_SESSION",
      payload: {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email || "Usuário"
        }
      }
    }, targetOrigin);
  }, []);

  /**
   * Abre chat em nova aba com handshake
   */
  const openChat = useCallback(async (property?: PropertyLite): Promise<void> => {
    try {
      const url = await getChatUrl(property);
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      
      if (!popup) {
        alert("Bloqueador de pop-ups ativado! Permita pop-ups para acessar o chat.");
        return;
      }

      let handshakeCompleted = false;
      const timeout = setTimeout(() => {
        if (!handshakeCompleted) {
          console.error("⏱️ Timeout: Bridge não respondeu");
          popup.close();
          alert("Falha ao conectar com o chat. Tente novamente.");
        }
      }, HANDSHAKE_TIMEOUT);

      // Listener para handshake
      const onMessage = async (ev: MessageEvent) => {
        if (ev.origin !== CHAT_ORIGIN) return;
        if (ev.data?.type !== "CHAT_BRIDGE_READY") return;

        handshakeCompleted = true;
        clearTimeout(timeout);

        try {
          await sendSessionToChat(popup, CHAT_ORIGIN);
          console.log("✅ Sessão enviada ao chat (nova aba)");
        } catch (err) {
          console.error("❌ Erro ao enviar sessão:", err);
          popup.close();
          alert("Erro ao autenticar no chat. Tente novamente.");
        } finally {
          window.removeEventListener("message", onMessage);
        }
      };

      window.addEventListener("message", onMessage);

    } catch (err) {
      console.error("❌ Erro ao abrir chat:", err);
      alert("Erro ao abrir o chat. Tente novamente.");
    }
  }, [getChatUrl, sendSessionToChat]);

  /**
   * Abre chat em iframe (modal) com handshake
   */
  const openChatModal = useCallback(async (property?: PropertyLite): Promise<void> => {
    try {
      const url = await getChatUrl(property);
      setChatUrl(url);
      setModalOpen(true);

      // Aguardar iframe carregar (600ms de buffer)
      setTimeout(() => {
        const iframe = document.querySelector<HTMLIFrameElement>(
          'iframe[title="ConectaChat - Sistema de Mensageria"]'
        );
        
        if (!iframe?.contentWindow) {
          console.error("❌ Iframe não encontrado");
          return;
        }

        let handshakeCompleted = false;
        const timeout = setTimeout(() => {
          if (!handshakeCompleted) {
            console.error("⏱️ Timeout: Bridge (iframe) não respondeu");
            closeChatModal();
            alert("Falha ao conectar com o chat. Tente novamente.");
          }
        }, HANDSHAKE_TIMEOUT);

        // Listener para handshake
        const onMessage = async (ev: MessageEvent) => {
          if (ev.origin !== CHAT_ORIGIN) return;
          if (ev.data?.type !== "CHAT_BRIDGE_READY") return;

          handshakeCompleted = true;
          clearTimeout(timeout);

          try {
            if (!iframe.contentWindow) throw new Error("Iframe perdido");
            await sendSessionToChat(iframe.contentWindow, CHAT_ORIGIN);
            console.log("✅ Sessão enviada ao chat (iframe)");
          } catch (err) {
            console.error("❌ Erro ao enviar sessão (iframe):", err);
            closeChatModal();
            alert("Erro ao autenticar no chat. Tente novamente.");
          } finally {
            window.removeEventListener("message", onMessage);
          }
        };

        window.addEventListener("message", onMessage);
      }, 600);

    } catch (err) {
      console.error("❌ Erro ao abrir modal do chat:", err);
      alert("Erro ao abrir o chat. Tente novamente.");
    }
  }, [getChatUrl, sendSessionToChat]);

  /**
   * Fecha o modal do chat
   */
  const closeChatModal = useCallback(() => {
    setModalOpen(false);
    setChatUrl("");
  }, []);

  return { 
    getChatUrl, 
    openChat, 
    openChatModal, 
    closeChatModal,
    modalOpen,
    chatUrl
  };
}
