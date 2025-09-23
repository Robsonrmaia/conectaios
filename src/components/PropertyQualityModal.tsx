import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Star, MapPin, Image, FileText, Home, Building } from "lucide-react";

interface QualityCriteria {
  name: string;
  points: number;
  maxPoints: number;
  met: boolean;
  suggestion?: string;
  icon: React.ReactNode;
}

interface PropertyQualityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: any;
  qualityScore: number;
}

export function PropertyQualityModal({ open, onOpenChange, property, qualityScore }: PropertyQualityModalProps) {
  const calculateDetailedCriteria = (): QualityCriteria[] => {
    const fotoCount = (property?.fotos || []).length;
    const descricaoLength = (property?.descricao || '').length;
    const addressLength = (property?.address || '').length;
    
    return [
      {
        name: "Valor definido",
        points: property?.valor > 0 ? 15 : 0,
        maxPoints: 15,
        met: property?.valor > 0,
        suggestion: !property?.valor ? "Defina o valor do imóvel" : undefined,
        icon: <Building className="w-4 h-4" />
      },
      {
        name: "Descrição completa",
        points: descricaoLength >= 600 ? 20 : 0,
        maxPoints: 20,
        met: descricaoLength >= 600,
        suggestion: descricaoLength < 600 ? `Adicione mais ${600 - descricaoLength} caracteres à descrição` : undefined,
        icon: <FileText className="w-4 h-4" />
      },
      {
        name: "Área informada",
        points: property?.area > 0 ? 10 : 0,
        maxPoints: 10,
        met: property?.area > 0,
        suggestion: !property?.area ? "Informe a área do imóvel" : undefined,
        icon: <Home className="w-4 h-4" />
      },
      {
        name: "Quartos definidos",
        points: property?.quartos >= 1 ? 10 : 0,
        maxPoints: 10,
        met: property?.quartos >= 1,
        suggestion: !property?.quartos ? "Defina a quantidade de quartos" : undefined,
        icon: <Home className="w-4 h-4" />
      },
      {
        name: "Endereço completo",
        points: addressLength > 10 ? 10 : 0,
        maxPoints: 10,
        met: addressLength > 10,
        suggestion: addressLength <= 10 ? "Complete o endereço com mais detalhes" : undefined,
        icon: <MapPin className="w-4 h-4" />
      },
      {
        name: "Bairro informado",
        points: property?.neighborhood ? 5 : 0,
        maxPoints: 5,
        met: !!property?.neighborhood,
        suggestion: !property?.neighborhood ? "Informe o bairro" : undefined,
        icon: <MapPin className="w-4 h-4" />
      },
      {
        name: "Cidade informada",
        points: property?.city ? 5 : 0,
        maxPoints: 5,
        met: !!property?.city,
        suggestion: !property?.city ? "Informe a cidade" : undefined,
        icon: <MapPin className="w-4 h-4" />
      },
      {
        name: "Localização GPS",
        points: property?.coordinates ? 5 : 0,
        maxPoints: 5,
        met: !!property?.coordinates,
        suggestion: !property?.coordinates ? "Defina a localização no mapa" : undefined,
        icon: <MapPin className="w-4 h-4" />
      },
      {
        name: "Fotos suficientes",
        points: fotoCount >= 8 ? 20 : (fotoCount >= 5 ? 10 : (fotoCount >= 3 ? 5 : 0)),
        maxPoints: 20,
        met: fotoCount >= 8,
        suggestion: fotoCount < 8 ? `Adicione mais ${8 - fotoCount} fotos para alcançar 8+ fotos` : undefined,
        icon: <Image className="w-4 h-4" />
      }
    ];
  };

  const criteria = calculateDetailedCriteria();
  const totalPoints = criteria.reduce((sum, c) => sum + c.points, 0);
  const maxTotalPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const missingCriteria = criteria.filter(c => !c.met && c.suggestion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Qualidade do Anúncio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">{qualityScore}%</div>
            <Progress value={qualityScore} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {totalPoints} de {maxTotalPoints} pontos alcançados
            </p>
          </div>

          {/* Criteria List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Critérios de Qualidade</h3>
            <div className="grid gap-3">
              {criteria.map((criterion, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    criterion.met ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {criterion.met ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div className="flex items-center gap-2">
                      {criterion.icon}
                      <span className="font-medium">{criterion.name}</span>
                    </div>
                  </div>
                  <Badge variant={criterion.met ? "default" : "secondary"}>
                    {criterion.points}/{criterion.maxPoints} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Suggestions */}
          {missingCriteria.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                💡 Próximos passos para 100%
              </h3>
              <div className="space-y-2">
                {missingCriteria.map((criterion, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 font-semibold">{index + 1}.</span>
                    <span className="text-blue-800">{criterion.suggestion}</span>
                    <Badge variant="outline" className="ml-auto">
                      +{criterion.maxPoints} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gamification Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-purple-800 mb-2">🎮 Gamificação</h4>
            <div className="space-y-1 text-sm text-purple-700">
              <p>• Imóveis com 90%+ de qualidade: <strong>+15 pontos</strong></p>
              <p>• Imóveis com 8+ fotos: <strong>+2 pontos extras</strong></p>
              <p>• Imóveis vendidos/alugados: <strong>+50 pontos</strong></p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}