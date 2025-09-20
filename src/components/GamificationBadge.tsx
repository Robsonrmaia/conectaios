import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Star, Medal, Target, Zap, Trophy, Award } from 'lucide-react';

interface GamificationBadgeProps {
  tier: string;
  badges?: string[];
  pontos?: number;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GamificationBadge({ 
  tier, 
  badges = [], 
  pontos = 0, 
  showTooltip = true, 
  size = 'md',
  className = '' 
}: GamificationBadgeProps) {
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'Elite':
        return {
          icon: Crown,
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none',
          label: 'Elite',
          description: '50% de desconto - Tier máximo!'
        };
      case 'Premium':
        return {
          icon: Medal,
          color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none',
          label: 'Premium',
          description: '25% de desconto na mensalidade'
        };
      case 'Participativo':
        return {
          icon: Star,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none',
          label: 'Participativo',
          description: '10% de desconto na mensalidade'
        };
      default:
        return {
          icon: Target,
          color: 'bg-muted text-muted-foreground',
          label: '',
          description: 'Ganhe pontos para desbloquear descontos!'
        };
    }
  };

  const getBadgeIcon = (badgeSlug: string) => {
    switch (badgeSlug) {
      case 'fast_responder': return { icon: '⚡', label: 'Resposta Rápida' };
      case 'anunciante_premium': return { icon: '🏆', label: 'Anunciante Premium' };
      case 'parceiro_ouro': return { icon: '🥇', label: 'Parceiro Ouro' };
      case 'champion': return { icon: '👑', label: 'Campeão do Mês' };
      default: return { icon: '🏅', label: badgeSlug };
    }
  };

  const tierConfig = getTierConfig(tier);
  const Icon = tierConfig.icon;
  
  const sizeClasses = {
    sm: 'text-xs h-6',
    md: 'text-sm h-8',
    lg: 'text-base h-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const badgeContent = (
    <div className="flex items-center gap-1">
      <Badge className={`${tierConfig.color} ${sizeClasses[size]} ${className}`}>
        <Icon className={`${iconSizes[size]} ${tierConfig.label ? 'mr-1' : ''}`} />
        {tierConfig.label}
      </Badge>
      
      {/* Additional badges for specific achievements */}
      {badges.map(badgeSlug => {
        const badge = getBadgeIcon(badgeSlug);
        return (
          <Badge key={badgeSlug} variant="secondary" className={`${sizeClasses[size]} ml-1`}>
            <span className="mr-1">{badge.icon}</span>
            {size !== 'sm' && badge.label}
          </Badge>
        );
      })}
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold">{tierConfig.label || 'Sem Desconto'} Tier</p>
              <p className="text-sm">{tierConfig.description}</p>
              {pontos > 0 && (
                <p className="text-xs text-muted-foreground">{pontos} pontos este mês</p>
              )}
            </div>
            
            {badges.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-xs font-medium mb-1">Badges Conquistados:</p>
                {badges.map(badgeSlug => {
                  const badge = getBadgeIcon(badgeSlug);
                  return (
                    <div key={badgeSlug} className="flex items-center gap-1 text-xs">
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}