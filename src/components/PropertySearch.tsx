import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface PropertySearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export interface SearchFilters {
  query: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  listingType: string;
}

export function PropertySearch({ onSearch, onClear, isVisible, onToggle }: PropertySearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'all',
    bathrooms: 'all',
    propertyType: 'all',
    listingType: 'all'
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      query: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'all',
      bathrooms: 'all',
      propertyType: 'all',
      listingType: 'all'
    });
    onClear();
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative">
      {/* Search Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Pesquisar
        <Filter className="h-4 w-4" />
      </Button>

      {/* Search Panel */}
      {isVisible && (
        <Card className="absolute top-12 left-0 w-96 z-50 shadow-lg">
          <CardContent className="p-4 space-y-4">
            {/* Text Search */}
            <div>
              <Input
                placeholder="Buscar por título, descrição ou localização..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Preço mín."
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                type="number"
              />
              <Input
                placeholder="Preço máx."
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                type="number"
              />
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Quartos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer</SelectItem>
                  <SelectItem value="1">1 quarto</SelectItem>
                  <SelectItem value="2">2 quartos</SelectItem>
                  <SelectItem value="3">3 quartos</SelectItem>
                  <SelectItem value="4">4+ quartos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Banheiros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer</SelectItem>
                  <SelectItem value="1">1 banheiro</SelectItem>
                  <SelectItem value="2">2 banheiros</SelectItem>
                  <SelectItem value="3">3+ banheiros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Type and Listing Type */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.listingType} onValueChange={(value) => updateFilter('listingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Negócio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}