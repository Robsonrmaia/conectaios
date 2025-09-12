import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Global audio control system
const globalAudioInstances = new Map<string, HTMLAudioElement>();
const globalSpeakingStates = new Map<string, boolean>();
let globalCurrentSpeakingId: string | null = null;

// Global state change listeners
const stateListeners = new Set<() => void>();

export const useElevenLabsVoice = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Listen to global state changes
  useEffect(() => {
    const listener = () => {
      setCurrentSpeakingId(globalCurrentSpeakingId);
      setIsSpeaking(globalCurrentSpeakingId !== null);
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      // Fix currency - remove R$ symbol entirely
      .replace(/R\$\s*/g, '')
      // Fix square meters pronunciation
      .replace(/m²/g, 'metros quadrados')
      .replace(/m2/g, 'metros quadrados')
      // Melhor tratamento de números monetários
      .replace(/(\d+)\.(\d{3})\.(\d{3})\b/g, (match, milhoes, milhares, centenas) => {
        return `${milhoes} milhões ${milhares} mil e ${centenas} reais`;
      })
      .replace(/(\d+)\.(\d{3})\b/g, (match, dezenas, milhares) => {
        return `${dezenas === '0' ? '' : dezenas + ' '}${milhares === '000' ? 'mil' : milhares.replace(/^0+/, '') + ' mil'} reais`;
      })
      .replace(/(\d+)\.000/g, (match, num) => `${num} mil reais`)
      // Format currency properly for Portuguese
      .replace(/(\d+),(\d+)/g, '$1 vírgula $2')
      // Remove special characters that might cause issues
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF.,!?;:()\-]/g, ' ')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Stop all global audios
  const stopAllGlobalAudios = () => {
    console.log('🔇 Parando todos os áudios globalmente');
    
    globalAudioInstances.forEach((audio, id) => {
      if (!audio.paused) {
        console.log(`🔇 Pausando áudio: ${id}`);
        audio.pause();
        audio.currentTime = 0;
      }
      globalSpeakingStates.set(id, false);
    });
    
    // Stop native speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      console.log('🔇 Cancelando síntese de voz nativa');
      window.speechSynthesis.cancel();
    }
    
    globalCurrentSpeakingId = null;
    console.log('🔇 Estado global atualizado para não falando');
    
    // Notify all listeners
    stateListeners.forEach(listener => listener());
  };

  const speak = useCallback(async (text: string, audioId?: string) => {
    if (!text.trim()) return;

    const cleanedText = cleanTextForSpeech(text);

    try {
      // Set global state IMMEDIATELY when function is called
      if (audioId) {
        globalCurrentSpeakingId = audioId;
        globalSpeakingStates.set(audioId, true);
      }
      
      // Notify all listeners of state change IMMEDIATELY
      stateListeners.forEach(listener => listener());

      // Stop any currently playing audio globally
      stopAllGlobalAudios();
      
      console.log('Speaking:', cleanedText, 'with ID:', audioId);

      // Set global state again after stopping others
      if (audioId) {
        globalCurrentSpeakingId = audioId;
        globalSpeakingStates.set(audioId, true);
      }
      
      // Notify all listeners of state change
      stateListeners.forEach(listener => listener());

      // Timeout de 10 segundos para dar mais tempo ao ElevenLabs
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na geração de áudio - Tente novamente')), 10000)
      );
      
      const fetchPromise = fetch('https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YmRleXVxY2xpcXJtenZ5Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDAwNDgsImV4cCI6MjA3MDQxNjA0OH0.9-Ewj0EvAuo-z9caO4euMntxxRI-MlqgZDTba6Hw98I`
        },
        body: JSON.stringify({
          text: cleanedText,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - Brazilian Portuguese female voice
          model_id: 'eleven_turbo_v2_5' // Faster model
        })
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', errorText);
        throw new Error('ElevenLabs synthesis failed');
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      
      // Store in global map if audioId provided
      if (audioId) {
        globalAudioInstances.set(audioId, audio);
      }
      
      currentAudio.current = audio;

      audio.onended = () => {
        if (audioId) {
          globalSpeakingStates.set(audioId, false);
          globalAudioInstances.delete(audioId);
        }
        globalCurrentSpeakingId = null;
        URL.revokeObjectURL(audioUrl);
        
        // Notify all listeners
        stateListeners.forEach(listener => listener());
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        if (audioId) {
          globalSpeakingStates.set(audioId, false);
          globalAudioInstances.delete(audioId);
        }
        globalCurrentSpeakingId = null;
        URL.revokeObjectURL(audioUrl);
        
        // Notify all listeners
        stateListeners.forEach(listener => listener());
      };

      await audio.play();

    } catch (error) {
      // Se ElevenLabs falhar, mostra erro sem usar voz nativa ruim
      console.error('❌ ElevenLabs falhou completamente:', error);
      
      // Reset global state
      if (audioId) {
        globalSpeakingStates.set(audioId, false);
      }
      globalCurrentSpeakingId = null;
      
      // Notify all listeners
      stateListeners.forEach(listener => listener());
      
      // Show user-friendly error
      toast.error('Serviço de voz temporariamente indisponível. Tente novamente em alguns segundos.');
      
      throw new Error('Serviço de voz temporariamente indisponível');
    }
  }, []);

  const stop = useCallback(() => {
    stopAllGlobalAudios();
  }, []);

  const isCurrentlySpeaking = useCallback((audioId?: string): boolean => {
    if (audioId) {
      return globalCurrentSpeakingId === audioId;
    }
    return globalCurrentSpeakingId !== null;
  }, []);

  return { speak, stop, isSpeaking, isCurrentlySpeaking, currentSpeakingId };
};