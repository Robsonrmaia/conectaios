import { User, Lightbulb, MessageCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrokerDisplay } from './types';

interface ContactSectionProps {
  displayBroker?: BrokerDisplay | null;
  onScheduleVisit: () => void;
}

export function ContactSection({ displayBroker, onScheduleVisit }: ContactSectionProps) {
  const phone = displayBroker?.phone || '5511999999999';
  const email = displayBroker?.email || 'contato@conectaios.com.br';

  return (
    <section className="px-6 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Entre em Contato</h2>
      <p className="text-gray-600 text-lg mb-8">Agende sua visita e conheça este imóvel exclusivo</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {displayBroker?.avatar_url ? (
            <img src={displayBroker.avatar_url} alt={displayBroker.name} className="w-full h-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-gray-600" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{displayBroker?.name || 'Ricardo Silva'}</h3>
          <p className="text-gray-600">CRECI 123.456-F</p>
          <p className="text-gray-500">15 anos de experiência</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Dica Profissional</h4>
            <p className="text-blue-800">
              Esta propriedade está em uma localização estratégica com alta valorização.
              Agende sua visita hoje mesmo!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onScheduleVisit}
          className="w-full py-4 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2"
          size="lg"
        >
          <MessageCircle className="h-5 w-5" />
          Conversar no WhatsApp
        </Button>

        <Button
          onClick={() => window.open(`tel:${phone}`, '_self')}
          className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2"
          size="lg"
        >
          <Phone className="h-5 w-5" />
          Ligar Agora
        </Button>

        <Button
          onClick={() => window.open(`mailto:${email}`, '_self')}
          className="w-full py-4 text-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white rounded-xl flex items-center justify-center gap-2"
          size="lg"
        >
          <Mail className="h-5 w-5" />
          Enviar E-mail
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          💡 Use o botão verde "Compartilhar" no topo da página para enviar esta proposta aos seus clientes via WhatsApp
        </p>
      </div>
    </section>
  );
}