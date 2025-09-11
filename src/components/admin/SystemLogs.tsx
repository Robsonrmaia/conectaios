import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:25',
    level: 'info',
    message: 'Usuário robsonrmaia@hotmail.com fez login com sucesso',
    source: 'Auth'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:25:10',
    level: 'success',
    message: 'Backup automático concluído com sucesso',
    source: 'Database'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:20:05',
    level: 'warning',
    message: 'Alto uso de memória detectado (85%)',
    source: 'System'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:15:30',
    level: 'error',
    message: 'Falha na conexão com serviço de email',
    source: 'Email'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:10:15',
    level: 'info',
    message: 'Nova propriedade cadastrada: Casa em Copacabana',
    source: 'Properties'
  }
];

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-blue-500" />;
  }
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'success':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'warning':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'error':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
  }
};

export default function SystemLogs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Logs do Sistema
        </CardTitle>
        <CardDescription>
          Visualize logs recentes de atividades do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {mockLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                {getLevelIcon(log.level)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{log.source}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Clock className="h-3 w-3" />
                      {log.timestamp}
                    </div>
                  </div>
                  <p className="text-sm">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}