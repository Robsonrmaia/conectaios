import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home } from 'lucide-react';
import PipelineCRM from '@/components/PipelineCRM';
import SmartCalendar from '@/components/SmartCalendar';

export default function CRM() {
  const navigate = useNavigate();

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
          <PipelineCRM />
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <SmartCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}