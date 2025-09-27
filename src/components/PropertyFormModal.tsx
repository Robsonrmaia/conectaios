import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, MessageSquare, FormInput, Images, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { EnvioFlash } from '@/components/EnvioFlash';
import { AIPropertyDescription } from '@/components/AIPropertyDescription';
import { PhotoUploader } from '@/components/PhotoUploader';
import { EnhancedWatermarkManager } from '@/components/EnhancedWatermarkManager';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PropertyFormModal({ isOpen, onClose, onSuccess }: PropertyFormModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    purpose: '',
    type: '',
    price: '',
    condo_fee: '',
    iptu: '',
    area_total: '',
    area_built: '',
    bedrooms: '',
    bathrooms: '',
    suites: '',
    parking: '',
    is_furnished: false,
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkedImages, setWatermarkedImages] = useState<{original: string; watermarked: string}[]>([]);
  const [showAIDescription, setShowAIDescription] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !formData.title || !formData.purpose) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const { data: propertyData, error } = await supabase
        .from('imoveis')
        .insert({
          title: formData.title,
          description: formData.description || null,
          purpose: formData.purpose,
          type: formData.type || 'house',
          price: formData.price ? parseFloat(formData.price.replace(/[^\d,]/g, '').replace(',', '.')) : null,
          condo_fee: formData.condo_fee ? parseFloat(formData.condo_fee.replace(/[^\d,]/g, '').replace(',', '.')) : null,
          iptu: formData.iptu ? parseFloat(formData.iptu.replace(/[^\d,]/g, '').replace(',', '.')) : null,
          area_total: formData.area_total ? parseFloat(formData.area_total) : null,
          area_built: formData.area_built ? parseFloat(formData.area_built) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          suites: formData.suites ? parseInt(formData.suites) : null,
          parking: formData.parking ? parseInt(formData.parking) : null,
          is_furnished: formData.is_furnished,
          street: formData.street || null,
          number: formData.number || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
          zipcode: formData.zipcode || null,
          owner_id: user.id,
          status: 'available',
          visibility: 'private',
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      const newPropertyId = propertyData.id;
      setPropertyId(newPropertyId);

      // Upload images if any
      if (photos.length > 0) {
        const imagesToUpload = watermarkEnabled && watermarkedImages.length > 0 
          ? watermarkedImages.map(img => img.watermarked)
          : photos;

        for (let i = 0; i < imagesToUpload.length; i++) {
          const imageUrl = imagesToUpload[i];
          
          try {
            const { error: imageError } = await supabase
              .from('imovel_images')
              .insert({
                imovel_id: newPropertyId,
                url: imageUrl,
                position: i,
                is_cover: i === 0
              });

            if (imageError) {
              console.error('Erro ao salvar imagem:', imageError);
            }
          } catch (imgError) {
            console.error('Erro no upload da imagem:', imgError);
          }
        }
      }

      toast.success('Imóvel adicionado com sucesso!');
      onSuccess();
      onClose();
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Erro ao adicionar imóvel:', error);
      toast.error('Erro ao adicionar imóvel');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      purpose: '',
      type: '',
      price: '',
      condo_fee: '',
      iptu: '',
      area_total: '',
      area_built: '',
      bedrooms: '',
      bathrooms: '',
      suites: '',
      parking: '',
      is_furnished: false,
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipcode: ''
    });
    setPhotos([]);
    setWatermarkedImages([]);
    setWatermarkEnabled(false);
    setShowAIDescription(false);
    setPropertyId(null);
  };

  const handleFlashSuccess = (data: any) => {
    // Preencher formulário com dados do EnvioFlash
    setFormData(prev => ({
      ...prev,
      title: data.titulo || prev.title,
      description: data.descricao || prev.description,
      purpose: data.finalidade || prev.purpose,
      type: data.tipo || prev.type,
      price: data.preco || prev.price,
      condo_fee: data.condominio || prev.condo_fee,
      iptu: data.iptu || prev.iptu,
      area_total: data.area || prev.area_total,
      area_built: data.area_construida || prev.area_built,
      bedrooms: data.quartos || prev.bedrooms,
      bathrooms: data.banheiros || prev.bathrooms,
      suites: data.suites || prev.suites,
      parking: data.vagas || prev.parking,
      is_furnished: data.mobiliado || prev.is_furnished,
      street: data.endereco || prev.street,
      neighborhood: data.bairro || prev.neighborhood,
      city: data.cidade || prev.city,
      state: data.estado || prev.state,
      zipcode: data.cep || prev.zipcode
    }));
    setActiveTab('manual');
    toast.success('Dados preenchidos! Revise e confirme.');
  };

  const handleAIDescriptionGenerated = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
    setShowAIDescription(false);
    toast.success('Descrição IA aplicada com sucesso!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Imóvel</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="flash" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Por Foto
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Apartamento 3 quartos em Copacabana"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Finalidade *</Label>
                <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Venda</SelectItem>
                    <SelectItem value="rent">Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condo_fee">Condomínio</Label>
                <Input
                  id="condo_fee"
                  value={formData.condo_fee}
                  onChange={(e) => handleInputChange('condo_fee', e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iptu">IPTU</Label>
                <Input
                  id="iptu"
                  value={formData.iptu}
                  onChange={(e) => handleInputChange('iptu', e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_total">Área Total (m²)</Label>
                <Input
                  id="area_total"
                  type="number"
                  value={formData.area_total}
                  onChange={(e) => handleInputChange('area_total', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_built">Área Construída (m²)</Label>
                <Input
                  id="area_built"
                  type="number"
                  value={formData.area_built}
                  onChange={(e) => handleInputChange('area_built', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Quartos</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Banheiros</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suites">Suítes</Label>
                <Input
                  id="suites"
                  type="number"
                  value={formData.suites}
                  onChange={(e) => handleInputChange('suites', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parking">Vagas</Label>
                <Input
                  id="parking"
                  type="number"
                  value={formData.parking}
                  onChange={(e) => handleInputChange('parking', e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_furnished"
                    checked={formData.is_furnished}
                    onChange={(e) => handleInputChange('is_furnished', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_furnished">Mobiliado</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descrição</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIDescription(true)}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva as características do imóvel..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipcode">CEP</Label>
                <Input
                  id="zipcode"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Adicionar Imóvel'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="flash" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <EnvioFlash onDataExtracted={handleFlashSuccess} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <PhotoUploader
                  photos={photos}
                  onPhotosChange={setPhotos}
                  watermarkEnabled={watermarkEnabled}
                  onWatermarkEnabledChange={setWatermarkEnabled}
                  watermarkText="ConectaIOS"
                />
                {watermarkEnabled && photos.length > 0 && (
                  <div className="mt-4">
                    <EnhancedWatermarkManager
                      images={photos}
                      onWatermarkedImages={setWatermarkedImages}
                      defaultWatermarkText="ConectaIOS"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Envio por WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">
                      Cole aqui o texto recebido via WhatsApp com informações do imóvel
                    </p>
                  </div>
                  <Textarea
                    placeholder="Cole o texto do WhatsApp aqui..."
                    rows={6}
                    className="w-full"
                  />
                  <Button className="w-full">
                    Processar Texto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Description Modal */}
        {showAIDescription && (
          <AIPropertyDescription
            property={{
              id: propertyId || '',
              title: formData.title,
              description: formData.description,
              purpose: formData.purpose,
              type: formData.type,
              price: formData.price ? parseFloat(formData.price.replace(/[^\d,]/g, '').replace(',', '.')) : null,
              area_total: formData.area_total ? parseFloat(formData.area_total) : null,
              bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
              bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
              parking: formData.parking ? parseInt(formData.parking) : null,
              street: formData.street,
              neighborhood: formData.neighborhood,
              city: formData.city,
              visibility: 'private',
              is_public: false,
              created_at: new Date().toISOString()
            } as any}
            targetAudience="brokers"
            onDescriptionGenerated={handleAIDescriptionGenerated}
            onClose={() => setShowAIDescription(false)}
            initialDescription={formData.description}
            autoSaveToDatabase={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}