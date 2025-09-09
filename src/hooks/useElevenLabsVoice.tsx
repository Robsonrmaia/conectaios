import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useElevenLabsVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Função para limpar texto para melhor síntese de voz
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove asteriscos e caracteres especiais
      .replace(/\*/g, '')
      .replace(/[^\w\s\.\,\!\?\:\;\-\(\)]/g, ' ')
      // Trata valores monetários
      .replace(/R\$\s*(\d{1,3}(?:\.\d{3})*),(\d{2})/g, '$1 reais e $2 centavos')
      .replace(/R\$\s*(\d{1,3}(?:\.\d{3})*)/g, '$1 reais')
      // Trata metros quadrados
      .replace(/(\d+)\s*m²/g, '$1 metros quadrados')
      .replace(/(\d+)\s*m2/g, '$1 metros quadrados')
      // Melhora pontuação para pausas naturais
      .replace(/\./g, '. ')
      .replace(/\,/g, ', ')
      // Remove espaços duplos
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback(async (text: string) => {
    if (!text) {
      toast.error('Nenhum texto encontrado para ler');
      return;
    }

    if (isSpeaking) {
      toast.info('Aguarde o áudio anterior terminar');
      return;
    }

    setIsSpeaking(true);

    try {
      const cleanText = cleanTextForSpeech(text);
      
      // Usar ElevenLabs através do Supabase Edge Function
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          voice_id: '9BWtsMINqrJLrRacOk9x', // Aria - voz feminina natural
          model_id: 'eleven_multilingual_v2'
        })
      });

      if (!response.ok) {
        throw new Error('Erro na síntese de voz');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        toast.error('Erro ao reproduzir áudio');
      };

      await audio.play();
    } catch (error) {
      console.error('Erro na síntese de voz:', error);
      setIsSpeaking(false);
      toast.error('Erro na síntese de voz. Usando síntese nativa do navegador.');
      
      // Fallback para síntese nativa
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
        utterance.lang = 'pt-BR';
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.lang.includes('pt') && 
          (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('feminina'))
        );
        
        if (femaleVoice) utterance.voice = femaleVoice;
        
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [isSpeaking]);

  const stop = useCallback(() => {
    setIsSpeaking(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    speak,
    stop,
    isSpeaking
  };
};