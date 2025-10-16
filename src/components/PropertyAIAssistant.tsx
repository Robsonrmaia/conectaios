import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Send, X, Minimize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Property {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms?: number;
  parking?: number;
  neighborhood?: string;
  city?: string;
  description?: string;
  purpose?: string;
  type?: string;
  owner_id: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PropertyAIAssistantProps {
  property: Property;
}

export function PropertyAIAssistant({ property }: PropertyAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá! 👋 Sou seu assistente virtual especializado em imóveis.\n\nEstou aqui para ajudá-lo com informações sobre:\n• Este imóvel e seus diferenciais\n• A localização e vizinhança\n• Outros imóveis similares disponíveis\n• Processo de compra/locação\n\nComo posso ajudá-lo? 😊`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('property-ai-assistant', {
        body: {
          property: {
            id: property.id,
            title: property.title,
            price: property.price,
            area: property.area,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms || 0,
            parking: property.parking || 0,
            neighborhood: property.neighborhood || '',
            city: property.city || '',
            description: property.description || '',
            purpose: property.purpose || 'sale',
            type: property.type || 'apartment'
          },
          brokerId: property.owner_id,
          messages: [...messages, userMessage]
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[10020] h-14 w-14 rounded-full shadow-xl 
          bg-white hover:bg-gray-50
          border-2 border-gray-800 hover:border-blue-600
          transition-all duration-300 hover:scale-110
          group relative
          animate-bounce-gentle"
        size="icon"
      >
        {/* Pulsação suave externa - anel que expande */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 
          animate-ping opacity-20" />
        
        {/* Segundo anel de pulsação */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-400 
          animate-pulse opacity-30" />
        
        {/* Ícone com movimento suave */}
        <Bot className="h-6 w-6 relative z-10 text-gray-800 group-hover:text-blue-600 
          transition-all duration-300 group-hover:rotate-12" 
          strokeWidth={2.5} 
        />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[10020] w-96 max-w-[calc(100vw-3rem)] 
      bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col 
      animate-fade-in animate-scale-in overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Assistente Virtual</h3>
            <p className="text-white/80 text-xs">Online agora</p>
          </div>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
