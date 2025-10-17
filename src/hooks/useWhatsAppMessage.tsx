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
      ruler: '📐',
      bed: '🛏️',
      bath: '🚿',
      car: '🚗',
      money: '💰',
      location: '📍',
      target: '🎯',
      person: '👤',
      phone: '📞',
      globe: '🌐',
    };

    let message = `${emojis.house} *OPORTUNIDADE EXCLUSIVA*\n`;
    message += `*${property.titulo.toUpperCase()}*`;
    
    // Localização compacta na mesma linha
    if (property.neighborhood) {
      message += ` • ${property.neighborhood}`;
    }
    message += `\n\n`;
    
    // Especificações em uma linha com bullet points
    const specs = [];
    if (property.area > 0) specs.push(`${emojis.ruler} ${property.area}m²`);
    if (property.quartos > 0) specs.push(`${emojis.bed} ${property.quartos} quartos`);
    if (property.bathrooms && property.bathrooms > 0) specs.push(`${emojis.bath} ${property.bathrooms} banheiros`);
    if (property.parking_spots && property.parking_spots > 0) specs.push(`${emojis.car} ${property.parking_spots} vagas`);
    
    if (specs.length > 0) {
      message += specs.join(' • ') + '\n\n';
    }
    
    // Valor em destaque (sem box ASCII)
    message += `${emojis.money} *${formatCurrency(property.valor)}*\n\n`;
    
    // CTA com link da proposta (incluindo shareId se tiver)
    if (presentationUrl) {
      const fullUrl = presentationUrl.startsWith('http') 
        ? presentationUrl 
        : `https://conectaios.com.br${presentationUrl}`;
      
      message += `${emojis.target} *Ver Proposta Completa:*\n${fullUrl}\n`;
    }
    
    // Rodapé compacto com informações do corretor
    if (brokerInfo) {
      message += `\n─────────────────\n`;
      message += `${emojis.person} *${brokerInfo.name}*`;
      
      if (brokerInfo.phone) {
        message += ` | ${emojis.phone} ${brokerInfo.phone}`;
      }
      
      if (brokerInfo.minisite) {
        message += `\n${emojis.globe} conectaios.com.br/minisite/${brokerInfo.minisite}`;
      }
    } else if (brokerName) {
      message += `\n─────────────────\n`;
      message += `${emojis.person} *${brokerName}*`;
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