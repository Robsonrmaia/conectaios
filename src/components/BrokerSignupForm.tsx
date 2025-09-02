import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader, UserPlus, MapPin, Phone, Mail, Building } from 'lucide-react';

interface BrokerSignupFormProps {
  onSuccess?: () => void;
}

export function BrokerSignupForm({ onSuccess }: BrokerSignupFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    creci: '',
    city: '',
    region: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Enhanced validation with length limits
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.full_name.trim().length > 100) {
      newErrors.full_name = 'Nome não pode ter mais de 100 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email inválido';
    } else if (formData.email.trim().length > 254) {
      newErrors.email = 'Email muito longo';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Telefone deve estar no formato (XX) XXXXX-XXXX';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    } else if (formData.city.trim().length > 100) {
      newErrors.city = 'Nome da cidade muito longo';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Região é obrigatória';
    }

    if (formData.creci && formData.creci.length > 20) {
      newErrors.creci = 'CRECI muito longo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos em destaque.",
        variant: "destructive",
      });
      return;
    }

    // Input sanitization
    const sanitizedData = {
      full_name: formData.full_name.trim().replace(/<[^>]*>/g, '').substring(0, 100),
      email: formData.email.trim().toLowerCase().substring(0, 254),
      phone: formData.phone.replace(/[^\d\-\(\)\s]/g, '').substring(0, 20),
      creci: formData.creci.trim().replace(/[^a-zA-Z0-9\-]/g, '').substring(0, 20),
      city: formData.city.trim().replace(/[<>]/g, '').substring(0, 100),
      region: formData.region.trim().replace(/[<>]/g, '').substring(0, 100)
    };

    setLoading(true);
    
    try {
      // Remove console.log to avoid logging sensitive data
      const { data, error } = await supabase.functions.invoke('send-registration-email', {
        body: sanitizedData
      });

      if (error) {
        console.error('Registration error occurred');
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Cadastro realizado com sucesso! 🎉",
          description: "Recebemos seus dados e entraremos em contato em breve. Verifique seu email.",
        });

        // Reset form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          creci: '',
          city: '',
          region: ''
        });
        setErrors({});

        onSuccess?.();
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('Registration submission error occurred');
      
      let errorMessage = 'Erro ao processar cadastro. Tente novamente.';
      
      if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-primary/10 to-brand-secondary/10 rounded-full w-fit">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Cadastre-se como Corretor</CardTitle>
        <CardDescription>
          Junte-se à maior rede de corretores colaborativos do Brasil. 
          Preencha seus dados e nossa equipe entrará em contato.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <div className="relative">
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Seu nome completo"
                  className={errors.full_name ? 'border-destructive' : ''}
                />
                <UserPlus className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone/WhatsApp *</Label>
              <div className="relative">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creci">CRECI</Label>
              <div className="relative">
                <Input
                  id="creci"
                  value={formData.creci}
                  onChange={(e) => handleInputChange('creci', e.target.value)}
                  placeholder="Ex: 123456"
                />
                <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade de Atuação *</Label>
              <div className="relative">
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                  className={errors.city ? 'border-destructive' : ''}
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Região/Estado *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange('region', value)}
              >
                <SelectTrigger className={errors.region ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione sua região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp">São Paulo</SelectItem>
                  <SelectItem value="rj">Rio de Janeiro</SelectItem>
                  <SelectItem value="mg">Minas Gerais</SelectItem>
                  <SelectItem value="ba">Bahia</SelectItem>
                  <SelectItem value="pr">Paraná</SelectItem>
                  <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                  <SelectItem value="pe">Pernambuco</SelectItem>
                  <SelectItem value="ce">Ceará</SelectItem>
                  <SelectItem value="pa">Pará</SelectItem>
                  <SelectItem value="sc">Santa Catarina</SelectItem>
                  <SelectItem value="go">Goiás</SelectItem>
                  <SelectItem value="ma">Maranhão</SelectItem>
                  <SelectItem value="es">Espírito Santo</SelectItem>
                  <SelectItem value="pb">Paraíba</SelectItem>
                  <SelectItem value="al">Alagoas</SelectItem>
                  <SelectItem value="pi">Piauí</SelectItem>
                  <SelectItem value="df">Distrito Federal</SelectItem>
                  <SelectItem value="ms">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="mt">Mato Grosso</SelectItem>
                  <SelectItem value="rn">Rio Grande do Norte</SelectItem>
                  <SelectItem value="ro">Rondônia</SelectItem>
                  <SelectItem value="se">Sergipe</SelectItem>
                  <SelectItem value="am">Amazonas</SelectItem>
                  <SelectItem value="ac">Acre</SelectItem>
                  <SelectItem value="ap">Amapá</SelectItem>
                  <SelectItem value="rr">Roraima</SelectItem>
                  <SelectItem value="to">Tocantins</SelectItem>
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region}</p>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Próximos passos:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Nossa equipe validará seus dados</li>
              <li>• Você receberá acesso exclusivo à plataforma</li>
              <li>• Configuraremos seu perfil e mini-site</li>
              <li>• Treinamento completo das funcionalidades</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Processando Cadastro...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar como Corretor
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Ao se cadastrar, você concorda com nossos{' '}
            <a href="#" className="text-primary hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}