import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/components/ui/use-toast';

interface VoiceClientRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onClientData: (clientData: any) => void;
}

export function VoiceClientRecorder({ isOpen, onClose, onClientData }: VoiceClientRecorderProps) {
  const { isRecording, isProcessing, audioLevel, processingStep, startRecording, stopRecording, cancelRecording } = useVoiceRecording('client');
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      onClose();
    }
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    
    console.log('🎤 Voice recording result:', result);
    
    if (result && result.structured) {
      console.log('✅ Structured client data received:', result.structured);
      onClientData(result.structured);
      toast({
        title: "Cliente adicionado por voz",
        description: "Dados do cliente extraídos com sucesso!",
      });
      onClose();
    } else if (result && result.text) {
      console.log('⚠️ Only text transcription available:', result.text);
      // Fallback: create basic client with transcribed text
      const fallbackClient = {
        nome: "Cliente por Voz",
        telefone: "",
        tipo: "cliente",
        classificacao: "novo_lead",
        descricao: result.text
      };
      onClientData(fallbackClient);
      toast({
        title: "Cliente criado",
        description: "Cliente criado com transcrição de voz (dados manuais necessários)",
      });
      onClose();
    } else {
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível processar a gravação de voz",
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
            <Mic className="h-5 w-5" />
            Gravar Dados do Cliente
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {!isRecording && !isProcessing && "Clique para começar a gravar"}
              {isRecording && "Fale os dados do cliente: nome, telefone, interesse..."}
              {isProcessing && processingStep && processingStep}
              {isProcessing && !processingStep && "Processando transcrição..."}
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
                {processingStep || "Processando..."}
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>💡 <strong>Dica:</strong> Fale claramente informações como:</p>
            <p>"João Silva, telefone 11 99999-9999, quer comprar apartamento de 2 quartos, orçamento 300 mil"</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}