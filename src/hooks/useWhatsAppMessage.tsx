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
  const generatePropertyMessage = (property: Property, presentationUrl?: string, brokerName?: string) => {
    const emojis = {
      house: '🏡',
      sparkles: '✨',
      bed: '🛏️',
      bath: '🚿',
      car: '🚗',
      money: '💰',
      location: '📍',
      ruler: '📐',
      check: '✅'
    };

    // Linha divisória elegante
    const divider = '━━━━━━━━━━━━━━━━━';

    let message = `${emojis.house} *OPORTUNIDADE EXCLUSIVA*\n`;
    message += `${divider}\n\n`;
    
    // Título do imóvel
    message += `*${property.titulo.toUpperCase()}*\n\n`;
    
    // Localização em destaque
    if (property.neighborhood) {
      message += `${emojis.location} *Localização:*\n`;
      message += `   ${property.neighborhood}\n\n`;
    }
    
    // Especificações em formato elegante
    message += `${emojis.sparkles} *Especificações:*\n`;
    message += `${divider}\n`;
    message += `${emojis.ruler} Área: *${property.area}m²*\n`;
    message += `${emojis.bed} Quartos: *${property.quartos}*\n`;
    
    if (property.bathrooms && property.bathrooms > 0) {
      message += `${emojis.bath} Banheiros: *${property.bathrooms}*\n`;
    }
    
    if (property.parking_spots && property.parking_spots > 0) {
      message += `${emojis.car} Vagas: *${property.parking_spots}*\n`;
    }
    
    message += `\n`;
    
    // Valor em destaque com box
    message += `╭─────────────────╮\n`;
    message += `│ ${emojis.money} *VALOR*          │\n`;
    message += `│ *${formatCurrency(property.valor)}* │\n`;
    message += `╰─────────────────╯\n\n`;
    
    // Diferenciais
    message += `${emojis.check} *Imóvel Premium*\n`;
    message += `${emojis.check} *Localização Privilegiada*\n`;
    message += `${emojis.check} *Pronto para Morar*\n\n`;
    
    // CTA com link
    if (presentationUrl) {
      const fullUrl = presentationUrl.startsWith('http') 
        ? presentationUrl 
        : `https://www.conectaios.com.br${presentationUrl}`;
      
      message += `${divider}\n\n`;
      message += `🎯 *VEJA MAIS DETALHES E FOTOS:*\n`;
      message += `${fullUrl}\n\n`;
    }
    
    // Assinatura do corretor
    if (brokerName) {
      message += `${divider}\n`;
      message += `📞 *${brokerName}*\n`;
      message += `_Corretor de Imóveis_\n`;
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