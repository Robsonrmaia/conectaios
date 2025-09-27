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
import { Trash2, Edit3, Plus, Star, MessageSquare, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Testimonial {
  id: string;
  name: string;
  company?: string;
  role?: string;
  testimonial: string;
  photo_url?: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface TestimonialForm {
  name: string;
  company: string;
  role: string;
  testimonial: string;
  photo_url: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
}

export default function AdminTestimonialManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState<TestimonialForm>({
    name: '',
    company: '',
    role: '',
    testimonial: '',
    photo_url: '',
    rating: 5,
    is_active: true,
    sort_order: 0
  });

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const testimonialsWithDefaults = (data || []).map((testimonial: any) => ({
        ...testimonial,
        name: testimonial.name || testimonial.author_name || '',
        testimonial: testimonial.testimonial || testimonial.content || '',
        is_active: testimonial.is_active ?? testimonial.published ?? true,
        sort_order: testimonial.sort_order || 0
      }));
      
      setTestimonials(testimonialsWithDefaults);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Erro ao carregar testemunhos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSave = async () => {
    try {
      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', editingTestimonial.id);

        if (error) throw error;
        toast.success('Testemunho atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert(formData);

        if (error) throw error;
        toast.success('Testemunho criado com sucesso!');
      }

      setDialogOpen(false);
      setEditingTestimonial(null);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('Erro ao salvar testemunho');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Testemunho excluído com sucesso!');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Erro ao excluir testemunho');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      company: testimonial.company || '',
      role: testimonial.role || '',
      testimonial: testimonial.testimonial,
      photo_url: testimonial.photo_url || '',
      rating: testimonial.rating,
      is_active: testimonial.is_active,
      sort_order: testimonial.sort_order
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      role: '',
      testimonial: '',
      photo_url: '',
      rating: 5,
      is_active: true,
      sort_order: 0
    });
  };

  const handleNewTestimonial = () => {
    setEditingTestimonial(null);
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando testemunhos...</p>
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
              <MessageSquare className="h-5 w-5" />
              Gerenciamento de Testemunhos
            </CardTitle>
            <CardDescription>
              Gerencie os testemunhos exibidos no site
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewTestimonial} className="gap-2 w-full sm:w-auto px-3 sm:px-4 text-sm sm:text-base">
                <Plus className="h-4 w-4" />
                Novo Testemunho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTestimonial ? 'Editar Testemunho' : 'Novo Testemunho'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do testemunho
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="Cargo/função"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Avaliação</Label>
                    <Select
                      value={formData.rating.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, rating: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(rating => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating} {rating === 1 ? 'estrela' : 'estrelas'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="testimonial">Testemunho *</Label>
                  <Textarea
                    id="testimonial"
                    value={formData.testimonial}
                    onChange={(e) => setFormData(prev => ({ ...prev, testimonial: e.target.value }))}
                    placeholder="Depoimento do cliente"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="photo_url">URL da Foto</Label>
                  <Input
                    id="photo_url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                    placeholder="https://..."
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
                  {editingTestimonial ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {testimonials.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum testemunho encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro testemunho
            </p>
            <Button onClick={handleNewTestimonial}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Testemunho
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {testimonial.photo_url && (
                            <img 
                              src={testimonial.photo_url} 
                              alt={testimonial.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{testimonial.name}</h4>
                            {testimonial.company && (
                              <p className="text-sm text-muted-foreground">
                                {testimonial.role} - {testimonial.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <div className="flex items-center">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Badge variant={testimonial.is_active ? "default" : "secondary"}>
                            {testimonial.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        "{testimonial.testimonial}"
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(testimonial)}
                        className="w-full sm:w-auto px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(testimonial.id)}
                        className="text-destructive hover:text-destructive w-full sm:w-auto px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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