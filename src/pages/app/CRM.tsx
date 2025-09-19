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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 w-full sm:w-auto min-h-[44px]"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="px-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-tight">CRM Completo</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Pipeline drag-and-drop, histórico detalhado, tarefas e notas
            </p>
          </div>
        </div>
      </div>
        
      <Tabs defaultValue="pipeline" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="grid w-full grid-cols-2 min-w-max h-12">
            <TabsTrigger value="pipeline" className="text-sm font-medium min-h-[44px]">Pipeline CRM</TabsTrigger>
            <TabsTrigger value="agenda" className="text-sm font-medium min-h-[44px]">Agenda Inteligente</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipeline" className="space-y-4 focus:outline-none">
          <div className="min-h-[400px]">
            <PipelineCRM />
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4 focus:outline-none">
          <div className="min-h-[400px]">
            <SmartCalendar />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}