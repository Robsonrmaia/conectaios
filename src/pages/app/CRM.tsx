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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">CRM Completo</h1>
            <p className="text-muted-foreground">
              Pipeline drag-and-drop, histórico detalhado, tarefas e notas
            </p>
          </div>
        </div>
      </div>
        
      <Tabs defaultValue="pipeline" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
          <TabsList className="grid w-full grid-cols-2 min-w-max">
            <TabsTrigger value="pipeline">Pipeline CRM</TabsTrigger>
            <TabsTrigger value="agenda">Agenda Inteligente</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setIsVoiceRecorderOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
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