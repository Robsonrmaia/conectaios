import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  MapPin, 
  DollarSign, 
  Ruler, 
  Bed, 
  Bath, 
  Car, 
  Phone,
  Mail,
  MessageCircle,
  Share2,
  ExternalLink,
  Building2,
  CalendarDays,
  Eye,
  Home
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking_spots?: number;
  listing_type: string;
  property_type?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  address?: string;
  condominium_fee?: number;
  iptu?: number;
  descricao?: string;
  fotos: string[];
  reference_code?: string;
  created_at: string;
  furnishing_type?: string;
  sea_distance?: number;
  has_sea_view?: boolean;
  year_built?: number;
}

interface Broker {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  creci?: string;
}

interface PropertyDetailModalProps {
  property: Property | null;
  broker: Broker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryColor?: string;
}

export function PropertyDetailModal({
  property,
  broker,
  open,
  onOpenChange,
  primaryColor = '#2563eb'
}: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  const shareProperty = async () => {
    const propertyUrl = `${window.location.origin}/property/${property.id}`;
    const shareText = `${property.titulo} - ${formatCurrency(property.valor)} - Confira este imóvel!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.titulo,
          text: shareText,
          url: propertyUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(propertyUrl);
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Olá! Vi este imóvel e tenho interesse: ${property.titulo} - ${formatCurrency(property.valor)}. Poderia me dar mais informações?`;
    const whatsappUrl = `https://wa.me/55${broker.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'apartamento': 'Apartamento',
      'casa': 'Casa',
      'terreno': 'Terreno',
      'comercial': 'Comercial',
      'rural': 'Rural'
    };
    return types[type] || type;
  };

  const getListingTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'venda': 'Venda',
      'aluguel': 'Aluguel',
      'temporada': 'Temporada'
    };
    return types[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Image Carousel */}
          {property.fotos && property.fotos.length > 0 && (
            <div className="relative h-96 overflow-hidden">
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {property.fotos.map((photo, index) => (
                    <CarouselItem key={index} className="relative h-96">
                      <img 
                        src={photo} 
                        alt={`${property.titulo} - Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
              
              {/* Photo counter */}
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {property.fotos.length} fotos
              </div>
            </div>
          )}

          <div className="p-6">
            <DialogHeader className="space-y-4 pb-6 border-b">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold">{property.titulo}</DialogTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.neighborhood}, {property.city}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {getListingTypeLabel(property.listing_type)}
                  </Badge>
                  <Badge variant="secondary" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                    {getPropertyTypeLabel(property.property_type || '')}
                  </Badge>
                  {property.reference_code && (
                    <Badge variant="outline" className="text-xs">
                      REF: {property.reference_code}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="grid lg:grid-cols-3 gap-8 pt-6">
              {/* Left Column - Property Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Price */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-400">Valor do imóvel</p>
                      <p className="text-3xl font-bold text-green-800 dark:text-green-300">
                        {formatCurrency(property.valor)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Characteristics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Ruler className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Área</p>
                    <p className="font-semibold">{property.area}m²</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Quartos</p>
                    <p className="font-semibold">{property.quartos}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Banheiros</p>
                    <p className="font-semibold">{property.bathrooms || 0}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Vagas</p>
                    <p className="font-semibold">{property.parking_spots || 0}</p>
                  </div>
                </div>

                {/* Additional costs */}
                {(property.condominium_fee || property.iptu) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Custos adicionais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {property.condominium_fee && (
                        <div>
                          <p className="text-sm text-muted-foreground">Condomínio</p>
                          <p className="font-medium">{formatCurrency(property.condominium_fee)}/mês</p>
                        </div>
                      )}
                      {property.iptu && (
                        <div>
                          <p className="text-sm text-muted-foreground">IPTU</p>
                          <p className="font-medium">{formatCurrency(property.iptu)}/ano</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {property.descricao && (
                  <div>
                    <h3 className="font-semibold mb-3">Descrição</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {property.descricao}
                    </p>
                  </div>
                )}

                {/* Additional Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.furnishing_type && property.furnishing_type !== 'none' && (
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {property.furnishing_type === 'furnished' ? 'Mobiliado' : 'Semi-mobiliado'}
                      </span>
                    </div>
                  )}
                  {property.has_sea_view && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="text-sm">Vista para o mar</span>
                    </div>
                  )}
                  {property.sea_distance && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm">{property.sea_distance}m do mar</span>
                    </div>
                  )}
                  {property.year_built && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm">Construído em {property.year_built}</span>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <h3 className="font-semibold mb-3">Localização</h3>
                  <div className="space-y-2">
                    {property.address && (
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                    )}
                    <p className="text-sm">
                      {property.neighborhood && `${property.neighborhood}, `}
                      {property.city}
                      {property.zipcode && ` - CEP: ${property.zipcode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Broker Info */}
              <div className="space-y-6">
                {/* Broker Card */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border">
                  <div className="text-center mb-4">
                    {broker.avatar_url ? (
                      <img 
                        src={broker.avatar_url} 
                        alt={broker.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-primary/20 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg">{broker.name}</h3>
                    {broker.creci && (
                      <p className="text-sm text-muted-foreground">CRECI: {broker.creci}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {broker.phone && (
                      <Button 
                        size="lg" 
                        className="w-full text-white" 
                        style={{ backgroundColor: primaryColor }}
                        onClick={shareOnWhatsApp}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      {broker.phone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${broker.phone}`}>
                            <Phone className="h-4 w-4 mr-1" />
                            Ligar
                          </a>
                        </Button>
                      )}
                      {broker.email && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${broker.email}`}>
                            <Mail className="h-4 w-4 mr-1" />
                            E-mail
                          </a>
                        </Button>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={shareProperty}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>

                {/* Property Info Summary */}
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-4">Resumo do imóvel</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Código:</span>
                      <span className="font-medium">{property.reference_code || property.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{getPropertyTypeLabel(property.property_type || '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Finalidade:</span>
                      <span className="font-medium">{getListingTypeLabel(property.listing_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área:</span>
                      <span className="font-medium">{property.area}m²</span>
                    </div>
                    {property.area > 0 && property.valor > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor/m²:</span>
                        <span className="font-medium">{formatCurrency(property.valor / property.area)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}