import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building2, Plus, Search, Filter, MapPin, Bath, Bed, Car, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Property {
  id: string;
  titulo: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms: number;
  parking_spots: number;
  listing_type: string;
  property_type: string;
  visibility: string;
  descricao: string;
  fotos: string[];
  videos: string[];
  created_at: string;
}

export default function Imoveis() {
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    area: '',
    quartos: '',
    bathrooms: '',
    parking_spots: '',
    listing_type: 'venda',
    property_type: 'apartamento',
    visibility: 'public_site',
    descricao: '',
    fotos: '',
    videos: '',
    address: '',
    neighborhood: '',
    city: '',
    condominium_fee: '',
    iptu: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          titulo,
          valor,
          area,
          quartos,
          bathrooms,
          parking_spots,
          listing_type,
          property_type,
          visibility,
          descricao,
          fotos,
          videos,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar imóveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async () => {
    try {
      const { error } = await supabase
        .from('properties')
        .insert({
          titulo: formData.titulo,
          valor: parseFloat(formData.valor),
          area: parseFloat(formData.area),
          quartos: parseInt(formData.quartos),
          bathrooms: parseInt(formData.bathrooms) || 0,
          parking_spots: parseInt(formData.parking_spots) || 0,
          listing_type: formData.listing_type,
          property_type: formData.property_type,
          visibility: formData.visibility,
          descricao: formData.descricao,
          fotos: formData.fotos ? formData.fotos.split(',').map(f => f.trim()) : [],
          videos: formData.videos ? formData.videos.split(',').map(v => v.trim()) : [],
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          condominium_fee: formData.condominium_fee ? parseFloat(formData.condominium_fee) : null,
          iptu: formData.iptu ? parseFloat(formData.iptu) : null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imóvel adicionado com sucesso!",
      });

      setIsAddDialogOpen(false);
      setFormData({
        titulo: '',
        valor: '',
        area: '',
        quartos: '',
        bathrooms: '',
        parking_spots: '',
        listing_type: 'venda',
        property_type: 'apartamento',
        visibility: 'public_site',
        descricao: '',
        fotos: '',
        videos: '',
        address: '',
        neighborhood: '',
        city: '',
        condominium_fee: '',
        iptu: ''
      });
      fetchProperties();
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar imóvel",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Imóvel excluído com sucesso!",
      });
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir imóvel",
        variant: "destructive",
      });
    }
  };

  const filteredProperties = properties.filter(property =>
    property.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            Imóveis
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu portfólio de imóveis
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imóvel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
              <DialogDescription>
                Preencha as informações do imóvel
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Apartamento 2 quartos Jardins"
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    placeholder="500000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="quartos">Quartos</Label>
                  <Input
                    id="quartos"
                    type="number"
                    value={formData.quartos}
                    onChange={(e) => setFormData({...formData, quartos: e.target.value})}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="listing_type">Finalidade</Label>
                  <Select value={formData.listing_type} onValueChange={(value) => setFormData({...formData, listing_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição detalhada do imóvel..."
                />
              </div>

              <div>
                <Label htmlFor="fotos">URLs das Fotos (separadas por vírgula)</Label>
                <Textarea
                  id="fotos"
                  value={formData.fotos}
                  onChange={(e) => setFormData({...formData, fotos: e.target.value})}
                  placeholder="https://exemplo.com/foto1.jpg, https://exemplo.com/foto2.jpg"
                />
              </div>

              <div>
                <Label htmlFor="videos">URLs dos Vídeos (separadas por vírgula)</Label>
                <Textarea
                  id="videos"
                  value={formData.videos}
                  onChange={(e) => setFormData({...formData, videos: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..., https://vimeo.com/..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="visibility"
                  checked={formData.visibility === 'public_site'}
                  onCheckedChange={(checked) => setFormData({...formData, visibility: checked ? 'public_site' : 'hidden'})}
                />
                <Label htmlFor="visibility">Visível no Marketplace</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProperty}>
                Adicionar Imóvel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative">
              {property.fotos?.[0] ? (
                <img
                  src={property.fotos[0]}
                  alt={property.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <Badge className="bg-primary/90 text-primary-foreground">
                  {property.listing_type === 'venda' ? 'Venda' : 'Locação'}
                </Badge>
                {property.visibility === 'public_site' && (
                  <Badge variant="secondary">Público</Badge>
                )}
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{property.titulo}</CardTitle>
              <CardDescription>
                {property.descricao && property.descricao.substring(0, 100)}...
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                R$ {property.valor?.toLocaleString('pt-BR')}
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {property.area}m²
                </div>
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {property.quartos}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{property.property_type}</Badge>
                  {property.visibility === 'public_site' && (
                    <Badge variant="outline" className="text-xs">Marketplace</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProperty(property.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground">
            Adicione seu primeiro imóvel para começar
          </p>
        </div>
      )}
    </div>
  );
}