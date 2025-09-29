import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Users } from 'lucide-react';
import { useMessaging } from '@/hooks/useMessaging';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { NewConversationModal } from '@/features/messaging/NewConversationModal';

export default function Mensagens() {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const { 
    threads, 
    messages, 
    loading, 
    activeThreadId, 
    setActiveThreadId,
    sendMessage,
    loadThreads 
  } = useMessaging();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeThreadId) return;
    
    try {
      await sendMessage(activeThreadId, newMessage);
      setNewMessage('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  };

  const handleThreadCreated = (threadId: string) => {
    setActiveThreadId(threadId);
    loadThreads();
  };

  const getThreadTitle = (thread: any) => {
    if (thread.is_group) {
      return thread.title || 'Grupo';
    }
    return 'Chat 1:1';
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row h-[600px] gap-4">
        <Card className="w-full lg:w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando conversas...</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Selecione uma conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[600px] gap-4">
      {/* Threads List */}
      <Card className="w-full lg:w-1/3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="mb-4">
              <NewConversationModal onThreadCreated={handleThreadCreated} />
            </div>
            <div className="space-y-2">
              {threads.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                      activeThreadId === thread.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        {thread.is_group ? (
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback>
                            {getThreadTitle(thread).charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getThreadTitle(thread)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(thread.updated_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>
            {activeThreadId ? (
              threads.find(t => t.id === activeThreadId)?.title || 'Conversa'
            ) : (
              'Selecione uma conversa'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeThreadId ? (
            <div className="flex flex-col h-[500px]">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.body}</p>
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
              
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}