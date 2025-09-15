import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Square, Loader2, Calendar } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/components/ui/use-toast';

interface VoiceTaskRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskData: (taskData: any) => void;
}

export function VoiceTaskRecorder({ isOpen, onClose, onTaskData }: VoiceTaskRecorderProps) {
  const { isRecording, isProcessing, audioLevel, startRecording, stopRecording, cancelRecording } = useVoiceRecording();
  const { toast } = useToast();

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      onClose();
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording('task');
    
    if (result && result.structured) {
      onTaskData(result.structured);
      onClose();
    } else if (result) {
      // Se não conseguiu extrair dados estruturados, mostrar texto bruto
      toast({
        title: "Transcrição realizada",
        description: "Não foi possível extrair dados da tarefa. Texto: " + result.text.substring(0, 100) + "...",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      cancelRecording();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gravar Nova Tarefa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {!isRecording && !isProcessing && "Clique para começar a gravar"}
              {isRecording && "Descreva a tarefa, data e horário..."}
              {isProcessing && "Processando transcrição..."}
            </p>
            
            {/* Indicador visual de nível de áudio */}
            {isRecording && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.max(5, audioLevel)}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            {!isRecording && !isProcessing && (
              <Button
                onClick={handleStartRecording}
                className="bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                <Mic className="h-5 w-5 mr-2" />
                Iniciar Gravação
              </Button>
            )}

            {isRecording && (
              <>
                <Button
                  onClick={handleStopRecording}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="lg"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Parar e Processar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="lg"
                >
                  Cancelar
                </Button>
              </>
            )}

            {isProcessing && (
              <Button disabled size="lg">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>💡 <strong>Dica:</strong> Fale claramente:</p>
            <p>"Ligar para cliente João amanhã às 14h para mostrar apartamento, prioridade alta"</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}