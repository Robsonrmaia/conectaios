import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Construction, Clock, AlertTriangle } from 'lucide-react';

export default function MaintenanceSettings() {
  const { settings, updateMaintenanceMode, updateConstructionMode } = useMaintenanceMode();
  const { toast } = useToast();
  
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    settings.maintenanceMessage || 'Sistema em manutenção. Voltaremos em breve!'
  );
  const [constructionMessage, setConstructionMessage] = useState(
    settings.constructionMessage || 'Estamos trabalhando em melhorias. Em breve teremos novidades!'
  );
  const [estimatedTime, setEstimatedTime] = useState(settings.estimatedTime || '');
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showConstructionDialog, setShowConstructionDialog] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);
  const [pendingConstructionState, setPendingConstructionState] = useState(false);

  const handleMaintenanceToggle = (enabled: boolean) => {
    setPendingMaintenanceState(enabled);
    setShowMaintenanceDialog(true);
  };

  const handleConstructionToggle = (enabled: boolean) => {
    setPendingConstructionState(enabled);
    setShowConstructionDialog(true);
  };

  const confirmMaintenanceChange = async () => {
    const result = await updateMaintenanceMode(
      pendingMaintenanceState, 
      maintenanceMessage, 
      estimatedTime
    );
    
    if (result.success) {
      toast({
        title: pendingMaintenanceState ? "Modo manutenção ativado" : "Modo manutenção desativado",
        description: pendingMaintenanceState 
          ? "O sistema está agora em modo manutenção" 
          : "O sistema voltou ao funcionamento normal"
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao alterar modo de manutenção",
        variant: "destructive"
      });
    }
    
    setShowMaintenanceDialog(false);
  };

  const confirmConstructionChange = async () => {
    const result = await updateConstructionMode(
      pendingConstructionState, 
      constructionMessage, 
      estimatedTime
    );
    
    if (result.success) {
      toast({
        title: pendingConstructionState ? "Modo construção ativado" : "Modo construção desativado",
        description: pendingConstructionState 
          ? "O sistema está agora em modo construção" 
          : "O sistema voltou ao funcionamento normal"
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao alterar modo de construção",
        variant: "destructive"
      });
    }
    
    setShowConstructionDialog(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Modo Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Ativar Modo Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Bloqueia o acesso ao sistema para todos os usuários (exceto admins)
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={handleMaintenanceToggle}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
            <Textarea
              id="maintenance-message"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Digite a mensagem que será exibida aos usuários"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Modo Construção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Ativar Modo Construção</Label>
              <p className="text-sm text-muted-foreground">
                Exibe uma página "Em Construção" com animações especiais
              </p>
            </div>
            <Switch
              checked={settings.constructionMode}
              onCheckedChange={handleConstructionToggle}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="construction-message">Mensagem de Construção</Label>
            <Textarea
              id="construction-message"
              value={constructionMessage}
              onChange={(e) => setConstructionMessage(e.target.value)}
              placeholder="Digite a mensagem que será exibida na página em construção"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Estimado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estimated-time">Previsão de Retorno (Opcional)</Label>
            <Input
              id="estimated-time"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="Ex: 2 horas, 30 minutos, amanhã às 9h"
            />
            <p className="text-sm text-muted-foreground">
              Esta informação será exibida aos usuários junto com a mensagem
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação para manutenção */}
      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {pendingMaintenanceState ? "Ativar" : "Desativar"} Modo Manutenção
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMaintenanceState 
                ? "Tem certeza que deseja colocar o sistema em modo manutenção? Todos os usuários (exceto admins) serão impedidos de acessar o sistema."
                : "Tem certeza que deseja desativar o modo manutenção? O sistema voltará ao funcionamento normal."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMaintenanceChange}>
              {pendingMaintenanceState ? "Ativar" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para construção */}
      <AlertDialog open={showConstructionDialog} onOpenChange={setShowConstructionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-orange-500" />
              {pendingConstructionState ? "Ativar" : "Desativar"} Modo Construção
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConstructionState 
                ? "Tem certeza que deseja colocar o sistema em modo construção? Todos os usuários (exceto admins) verão a página 'Em Construção'."
                : "Tem certeza que deseja desativar o modo construção? O sistema voltará ao funcionamento normal."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConstructionChange}>
              {pendingConstructionState ? "Ativar" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}