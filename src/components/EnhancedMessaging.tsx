import { useEnhancedChat } from '@/hooks/useEnhancedChat';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Send, Users, MessageCircle, Plus, UserPlus, Clock, Check, CheckCheck, Circle, Paperclip } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { broker } = useBroker();
  const {
    threads,
    messages,
    presence,
    typingUsers,
    loading,
    activeThread,
    unreadCounts,
    setActiveThread,
    createOrGetThread,
    createGroup,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    refreshThreads
  } = useEnhancedChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]);
  const [availableBrokers, setAvailableBrokers] = useState<Broker[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch available brokers
  useEffect(() => {
    if (user) {
      fetchAvailableBrokers();
    }
  }, [user]);

  const fetchAvailableBrokers = async () => {
    try {
      const { data: brokersData, error } = await supabase
        .from('conectaios_brokers')
        .select('id, name, email, creci, avatar_url, user_id')
        .eq('status', 'active')
        .neq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThread]);

  const createNewChat = async (brokerIds: string[]) => {
    if (brokerIds.length === 0) return;

    try {
      let threadId;
      if (brokerIds.length === 1) {
        // 1:1 chat
        threadId = await createOrGetThread(brokerIds[0]);
      } else {
        // Group chat
        threadId = await createGroup(groupTitle || 'Nova Conversa', brokerIds);
      }
      
      if (threadId) {
        setActiveThread(threadId);
        setShowNewChatDialog(false);
        setShowNewGroupDialog(false);
        setSelectedBrokers([]);
        setGroupTitle('');
        toast({
          title: "Sucesso",
          description: "Nova conversa criada!",
        });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conversa",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return;

    try {
      await sendMessage(activeThread, newMessage.trim());
      setNewMessage('');
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping(activeThread);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (activeThread && value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(activeThread);
      }
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(activeThread);
      }, 2000);
    }
  };

  const getThreadTitle = (thread: any) => {
    if (thread.is_group) {
      return thread.title || `Grupo (${thread.participants?.length || 0} membros)`;
    } else {
      // 1:1 chat - show the other participant's name
      const otherParticipant = thread.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.name || 'Chat';
    }
  };

  const getPresenceStatus = (userId: string) => {
    const userPresence = presence[userId];
    if (!userPresence) return 'offline';
    
    const lastSeen = new Date(userPresence.last_seen_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'away';
    return 'offline';
  };

  const getTypingIndicator = (threadId: string) => {
    const typing = typingUsers[threadId]?.filter(id => id !== user?.id) || [];
    if (typing.length === 0) return null;
    
    if (typing.length === 1) {
      return 'digitando...';
    } else {
      return `${typing.length} pessoas digitando...`;
    }
  };

  const filteredThreads = threads.filter(thread => {
    const title = getThreadTitle(thread).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

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
    <div className="flex flex-col lg:flex-row h-[600px] border rounded-lg overflow-hidden bg-background">
      {/* Threads List */}
      <div className="w-full lg:w-1/3 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conversas
            </h3>
            <div className="flex gap-1">
              <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar corretor..."
                        className="pl-9"
                      />
                    </div>
                    <ScrollArea className="max-h-48">
                      <div className="space-y-2">
                        {availableBrokers.map(broker => (
                          <div 
                            key={broker.id}
                            className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                            onClick={() => createNewChat([broker.user_id])}
                          >
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={broker.avatar_url} />
                                <AvatarFallback>{broker.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                                getPresenceStatus(broker.user_id) === 'online' ? 'bg-green-500' :
                                getPresenceStatus(broker.user_id) === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{broker.name}</p>
                              <p className="text-xs text-muted-foreground">{broker.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Users className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Grupo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Nome do grupo..."
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selecionar membros:</p>
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                          {availableBrokers.map(broker => (
                            <div key={broker.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                              <Checkbox
                                checked={selectedBrokers.includes(broker.user_id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedBrokers([...selectedBrokers, broker.user_id]);
                                  } else {
                                    setSelectedBrokers(selectedBrokers.filter(id => id !== broker.user_id));
                                  }
                                }}
                              />
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={broker.avatar_url} />
                                <AvatarFallback>{broker.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{broker.name}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <Button 
                      onClick={() => createNewChat(selectedBrokers)}
                      disabled={selectedBrokers.length === 0}
                      className="w-full"
                    >
                      Criar Grupo ({selectedBrokers.length} membros)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
                <p className="text-xs text-muted-foreground mt-1">Clique no botão + para começar</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setActiveThread(thread.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                    activeThread === thread.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {thread.is_group ? (
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={thread.participants?.find(p => p.user_id !== user?.id)?.avatar_url} />
                            <AvatarFallback>
                              {getThreadTitle(thread).charAt(0)}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      {!thread.is_group && (
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          getPresenceStatus(thread.participants?.find(p => p.user_id !== user?.id)?.user_id || '') === 'online' ? 'bg-green-500' :
                          getPresenceStatus(thread.participants?.find(p => p.user_id !== user?.id)?.user_id || '') === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {getThreadTitle(thread)}
                        </p>
                        {unreadCounts[thread.id] > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {unreadCounts[thread.id]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">
                          {thread.last_message?.body || 'Nenhuma mensagem'}
                        </p>
                        <p className="text-xs text-muted-foreground ml-2">
                          {thread.last_message && formatDistanceToNow(new Date(thread.last_message.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background/50 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    {threads.find(t => t.id === activeThread)?.is_group ? (
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={threads.find(t => t.id === activeThread)?.participants?.find(p => p.user_id !== user?.id)?.avatar_url} />
                        <AvatarFallback>
                          {getThreadTitle(threads.find(t => t.id === activeThread) || {}).charAt(0)}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getThreadTitle(threads.find(t => t.id === activeThread) || {})}
                    </p>
                    <div className="flex items-center gap-1">
                      {getTypingIndicator(activeThread) ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Circle className="h-2 w-2 fill-current animate-pulse" />
                          {getTypingIndicator(activeThread)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {threads.find(t => t.id === activeThread)?.is_group ? 
                            `${threads.find(t => t.id === activeThread)?.participants?.length || 0} membros` :
                            getPresenceStatus(threads.find(t => t.id === activeThread)?.participants?.find(p => p.user_id !== user?.id)?.user_id || '') === 'online' ? 'Online' : 'Offline'
                          }
                        </p>
                      )}
                    </div>
                  </div>
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
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[70%] ${
                      message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {message.sender_id !== user?.id && (
                        <Avatar className="h-6 w-6 mt-1">
                          <AvatarImage src={message.sender_avatar} />
                          <AvatarFallback className="text-xs">
                            {message.sender_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        {message.sender_id !== user?.id && threads.find(t => t.id === activeThread)?.is_group && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {formatDistanceToNow(new Date(message.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                          {message.sender_id === user?.id && (
                            <div className="flex items-center ml-2">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background/50 backdrop-blur">
              <div className="flex items-end space-x-2">
                <Button variant="outline" size="sm" className="mb-1">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[40px] max-h-[120px] resize-none pr-12"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="mb-1"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Bem-vindo à Mensageria</h3>
              <p className="text-sm">Selecione uma conversa para começar ou crie uma nova</p>
              <div className="mt-6 space-x-2">
                <Button variant="outline" onClick={() => setShowNewChatDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conversa
                </Button>
                <Button variant="outline" onClick={() => setShowNewGroupDialog(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Novo Grupo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}