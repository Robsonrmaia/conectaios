import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, MapPin, User, Building2, Star } from 'lucide-react';

export default function Match() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock data for matches
  const matches = [
    {
      id: 1,
      clientName: 'Maria Silva',
      clientType: 'Compradora',
      budget: 800000,
      location: 'Jardins, São Paulo',
      propertyTitle: 'Apartamento Luxo Jardins',
      propertyPrice: 850000,
      propertyArea: 120,
      matchScore: 95,
      clientPhoto: '/placeholder.svg',
      propertyPhoto: '/placeholder.svg'
    },
    {
      id: 2,
      clientName: 'João Santos',
      clientType: 'Investidor',
      budget: 1500000,
      location: 'Alphaville, Barueri',
      propertyTitle: 'Casa Condomínio Alphaville',
      propertyPrice: 1200000,
      propertyArea: 280,
      matchScore: 88,
      clientPhoto: '/placeholder.svg',
      propertyPhoto: '/placeholder.svg'
    },
    {
      id: 3,
      clientName: 'Ana Costa',
      clientType: 'Compradora',
      budget: 2000000,
      location: 'Barra da Tijuca, RJ',
      propertyTitle: 'Cobertura Vista Mar',
      propertyPrice: 2500000,
      propertyArea: 200,
      matchScore: 78,
      clientPhoto: '/placeholder.svg',
      propertyPhoto: '/placeholder.svg'
    }
  ];

  const currentMatch = matches[currentIndex];

  const handleLike = () => {
    console.log('Liked match:', currentMatch.id);
    nextMatch();
  };

  const handlePass = () => {
    console.log('Passed match:', currentMatch.id);
    nextMatch();
  };

  const nextMatch = () => {
    setCurrentIndex((prev) => (prev + 1) % matches.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
          Match IA
        </h1>
        <p className="text-muted-foreground">
          Conecte clientes aos imóveis perfeitos com inteligência artificial
        </p>
      </div>

      {currentMatch && (
        <Card className="relative overflow-hidden">
          {/* Match Score Badge */}
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-background/90 backdrop-blur-sm">
              <Star className={`h-3 w-3 mr-1 ${getScoreColor(currentMatch.matchScore)}`} />
              <span className={getScoreColor(currentMatch.matchScore)}>
                {currentMatch.matchScore}% Match
              </span>
            </Badge>
          </div>

          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <img
                src={currentMatch.clientPhoto}
                alt={currentMatch.clientName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold">{currentMatch.clientName}</div>
                <div className="text-sm text-muted-foreground">{currentMatch.clientType}</div>
              </div>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Procura em {currentMatch.location}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Client Budget */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Orçamento</div>
              <div className="text-lg font-semibold text-primary">
                R$ {currentMatch.budget.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Property Match */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Imóvel Sugerido
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={currentMatch.propertyPhoto}
                  alt={currentMatch.propertyTitle}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{currentMatch.propertyTitle}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-lg font-bold text-primary">
                      R$ {currentMatch.propertyPrice.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentMatch.propertyArea}m²
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handlePass}
              >
                <X className="h-5 w-5 mr-2" />
                Pular
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
                onClick={handleLike}
              >
                <Heart className="h-5 w-5 mr-2" />
                Conectar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <div className="text-center text-sm text-muted-foreground">
        {currentIndex + 1} de {matches.length} matches
      </div>
    </div>
  );
}