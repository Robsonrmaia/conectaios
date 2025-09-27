import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { partnersService, type Partner, type CreatePartnerInput } from '@/data/partners';
import { toast } from '@/hooks/use-toast';
import { Plus, Building, Edit, Trash2, Upload, ExternalLink } from 'lucide-react';

export default function AdminPartnersManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePartnerInput>({
    name: '',
    logo_url: '',
    website: '',
    description: '',
    active: true
  });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await partnersService.listMine();
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar parceiros',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    try {
      if (!createForm.name.trim()) {
        toast({
          title: 'Erro',
          description: 'Nome do parceiro é obrigatório',
          variant: 'destructive'
        });
        return;
      }

      if (editingPartner) {
        await partnersService.update(editingPartner.id, createForm);
        toast({
          title: 'Sucesso',
          description: 'Parceiro atualizado com sucesso'
        });
      } else {
        await partnersService.create(createForm);
        toast({
          title: 'Sucesso',
          description: 'Parceiro criado com sucesso'
        });
      }

      setCreateForm({ name: '', logo_url: '', website: '', description: '', active: true });
      setEditingPartner(null);
      setIsCreateDialogOpen(false);
      loadPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar parceiro',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setCreateForm({
      name: partner.name,
      logo_url: partner.logo_url || '',
      website: partner.website || '',
      description: partner.description || '',
      active: partner.active
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;

    try {
      await partnersService.remove(id);
      toast({
        title: 'Sucesso',
        description: 'Parceiro excluído com sucesso'
      });
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir parceiro',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await partnersService.toggleActive(id, active);
      toast({
        title: 'Sucesso',
        description: `Parceiro ${active ? 'ativado' : 'desativado'} com sucesso`
      });
      loadPartners();
    } catch (error) {
      console.error('Error toggling active:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status do parceiro',
        variant: 'destructive'
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const logoUrl = await partnersService.uploadLogo(file);
      setCreateForm({...createForm, logo_url: logoUrl});
      toast({
        title: 'Sucesso',
        description: 'Logo enviado com sucesso'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar logo',
        variant: 'destructive'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Parceiros</h2>
          <p className="text-muted-foreground">Gerencie seus parceiros comerciais</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingPartner(null);
            setCreateForm({ name: '', logo_url: '', website: '', description: '', active: true });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Parceiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'Editar Parceiro' : 'Criar Novo Parceiro'}
              </DialogTitle>
              <DialogDescription>
                {editingPartner ? 'Edite os dados do parceiro' : 'Adicione um novo parceiro comercial'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Parceiro *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Nome da empresa parceira"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={createForm.website}
                  onChange={(e) => setCreateForm({...createForm, website: e.target.value})}
                  placeholder="https://www.parceiro.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Descrição dos serviços do parceiro"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo do Parceiro</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Enviando...' : 'Upload'}
                  </Button>
                </div>
                {createForm.logo_url && (
                  <div className="mt-2">
                    <img 
                      src={createForm.logo_url} 
                      alt="Logo preview" 
                      className="h-16 w-16 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={createForm.active}
                  onCheckedChange={(checked) => setCreateForm({...createForm, active: checked})}
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePartner}>
                  {editingPartner ? 'Atualizar' : 'Criar'} Parceiro
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando parceiros...</div>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum parceiro encontrado</h3>
            <p className="text-muted-foreground">Adicione seu primeiro parceiro comercial.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {partner.logo_url ? (
                      <img 
                        src={partner.logo_url} 
                        alt={`${partner.name} logo`}
                        className="h-10 w-10 object-contain rounded"
                      />
                    ) : (
                      <Building className="h-10 w-10 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{partner.name}</CardTitle>
                      {partner.website && (
                        <a 
                          href={partner.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={partner.active ? "default" : "secondary"}>
                    {partner.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardDescription>
                  Criado em {new Date(partner.created_at).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partner.description && (
                  <p className="text-sm text-muted-foreground mb-4">{partner.description}</p>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={partner.active}
                    onCheckedChange={(checked) => handleToggleActive(partner.id, checked)}
                  />
                  <Label className="text-sm">
                    {partner.active ? 'Ativo' : 'Inativo'}
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}