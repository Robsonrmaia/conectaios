import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Search, Phone, Video } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Inbox() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  const chats = [
    {
      id: 1,
      name: 'Maria Silva',
      lastMessage: 'Oi, gostaria de saber mais sobre o apartamento',
      time: '14:30',
      unread: 2,
      avatar: '/placeholder.svg',
      online: true
    },
    {
      id: 2,
      name: 'João Santos',
      lastMessage: 'Podemos marcar uma visita?',
      time: '13:45',
      unread: 0,
      avatar: '/placeholder.svg',
      online: false
    },
    {
      id: 3,
      name: 'Ana Costa',
      lastMessage: 'Obrigada pela informação!',
      time: '12:15',
      unread: 1,
      avatar: '/placeholder.svg',
      online: true
    }
  ];

  const messages = [
    {
      id: 1,
      senderId: 1,
      sender: 'Maria Silva',
      content: 'Oi! Tudo bem?',
      time: '14:25',
      isOwn: false
    },
    {
      id: 2,
      senderId: 'me',
      sender: 'Você',
      content: 'Oi Maria! Tudo ótimo, e você?',
      time: '14:26',
      isOwn: true
    },
    {
      id: 3,
      senderId: 1,
      sender: 'Maria Silva',
      content: 'Gostaria de saber mais sobre o apartamento no Jardins',
      time: '14:30',
      isOwn: false
    },
    {
      id: 4,
      senderId: 'me',
      sender: 'Você',
      content: 'Claro! É um apartamento de 3 quartos, 120m², com 2 vagas de garagem. Tem interesse em agendar uma visita?',
      time: '14:32',
      isOwn: true
    },
    {
      id: 5,
      senderId: 1,
      sender: 'Maria Silva',
      content: 'Sim! Quando podemos marcar?',
      time: '14:35',
      isOwn: false
    }
  ];

  const currentChat = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      // Implementar envio real de mensagem
      try {
        // Simular envio da mensagem
        toast({
          title: "Mensagem enviada",
          description: `Mensagem enviada para ${currentChat?.name}`,
        });
        setNewMessage('');
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao enviar mensagem",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat List */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 border-l-2 transition-colors ${
                  selectedChat === chat.id 
                    ? 'bg-muted border-l-primary' 
                    : 'border-l-transparent'
                }`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{chat.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{chat.time}</span>
                        {chat.unread > 0 && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={currentChat.avatar} />
                      <AvatarFallback>{currentChat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {currentChat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentChat.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentChat.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />

            {/* Messages */}
            <CardContent className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isOwn 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground">
                Escolha uma conversa da lista para começar a conversar
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}