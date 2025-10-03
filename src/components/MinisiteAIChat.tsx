import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useMinisiteAIChat } from '@/hooks/useMinisiteAIChat';
import { cn } from '@/lib/utils';

interface MinisiteAIChatProps {
  brokerId: string;
  brokerName: string;
  brokerAvatar?: string;
}

export function MinisiteAIChat({ brokerId, brokerName, brokerAvatar }: MinisiteAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, loading, sendMessage, error } = useMinisiteAIChat(brokerId);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Formatar links do WhatsApp para serem clicáveis
  const formatMessage = (text: string) => {
    const whatsappRegex = /https:\/\/wa\.me\/\d+/g;
    const parts = text.split(whatsappRegex);
    const matches = text.match(whatsappRegex);

    if (!matches) return text;

    return parts.map((part, i) => (
      <span key={i}>
        {part}
        {matches[i] && (
          <a
            href={matches[i]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            {matches[i]}
          </a>
        )}
      </span>
    ));
  };

  return (
    <>
      {/* Botão Flutuante - Só o robô */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "hover:opacity-80 transition-opacity animate-pulse-gentle hover:animate-none"
        )}
      >
        <img 
          src="https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/robo.gif" 
          alt="Assistente IA"
          className="w-[70px] h-[70px] object-contain"
        />
      </button>

      {/* Sheet do Chat */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={brokerAvatar} alt={brokerName} />
                <AvatarFallback>{brokerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-base">Assistente Virtual</SheetTitle>
                <p className="text-xs text-muted-foreground">{brokerName}</p>
              </div>
            </div>
          </SheetHeader>

          {/* Área de Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    Olá! 👋 Sou o assistente virtual.
                    <br />
                    Como posso ajudar você hoje?
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-2",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={brokerAvatar} alt={brokerName} />
                      <AvatarFallback className="text-xs">
                        {brokerName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src={brokerAvatar} alt={brokerName} />
                    <AvatarFallback className="text-xs">
                      {brokerName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite] delay-200" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite] delay-[400ms]" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center text-sm text-destructive py-2">
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by IA • GPT-5 Nano
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
