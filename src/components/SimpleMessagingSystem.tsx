import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
}

interface Thread {
  id: string;
  title: string;
  participants: string[];
}

export function SimpleMessagingSystem() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  const fetchThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .contains('participants', [user?.id]);
      
      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          thread_id: selectedThread,
          content: newMessage,
          sender_name: user.email || 'Usuário',
          user_id: user.id
        }]);

      if (error) throw error;
      
      setNewMessage('');
      fetchMessages(selectedThread);
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Threads List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conversas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {threads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setSelectedThread(thread.id);
                    fetchMessages(thread.id);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedThread === thread.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <h4 className="font-medium">{thread.title || 'Conversa'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {thread.participants.length} participantes
                  </p>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {selectedThread ? 'Mensagens' : 'Selecione uma conversa'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedThread ? (
            <div className="space-y-4">
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem ainda
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {message.sender_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm bg-muted/50 p-2 rounded">
                        {message.content}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4" />
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}