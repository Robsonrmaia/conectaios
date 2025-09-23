import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, AlertCircle, CheckCircle } from "lucide-react";

interface QualityIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  suggestions?: string[];
  className?: string;
}

export function QualityIndicator({ 
  score, 
  size = 'md', 
  showProgress = false, 
  suggestions = [],
  className = "" 
}: QualityIndicatorProps) {
  const getQualityLevel = (score: number) => {
    if (score >= 90) return { level: 'high', color: 'bg-green-500', textColor: 'text-green-700', label: 'Alta' };
    if (score >= 70) return { level: 'medium', color: 'bg-yellow-500', textColor: 'text-yellow-700', label: 'Média' };
    return { level: 'low', color: 'bg-red-500', textColor: 'text-red-700', label: 'Baixa' };
  };

  const quality = getQualityLevel(score);
  
  const getIcon = () => {
    if (score >= 90) return <CheckCircle className="w-3 h-3" />;
    if (score >= 70) return <Star className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-1.5 py-0.5';
      case 'lg': return 'text-sm px-3 py-1.5';
      default: return 'text-xs px-2 py-1';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <Badge 
              variant="secondary"
              className={`${quality.color} text-white ${getSizeClasses()} flex items-center gap-1`}
            >
              {getIcon()}
              {score}%
            </Badge>
            {showProgress && (
              <div className="flex-1 min-w-[60px]">
                <Progress 
                  value={score} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Qualidade: {quality.label} ({score}%)</p>
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Para melhorar:</p>
                {suggestions.map((suggestion, index) => (
                  <p key={index} className="text-xs">{suggestion}</p>
                ))}
              </div>
            )}
            {score >= 90 && (
              <p className="text-xs text-green-600">🎉 Qualidade excelente! Ganhe pontos extras!</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}