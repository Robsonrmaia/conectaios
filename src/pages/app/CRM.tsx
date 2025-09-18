import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Mic } from 'lucide-react';
import PipelineCRM from '@/components/PipelineCRM';
import SmartCalendar from '@/components/SmartCalendar';
import { VoiceClientRecorder } from '@/components/VoiceClientRecorder';

export default function CRM() {
  const navigate = useNavigate();
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  const handleVoiceClientData = (clientData: any) => {
    console.log('Voice client data received:', clientData);
    // Here you could automatically create a new client in PipelineCRM
    // or show a form pre-filled with the voice data
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">CRM Completo</h1>
            <p className="text-muted-foreground">
              Pipeline drag-and-drop, histórico detalhado, tarefas e notas
            </p>
          </div>
        </div>
      </div>
        
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pipeline">Pipeline CRM</TabsTrigger>
          <TabsTrigger value="agenda">Agenda Inteligente</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setIsVoiceRecorderOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              Gravar Cliente
            </Button>
          </div>
          <PipelineCRM />
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <SmartCalendar />
        </TabsContent>
      </Tabs>
      
      <VoiceClientRecorder 
        isOpen={isVoiceRecorderOpen}
        onClose={() => setIsVoiceRecorderOpen(false)}
        onClientData={handleVoiceClientData}
      />
    </div>
  );
}