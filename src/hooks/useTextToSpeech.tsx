import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

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

    const utterance = new SpeechSynthesisUtterance(text);
    
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