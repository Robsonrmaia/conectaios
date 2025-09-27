import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, Home, MapPin } from 'lucide-react';

export default function PropertySubmissionFormComplete() {
  const { token } = useParams<{ token: string }>();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    price: 0,
    area_total: 0,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    purpose: 'sale' as 'sale' | 'rent',
    type: 'house' as 'house' | 'apartment' | 'commercial' | 'land',
    city: '',
    neighborhood: '',
    street: '',
    zipcode: '',
    message: ''
  });

  useEffect(() => {
    if (token) loadSubmission();
  }, [token]);

  const loadSubmission = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // Use fetch directly to avoid complex types
      const response = await fetch(`https://paawojkqrggnuvpnnwrc.supabase.co/rest/v1/property_submissions?submission_token=eq.${token}&status=eq.pending`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYXdvamtxcmdnbnV2cG5ud3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjcwMjIsImV4cCI6MjA3NDUwMzAyMn0.w6GWfIyEvcYDsG1W4J0yatSx-ueTm6_m7Qkj-GvxEIU'
        }
      });

      const data = await response.json();
      
      if (!data || data.length === 0) {
        setNotFound(true);
        return;
      }

      setSubmission(data[0]);

    } catch (error) {
      console.error('Error:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submission) return;

    // Validação básica
    if (!formData.name || !formData.email || !formData.title) {
      toast.error('Por favor, preencha os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);

      // Atualizar a submissão com os dados do imóvel
      const { error } = await supabase
        .from('property_submissions')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          property_data: {
            title: formData.title,
            description: formData.description,
            price: formData.price,
            area_total: formData.area_total,
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            parking: formData.parking,
            purpose: formData.purpose,
            type: formData.type,
            city: formData.city,
            neighborhood: formData.neighborhood,
            street: formData.street,
            zipcode: formData.zipcode
          },
          status: 'submitted'
        })
        .eq('id', submission.id);

      if (error) {
        throw error;
      }

      setSubmitted(true);
      toast.success('Imóvel cadastrado com sucesso! O corretor entrará em contato em breve.');

    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar dados. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (notFound || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-8">Formulário não encontrado ou já utilizado</p>
          <Button onClick={() => window.location.href = '/'}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sucesso!</h1>
          <p className="text-muted-foreground mb-6">
            Seu imóvel foi cadastrado com sucesso. O corretor responsável analisará as informações e entrará em contato em breve.
          </p>
          <Button onClick={() => window.location.href = '/'}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Cadastro de Imóvel</h1>
          </div>
          <p className="text-muted-foreground">
            Preencha os dados do seu imóvel para que possamos ajudá-lo na venda ou locação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados de Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dados de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Imóvel */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Anúncio *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Apartamento 2 quartos no Centro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva seu imóvel..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purpose">Finalidade</Label>
                  <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venda</SelectItem>
                      <SelectItem value="rent">Aluguel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Imóvel</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="apartment">Apartamento</SelectItem>
                      <SelectItem value="commercial">Comercial</SelectItem>
                      <SelectItem value="land">Terreno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="300000"
                  />
                </div>

                <div>
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area_total}
                    onChange={(e) => handleInputChange('area_total', parseFloat(e.target.value) || 0)}
                    placeholder="85"
                  />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Select value={formData.bedrooms.toString()} onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Select value={formData.bathrooms.toString()} onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="parking">Vagas de Garagem</Label>
                  <Select value={formData.parking.toString()} onValueChange={(value) => handleInputChange('parking', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0,1,2,3,4,5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Centro"
                  />
                </div>

                <div>
                  <Label htmlFor="zipcode">CEP</Label>
                  <Input
                    id="zipcode"
                    value={formData.zipcode}
                    onChange={(e) => handleInputChange('zipcode', e.target.value)}
                    placeholder="01000-000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="street">Endereço Completo</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Rua das Flores, 123"
                />
              </div>

              <div>
                <Label htmlFor="message">Observações Adicionais</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Informações adicionais sobre o imóvel..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting}
              size="lg"
              className="min-w-[200px]"
            >
              {submitting ? 'Enviando...' : 'Enviar Dados do Imóvel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}