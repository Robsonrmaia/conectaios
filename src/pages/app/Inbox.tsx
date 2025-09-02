import { MessagingSystem } from '@/components/MessagingSystem';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Inbox() {
  const navigate = useNavigate();

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
            <h1 className="text-3xl font-bold text-primary">
              Mensageria Interna
            </h1>
            <p className="text-muted-foreground">
              Sistema completo de mensagens - comunicação protegida
            </p>
          </div>
        </div>
      </div>

      <MessagingSystem />
    </div>
  );
}