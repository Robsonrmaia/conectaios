import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessaging } from '@/hooks/useMessaging';
import { toast } from '@/hooks/use-toast';

interface NewConversationModalProps {
  onThreadCreated: (threadId: string) => void;
}

export function NewConversationModal({ onThreadCreated }: NewConversationModalProps) {
  const { user } = useAuth();
  const { searchUsers, startOneToOneThread } = useMessaging();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim() || !user?.id) return;
    
    setLoading(true);
    try {
      const results = await searchUsers(query);
      setBrokers(results);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar corretores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (otherUserId: string) => {
    setCreating(true);
    try {
      const threadId = await startOneToOneThread(otherUserId);
      onThreadCreated(threadId);
      setOpen(false);
      setSearchQuery('');
      setBrokers([]);
      toast({
        title: "Sucesso",
        description: "Conversa criada!",
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      
      const errorMessage = error.message?.includes('not_authenticated')
        ? 'Você precisa estar logado para criar conversas'
        : error.message || 'Erro ao criar conversa';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar corretor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          )}
          
          {brokers.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {brokers.map((broker) => (
                <div
                  key={broker.id}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => handleCreateConversation(broker.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={broker.avatar_url} />
                      <AvatarFallback>
                        {broker.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{broker.name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{broker.email}</p>
                    </div>
                  </div>
                  {creating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && !loading && brokers.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum corretor encontrado
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}