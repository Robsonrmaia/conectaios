import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Search, Filter, User, MoreVertical, Phone, Star, Plus, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at?: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface Conversation {
  id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  participant_id: string;
  participant_creci?: string;
}

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [brokerSearchTerm, setBrokerSearchTerm] = useState('');
  const [availableBrokers, setAvailableBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAvailableBrokers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchAvailableBrokers = async () => {
    try {
      const { data: brokersData, error } = await supabase
        .from('conectaios_brokers')
        .select('id, name, email, creci, avatar_url, user_id')
        .eq('status', 'active')
        .neq('user_id', user?.id); // Exclude current user

      if (error) throw error;
      setAvailableBrokers(brokersData || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // Fetch real conversations from threads table
      const { data: threadsData, error: threadsError } = await supabase
        .from('threads')
        .select(`
          id,
          title,
          participants,
          last_message_at,
          messages!inner(
            content,
            created_at,
            sender_name
          )
        `)
        .contains('participants', [user.id])
        .order('last_message_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Convert threads to conversations format
      const conversationsData: Conversation[] = await Promise.all(
        (threadsData || []).map(async (thread) => {
          // Get the other participant
          const otherParticipantId = thread.participants.find((p: string) => p !== user.id);
          
          // Fetch broker info for the other participant
          const { data: brokerData } = await supabase
            .from('conectaios_brokers')
            .select('name, creci, avatar_url')
            .eq('id', otherParticipantId)
            .single();

          const lastMessage = thread.messages[0];
          
          return {
            id: thread.id,
            participant_name: brokerData?.name || 'Usuário',
            participant_creci: brokerData?.creci || '',
            participant_avatar: brokerData?.avatar_url || '',
            last_message: lastMessage?.content || 'Nova conversa',
            last_message_at: thread.last_message_at,
            unread_count: 0, // TODO: Implement unread count
            participant_id: otherParticipantId || ''
          };
        })
      );

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to empty array
      setConversations([]);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    
    try {
      // Fetch real messages from Supabase
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.broker_id,
        receiver_id: '', // Not needed for thread-based messages
        created_at: msg.created_at,
        sender_name: msg.sender_name,
        sender_avatar: '' // TODO: Add avatar support
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setLoading(true);
    try {
      // Get current broker ID
      const { data: brokerData } = await supabase
        .from('conectaios_brokers')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (!brokerData) throw new Error('Broker não encontrado');

      // Insert message into Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          thread_id: selectedConversation,
          broker_id: brokerData.id,
          content: newMessage,
          sender_name: brokerData.name || 'Você',
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newMsg: Message = {
        id: data.id,
        content: data.content,
        sender_id: data.broker_id,
        receiver_id: '',
        created_at: data.created_at,
        sender_name: data.sender_name
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      // Update thread last_message_at
      await supabase
        .from('threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation);

      toast({
        title: "Mensagem enviada!",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async (brokerId: string) => {
    try {
      const broker = availableBrokers.find(b => b.id === brokerId);
      if (!broker || !user) return;

      // Get current user's broker ID
      const { data: currentBrokerData } = await supabase
        .from('conectaios_brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!currentBrokerData) throw new Error('Broker atual não encontrado');

      // Create new thread in Supabase
      const { data: threadData, error } = await supabase
        .from('threads')
        .insert([{
          participants: [currentBrokerData.id, brokerId],
          title: `Conversa com ${broker.name}`,
          type: 'broker_chat',
          created_by: currentBrokerData.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Create conversation object
      const newConversation: Conversation = {
        id: threadData.id,
        participant_name: broker.name,
        participant_creci: broker.creci,
        participant_avatar: broker.avatar_url,
        last_message: 'Conversa iniciada',
        last_message_at: threadData.created_at,
        unread_count: 0,
        participant_id: brokerId
      };

      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation.id);
      setIsNewChatDialogOpen(false);
      setBrokerSearchTerm('');
      
      toast({
        title: "Nova conversa iniciada!",
        description: `Você agora pode conversar com ${broker.name}`,
      });
    } catch (error) {
      console.error('Error starting new conversation:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar nova conversa",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant_creci?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBrokers = availableBrokers.filter(broker =>
    broker.name.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
    broker.email.toLowerCase().includes(brokerSearchTerm.toLowerCase()) ||
    broker.creci?.toLowerCase().includes(brokerSearchTerm.toLowerCase())
  );

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" strokeWidth={2} fill="none" />
              Conversas
              {conversations.some(c => c.unread_count > 0) && (
                <Badge variant="destructive" className="ml-auto">
                  {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
                </Badge>
              )}
            </CardTitle>
            <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
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
                      placeholder="Buscar corretores..."
                      value={brokerSearchTerm}
                      onChange={(e) => setBrokerSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredBrokers.map((broker) => (
                        <div
                          key={broker.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => startNewConversation(broker.id)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={broker.avatar_url} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{broker.name}</h4>
                            <p className="text-xs text-muted-foreground">{broker.creci}</p>
                            <p className="text-xs text-muted-foreground">{broker.email}</p>
                          </div>
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" strokeWidth={2} fill="none" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participant_avatar} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {conversation.participant_name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        {conversation.participant_creci && (
                          <div className="text-xs text-muted-foreground mb-1">
                            {conversation.participant_creci}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs px-2 py-1">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="lg:col-span-2">
        {selectedConversation ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversationData?.participant_avatar} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversationData?.participant_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversationData?.participant_creci || 'Online há 2 horas'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col h-96">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          message.sender_id === user?.id
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

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || loading}
                  size="sm"
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" strokeWidth={2} fill="none" />
              <h3 className="font-semibold mb-2">Selecione uma conversa</h3>
              <p>Escolha uma conversa à esquerda para começar a trocar mensagens</p>
              <p className="text-sm mt-2">Ou clique no + para iniciar uma nova conversa</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}