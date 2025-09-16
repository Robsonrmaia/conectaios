import { formatCurrency } from '@/lib/utils';

interface Property {
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  parking_spots?: number;
  neighborhood?: string;
  bathrooms?: number;
}

export function useWhatsAppMessage() {
  const generatePropertyMessage = (property: Property, presentationUrl?: string) => {
    const emojis = {
      house: '🏡',
      sparkles: '✨',
      bed: '🛏️',
      car: '🚗',
      money: '💰'
    };

    let message = `${emojis.house} *${property.titulo}*\n\n`;
    
    // Adicionar localização se disponível
    if (property.neighborhood) {
      message += `📍 *${property.neighborhood}*\n\n`;
    }
    
    message += `${emojis.sparkles} ${property.area}m² de área construída\n`;
    message += `${emojis.bed} ${property.quartos} ${property.quartos > 1 ? 'quartos' : 'quarto'}\n`;
    
    // Adicionar banheiros se disponível
    if (property.bathrooms && property.bathrooms > 0) {
      message += `🚿 ${property.bathrooms} ${property.bathrooms > 1 ? 'banheiros' : 'banheiro'}\n`;
    }
    
    if (property.parking_spots && property.parking_spots > 0) {
      message += `${emojis.car} ${property.parking_spots} ${property.parking_spots > 1 ? 'vagas de garagem' : 'vaga de garagem'}\n`;
    }
    
    message += `\n${emojis.money} *${formatCurrency(property.valor)}*\n\n`;
    message += `🏠 Imóvel de alto padrão em localização privilegiada!\n\n`;
    
    if (presentationUrl) {
      message += `Veja mais detalhes: ${presentationUrl}`;
    }

    return message;
  };

  const shareToWhatsApp = (message: string, phone?: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phone 
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const copyMessageToClipboard = (message: string) => {
    return navigator.clipboard.writeText(message);
  };

  return {
    generatePropertyMessage,
    shareToWhatsApp,
    copyMessageToClipboard
  };
}