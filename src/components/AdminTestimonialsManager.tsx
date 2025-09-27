import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { testimonialsService, type Testimonial, type CreateTestimonialInput } from '@/data/testimonials';
import { toast } from '@/hooks/use-toast';
import { Plus, Star, MessageSquare, Edit, Trash2 } from 'lucide-react';

export default function AdminTestimonialsManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [createForm, setCreateForm] = useState<CreateTestimonialInput>({
    author_name: '',
    rating: 5,
    content: '',
    source: '',
    published: true
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await testimonialsService.listMine();
      setTestimonials(data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar testemunhos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestimonial = async () => {
    try {
      if (!createForm.author_name.trim() || !createForm.content.trim()) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      if (editingTestimonial) {
        await testimonialsService.update(editingTestimonial.id, createForm);
        toast({
          title: 'Sucesso',
          description: 'Testemunho atualizado com sucesso'
        });
      } else {
        await testimonialsService.create(createForm);
        toast({
          title: 'Sucesso',
          description: 'Testemunho criado com sucesso'
        });
      }

      setCreateForm({ author_name: '', rating: 5, content: '', source: '', published: true });
      setEditingTestimonial(null);
      setIsCreateDialogOpen(false);
      loadTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar testemunho',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setCreateForm({
      author_name: testimonial.author_name,
      rating: testimonial.rating,
      content: testimonial.content,
      source: testimonial.source || '',
      published: testimonial.published
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este testemunho?')) return;

    try {
      await testimonialsService.remove(id);
      toast({
        title: 'Sucesso',
        description: 'Testemunho excluído com sucesso'
      });
      loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir testemunho',
        variant: 'destructive'
      });
    }
  };

  const handleTogglePublished = async (id: string, published: boolean) => {
    try {
      await testimonialsService.togglePublished(id, published);
      toast({
        title: 'Sucesso',
        description: `Testemunho ${published ? 'publicado' : 'despublicado'} com sucesso`
      });
      loadTestimonials();
    } catch (error) {
      console.error('Error toggling published:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status de publicação',
        variant: 'destructive'
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Testemunhos</h2>
          <p className="text-muted-foreground">Gerencie testemunhos e avaliações de clientes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingTestimonial(null);
            setCreateForm({ author_name: '', rating: 5, content: '', source: '', published: true });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Testemunho
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? 'Editar Testemunho' : 'Criar Novo Testemunho'}
              </DialogTitle>
              <DialogDescription>
                {editingTestimonial ? 'Edite os dados do testemunho' : 'Adicione um novo testemunho de cliente'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Nome do Cliente *</Label>
                <Input
                  id="author_name"
                  value={createForm.author_name}
                  onChange={(e) => setCreateForm({...createForm, author_name: e.target.value})}
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação</Label>
                <Select 
                  value={createForm.rating.toString()} 
                  onValueChange={(value) => 
                    setCreateForm({...createForm, rating: parseInt(value)})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ (1 estrela)</SelectItem>
                    <SelectItem value="2">⭐⭐ (2 estrelas)</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ (3 estrelas)</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ (4 estrelas)</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrelas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Fonte</Label>
                <Input
                  id="source"
                  value={createForm.source}
                  onChange={(e) => setCreateForm({...createForm, source: e.target.value})}
                  placeholder="Ex: Google, Site, Facebook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Testemunho *</Label>
                <Textarea
                  id="content"
                  value={createForm.content}
                  onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                  placeholder="Escreva o testemunho do cliente"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={createForm.published}
                  onCheckedChange={(checked) => setCreateForm({...createForm, published: checked})}
                />
                <Label htmlFor="published">Publicado</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTestimonial}>
                  {editingTestimonial ? 'Atualizar' : 'Criar'} Testemunho
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando testemunhos...</div>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum testemunho encontrado</h3>
            <p className="text-muted-foreground">Adicione seu primeiro testemunho de cliente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{testimonial.author_name}</CardTitle>
                    <div className="flex items-center space-x-1 mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {testimonial.source && (
                      <Badge variant="outline">{testimonial.source}</Badge>
                    )}
                    <Badge variant={testimonial.published ? "default" : "secondary"}>
                      {testimonial.published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(testimonial)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(testimonial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  Criado em {new Date(testimonial.created_at).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{testimonial.content}</p>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={testimonial.published}
                    onCheckedChange={(checked) => handleTogglePublished(testimonial.id, checked)}
                  />
                  <Label className="text-sm">
                    {testimonial.published ? 'Publicado' : 'Rascunho'}
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