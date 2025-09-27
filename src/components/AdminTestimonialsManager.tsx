import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { testimonialsService, type Testimonial, type CreateTestimonialInput } from '@/data/testimonials';
import { toast } from '@/hooks/use-toast';
import { Plus, MessageSquare, Star, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';

export default function AdminTestimonialsManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [createForm, setCreateForm] = useState<CreateTestimonialInput>({
    author_name: '',
    content: '',
    rating: 5,
    source: ''
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

      setCreateForm({ author_name: '', content: '', rating: 5, source: '' });
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

  const handleTogglePublished = async (testimonial: Testimonial) => {
    try {
      await testimonialsService.togglePublished(testimonial.id, !testimonial.published);
      toast({
        title: 'Sucesso',
        description: `Testemunho ${!testimonial.published ? 'publicado' : 'despublicado'} com sucesso`
      });
      loadTestimonials();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status de publicação',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTestimonial = async (testimonial: Testimonial) => {
    if (!confirm('Tem certeza que deseja excluir este testemunho?')) return;
    
    try {
      await testimonialsService.remove(testimonial.id);
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

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setCreateForm({
      author_name: testimonial.author_name,
      content: testimonial.content,
      rating: testimonial.rating || 5,
      source: testimonial.source || ''
    });
    setIsCreateDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Testemunhos</h2>
          <p className="text-muted-foreground">Gerencie os testemunhos e avaliações dos clientes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingTestimonial(null);
            setCreateForm({ author_name: '', content: '', rating: 5, source: '' });
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
                {editingTestimonial ? 'Edite os dados do testemunho' : 'Crie um novo testemunho de cliente'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Nome do Autor *</Label>
                <Input
                  id="author_name"
                  value={createForm.author_name}
                  onChange={(e) => setCreateForm({...createForm, author_name: e.target.value})}
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação</Label>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCreateForm({...createForm, rating: i + 1})}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${i < createForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground">({createForm.rating} estrela{createForm.rating !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Fonte (opcional)</Label>
                <Input
                  id="source"
                  value={createForm.source}
                  onChange={(e) => setCreateForm({...createForm, source: e.target.value})}
                  placeholder="Ex: Google Reviews, WhatsApp, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo do Testemunho *</Label>
                <Textarea
                  id="content"
                  value={createForm.content}
                  onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                  placeholder="Digite o testemunho completo do cliente"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTestimonial}>
                  {editingTestimonial ? 'Salvar Alterações' : 'Criar Testemunho'}
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
            <p className="text-muted-foreground">Crie seu primeiro testemunho de cliente.</p>
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
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {renderStars(testimonial.rating || 5)}
                      </div>
                      {testimonial.source && (
                        <Badge variant="outline" className="text-xs">
                          {testimonial.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={testimonial.published}
                        onCheckedChange={() => handleTogglePublished(testimonial)}
                      />
                      {testimonial.published ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(testimonial)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTestimonial(testimonial)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Criado em {new Date(testimonial.created_at).toLocaleDateString('pt-BR')}
                  {testimonial.published ? ' • Publicado' : ' • Rascunho'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}