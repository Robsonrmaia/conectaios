import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyImageUpload } from '@/hooks/usePropertyImageUpload';
import { Loader2, Upload, X, Home, MapPin, Camera, DollarSign } from 'lucide-react';

const propertySchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  type: z.string().min(1, 'Selecione o tipo do imóvel'),
  purpose: z.string().min(1, 'Selecione a finalidade'),
  price: z.string().min(1, 'Preço é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  street: z.string().optional(),
  number: z.string().optional(),
  zipcode: z.string().optional(),
  state: z.string().min(2, 'Estado é obrigatório'),
  bedrooms: z.string().transform(val => parseInt(val) || 0),
  bathrooms: z.string().transform(val => parseInt(val) || 0),
  suites: z.string().transform(val => parseInt(val) || 0),
  parking: z.string().transform(val => parseInt(val) || 0),
  area_total: z.string().optional(),
  area_built: z.string().optional(),
  condo_fee: z.string().optional(),
  iptu: z.string().optional(),
  is_furnished: z.boolean().default(false),
  vista_mar: z.boolean().default(false),
  distancia_mar: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PropertyForm({ open, onOpenChange, onSuccess }: PropertyFormProps) {
  const { user } = useAuth();
  const { uploadImage, isUploading } = usePropertyImageUpload();
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: '',
      purpose: '',
      is_furnished: false,
      vista_mar: false,
      bedrooms: 0,
      bathrooms: 0,
      suites: 0,
      parking: 0,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file, 'imoveis');
      setImages(prev => [...prev, imageUrl]);
      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Convert string values to proper types
      const propertyData = {
        title: data.title,
        description: data.description,
        type: data.type,
        purpose: data.purpose,
        price: parseFloat(data.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        city: data.city,
        neighborhood: data.neighborhood,
        street: data.street || null,
        number: data.number || null,
        zipcode: data.zipcode || null,
        state: data.state,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        suites: data.suites,
        parking: data.parking,
        area_total: data.area_total ? parseFloat(data.area_total) : null,
        area_built: data.area_built ? parseFloat(data.area_built) : null,
        condo_fee: data.condo_fee ? parseFloat(data.condo_fee.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
        iptu: data.iptu ? parseFloat(data.iptu.replace(/[^\d.,]/g, '').replace(',', '.')) : null,
        is_furnished: data.is_furnished,
        vista_mar: data.vista_mar,
        distancia_mar: data.distancia_mar ? parseFloat(data.distancia_mar) : null,
        owner_id: user.id,
        status: 'available' as const,
        visibility: 'private' as const,
        is_public: false,
      };

      // Insert property
      const { data: property, error: propertyError } = await supabase
        .from('imoveis')
        .insert([propertyData])
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Insert images
      if (images.length > 0) {
        const imageData = images.map((url, index) => ({
          imovel_id: property.id,
          url,
          position: index,
          is_cover: index === 0, // First image is cover
        }));

        const { error: imageError } = await supabase
          .from('imovel_images')
          .insert(imageData);

        if (imageError) throw imageError;
      }

      toast.success('Imóvel criado com sucesso!');
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      form.reset();
      setImages([]);
      setCurrentStep(1);
    } catch (error: any) {
      console.error('Error creating property:', error);
      toast.error('Erro ao criar imóvel: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const steps = [
    { number: 1, title: 'Dados Básicos', icon: Home },
    { number: 2, title: 'Localização', icon: MapPin },
    { number: 3, title: 'Detalhes', icon: DollarSign },
    { number: 4, title: 'Fotos', icon: Camera },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Imóvel *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ex: Apartamento 2 quartos com vista para o mar"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva as principais características do imóvel..."
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo do Imóvel *</Label>
                <Select onValueChange={(value) => setValue('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="condo">Condomínio</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="land">Terreno</SelectItem>
                    <SelectItem value="farm">Chácara/Sítio</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>}
              </div>

              <div>
                <Label htmlFor="purpose">Finalidade *</Label>
                <Select onValueChange={(value) => setValue('purpose', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Venda</SelectItem>
                    <SelectItem value="rent">Aluguel</SelectItem>
                    <SelectItem value="both">Venda/Aluguel</SelectItem>
                  </SelectContent>
                </Select>
                {errors.purpose && <p className="text-sm text-red-500 mt-1">{errors.purpose.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="price">Preço *</Label>
              <Input
                id="price"
                {...register('price')}
                placeholder="Ex: 350.000"
                type="text"
              />
              {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Ex: Florianópolis"
                />
                {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="Ex: SC"
                />
                {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                {...register('neighborhood')}
                placeholder="Ex: Centro"
              />
              {errors.neighborhood && <p className="text-sm text-red-500 mt-1">{errors.neighborhood.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="Ex: Rua das Flores"
                />
              </div>

              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  {...register('number')}
                  placeholder="Ex: 123"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zipcode">CEP</Label>
              <Input
                id="zipcode"
                {...register('zipcode')}
                placeholder="Ex: 88000-000"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bedrooms">Quartos</Label>
                <Input
                  id="bedrooms"
                  {...register('bedrooms')}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Banheiros</Label>
                <Input
                  id="bathrooms"
                  {...register('bathrooms')}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="suites">Suítes</Label>
                <Input
                  id="suites"
                  {...register('suites')}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="parking">Vagas</Label>
                <Input
                  id="parking"
                  {...register('parking')}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area_total">Área Total (m²)</Label>
                <Input
                  id="area_total"
                  {...register('area_total')}
                  type="number"
                  placeholder="Ex: 150"
                />
              </div>

              <div>
                <Label htmlFor="area_built">Área Construída (m²)</Label>
                <Input
                  id="area_built"
                  {...register('area_built')}
                  type="number"
                  placeholder="Ex: 120"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condo_fee">Condomínio (R$)</Label>
                <Input
                  id="condo_fee"
                  {...register('condo_fee')}
                  placeholder="Ex: 300"
                />
              </div>

              <div>
                <Label htmlFor="iptu">IPTU (R$)</Label>
                <Input
                  id="iptu"
                  {...register('iptu')}
                  placeholder="Ex: 150"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_furnished"
                  checked={watch('is_furnished')}
                  onCheckedChange={(checked) => setValue('is_furnished', !!checked)}
                />
                <Label htmlFor="is_furnished">Imóvel mobiliado</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vista_mar"
                  checked={watch('vista_mar')}
                  onCheckedChange={(checked) => setValue('vista_mar', !!checked)}
                />
                <Label htmlFor="vista_mar">Vista para o mar</Label>
              </div>

              {watch('vista_mar') && (
                <div>
                  <Label htmlFor="distancia_mar">Distância do mar (metros)</Label>
                  <Input
                    id="distancia_mar"
                    {...register('distancia_mar')}
                    type="number"
                    placeholder="Ex: 100"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>Fotos do Imóvel</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-500">
                    {isUploading ? 'Enviando...' : 'Clique para adicionar fotos'}
                  </span>
                  <span className="text-xs text-gray-400">
                    JPG, PNG ou WebP até 10MB
                  </span>
                </label>
              </div>
            </div>

            {images.length > 0 && (
              <div>
                <Label>Fotos Adicionadas ({images.length})</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          Capa
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Adicionar Novo Imóvel
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {currentStep > step.number ? (
                  '✓'
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`ml-2 text-sm ${
                  currentStep >= step.number ? 'text-primary font-medium' : 'text-gray-400'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {steps[currentStep - 1]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Próximo
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Imóvel'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}