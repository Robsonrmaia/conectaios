/**
 * Hook para integração segura com chat externo via PostMessage Bridge
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildChatUrl, PropertyLite } from "@/lib/chatExternal";

const CHAT_ORIGIN = "https://preview--chatconectaios.lovable.app";
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
      console.log("🔗 Abrindo chat em nova aba");
      const url = await getChatUrl(property);
      console.log("🌐 URL do bridge:", url);
      
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      
      if (!popup) {
        console.error("❌ Pop-up bloqueado pelo navegador");
        alert("Bloqueador de pop-ups ativado! Permita pop-ups para acessar o chat.");
        return;
      }

      console.log("⏳ Aguardando handshake do Bridge...");
      let handshakeCompleted = false;
      const timeout = setTimeout(() => {
        if (!handshakeCompleted) {
          console.error("⏱️ Timeout: Bridge não respondeu em 15s");
          console.error("🔍 Possíveis causas:");
          console.error("  1. Bridge não está enviando CHAT_BRIDGE_READY");
          console.error("  2. Middleware do chat está redirecionando /bridge");
          console.error("  3. CORS/origem bloqueada");
          popup.close();
          alert("Falha ao conectar com o chat. Verifique o console para mais detalhes.");
        }
      }, HANDSHAKE_TIMEOUT);

      // Listener para handshake
      const onMessage = async (ev: MessageEvent) => {
        console.log("📨 Mensagem recebida:", { origin: ev.origin, type: ev.data?.type });
        
        if (ev.origin !== CHAT_ORIGIN) {
          console.warn("⚠️ Origem rejeitada:", ev.origin, "- Esperado:", CHAT_ORIGIN);
          return;
        }
        
        if (ev.data?.type !== "CHAT_BRIDGE_READY") {
          console.log("📭 Mensagem ignorada (tipo diferente):", ev.data?.type);
          return;
        }

        console.log("✅ CHAT_BRIDGE_READY recebido de:", ev.origin);
        handshakeCompleted = true;
        clearTimeout(timeout);

        try {
          await sendSessionToChat(popup, CHAT_ORIGIN);
          console.log("✅ Sessão enviada ao chat (nova aba)");
        } catch (err) {
          console.error("❌ Erro ao enviar sessão:", err);
          popup.close();
          alert(`Erro ao autenticar no chat: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        } finally {
          window.removeEventListener("message", onMessage);
        }
      };

      window.addEventListener("message", onMessage);

    } catch (err) {
      console.error("❌ Erro ao abrir chat:", err);
      alert(`Erro ao abrir o chat: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [getChatUrl, sendSessionToChat]);

  /**
   * Abre chat em iframe (modal) com handshake
   */
  const openChatModal = useCallback(async (property?: PropertyLite): Promise<void> => {
    try {
      console.log("🔗 Abrindo chat modal");
      const url = await getChatUrl(property);
      console.log("🌐 URL do bridge:", url);
      
      setChatUrl(url);
      setModalOpen(true);

      // Aguardar iframe carregar (1500ms para garantir que o Bridge carregue)
      setTimeout(() => {
        const iframe = document.querySelector<HTMLIFrameElement>(
          'iframe[title="ConectaChat - Sistema de Mensageria"]'
        );
        
        if (!iframe?.contentWindow) {
          console.error("❌ Iframe não encontrado no DOM");
          setModalOpen(false);
          setChatUrl("");
          alert("Erro ao carregar iframe do chat. Tente novamente.");
          return;
        }

        console.log("✅ Iframe encontrado, aguardando handshake...");

        let handshakeCompleted = false;
        const timeout = setTimeout(() => {
          if (!handshakeCompleted) {
            console.error("⏱️ Timeout: Bridge (iframe) não respondeu em 15s");
            console.error("🔍 Possíveis causas:");
            console.error("  1. Bridge não está enviando CHAT_BRIDGE_READY");
            console.error("  2. Middleware do chat está redirecionando /bridge");
            console.error("  3. Iframe sandbox bloqueando scripts");
            console.error("  4. CORS/origem bloqueada");
            console.error("📋 URL do iframe:", url);
            console.error("📋 Origem esperada:", CHAT_ORIGIN);
            setModalOpen(false);
            setChatUrl("");
            alert("Falha ao conectar com o chat. Verifique o console para mais detalhes.");
          }
        }, HANDSHAKE_TIMEOUT);

        // Listener para handshake
        const onMessage = async (ev: MessageEvent) => {
          console.log("📨 Mensagem recebida (iframe):", { origin: ev.origin, type: ev.data?.type });
          
          if (ev.origin !== CHAT_ORIGIN) {
            console.warn("⚠️ Origem rejeitada:", ev.origin, "- Esperado:", CHAT_ORIGIN);
            return;
          }
          
          if (ev.data?.type !== "CHAT_BRIDGE_READY") {
            console.log("📭 Mensagem ignorada (tipo diferente):", ev.data?.type);
            return;
          }

          console.log("✅ CHAT_BRIDGE_READY recebido de:", ev.origin);
          handshakeCompleted = true;
          clearTimeout(timeout);

          try {
            if (!iframe.contentWindow) throw new Error("Iframe perdido após handshake");
            await sendSessionToChat(iframe.contentWindow, CHAT_ORIGIN);
            console.log("✅ Sessão enviada ao chat (iframe)");
          } catch (err) {
            console.error("❌ Erro ao enviar sessão (iframe):", err);
            setModalOpen(false);
            setChatUrl("");
            alert(`Erro ao autenticar no chat: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          } finally {
            window.removeEventListener("message", onMessage);
          }
        };

        window.addEventListener("message", onMessage);
      }, 1500); // Aumentado de 600ms para 1500ms

    } catch (err) {
      console.error("❌ Erro ao abrir modal do chat:", err);
      alert(`Erro ao abrir o chat: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
