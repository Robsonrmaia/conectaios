import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface VoiceRecordingResult {
  text: string;
  structured?: any;
  type: string;
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      updateAudioLevel();
      
      toast({
        title: "Gravação iniciada",
        description: "Fale agora...",
      });
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        title: "Erro",
        description: "Falha ao acessar microfone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = (): Promise<VoiceRecordingResult> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Gravação não iniciada'));
        return;
      }

      setIsRecording(false);
      setIsProcessing(true);
      
      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Stop all tracks
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }

          if (audioBlob.size === 0) {
            throw new Error('Áudio vazio');
          }

          console.log('🎤 Processando áudio:', audioBlob.size, 'bytes');

          // Converter para base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              if (!base64Audio) {
                throw new Error('Falha ao processar áudio');
              }

              // Determine type based on context (default to 'general')
              const type = 'task'; // You can make this dynamic based on context

              // Enviar para transcrição com timeout maior para agenda
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
              
              const { data, error } = await supabase.functions.invoke('transcribe-audio', {
                body: { audio: base64Audio, type }
              });
              
              clearTimeout(timeoutId);

              if (error) {
                console.error('Erro transcrição:', error);
                throw new Error('Falha na transcrição: ' + (error.message || 'Erro desconhecido'));
              }

              if (!data) {
                throw new Error('Nenhuma resposta da transcrição');
              }

              console.log('✅ Transcrição bem-sucedida:', data.text);

              // Enhanced feedback based on result
              if (data.structured) {
                toast({
                  title: "Gravação processada!",
                  description: `Dados estruturados extraídos: ${Object.keys(data.structured).join(', ')}`,
                });
                resolve({ text: data.text, structured: data.structured, type: data.type });
              } else {
                toast({
                  title: "Áudio transcrito!",
                  description: "Dados processados com sucesso",
                });
                resolve({ text: data.text, type: data.type });
              }
            } catch (error) {
              console.error('❌ Erro ao processar:', error);
              toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Falha ao processar áudio",
                variant: "destructive",
              });
              reject(error);
            } finally {
              setIsProcessing(false);
            }
          };

          reader.onerror = () => {
            const error = new Error('Falha ao converter áudio');
            console.error('❌ FileReader error:', error);
            toast({
              title: "Erro",
              description: "Falha ao converter áudio",
              variant: "destructive",
            });
            setIsProcessing(false);
            reject(error);
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('❌ Erro no processamento:', error);
          toast({
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro desconhecido",
            variant: "destructive",
          });
          setIsProcessing(false);
          reject(error);
        }
      };

      mediaRecorderRef.current.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      setIsProcessing(false);
      
      // Stop audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevel(0);
      
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      toast({
        title: "Gravação cancelada",
        description: "Gravação interrompida",
      });
    }
  };

  return {
    isRecording,
    isProcessing,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}