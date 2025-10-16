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

interface BrokerInfo {
  name: string;
  phone?: string;
  email?: string;
  minisite?: string;
}

export function useWhatsAppMessage() {
  const generatePropertyMessage = (
    property: Property, 
    presentationUrl?: string, 
    brokerName?: string,
    brokerInfo?: BrokerInfo
  ) => {
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

    let message = `${emojis.house} *OPORTUNIDADE EXCLUSIVA*\n\n`;
    
    // Título do imóvel
    message += `*${property.titulo.toUpperCase()}*\n\n`;
    
    // Localização em destaque
    if (property.neighborhood) {
      message += `${emojis.location} *Localização:*\n`;
      message += `   ${property.neighborhood}\n\n`;
    }
    
    // Especificações em formato elegante
    message += `${emojis.sparkles} *Especificações:*\n\n`;
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
      
      message += `\n🎯 *VEJA MAIS DETALHES E FOTOS:*\n`;
      message += `${fullUrl}\n\n`;
    }
    
    // Assinatura do corretor com TODOS os dados
    if (brokerInfo) {
      message += `\n👤 *${brokerInfo.name}*\n`;
      message += `_Corretor de Imóveis_\n\n`;
      
      if (brokerInfo.phone) {
        message += `📞 WhatsApp: *${brokerInfo.phone}*\n`;
      }
      
      if (brokerInfo.email) {
        message += `📧 Email: ${brokerInfo.email}\n`;
      }
      
      if (brokerInfo.minisite) {
        const minisiteUrl = `https://conectaios.com.br/minisite/${brokerInfo.minisite}`;
        message += `🌐 Mais Imóveis: ${minisiteUrl}\n`;
      }
    } else if (brokerName) {
      // Fallback apenas com nome
      message += `\n📞 *${brokerName}*\n`;
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