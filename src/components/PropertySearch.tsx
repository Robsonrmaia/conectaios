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
    <>
      {/* Toggle Button - Mobile Only */}
      {!isVisible && (
        <Button
          onClick={onToggle}
          variant="outline"
          size="lg"
          className="w-full mb-4 md:hidden touch-target"
        >
          <Search className="h-5 w-5 mr-2" />
          Filtros de Busca
          <Filter className="h-5 w-5 ml-2" />
        </Button>
      )}

      {/* Search Panel */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-background md:relative md:bg-transparent md:z-0 md:mb-6">
          <div className="h-full overflow-y-auto md:overflow-visible">
            <div className="container-responsive p-4 md:p-0">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-4 md:hidden sticky top-0 bg-background pb-4 border-b z-10">
                <h3 className="text-lg font-semibold">Filtros de Busca</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="touch-target"
                >
                  Fechar
                </Button>
              </div>

              <Card className="md:shadow-lg">
                <CardContent className="p-4 space-y-4">
                  {/* Text Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Buscar</label>
                    <Input
                      placeholder="Buscar por título, descrição ou localização..."
                      value={filters.query}
                      onChange={(e) => updateFilter('query', e.target.value)}
                      className="h-12 md:h-10 text-base md:text-sm"
                    />
                  </div>

                  {/* Price Range - Stack on mobile */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preço Mínimo</label>
                      <Input
                        placeholder="R$ 0"
                        value={filters.minPrice}
                        onChange={(e) => updateFilter('minPrice', e.target.value)}
                        type="number"
                        className="h-12 md:h-10 text-base md:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preço Máximo</label>
                      <Input
                        placeholder="R$ 999.999"
                        value={filters.maxPrice}
                        onChange={(e) => updateFilter('maxPrice', e.target.value)}
                        type="number"
                        className="h-12 md:h-10 text-base md:text-sm"
                      />
                    </div>
                  </div>

                  {/* Property Details - Stack on mobile */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quartos</label>
                      <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
                        <SelectTrigger className="h-12 md:h-10">
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
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Banheiros</label>
                      <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
                        <SelectTrigger className="h-12 md:h-10">
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
                  </div>

                  {/* Property Type and Listing Type - Stack on mobile */}
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo</label>
                      <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
                        <SelectTrigger className="h-12 md:h-10">
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
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Negócio</label>
                      <Select value={filters.listingType} onValueChange={(value) => updateFilter('listingType', value)}>
                        <SelectTrigger className="h-12 md:h-10">
                          <SelectValue placeholder="Negócio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="venda">Venda</SelectItem>
                          <SelectItem value="locacao">Locação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons - Stack on mobile, sticky on mobile */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-background pb-4 md:pb-0 border-t md:border-t-0 -mx-4 px-4 md:mx-0 md:px-0 md:static">
                    <Button 
                      onClick={handleSearch} 
                      className="flex-1 h-12 md:h-10 touch-target"
                      size="lg"
                    >
                      <Search className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                      Buscar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClear}
                      className="flex-1 h-12 md:h-10 touch-target"
                      size="lg"
                    >
                      <X className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
