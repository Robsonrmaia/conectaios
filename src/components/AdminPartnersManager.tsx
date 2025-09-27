import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { partnersService, type Partner, type CreatePartnerInput } from '@/data/partners';
import { toast } from '@/hooks/use-toast';
import { Plus, Building2, Eye, EyeOff, Edit, Trash2, Upload, ExternalLink } from 'lucide-react';

export default function AdminPartnersManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePartnerInput>({
    name: '',
    description: '',
    website: '',
    logo_url: ''
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

      setCreateForm({ name: '', description: '', website: '', logo_url: '' });
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

  const handleToggleActive = async (partner: Partner) => {
    try {
      await partnersService.toggleActive(partner.id, !partner.active);
      toast({
        title: 'Sucesso',
        description: `Parceiro ${!partner.active ? 'ativado' : 'desativado'} com sucesso`
      });
      loadPartners();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status do parceiro',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;
    
    try {
      await partnersService.remove(partner.id);
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

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setCreateForm({
      name: partner.name,
      description: partner.description || '',
      website: partner.website || '',
      logo_url: partner.logo_url || ''
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Parceiros</h2>
          <p className="text-muted-foreground">Gerencie os parceiros e empresas associadas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingPartner(null);
            setCreateForm({ name: '', description: '', website: '', logo_url: '' });
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
                {editingPartner ? 'Edite os dados da empresa parceira' : 'Cadastre uma nova empresa parceira'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Nome completo da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={createForm.website}
                  onChange={(e) => setCreateForm({...createForm, website: e.target.value})}
                  placeholder="https://www.empresa.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="logo-file"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-file')?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                  </Button>
                  {createForm.logo_url && (
                    <div className="flex items-center space-x-2">
                      <img 
                        src={createForm.logo_url} 
                        alt="Logo preview" 
                        className="h-8 w-8 object-contain rounded"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreateForm({...createForm, logo_url: ''})}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Descrição da empresa e dos serviços oferecidos"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePartner}>
                  {editingPartner ? 'Salvar Alterações' : 'Criar Parceiro'}
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
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum parceiro encontrado</h3>
            <p className="text-muted-foreground">Cadastre sua primeira empresa parceira.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {partners.map((partner) => (
            <Card key={partner.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {partner.logo_url && (
                      <img 
                        src={partner.logo_url} 
                        alt={`Logo ${partner.name}`}
                        className="h-12 w-12 object-contain rounded border"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{partner.name}</span>
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Criado em {new Date(partner.created_at).toLocaleDateString('pt-BR')}
                        {partner.website && (
                          <span className="ml-2 text-primary">• {partner.website}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={partner.active}
                        onCheckedChange={() => handleToggleActive(partner)}
                      />
                      {partner.active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <Badge variant={partner.active ? "default" : "secondary"}>
                      {partner.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(partner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePartner(partner)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {partner.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{partner.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}