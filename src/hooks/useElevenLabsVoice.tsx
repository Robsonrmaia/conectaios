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

  // Enhanced text cleaning for better Portuguese speech
  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove emojis and special characters
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Clean up common problematic characters
      .replace(/[""'']/g, '"')
      .replace(/[–—]/g, '-')
      // Handle currency better
      .replace(/R\$\s*(\d+)/g, '$1 reais')
      .replace(/(\d+)\s*m²/g, '$1 metros quadrados')
      // Handle Portuguese accents and special chars better
      .replace(/ção/g, 'ssão')
      .replace(/ções/g, 'ssões')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Stop all global audios
  const stopAllGlobalAudios = () => {
    globalAudioInstances.forEach((audio, id) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
      globalSpeakingStates.set(id, false);
    });
    
    // Stop native speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    globalCurrentSpeakingId = null;
    
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
      console.error('ElevenLabs failed, using native speech synthesis');
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        if (audioId) {
          globalSpeakingStates.set(audioId, false);
        }
        globalCurrentSpeakingId = null;
        
        // Notify all listeners
        stateListeners.forEach(listener => listener());
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        if (audioId) {
          globalSpeakingStates.set(audioId, false);
        }
        globalCurrentSpeakingId = null;
        
        // Notify all listeners
        stateListeners.forEach(listener => listener());
      };
      
      window.speechSynthesis.speak(utterance);
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