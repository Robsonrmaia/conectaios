import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';
import { X } from 'lucide-react';

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
  showOnScroll?: boolean;
}

export function WhatsAppButton({ 
  phone = "5511999999999", 
  message = "Olá! Gostaria de mais informações sobre os imóveis.",
  position = 'bottom-right',
  showOnScroll = false
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(!showOnScroll);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!showOnScroll) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 200); // Show after scrolling 200px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showOnScroll]);

  const openWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!isVisible) return null;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end gap-2`}>
        {/* Message Bubble */}
        {!isMinimized && (
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs relative animate-slide-in-right">
            <button
              onClick={() => setIsMinimized(true)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-6">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Precisa de ajuda?
              </p>
              <p className="text-xs text-gray-600">
                Entre em contato pelo WhatsApp e tire suas dúvidas sobre nossos imóveis!
              </p>
            </div>
            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-200" />
          </div>
        )}

        {/* WhatsApp Button */}
        <Button
          onClick={openWhatsApp}
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <FaWhatsapp className="h-6 w-6" />
        </Button>
      </div>

      {/* Pulse animation styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse-ring {
            0% {
              transform: scale(0.8);
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
            }
            100% {
              transform: scale(0.8);
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
            }
          }
          
          .animate-pulse-ring {
            animation: pulse-ring 2s infinite;
          }
        `
      }} />
    </>
  );
}