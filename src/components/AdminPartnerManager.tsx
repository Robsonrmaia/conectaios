import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit3, Plus, Building, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  description?: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface PartnerForm {
  name: string;
  logo_url: string;
  website_url: string;
  description: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

const categories = [
  { value: 'banco', label: 'Banco' },
  { value: 'seguradora', label: 'Seguradora' },
  { value: 'construtora', label: 'Construtora' },
  { value: 'imobiliaria', label: 'Imobiliária' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'parceiro', label: 'Parceiro Geral' }
];

export default function AdminPartnerManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<PartnerForm>({
    name: '',
    logo_url: '',
    website_url: '',
    description: '',
    category: 'parceiro',
    is_active: true,
    sort_order: 0
  });

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const partnersWithDefaults = (data || []).map((partner: any) => ({
        ...partner,
        category: partner.category || 'geral',
        is_active: partner.is_active ?? partner.active ?? true,
        sort_order: partner.sort_order || 0
      }));
      
      setPartners(partnersWithDefaults);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Erro ao carregar parceiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.logo_url) {
        toast.error('Nome e logo são obrigatórios');
        return;
      }

      if (editingPartner) {
        const { error } = await supabase
          .from('partners')
          .update(formData)
          .eq('id', editingPartner.id);

        if (error) throw error;
        toast.success('Parceiro atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('partners')
          .insert(formData);

        if (error) throw error;
        toast.success('Parceiro criado com sucesso!');
      }

      setDialogOpen(false);
      setEditingPartner(null);
      resetForm();
      fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Erro ao salvar parceiro');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Parceiro excluído com sucesso!');
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Erro ao excluir parceiro');
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url,
      website_url: partner.website_url || '',
      description: partner.description || '',
      category: partner.category,
      is_active: partner.is_active,
      sort_order: partner.sort_order
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      website_url: '',
      description: '',
      category: 'parceiro',
      is_active: true,
      sort_order: 0
    });
  };

  const handleNewPartner = () => {
    setEditingPartner(null);
    resetForm();
    setDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando parceiros...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Gerenciamento de Parceiros
            </CardTitle>
            <CardDescription>
              Gerencie parceiros e convênios da plataforma
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewPartner} className="gap-2 w-full sm:w-auto px-3 sm:px-4 text-sm sm:text-base">
                <Plus className="h-4 w-4" />
                Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do parceiro
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do parceiro"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL do Logo *</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website_url">Site</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição breve do parceiro"
                    rows={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Ordem</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingPartner ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {partners.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum parceiro encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro parceiro
            </p>
            <Button onClick={handleNewPartner}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Parceiro
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name}
                        className="w-12 h-12 rounded object-contain bg-muted p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{partner.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={partner.category === 'banco' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {getCategoryLabel(partner.category)}
                          </Badge>
                          <Badge variant={partner.is_active ? "default" : "secondary"}>
                            {partner.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      
                      {partner.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {partner.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {partner.website_url && (
                          <a
                            href={partner.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Site
                          </a>
                        )}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ml-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(partner)}
                            className="w-full sm:w-auto px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(partner.id)}
                            className="text-destructive hover:text-destructive w-full sm:w-auto px-2 sm:px-3 text-xs sm:text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}