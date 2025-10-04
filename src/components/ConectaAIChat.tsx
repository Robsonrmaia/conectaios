import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useConectaAIChat } from '@/hooks/useConectaAIChat';
import { cn } from '@/lib/utils';

const questions = [
  "Quantos imóveis você gerencia? 🏠",
  "Quer automatizar seu trabalho? ⚡",
  "Precisa de mais leads? 🎯",
  "Quer vender mais rápido? 🚀"
];

export function ConectaAIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { messages, loading, sendMessage, error } = useConectaAIChat();

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
            className="text-primary underline hover:text-primary/80 font-semibold"
          >
            {matches[i]}
          </a>
        )}
      </span>
    ));
  };

  // Rotação de perguntas a cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestion((prev) => (prev + 1) % questions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Botão do Header - Só o robô com balões */}
      <div className="relative">
        {/* Balão de pergunta animado */}
        <div className="absolute -left-48 top-1/2 -translate-y-1/2 animate-bounce pointer-events-none hidden md:block">
          <div className="bg-white rounded-2xl shadow-xl p-3 max-w-[180px] border-2 border-primary/20 relative">
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r-2 border-t-2 border-primary/20 transform rotate-45"></div>
            <p className="text-xs font-medium text-primary animate-fade-in">
              {questions[currentQuestion]}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="hover:opacity-80 transition-opacity relative"
        >
          <img 
            src="https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/robo.gif" 
            alt="Assistente IA"
            className="w-[53px] h-[53px]"
          />
          {/* Indicador de pulso */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </button>
      </div>

      {/* Sheet do Chat */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="left" 
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-emerald-500 to-blue-600">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white bg-white">
                <AvatarImage src="https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/logonova.png" alt="ConectaIOS" />
                <AvatarFallback className="bg-white text-emerald-600 font-bold">
                  CI
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-base text-white">Assistente ConectaIOS</SheetTitle>
                <p className="text-xs text-white/90">Especialista em vendas</p>
              </div>
            </div>
          </SheetHeader>

          {/* Área de Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Avatar className="w-16 h-16 mx-auto mb-3 bg-white">
                    <AvatarImage src="https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/logonova.png" alt="ConectaIOS" />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white">CI</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">
                    Olá! 👋 Sou o assistente de vendas do ConectaIOS.
                    <br />
                    Como posso ajudar você a revolucionar seu negócio imobiliário?
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
                    <Avatar className="w-8 h-8 mt-1 border border-emerald-200 bg-white">
                      <AvatarImage src="https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/logonova.png" alt="ConectaIOS" />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-100 to-blue-100 text-emerald-700">
                        CI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      msg.role === 'user'
                        ? "bg-gradient-to-br from-emerald-500 to-blue-600 text-white"
                        : "bg-muted text-foreground border border-emerald-100"
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
                  <Avatar className="w-8 h-8 mt-1 border border-emerald-200 bg-white">
                    <AvatarImage src="https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/logonova.png" alt="ConectaIOS" />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-100 to-blue-100 text-emerald-700">
                      CI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm border border-emerald-100">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]" />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite] delay-200" />
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite] delay-[400ms]" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center text-sm text-destructive py-2 bg-destructive/10 rounded-lg">
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
                className="bg-gradient-to-br from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by IA • GPT-5 Mini
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
