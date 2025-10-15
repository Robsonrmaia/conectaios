import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ConectaLogo from '@/components/ConectaLogo';
import { Upload, Check, AlertCircle, Home, MapPin, Camera, FileText, Shield, Save, Phone, Mail } from 'lucide-react';
import { usePropertyImageUpload } from '@/hooks/usePropertyImageUpload';

const propertySubmissionSchema = z.object({
  // Owner data
  owner_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  owner_email: z.string().email('Email inválido'),
  owner_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),

  // Property basics
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  descricao: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  valor: z.number().min(1, 'Valor é obrigatório'),
  listing_type: z.enum(['venda', 'aluguel', 'temporada']),
  property_type: z.enum(['apartamento', 'casa', 'terreno', 'comercial', 'rural']),

  // Property details
  area: z.number().min(1, 'Área é obrigatória'),
  quartos: z.number().min(0),
  banheiros: z.number().min(0),
  vagas: z.number().min(0),
  ano_construcao: z.number().optional(),

  // Location
  cep: z.string().min(8, 'CEP é obrigatório'),
  endereco: z.string().min(10, 'Endereço é obrigatório'),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório'),

  // Values
  condominio: z.number().optional(),
  iptu: z.number().optional(),

  // Consent and exclusivity - REQUIRED
  marketing_consent: z.boolean().refine(val => val === true, {
    message: 'Você deve concordar com a divulgação do imóvel'
  }),
  exclusivity_type: z.enum(['exclusive', 'non_exclusive'], {
    required_error: 'Você deve escolher o tipo de representação'
  })
});

type PropertySubmissionData = z.infer<typeof propertySubmissionSchema>;

export default function PropertySubmissionForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [brokerInfo, setBrokerInfo] = useState<any>(null);
  const { uploadImage, isUploading } = usePropertyImageUpload();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [valorDisplay, setValorDisplay] = useState('');

  const form = useForm<PropertySubmissionData>({
    resolver: zodResolver(propertySubmissionSchema),
    defaultValues: {
      marketing_consent: false,
      exclusivity_type: 'non_exclusive',
      quartos: 0,
      banheiros: 0,
      vagas: 0
    }
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Auto-save when photos change
  useEffect(() => {
    if (photos.length > 0 && submission?.id) {
      const currentData = form.getValues();
      saveProgress(currentData);
    }
  }, [photos]);

  // Load submission data on mount
  useEffect(() => {
    if (!token) {
      toast.error('Token inválido');
      navigate('/');
      return;
    }

    loadSubmission();
  }, [token]);

  const loadSubmission = async () => {
    if (!token) return;

    try {
      console.log('🔍 Loading submission with token:', token);
      
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*')
        .eq('submission_token', token)
        .maybeSingle();

      console.log('📊 Submission query result:', { data, error });

      if (error) {
        console.error('❌ Error loading submission:', error);
        toast.error(`Erro ao carregar formulário: ${error.message}`);
        return;
      }

      if (!data) {
        console.error('❌ Submission not found for token:', token);
        toast.error('Formulário não encontrado. Verifique o link.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      console.log('✅ Submission loaded:', data.id);

      if (data.status !== 'pending') {
        setIsSubmitted(true);
        setSubmission(data);
        return;
      }

      setSubmission(data);

      // Load broker information
      if (data.broker_id) {
        const { data: broker } = await supabase
          .from('conectaios_brokers')
          .select('name, creci, phone, avatar_url, bio')
          .eq('id', data.broker_id)
          .single();
        
        if (broker) {
          setBrokerInfo(broker);
        }
      }
      
      // Load saved data if exists
      if (data.property_data && Object.keys(data.property_data).length > 0) {
        const savedData = data.property_data as any;
        form.reset({
          ...savedData,
          marketing_consent: data.marketing_consent,
          exclusivity_type: data.exclusivity_type
        });
        
        // Set formatted valor display
        if (savedData.valor) {
          setValorDisplay(savedData.valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }));
        }
      }

      if (data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (photos.length + files.length > 20) {
      toast.error('Máximo de 20 fotos permitido');
      return;
    }

    console.log('📸 Starting photo upload process for', files.length, 'files');

    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        console.log(`📤 Uploading photo ${index + 1}/${files.length}:`, file.name);
        
        const url = await uploadImage(file, 'property-images', {
          submissionToken: token,
          maxRetries: 3
        });
        
        console.log(`✅ Photo ${index + 1} uploaded successfully:`, url);
        return url;
      } catch (error: any) {
        console.error(`❌ Upload failed for photo ${index + 1}:`, error);
        
        const errorMessage = error.message || 'Erro desconhecido';
        if (errorMessage.includes('permission denied') || errorMessage.includes('row-level security')) {
          toast.error(`Erro de permissão ao enviar ${file.name}. Verifique sua conexão.`);
        } else if (errorMessage.includes('Arquivo muito grande')) {
          toast.error(`${file.name} é muito grande (máx. 10MB)`);
        } else if (errorMessage.includes('Tipo de arquivo')) {
          toast.error(`${file.name} não é um tipo de imagem válido`);
        } else {
          toast.error(`Erro ao enviar ${file.name}: ${errorMessage}`);
        }
        
        return null;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null) as string[];
      
      if (validUrls.length > 0) {
        setPhotos(prev => [...prev, ...validUrls]);
        console.log('✅ All photos processed. Valid uploads:', validUrls.length);
        
        if (validUrls.length < files.length) {
          toast.info(`${validUrls.length} de ${files.length} fotos foram enviadas com sucesso`);
        } else {
          toast.success(`${validUrls.length} fotos enviadas com sucesso!`);
        }
      } else {
        toast.error('Nenhuma foto pôde ser enviada. Verifique sua conexão e tente novamente.');
      }
    } catch (error) {
      console.error('Error in photo upload process:', error);
      toast.error('Erro no processo de upload. Tente novamente.');
    }
  };

  const saveProgress = useCallback(async (data: PropertySubmissionData) => {
    if (!submission?.id) return;

    setIsSaving(true);
    try {
      console.log('💾 Auto-saving progress...', { 
        submissionId: submission.id,
        dataKeys: Object.keys(data),
        photosCount: photos.length 
      });

      const { error } = await supabase
        .from('property_submissions')
        .update({
          owner_name: data.owner_name || '',
          owner_email: data.owner_email || '',
          owner_phone: data.owner_phone || '',
          property_data: data,
          photos,
          marketing_consent: data.marketing_consent,
          exclusivity_type: data.exclusivity_type
        })
        .eq('id', submission.id);

      if (error) {
        console.error('❌ Error saving progress:', error);
      } else {
        console.log('✅ Progress saved successfully');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [submission?.id, photos]);

  // Format currency for Brazilian Real
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    if (!numericValue) return '';
    
    // Convert to number and format
    const numberValue = parseFloat(numericValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Parse currency to number
  const parseCurrency = (value: string): number => {
    const numericValue = value.replace(/\D/g, '');
    return parseFloat(numericValue) / 100;
  };

  // Handle valor input with Brazilian currency format
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValorDisplay(formatted);
    
    const numericValue = parseCurrency(e.target.value);
    form.setValue('valor', numericValue);
  };

  const onSubmit = async (data: PropertySubmissionData) => {
    if (!submission?.id) {
      toast.error('Erro interno. Recarregue a página.');
      return;
    }

    try {
      // Get user's IP address for consent tracking
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { error } = await supabase
        .from('property_submissions')
        .update({
          owner_name: data.owner_name,
          owner_email: data.owner_email,
          owner_phone: data.owner_phone,
          property_data: data,
          photos,
          marketing_consent: data.marketing_consent,
          exclusivity_type: data.exclusivity_type,
          consent_ip_address: ip,
          consent_timestamp: new Date().toISOString(),
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) {
        console.error('Error submitting:', error);
        toast.error('Erro ao enviar dados');
        return;
      }

      setIsSubmitted(true);
      toast.success('Dados enviados com sucesso!');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar dados');
    }
  };

  const nextStep = async () => {
    const currentData = form.getValues();
    await saveProgress(currentData);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = async () => {
    const currentData = form.getValues();
    await saveProgress(currentData);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Dados Enviados!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Seus dados foram enviados com sucesso. O corretor irá analisar as informações e entrar em contato em breve.
            </p>
            <Badge variant="outline" className="text-xs">
              Protocolo: {submission?.submission_token}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <ConectaLogo />
            <div className="text-right">
              <h1 className="text-lg font-semibold">Cadastro de Imóvel</h1>
              <p className="text-sm text-muted-foreground">
                Preencha os dados do seu imóvel
              </p>
            </div>
          </div>
          
          {/* Broker Info - Premium Design */}
          {brokerInfo && (
            <div className="mt-6 relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 shadow-lg">
              {/* Decoração de fundo */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
              
              <div className="relative p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar do Corretor - DESTAQUE */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
                    {brokerInfo.avatar_url ? (
                      <img 
                        src={brokerInfo.avatar_url} 
                        alt={brokerInfo.name}
                        className="relative w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl"
                      />
                    ) : (
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-white shadow-xl">
                        <span className="text-2xl font-bold text-white">
                          {brokerInfo.name?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                    )}
                    {/* Badge de verificação */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Informações do Corretor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {brokerInfo.name}
                          <Badge variant="default" className="text-xs">
                            Verificado
                          </Badge>
                        </h3>
                        {brokerInfo.creci && (
                          <p className="text-sm font-medium text-primary flex items-center gap-1 mt-1">
                            <Shield className="w-3.5 h-3.5" />
                            CRECI: {brokerInfo.creci}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contatos - Cards Compactos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {brokerInfo.phone && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-gray-200 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Telefone</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{brokerInfo.phone}</p>
                          </div>
                        </div>
                      )}
                      {brokerInfo.email && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-gray-200 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-4 h-4 text-secondary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{brokerInfo.email}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bio do Corretor */}
                    {brokerInfo.bio && (
                      <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {brokerInfo.bio}
                        </p>
                      </div>
                    )}

                    {/* Call to Action */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex -space-x-1">
                        <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                          <span className="text-green-600 text-[10px]">✓</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                          <Shield className="w-3 h-3 text-blue-600" />
                        </div>
                      </div>
                      <span>Corretor verificado • Atendimento personalizado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Etapa {currentStep} de {totalSteps}</span>
                <div className="flex items-center gap-2">
                  <span>{Math.round(progress)}% concluído</span>
                  {isSaving && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Save className="w-3 h-3 animate-pulse" />
                      Salvando...
                    </span>
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 1: Owner Data */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Seus Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="owner_name">Nome Completo *</Label>
                  <Input
                    id="owner_name"
                    {...form.register('owner_name')}
                    placeholder="Seu nome completo"
                  />
                  {form.formState.errors.owner_name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.owner_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="owner_email">Email *</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    {...form.register('owner_email')}
                    placeholder="seu@email.com"
                  />
                  {form.formState.errors.owner_email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.owner_email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="owner_phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="owner_phone"
                    {...form.register('owner_phone')}
                    placeholder="(11) 99999-9999"
                  />
                  {form.formState.errors.owner_phone && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.owner_phone.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Basic Property Info */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título do Anúncio *</Label>
                  <Input
                    id="titulo"
                    {...form.register('titulo')}
                    placeholder="Ex: Apartamento 2 quartos com vista mar"
                  />
                  {form.formState.errors.titulo && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.titulo.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição Detalhada *</Label>
                  <Textarea
                    id="descricao"
                    {...form.register('descricao')}
                    rows={4}
                    placeholder="Descreva seu imóvel detalhadamente..."
                  />
                  {form.formState.errors.descricao && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.descricao.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="listing_type">Finalidade *</Label>
                    <select
                      id="listing_type"
                      {...form.register('listing_type')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="venda">Venda</option>
                      <option value="aluguel">Aluguel</option>
                      <option value="temporada">Temporada</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="property_type">Tipo *</Label>
                    <select
                      id="property_type"
                      {...form.register('property_type')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="terreno">Terreno</option>
                      <option value="comercial">Comercial</option>
                      <option value="rural">Rural</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="valor">Valor Desejado *</Label>
                  <Input
                    id="valor"
                    type="text"
                    value={valorDisplay}
                    onChange={handleValorChange}
                    placeholder="R$ 450.000,00"
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite apenas números. Ex: 450000 = R$ 450.000,00
                  </p>
                  {form.formState.errors.valor && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.valor.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Property Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Características
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="area">Área Total (m²) *</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.01"
                      {...form.register('area', { valueAsNumber: true })}
                      placeholder="120"
                    />
                    {form.formState.errors.area && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.area.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ano_construcao">Ano de Construção</Label>
                    <Input
                      id="ano_construcao"
                      type="number"
                      {...form.register('ano_construcao', { valueAsNumber: true })}
                      placeholder="2010"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quartos">Quartos</Label>
                    <Input
                      id="quartos"
                      type="number"
                      min="0"
                      {...form.register('quartos', { valueAsNumber: true })}
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banheiros">Banheiros</Label>
                    <Input
                      id="banheiros"
                      type="number"
                      min="0"
                      {...form.register('banheiros', { valueAsNumber: true })}
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vagas">Vagas Garagem</Label>
                    <Input
                      id="vagas"
                      type="number"
                      min="0"
                      {...form.register('vagas', { valueAsNumber: true })}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condominio">Condomínio (R$/mês)</Label>
                    <Input
                      id="condominio"
                      type="number"
                      step="0.01"
                      {...form.register('condominio', { valueAsNumber: true })}
                      placeholder="350"
                    />
                  </div>

                  <div>
                    <Label htmlFor="iptu">IPTU (R$/ano)</Label>
                    <Input
                      id="iptu"
                      type="number"
                      step="0.01"
                      {...form.register('iptu', { valueAsNumber: true })}
                      placeholder="1200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Location */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    {...form.register('cep')}
                    placeholder="12345-678"
                  />
                  {form.formState.errors.cep && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.cep.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input
                    id="endereco"
                    {...form.register('endereco')}
                    placeholder="Rua das Flores, 123"
                  />
                  {form.formState.errors.endereco && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.endereco.message}  
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      {...form.register('bairro')}
                      placeholder="Centro"
                    />
                    {form.formState.errors.bairro && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.bairro.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      {...form.register('cidade')}
                      placeholder="São Paulo"
                    />
                    {form.formState.errors.cidade && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.cidade.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    {...form.register('estado')}
                    placeholder="SP"
                  />
                  {form.formState.errors.estado && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.estado.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Photos and Consent */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Fotos do Imóvel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center relative">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {isUploading ? 'Enviando fotos...' : 'Clique para selecionar fotos ou arraste aqui'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Máximo 20 fotos • JPG, PNG, WebP até 10MB cada
                      </p>
                      {isUploading && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm text-primary">Processando imagens...</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                  </div>

                  {photos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {photos.length} foto{photos.length !== 1 ? 's' : ''} adicionada{photos.length !== 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border"
                              onError={(e) => {
                                console.error('Error loading image:', photo);
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                            <div className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded px-1">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Consent and Exclusivity */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <Shield className="w-5 h-5" />
                    Termos e Condições
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Marketing Consent */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="marketing_consent"
                        checked={form.watch('marketing_consent')}
                        onCheckedChange={(checked) => 
                          form.setValue('marketing_consent', checked as boolean)
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="marketing_consent" className="text-sm font-medium leading-relaxed">
                          Concordo com a divulgação do meu imóvel *
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Autorizo a divulgação das informações e fotos do imóvel em portais, 
                          redes sociais e materiais de marketing do corretor. Os dados serão 
                          tratados conforme a LGPD e você pode revogar esta autorização a qualquer momento.
                        </p>
                      </div>
                    </div>
                    {form.formState.errors.marketing_consent && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {form.formState.errors.marketing_consent.message}
                      </p>
                    )}
                  </div>

                  {/* Exclusivity Type */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">
                      Tipo de Representação *
                    </Label>
                    
                    <RadioGroup
                      value={form.watch('exclusivity_type')}
                      onValueChange={(value) => 
                        form.setValue('exclusivity_type', value as 'exclusive' | 'non_exclusive')
                      }
                      className="space-y-4"
                    >
                      <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="exclusive" id="exclusive" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="exclusive" className="font-medium text-green-700">
                            🏆 Representação Exclusiva
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Apenas este corretor poderá comercializar o imóvel. 
                            Maior dedicação e estratégias personalizadas de venda.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="non_exclusive" id="non_exclusive" className="mt-1" />
                        <div className="space-y-1">
                          <Label htmlFor="non_exclusive" className="font-medium text-blue-700">
                            🤝 Representação Não-Exclusiva
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Você pode trabalhar com outros corretores simultaneamente. 
                            Maior flexibilidade na escolha de profissionais.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>

                    {form.formState.errors.exclusivity_type && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {form.formState.errors.exclusivity_type.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Próximo
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={!form.watch('marketing_consent') || !form.watch('exclusivity_type')}
                className="bg-green-600 hover:bg-green-700"
              >
                Enviar Dados
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}