import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, MapPin, Home, Car, Bath, Bed, Calculator, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface PropertySearchFilters {
  search: string;
  property_type: string;
  listing_type: string;
  min_price: number;
  max_price: number;
  min_area: number;
  max_area: number;
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  neighborhood: string;
}

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  fotos: string[];
  property_type: string;
  listing_type: string;
  city: string;
  neighborhood: string;
  descricao: string;
}

interface EnhancedPropertySearchProps {
  isVisible: boolean;
  onClose: () => void;
  onSearch: (filters: PropertySearchFilters) => void;
  onClear: () => void;
  properties: Property[];
}

const propertyTypes = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' }
];

const listingTypes = [
  { value: 'all', label: 'Compra e Aluguel' },
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' }
];

export function EnhancedPropertySearch({ 
  isVisible, 
  onClose, 
  onSearch, 
  onClear, 
  properties 
}: EnhancedPropertySearchProps) {
  const [filters, setFilters] = useState<PropertySearchFilters>({
    search: '',
    property_type: 'all',
    listing_type: 'all',
    min_price: 0,
    max_price: 10000000,
    min_area: 0,
    max_area: 1000,
    bedrooms: 0,
    bathrooms: 0,
    parking_spots: 0,
    neighborhood: 'all'
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('updated_at');
  
  // Extrair valores únicos dos imóveis para os filtros
  const uniqueNeighborhoods = [...new Set(properties.map(p => p.neighborhood).filter(Boolean))];
  const maxPrice = Math.max(...properties.map(p => p.valor || 0));
  const maxArea = Math.max(...properties.map(p => p.area || 0));

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      max_price: maxPrice || 10000000,
      max_area: maxArea || 1000
    }));
  }, [maxPrice, maxArea]);

  const updateFilter = (key: keyof PropertySearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      search: '',
      property_type: 'all',
      listing_type: 'all',
      min_price: 0,
      max_price: maxPrice || 10000000,
      min_area: 0,
      max_area: maxArea || 1000,
      bedrooms: 0,
      bathrooms: 0,
      parking_spots: 0,
      neighborhood: 'all'
    });
    onClear();
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.property_type) count++;
    if (filters.listing_type) count++;
    if (filters.min_price > 0) count++;
    if (filters.max_price < (maxPrice || 10000000)) count++;
    if (filters.min_area > 0) count++;
    if (filters.max_area < (maxArea || 1000)) count++;
    if (filters.bedrooms > 0) count++;
    if (filters.bathrooms > 0) count++;
    if (filters.parking_spots > 0) count++;
    if (filters.neighborhood) count++;
    return count;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Busca Avançada</h2>
                <p className="text-sm text-muted-foreground">
                  {getActiveFiltersCount()} filtros ativos
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Busca por texto */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Buscar por palavra-chave
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: apartamento, casa, centro..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tipo e Finalidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo do Imóvel
                  </label>
                  <Select value={filters.property_type} onValueChange={(value) => updateFilter('property_type', value)}>
                    <SelectTrigger>
                      <Home className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Finalidade
                  </label>
                  <Select value={filters.listing_type} onValueChange={(value) => updateFilter('listing_type', value)}>
                    <SelectTrigger>
                      <Calculator className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Venda ou Aluguel" />
                    </SelectTrigger>
                    <SelectContent>
                      {listingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bairro
                </label>
                <Select value={filters.neighborhood} onValueChange={(value) => updateFilter('neighborhood', value)}>
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os bairros</SelectItem>
                    {uniqueNeighborhoods.map(neighborhood => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Faixa de Preço */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Faixa de Preço: {formatPrice(filters.min_price)} - {formatPrice(filters.max_price)}
                </label>
                <div className="px-3">
                  <Slider
                    value={[filters.min_price, filters.max_price]}
                    onValueChange={([min, max]) => {
                      updateFilter('min_price', min);
                      updateFilter('max_price', max);
                    }}
                    max={maxPrice || 10000000}
                    min={0}
                    step={50000}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Área: {filters.min_area}m² - {filters.max_area}m²
                </label>
                <div className="px-3">
                  <Slider
                    value={[filters.min_area, filters.max_area]}
                    onValueChange={([min, max]) => {
                      updateFilter('min_area', min);
                      updateFilter('max_area', max);
                    }}
                    max={maxArea || 1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Quartos, Banheiros e Vagas */}
              <div>
                <label className="block text-sm font-medium mb-4">
                  Características
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">
                      Quartos (mín.)
                    </label>
                    <Select value={filters.bedrooms.toString()} onValueChange={(value) => updateFilter('bedrooms', parseInt(value))}>
                      <SelectTrigger>
                        <Bed className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 0 ? 'Qualquer' : `${num}+`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">
                      Banheiros (mín.)
                    </label>
                    <Select value={filters.bathrooms.toString()} onValueChange={(value) => updateFilter('bathrooms', parseInt(value))}>
                      <SelectTrigger>
                        <Bath className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 0 ? 'Qualquer' : `${num}+`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">
                      Vagas (mín.)
                    </label>
                    <Select value={filters.parking_spots.toString()} onValueChange={(value) => updateFilter('parking_spots', parseInt(value))}>
                      <SelectTrigger>
                        <Car className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 0 ? 'Qualquer' : `${num}+`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Filtros Ativos */}
              {getActiveFiltersCount() > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Filtros Ativos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Busca: {filters.search}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => updateFilter('search', '')} 
                        />
                      </Badge>
                    )}
                    {filters.property_type && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {propertyTypes.find(t => t.value === filters.property_type)?.label}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => updateFilter('property_type', 'all')} 
                        />
                      </Badge>
                    )}
                    {filters.listing_type && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {listingTypes.find(t => t.value === filters.listing_type)?.label}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => updateFilter('listing_type', 'all')} 
                        />
                      </Badge>
                    )}
                    {filters.neighborhood && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {filters.neighborhood}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => updateFilter('neighborhood', 'all')} 
                        />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />
          
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {properties.length} imóveis encontrados
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClear}>
                Limpar Filtros
              </Button>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar Imóveis
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}