import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Crown } from 'lucide-react';
import { useIndications } from '@/hooks/useIndications';

export function IndicationBadge() {
  const { stats } = useIndications();

  if (stats.confirmedIndications === 0) return null;

  const getBadgeContent = () => {
    if (stats.confirmedIndications >= 10) {
      return {
        icon: Crown,
        text: 'Top Indicador',
        className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none'
      };
    } else if (stats.confirmedIndications >= 5) {
      return {
        icon: Star,
        text: 'Super Indicador',
        className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none'
      };
    } else if (stats.confirmedIndications >= 2) {
      return {
        icon: Gift,
        text: 'Indicador Ativo',
        className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none'
      };
    }

    return {
      icon: Gift,
      text: 'Primeiro Indicador',
      className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none'
    };
  };

  const { icon: Icon, text, className } = getBadgeContent();

  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {text}
    </Badge>
  );
}