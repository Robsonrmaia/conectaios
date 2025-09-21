import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useRealTimeMessaging } from '@/hooks/useRealTimeMessaging';

interface Broker {
  id: string;
  name: string;
  email: string;
  creci?: string;
  avatar_url?: string;
  user_id: string;
}

export function EnhancedMessaging() {
  const { user } = useAuth();
  const {
    threads,
    messages,
    loading,
    activeThread,
    setActiveThread,
    sendMessage: sendMessageHook,
    createThread
  } = useRealTimeMessaging();
  
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [brokerSearchTerm, setBrokerSearchTerm] = useState('');
  const [availableBrokers, setAvailableBrokers] = useState<Broker[]>([]);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAvailableBrokers();
    }
  }, [user]);

  const fetchAvailableBrokers = async () => {
    try {
      // Use uma subquery para evitar duplicatas por email
      const { data: brokersData, error } = await supabase
        .from('conectaios_brokers')
        .select('id, name, email, creci, avatar_url, user_id')
        .eq('status', 'active')
        .neq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      
      // Remove duplicatas manualmente por email (pega sempre o primeiro)
      const uniqueBrokers = brokersData?.reduce((acc: Broker[], broker) => {
        if (!acc.some(b => b.email === broker.email)) {
          acc.push(broker);
        }
        return acc;
      }, []) || [];
      
      setAvailableBrokers(uniqueBrokers);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!activeThread || !newMessage.trim()) return;
    await sendMessageHook(activeThread, newMessage);
    setNewMessage('');
  };

  const createNewChat = async (brokerIds: string[]) => {
    const threadId = await createThread(brokerIds, `Chat com ${brokerIds.length} corretores`);
    if (threadId) {
      setActiveThread(threadId);
      setIsNewChatDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[600px] border rounded-lg overflow-hidden">
      {/* Threads List */}
      <div className="w-full lg:w-1/3 border-r bg-muted/30 lg:min-h-0 max-h-64 lg:max-h-none">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Conversas</h3>
            <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Buscar corretor..."
                    value={brokerSearchTerm}
                    onChange={(e) => setBrokerSearchTerm(e.target.value)}
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableBrokers
                      .filter(broker => 
                        broker.name.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
                        broker.email.toLowerCase().includes(brokerSearchTerm.toLowerCase())
                      )
                      .map(broker => (
                        <div 
                          key={broker.id}
                          className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                          onClick={() => createNewChat([broker.id])}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={broker.avatar_url} />
                            <AvatarFallback>{broker.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{broker.name}</p>
                            <p className="text-xs text-muted-foreground">{broker.creci}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <ScrollArea className="h-[calc(100%-140px)]">
          <div className="space-y-1 p-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setActiveThread(thread.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeThread === thread.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {thread.title?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {thread.title || 'Conversa'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.last_message_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>C</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {threads.find(t => t.id === activeThread)?.title || 'Conversa'}
                  </p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(messages[activeThread] || []).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.user_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.user_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}