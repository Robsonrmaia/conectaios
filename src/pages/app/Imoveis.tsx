import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  MapPin,
  Home,
  Bed,
  Bath,
  Car,
  Send,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBroker } from '@/hooks/useBroker';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageWrapper from '@/components/PageWrapper';
import { PropertyFormModal } from '@/components/PropertyFormModal';
import { PropertyClientFormModal } from '@/components/PropertyClientFormModal';
import { PropertySubmissionModal } from '@/components/PropertySubmissionModal';

interface Property {
  id: string;
  title: string;
  price: number | null;
  area_total: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  purpose: string;
  type: string;
  status: string;
  visibility: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  zipcode: string | null;
  suites: number | null;
  is_furnished: boolean;
  vista_mar: boolean;
  distancia_mar: number | null;
  created_at: string;
  is_public: boolean;
}

const Imoveis = () => {
  const { user } = useAuth();
  const { broker } = useBroker();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilterState] = useState('');
  const [typeFilter, setTypeFilterState] = useState('');
  const [statusFilter, setStatusFilterState] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isClientFormModalOpen, setIsClientFormModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const setPurposeFilter = (value: string) => {
    setPurposeFilterState(value === "all" ? "" : value);
  };

  const setTypeFilter = (value: string) => {
    setTypeFilterState(value === "all" ? "" : value);
  };

  const setStatusFilter = (value: string) => {
    setStatusFilterState(value === "all" ? "" : value);
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setProperties(data || []);
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error);
      toast.error('Erro ao carregar imóveis');
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPurpose = !purposeFilter || property.purpose === purposeFilter;
    const matchesType = !typeFilter || property.type === typeFilter;
    const matchesStatus = !statusFilter || property.status === statusFilter;
    
    return matchesSearch && matchesPurpose && matchesType && matchesStatus;
  });

  const formatPrice = (price: number | null) => {
    if (!price) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'sale': return 'bg-green-100 text-green-800';
      case 'rent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'rented': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Meus Imóveis
            </h1>
            <p className="text-muted-foreground">
              Gerencie seu portfólio de imóveis
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Adicionar Imóvel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{properties.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {properties.filter(p => p.status === 'available').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Disponíveis</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {properties.filter(p => p.purpose === 'sale').length}
                  </div>
                  <div className="text-sm text-muted-foreground">À Venda</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {properties.filter(p => p.is_public).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Públicos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, cidade ou bairro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={purposeFilter || "all"} onValueChange={setPurposeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Finalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="rent">Aluguel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter || "all"} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="house">Casa</SelectItem>
                  <SelectItem value="apartment">Apartamento</SelectItem>
                  <SelectItem value="commercial">Comercial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="sold">Vendido</SelectItem>
                  <SelectItem value="rented">Alugado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Imóveis</CardTitle>
            <CardDescription>
              {filteredProperties.length} de {properties.length} imóveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imóvel</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="hidden md:table-cell">Detalhes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Criado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Carregando imóveis...
                      </TableCell>
                    </TableRow>
                  ) : filteredProperties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        Nenhum imóvel encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {property.city && property.neighborhood 
                                ? `${property.neighborhood}, ${property.city}`
                                : property.city || property.neighborhood || 'Localização não informada'
                              }
                            </div>
                            <div className="flex gap-1 mt-1">
                              <Badge className={getPurposeColor(property.purpose)}>
                                {property.purpose === 'sale' ? 'Venda' : 'Aluguel'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {property.type === 'house' ? 'Casa' : 
                                 property.type === 'apartment' ? 'Apartamento' : 
                                 property.type === 'commercial' ? 'Comercial' : property.type}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(property.price)}
                          </div>
                        </TableCell>
                        
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {property.area_total && (
                              <span>{property.area_total}m²</span>
                            )}
                            {property.bedrooms && (
                              <span className="flex items-center gap-1">
                                <Bed className="h-3 w-3" />
                                {property.bedrooms}
                              </span>
                            )}
                            {property.bathrooms && (
                              <span className="flex items-center gap-1">
                                <Bath className="h-3 w-3" />
                                {property.bathrooms}
                              </span>
                            )}
                            {property.parking && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {property.parking}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getStatusColor(property.status)}>
                            {property.status === 'available' ? 'Disponível' :
                             property.status === 'sold' ? 'Vendido' :
                             property.status === 'rented' ? 'Alugado' : property.status}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(property.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" title="Visualizar">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" title="Editar">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProperty(property);
                                setIsClientFormModalOpen(true);
                              }}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProperty(property);
                                setIsSubmissionModalOpen(true);
                              }}
                            >
                              <LinkIcon className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" title="Excluir">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Property Form Modal */}
        <PropertyFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchProperties}
        />

        {/* Property Client Form Modal */}
        {selectedProperty && broker && (
          <PropertyClientFormModal
            isOpen={isClientFormModalOpen}
            onClose={() => {
              setIsClientFormModalOpen(false);
              setSelectedProperty(null);
            }}
            property={{ id: selectedProperty.id, title: selectedProperty.title }}
            brokerId={broker.id}
          />
        )}
        {/* Property Submission Modal */}
        <PropertySubmissionModal
          open={isSubmissionModalOpen}          
          onOpenChange={setIsSubmissionModalOpen}
        />
      </div>
    </PageWrapper>
  );
};

export default Imoveis;