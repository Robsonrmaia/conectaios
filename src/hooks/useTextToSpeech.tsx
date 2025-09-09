import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Função para limpar texto de emojis e caracteres especiais
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove asteriscos
      .replace(/\*/g, '')
      // Remove caracteres especiais excessivos
      .replace(/[^\w\s\.\,\!\?\:\;\-\(\)]/g, ' ')
      // Remove espaços duplos
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback((text: string) => {
    if (!text) {
      toast.error('Nenhuma descrição encontrada para ler');
      return;
    }

    // Verifica se o navegador suporta síntese de fala
    if (!('speechSynthesis' in window)) {
      toast.error('Seu navegador não suporta síntese de fala');
      return;
    }

    // Para qualquer fala em andamento
    window.speechSynthesis.cancel();

    // Limpa o texto antes de criar o utterance
    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configurações da fala
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      toast.error('Erro ao reproduzir áudio');
    };

    // Inicia a fala
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking
  };
};