import { Bath, Car, Home, Sofa, Waves, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PropertyIconsProps {
  bathrooms?: number;
  parking_spots?: number;
  furnishing_type?: 'none' | 'furnished' | 'semi_furnished';
  sea_distance?: number;
  className?: string;
}

export function PropertyIcons({ 
  bathrooms, 
  parking_spots, 
  furnishing_type, 
  sea_distance,
  className = ""
}: PropertyIconsProps) {
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {bathrooms && bathrooms > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bath className="h-3 w-3" />
                <span className="text-xs">{bathrooms}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{bathrooms} banheiro{bathrooms > 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {parking_spots && parking_spots > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Car className="h-3 w-3" />
                <span className="text-xs">{parking_spots}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{parking_spots} vaga{parking_spots > 1 ? 's' : ''} de garagem</p>
            </TooltipContent>
          </Tooltip>
        )}

        {furnishing_type === 'furnished' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground">
                <Home className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mobiliado</p>
            </TooltipContent>
          </Tooltip>
        )}

        {furnishing_type === 'semi_furnished' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground">
                <Sofa className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Semi-mobiliado</p>
            </TooltipContent>
          </Tooltip>
        )}

        {sea_distance && sea_distance > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-blue-600">
                <Waves className="h-3 w-3" />
                <span className="text-xs">
                  {sea_distance >= 1000 
                    ? `${(sea_distance / 1000).toFixed(1)}km` 
                    : `${sea_distance}m`
                  }
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Distância do mar: {sea_distance >= 1000 
                ? `${(sea_distance / 1000).toFixed(1)}km` 
                : `${sea_distance}m`
              }</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}