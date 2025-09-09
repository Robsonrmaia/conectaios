import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Declare global window property
declare global {
  interface Window {
    currentGlobalAudio?: HTMLAudioElement | null;
  }
}

export const useElevenLabsVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Função para limpar texto para melhor síntese de voz
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove emojis básicos
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove asteriscos mas mantém acentos e cedilha
      .replace(/\*/g, '')
      // Melhora tratamento de acentos e cedilha - especificamente para português
      .replace(/ç/g, 'ç')
      .replace(/Ç/g, 'Ç')
      // Remove apenas caracteres especiais problemáticos, mantendo acentos, cedilha e pontuação
      .replace(/[^\w\s\.\,\!\?\:\;\-\(\)àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎ��ÑÒÓÔÕÖØÙÚÛÜÝŸ]/g, ' ')
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

  const speak = useCallback(async (text: string, audioId?: string) => {
    if (!text.trim()) return;

    const speakingId = audioId || `audio-${Date.now()}`;

    try {
      // Stop any current audio globally
      if (window.currentGlobalAudio) {
        window.currentGlobalAudio.pause();
        window.currentGlobalAudio.currentTime = 0;
      }

      // Stop current audio from this hook
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current.currentTime = 0;
        currentAudio.current = null;
      }

      // Stop native speech if it's running
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(true);
      setCurrentSpeakingId(speakingId);

      // Clean the text for better speech
      const cleanedText = cleanTextForSpeech(text);

      console.log('🎤 Trying ElevenLabs for:', cleanedText.substring(0, 50) + '...');

      const response = await fetch('https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YmRleXVxY2xpcXJtenZ5Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDAwNDgsImV4cCI6MjA3MDQxNjA0OH0.9-Ewj0EvAuo-z9caO4euMntxxRI-MlqgZDTba6Hw98I`
        },
        body: JSON.stringify({
          text: cleanedText,
          voice_id: '9BWtsMINqrJLrRacOk9x', // Aria - natural female voice
          model_id: 'eleven_multilingual_v2'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API error:', errorText);
        throw new Error('ElevenLabs synthesis failed');
      }

      console.log('✅ ElevenLabs responded successfully');
      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudio.current = audio;
      window.currentGlobalAudio = audio; // Global reference
      
      audio.onplay = () => {
        console.log('🔊 Audio started playing');
        setIsSpeaking(true);
      };
      
      audio.onended = () => {
        console.log('🔇 Audio playback ended');
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
        URL.revokeObjectURL(audioUrl);
        currentAudio.current = null;
        if (window.currentGlobalAudio === audio) {
          window.currentGlobalAudio = null;
        }
      };
      
      audio.onerror = (error) => {
        console.error('🚨 Audio playback error:', error);
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
        URL.revokeObjectURL(audioUrl);
        currentAudio.current = null;
        if (window.currentGlobalAudio === audio) {
          window.currentGlobalAudio = null;
        }
      };
      
      await audio.play();

    } catch (error) {
      console.error('❌ Error in ElevenLabs synthesis:', error);
      
      // Fallback to native speech
      try {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
          utterance.lang = 'pt-BR';
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          
          // Wait for voices to load if needed
          const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            
            // Try to find a female Portuguese voice
            const femalePortugueseVoice = voices.find(voice => 
              voice.lang.startsWith('pt') && 
              (voice.name.toLowerCase().includes('female') || 
               voice.name.toLowerCase().includes('feminina') ||
               voice.name.toLowerCase().includes('zira') ||
               voice.name.toLowerCase().includes('raquel'))
            ) || voices.find(voice => voice.lang.startsWith('pt'));
            
            if (femalePortugueseVoice) {
              utterance.voice = femalePortugueseVoice;
              console.log('🎙️ Using voice:', femalePortugueseVoice.name);
            }
            
            utterance.onend = () => {
              console.log('🔇 Native speech ended');
              setIsSpeaking(false);
              setCurrentSpeakingId(null);
            };
            
            utterance.onerror = (error) => {
              console.error('🚨 Native speech error:', error);
              setIsSpeaking(false);
              setCurrentSpeakingId(null);
            };
            
            window.speechSynthesis.speak(utterance);
          };
          
          if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
          } else {
            loadVoices();
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback speech error:', fallbackError);
        setIsSpeaking(false);
        setCurrentSpeakingId(null);
        toast.error('Erro na síntese de voz');
      }
    }
  }, []);

  const stop = useCallback(() => {
    setIsSpeaking(false);
    setCurrentSpeakingId(null);
    
    // Stop ElevenLabs audio
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
      currentAudio.current = null;
    }
    
    // Stop global audio
    if (window.currentGlobalAudio) {
      window.currentGlobalAudio.pause();
      window.currentGlobalAudio.currentTime = 0;
      window.currentGlobalAudio = null;
    }
    
    // Stop native speech synthesis
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const isCurrentlySpeaking = useCallback((audioId?: string) => {
    return isSpeaking && (!audioId || currentSpeakingId === audioId);
  }, [isSpeaking, currentSpeakingId]);

  return { speak, stop, isSpeaking, isCurrentlySpeaking, currentSpeakingId };
};