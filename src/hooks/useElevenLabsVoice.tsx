import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useElevenLabsVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

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
      
      console.log('Tentando usar ElevenLabs para:', cleanText.substring(0, 50) + '...');
      
      // Usar ElevenLabs através do Supabase Edge Function
      const response = await fetch('https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YmRleXVxY2xpcXJtenZ5Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDAwNDgsImV4cCI6MjA3MDQxNjA0OH0.9-Ewj0EvAuo-z9caO4euMntxxRI-MlqgZDTba6Hw98I`
        },
        body: JSON.stringify({
          text: cleanText,
          voice_id: '9BWtsMINqrJLrRacOk9x', // Aria - voz feminina natural
          model_id: 'eleven_multilingual_v2'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', errorText);
        throw new Error('Erro na síntese de voz');
      }

      console.log('ElevenLabs respondeu com sucesso');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Armazenar referência do áudio atual
      setCurrentAudio(audio);

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        toast.error('Erro ao reproduzir áudio');
      };

      await audio.play();
      console.log('Áudio ElevenLabs reproduzindo');
    } catch (error) {
      console.error('Erro na síntese de voz ElevenLabs:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
      toast.error('Erro na síntese de voz. Usando síntese nativa do navegador.');
      
      // Fallback para síntese nativa com voz feminina
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
        utterance.lang = 'pt-BR';
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        
        // Aguardar vozes carregarem se necessário
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log('Vozes disponíveis:', voices.map(v => v.name));
          
          // Procurar por voz feminina em português
          const femaleVoice = voices.find(voice => 
            voice.lang.startsWith('pt') && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('feminina') ||
             voice.name.toLowerCase().includes('zira') ||
             voice.name.toLowerCase().includes('raquel'))
          ) || voices.find(voice => voice.lang.startsWith('pt'));
          
          if (femaleVoice) {
            utterance.voice = femaleVoice;
            console.log('Usando voz:', femaleVoice.name);
          }
          
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          
          window.speechSynthesis.speak(utterance);
        };
        
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        } else {
          loadVoices();
        }
      }
    }
  }, [isSpeaking]);

  const stop = useCallback(() => {
    console.log('Parando áudio...');
    setIsSpeaking(false);
    
    // Parar áudio ElevenLabs se estiver tocando
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    // Parar síntese nativa
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [currentAudio]);

  return {
    speak,
    stop,
    isSpeaking
  };
};