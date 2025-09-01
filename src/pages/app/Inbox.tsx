import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Users, Send, Plus, Clock, ArrowLeft } from 'lucide-react';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBroker } from '@/hooks/useBroker';

export default function Inbox() {
  const navigate = useNavigate();
  const { broker } = useBroker();
  const {
    threads,
    messages,
    loading,
    activeThread,
    setActiveThread,
    sendMessage,
    markAsRead
  } = useRealTimeChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !newMessage.trim()) return;

    await sendMessage(activeThread, newMessage);
    setNewMessage('');
  };

  const handleThreadSelect = (threadId: string) => {
    setActiveThread(threadId);
    markAsRead(threadId);
  };

  const getThreadTitle = (thread: any) => {
    return thread.title || `Conversa ${thread.type === 'deal' ? 'Deal' : 'Geral'}`;
  };

  const getLastMessage = (threadId: string) => {
    const threadMessages = messages[threadId];
    if (!threadMessages || threadMessages.length === 0) return 'Nenhuma mensagem';
    return threadMessages[threadMessages.length - 1].content;
  };

  const getUnreadCount = (threadId: string) => {
    const threadMessages = messages[threadId];
    if (!threadMessages) return 0;
    return threadMessages.filter(msg => !msg.is_read && msg.broker_id !== broker?.id).length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mensagens</h1>
            <p className="text-muted-foreground">Converse com outros corretores</p>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && activeThread && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveThread(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              Mensagens
            </h1>
            <p className="text-muted-foreground">
              {activeThread && isMobile 
                ? getThreadTitle(threads.find(t => t.id === activeThread))
                : 'Converse com outros corretores em tempo real'
              }
            </p>
          </div>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 min-h-[600px]">
        {/* Threads List - Hidden on mobile when a thread is active */}
        <div className={`lg:col-span-1 ${isMobile && activeThread ? 'hidden' : ''}`}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversas ({threads.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {threads.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-sm">Crie um deal para começar</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {threads.map((thread) => {
                      const unreadCount = getUnreadCount(thread.id);
                      const isActive = activeThread === thread.id;
                      
                      return (
                        <button
                          key={thread.id}
                          onClick={() => handleThreadSelect(thread.id)}
                          className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-l-2 ${
                            isActive 
                              ? 'bg-muted border-l-primary' 
                              : 'border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {getThreadTitle(thread)}
                            </h4>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {getLastMessage(thread.id)}
                          </p>
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(thread.last_message_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window - Show only when thread is selected on mobile */}
        <div className={`lg:col-span-3 ${isMobile && !activeThread ? 'hidden' : ''}`}>
          <Card className="h-full flex flex-col">
            {activeThread ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Users className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {getThreadTitle(threads.find(t => t.id === activeThread))}
                        </CardTitle>
                        <CardDescription>
                          {threads.find(t => t.id === activeThread)?.participants.length} participantes
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages[activeThread]?.map((message) => {
                        const isOwn = message.broker_id === broker?.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            } rounded-lg p-3`}>
                              {!isOwn && (
                                <p className="text-xs font-medium mb-1">
                                  {message.sender_name}
                                </p>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="pt-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                    <p className="text-muted-foreground">
                      Escolha uma conversa existente ou crie uma nova
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}