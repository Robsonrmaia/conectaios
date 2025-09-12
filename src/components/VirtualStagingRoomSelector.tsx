import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Bed, Sofa, ChefHat, Monitor, Bath, ArrowRight } from 'lucide-react';

interface VirtualStagingRoomSelectorProps {
  onRoomSelected: (roomType: string, style: string) => void;
  onBack?: () => void;
}

const ROOM_TYPES = [
  {
    id: 'quarto',
    name: 'Quarto',
    icon: Bed,
    description: 'Mobiliário para dormitórios',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    id: 'sala',
    name: 'Sala de Estar',
    icon: Sofa,
    description: 'Ambiente de convivência',
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    icon: ChefHat,
    description: 'Área gastronômica',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    icon: Monitor,
    description: 'Espaço de trabalho',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  },
  {
    id: 'banheiro',
    name: 'Banheiro',
    icon: Bath,
    description: 'Área molhada',
    color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
  }
];

const STYLES = [
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Design contemporâneo e clean'
  },
  {
    id: 'classico',
    name: 'Clássico',
    description: 'Elegância tradicional'
  },
  {
    id: 'luxo',
    name: 'Luxo',
    description: 'Sofisticação premium'
  }
];

export function VirtualStagingRoomSelector({ onRoomSelected, onBack }: VirtualStagingRoomSelectorProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('moderno');

  const handleProceed = () => {
    if (selectedRoom) {
      onRoomSelected(selectedRoom, selectedStyle);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Virtual Staging - Seleção de Ambiente
          <Badge variant="secondary">Powered by IA</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo de ambiente e estilo para criar o mobiliário virtual
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Room Type Selection */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
            1. Tipo de Ambiente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROOM_TYPES.map((room) => {
              const IconComponent = room.icon;
              return (
                <Card
                  key={room.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedRoom === room.id 
                      ? 'ring-2 ring-primary border-primary bg-primary/5' 
                      : `${room.color} border`
                  }`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <IconComponent className="h-8 w-8 mx-auto text-primary" />
                    <h4 className="font-medium">{room.name}</h4>
                    <p className="text-xs text-muted-foreground">{room.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Style Selection */}
        {selectedRoom && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              2. Estilo de Decoração
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STYLES.map((style) => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedStyle === style.id 
                      ? 'ring-2 ring-primary border-primary bg-primary/5' 
                      : 'border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <CardContent className="p-4 text-center space-y-1">
                    <h4 className="font-medium">{style.name}</h4>
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
          )}
          
          <Button 
            onClick={handleProceed}
            disabled={!selectedRoom}
            className="ml-auto"
            size="lg"
          >
            Criar Virtual Staging
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Selected Summary */}
        {selectedRoom && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Selecionado:</span>{' '}
              {ROOM_TYPES.find(r => r.id === selectedRoom)?.name} - Estilo {STYLES.find(s => s.id === selectedStyle)?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}