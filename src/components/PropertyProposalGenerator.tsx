import { useState } from 'react';
import { Save, Download, Eye, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

interface PropertyData {
  propertyId: string;
  title: string;
  valor: number;
  area: number;
  quartos: number;
  bathrooms?: number;
  parking?: number;
  tipo?: string;
  finalidade?: string;
  bairro?: string;
  descricao?: string;
  fotos?: string[];
  has_sea_view?: boolean;
  furnishing_type?: string;
  sea_distance?: number | string;
  ownerUserId?: string;
}

interface PropertyProposalGeneratorProps {
  property: PropertyData;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyProposalGenerator({ property, isOpen, onClose }: PropertyProposalGeneratorProps) {
  const [formData, setFormData] = useState({
    tituloPrincipal: property.title || '',
    subtitulo: property.bairro || '',
    preco: formatCurrency(property.valor || 0),
    status: 'Disponível',
    categoria: property.tipo?.toUpperCase() || 'EXCLUSIVO',
    descricao: property.descricao || `Esta magnífica residência combina elegância contemporânea com funcionalidade excepcional. Localizada em uma das áreas mais valorizadas, oferece privacidade e sofisticação em cada detalhe.`
  });

  const [activeTab, setActiveTab] = useState('basicos');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Dados salvos",
      description: "Os dados da apresentação foram salvos com sucesso!",
    });
  };

  const handleExport = () => {
    const htmlContent = generateHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposta-${property.propertyId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Proposta exportada",
      description: "O arquivo HTML foi baixado com sucesso!",
    });
  };

  const handleVisualize = () => {
    const htmlContent = generateHTML();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const generateHTML = () => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formData.tituloPrincipal}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 2.5em; color: #2c3e50; margin-bottom: 10px; }
        .subtitle { font-size: 1.2em; color: #7f8c8d; margin-bottom: 20px; }
        .price { font-size: 2em; color: #27ae60; font-weight: bold; }
        .status { display: inline-block; padding: 5px 15px; background: #27ae60; color: white; border-radius: 20px; font-size: 0.9em; }
        .category { background: #3498db; color: white; padding: 5px 15px; border-radius: 5px; margin: 10px 0; display: inline-block; }
        .description { margin: 30px 0; font-size: 1.1em; line-height: 1.8; text-align: justify; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; }
        .feature-number { font-size: 2em; color: #3498db; font-weight: bold; }
        .feature-label { color: #7f8c8d; margin-top: 5px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 30px 0; }
        .gallery img { width: 100%; height: 200px; object-fit: cover; border-radius: 10px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${formData.tituloPrincipal}</h1>
            <p class="subtitle">${formData.subtitulo}</p>
            <div class="price">${formData.preco}</div>
            <div class="status">${formData.status}</div>
            <div class="category">${formData.categoria}</div>
        </div>
        
        <div class="description">
            ${formData.descricao}
        </div>
        
        <div class="features">
            ${property.quartos ? `<div class="feature"><div class="feature-number">${property.quartos}</div><div class="feature-label">Quartos</div></div>` : ''}
            ${property.bathrooms ? `<div class="feature"><div class="feature-number">${property.bathrooms}</div><div class="feature-label">Banheiros</div></div>` : ''}
            ${property.area ? `<div class="feature"><div class="feature-number">${property.area}m²</div><div class="feature-label">Área</div></div>` : ''}
            ${property.parking ? `<div class="feature"><div class="feature-number">${property.parking}</div><div class="feature-label">Vagas</div></div>` : ''}
        </div>
        
        ${property.fotos && property.fotos.length > 0 ? `
        <div class="gallery">
            ${property.fotos.slice(0, 6).map(foto => `<img src="${foto}" alt="Foto do imóvel" />`).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Painel de Administração</CardTitle>
              <CardDescription>Configure os dados do imóvel que serão exibidos na apresentação</CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Upload className="h-4 w-4 mr-2" />
              Carregar
            </Button>
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleVisualize} className="bg-purple-600 hover:bg-purple-700">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basicos">
                <FileText className="h-4 w-4 mr-1" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="especificacoes">Especificações</TabsTrigger>
              <TabsTrigger value="localizacao">Localização</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="imagens">Imagens</TabsTrigger>
              <TabsTrigger value="caracteristicas">Características</TabsTrigger>
            </TabsList>

            <TabsContent value="basicos" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título Principal</Label>
                  <Input
                    id="titulo"
                    value={formData.tituloPrincipal}
                    onChange={(e) => handleInputChange('tituloPrincipal', e.target.value)}
                    placeholder="Residência de Luxo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subtitulo">Subtítulo/Localização</Label>
                  <Input
                    id="subtitulo"
                    value={formData.subtitulo}
                    onChange={(e) => handleInputChange('subtitulo', e.target.value)}
                    placeholder="Vila Madalena"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço</Label>
                  <Input
                    id="preco"
                    value={formData.preco}
                    onChange={(e) => handleInputChange('preco', e.target.value)}
                    placeholder="R$ 2.850.000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponível">Disponível</SelectItem>
                      <SelectItem value="Vendido">Vendido</SelectItem>
                      <SelectItem value="Reservado">Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  placeholder="EXCLUSIVO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição detalhada do imóvel..."
                  rows={6}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.descricao.length}/500 caracteres
                </p>
              </div>
            </TabsContent>

            <TabsContent value="especificacoes" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{property.quartos || 0}</div>
                  <div className="text-sm text-muted-foreground">Quartos</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{property.bathrooms || 0}</div>
                  <div className="text-sm text-muted-foreground">Banheiros</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{property.area || 0}m²</div>
                  <div className="text-sm text-muted-foreground">Área</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{property.parking || 0}</div>
                  <div className="text-sm text-muted-foreground">Vagas</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="localizacao" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>Localização: {property.bairro}</p>
                <p>Tipo: {property.tipo}</p>
                <p>Finalidade: {property.finalidade}</p>
              </div>
            </TabsContent>

            <TabsContent value="contato" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                Informações de contato do corretor
              </div>
            </TabsContent>

            <TabsContent value="imagens" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.fotos && property.fotos.length > 0 ? (
                  property.fotos.slice(0, 6).map((foto, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={foto} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Nenhuma imagem disponível
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="caracteristicas" className="mt-6">
              <div className="space-y-4">
                {property.has_sea_view && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Vista para o mar</span>
                  </div>
                )}
                {property.furnishing_type && property.furnishing_type !== 'none' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Mobiliado: {property.furnishing_type}</span>
                  </div>
                )}
                {property.sea_distance && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <span>Distância do mar: {property.sea_distance}m</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}