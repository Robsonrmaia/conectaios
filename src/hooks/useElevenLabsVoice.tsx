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

  // Optimized text cleaning preserving Portuguese accents
  const cleanTextForSpeech = (text: string): string => {
    console.log('🎤 Texto original para limpeza:', text.substring(0, 100) + '...');
    
    const cleaned = text
      // Remove emojis completos e símbolos especiais
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove símbolos específicos comuns em textos imobiliários  
      .replace(/🏠|🏡|🏢|🏘️|🏗️|🏙️/g, '')
      .replace(/💰|💵|💲|🤑/g, '')
      .replace(/🎯|📍|📌|🗺️/g, '')
      .replace(/•/g, '') // Remove bullet points
      // Remove markdown e formatação
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
      .replace(/__(.*?)__/g, '$1')     // Remove __underline**
      .replace(/~~(.*?)~~/g, '$1')     // Remove ~~strikethrough~~
      .replace(/#{1,6}\s/g, '')        // Remove headers markdown
      // Limpa caracteres problemáticos
      .replace(/[""'']/g, '"')
      .replace(/[–—]/g, '-')
      // Trata valores monetários brasileiros de forma mais natural
      .replace(/R\$\s*(\d+)\.(\d+)\.(\d+),(\d+)/g, '$1 milhões $2 mil $3 reais e $4 centavos')
      .replace(/R\$\s*(\d+)\.(\d+),(\d+)/g, '$1 mil $2 reais e $3 centavos')
      .replace(/R\$\s*(\d+),(\d+)/g, '$1 reais e $2 centavos')
      .replace(/R\$\s*(\d+)/g, '$1 reais')
      // Trata medidas específicas imobiliárias
      .replace(/(\d+)\s*m²/g, '$1 metros quadrados')
      .replace(/(\d+)\s*m2/g, '$1 metros quadrados')
      .replace(/(\d+)\s*km/g, '$1 quilômetros')
      // ❌ REMOVIDO: Não modificar pronúncia portuguesa - preservar acentos originais
      // Remove apenas caracteres especiais problemáticos, mantendo acentos e pontuação
      .replace(/[^\w\sàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ\.\,\!\?\:\;\-\(\)\%\$]/g, ' ')
      // Adiciona pausas em pontuações para melhor prosódia
      .replace(/\./g, '. ')
      .replace(/\,/g, ', ')
      .replace(/\:/g, ': ')
      .replace(/\;/g, '; ')
      // Remove espaços duplos e triplos
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('🎤 Texto limpo para síntese (preservando acentos):', cleaned.substring(0, 100) + '...');
    return cleaned;
  };

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

      // Create timeout promise for fast fallback (5 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('ElevenLabs timeout')), 5000)
      );
      
      const fetchPromise = fetch('https://hvbdeyuqcliqrmzvyciq.supabase.co/functions/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YmRleXVxY2xpcXJtenZ5Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDAwNDgsImV4cCI6MjA3MDQxNjA0OH0.9-Ewj0EvAuo-z9caO4euMntxxRI-MlqgZDTba6Hw98I`
        },
        body: JSON.stringify({
          text: cleanedText,
          voice_id: '9BWtsMINqrJLrRacOk9x', // Aria - natural female voice  
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
      console.error('❌ ElevenLabs failed, fallback para síntese nativa:', error);
      
      // Stop any ongoing speech before starting native
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.85; // Velocidade mais natural
      utterance.pitch = 1.1; // Tom ligeiramente mais alto para melhor clareza
      utterance.volume = 0.9; // Volume otimizado
      
      // Tentar usar voz feminina portuguesa se disponível
      const voices = window.speechSynthesis.getVoices();
      const brazilianVoice = voices.find(voice => 
        voice.lang.includes('pt-BR') && voice.name.includes('fem') || 
        voice.lang.includes('pt-BR') && voice.name.toLowerCase().includes('female') ||
        voice.lang.includes('pt-BR')
      );
      
      if (brazilianVoice) {
        console.log('🎤 Usando voz brasileira:', brazilianVoice.name);
        utterance.voice = brazilianVoice;
      } else {
        console.log('⚠️ Voz brasileira não encontrada, usando padrão');
      }
      
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