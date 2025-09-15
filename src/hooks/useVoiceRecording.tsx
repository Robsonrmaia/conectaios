import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface VoiceRecordingResult {
  text: string;
  structured?: any;
  type: string;
}

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrame = useRef<number | null>(null);
  
  const { toast } = useToast();

  // Função para monitorar nível de áudio
  const updateAudioLevel = useCallback(() => {
    if (!analyser.current || !dataArray.current) return;
    
    analyser.current.getByteFrequencyData(dataArray.current);
    const average = dataArray.current.reduce((sum, value) => sum + value, 0) / dataArray.current.length;
    setAudioLevel(Math.min(100, (average / 255) * 100));
    
    if (isRecording) {
      animationFrame.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Iniciar gravação
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Configurar análise de áudio para feedback visual
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.current = audioContext.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);
      
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);

      // Configurar MediaRecorder
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start(100); // Captura dados a cada 100ms
      setIsRecording(true);
      
      // Iniciar monitoramento de nível
      updateAudioLevel();

      toast({
        title: "🎤 Gravação iniciada",
        description: "Fale agora...",
      });

      return true;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, updateAudioLevel]);

  // Parar gravação e processar
  const stopRecording = useCallback(async (type: 'general' | 'client' | 'task' = 'general'): Promise<VoiceRecordingResult | null> => {
    if (!mediaRecorder.current || !isRecording) return null;

    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        setAudioLevel(0);

        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }

        try {
          // Criar blob do áudio
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          
          if (audioBlob.size < 1000) { // Muito pequeno
            toast({
              title: "Áudio muito curto",
              description: "Tente gravar por mais tempo",
              variant: "destructive",
            });
            resolve(null);
            return;
          }

          console.log('🎤 Processando áudio:', audioBlob.size, 'bytes, tipo:', type);

          // Converter para base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string)?.split(',')[1];
              
              if (!base64Audio) {
                throw new Error('Falha ao processar áudio');
              }

              // Enviar para transcrição com timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
              
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64Audio, type }
              });
              
              clearTimeout(timeoutId);

              if (error) {
                console.error('Erro transcrição:', error);
                throw new Error('Falha na transcrição: ' + (error.message || 'Erro desconhecido'));
              }

              if (!data || !data.text) {
                throw new Error('Nenhuma transcrição retornada');
              }

              // Enhanced feedback based on result
              if (data.structured) {
                toast({
                  title: "✅ Dados estruturados extraídos",
                  description: "Informações processadas com sucesso!",
                });
              } else if (data.text) {
                toast({
                  title: "✅ Transcrição concluída", 
                  description: "Texto: " + data.text.substring(0, 50) + "...",
                });
              }

              resolve(data);
            } catch (error) {
              console.error('❌ Error in transcription process:', error);
              toast({
                title: "Erro na transcrição",
                description: error.message || "Tente novamente",
                variant: "destructive",
              });
              resolve(null);
            } finally {
              setIsProcessing(false);
            }
          };

          reader.onerror = () => {
            toast({
              title: "Erro ao processar áudio",
              description: "Tente novamente",
              variant: "destructive",
            });
            setIsProcessing(false);
            resolve(null);
          };

          reader.readAsDataURL(audioBlob);

        } catch (error) {
          console.error('Erro ao processar gravação:', error);
          toast({
            title: "Erro ao processar gravação",
            description: "Tente novamente",
            variant: "destructive",
          });
          setIsProcessing(false);
          resolve(null);
        }
      };

      mediaRecorder.current.stop();
      
      // Parar todas as tracks
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
    });
  }, [isRecording, toast]);

  // Cancelar gravação
  const cancelRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      if (mediaRecorder.current.stream) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setIsProcessing(false);
      setAudioLevel(0);
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      toast({
        title: "Gravação cancelada",
        description: "Nenhum áudio foi processado",
      });
    }
  }, [isRecording, toast]);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};