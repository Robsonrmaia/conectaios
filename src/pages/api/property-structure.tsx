import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, FileText, Code, Database, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export default function PropertyStructurePage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast({
      title: "Copiado!",
      description: `${section} copiado para a área de transferência`,
    });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const propertyStructure = {
    id: "string",
    titulo: "string (obrigatório)",
    valor: "number (obrigatório)",
    area: "number (m²)",
    quartos: "number",
    bathrooms: "number",
    parking_spots: "number",
    furnishing_type: "string ('none' | 'furnished' | 'semi_furnished')",
    sea_distance: "number (metros)",
    has_sea_view: "boolean",
    listing_type: "string ('venda' | 'aluguel' | 'temporada')",
    property_type: "string ('apartamento' | 'casa' | 'comercial' | 'cobertura')",
    fotos: "string[] (URLs das imagens)",
    neighborhood: "string",
    descricao: "string",
    user_id: "string (ID do usuário/corretor)"
  };

  const examplePayload = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    titulo: "Apartamento Luxuoso no Centro",
    valor: 850000,
    area: 120.5,
    quartos: 3,
    bathrooms: 2,
    parking_spots: 2,
    furnishing_type: "furnished",
    sea_distance: 500,
    has_sea_view: true,
    listing_type: "venda",
    property_type: "apartamento",
    fotos: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687644-aac4c75853c2?w=800&h=600&fit=crop&q=80"
    ],
    neighborhood: "Centro",
    descricao: "Magnifico apartamento de alto padrão localizado no coração da cidade.",
    user_id: "940c862e-a540-45dc-92af-6ca567fd2699"
  };

  const integrationCode = `
// Método 1: LocalStorage (Recomendado)
const propertyData = ${JSON.stringify(examplePayload, null, 2)};

// Salvar dados
localStorage.setItem('propertyFormData', JSON.stringify(propertyData));

// Redirecionar para admin
window.location.href = '/admin';

// Método 2: PostMessage (Para iframes)
window.parent.postMessage({
  type: 'FILL_PROPERTY_FORM',
  data: propertyData
}, '*');

// Método 3: URL Parameters (Dados pequenos)
const params = new URLSearchParams({
  titulo: propertyData.titulo,
  valor: propertyData.valor.toString(),
  // ... outros campos
});
window.location.href = '/admin?' + params.toString();
  `.trim();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Estrutura da API - Imóveis
        </h1>
        <p className="text-muted-foreground text-lg">
          Documentação completa para integração com o sistema de apresentação de imóveis
        </p>
      </div>

      <div className="grid gap-6">
        {/* Links principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Links de Integração
            </CardTitle>
            <CardDescription>
              URLs para acessar o painel administrativo e preview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-medium">Painel Administrativo:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {window.location.origin}/admin
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/admin`, 'Link Admin')}
                  >
                    {copiedSection === 'Link Admin' ? '✓' : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-medium">Preview da Apresentação:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {window.location.origin}/
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/`, 'Link Preview')}
                  >
                    {copiedSection === 'Link Preview' ? '✓' : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estrutura JSON */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estrutura dos Dados
            </CardTitle>
            <CardDescription>
              Campos esperados pelo sistema (todos opcionais exceto os marcados)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(propertyStructure).map(([key, type]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span className="font-mono text-sm">{key}:</span>
                    <Badge variant={key === 'titulo' || key === 'valor' ? 'default' : 'secondary'}>
                      {type}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(propertyStructure, null, 2), 'Estrutura')}
                >
                  {copiedSection === 'Estrutura' ? '✓' : <Copy className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-blue-800">Copiar estrutura JSON</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de payload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Exemplo de Payload
            </CardTitle>
            <CardDescription>
              Exemplo completo de dados para enviar ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  <code>{JSON.stringify(examplePayload, null, 2)}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(JSON.stringify(examplePayload, null, 2), 'Exemplo')}
                >
                  {copiedSection === 'Exemplo' ? '✓' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Código de integração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Código de Integração
            </CardTitle>
            <CardDescription>
              Exemplos de como enviar os dados para o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  <code>{integrationCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(integrationCode, 'Código')}
                >
                  {copiedSection === 'Código' ? '✓' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções de uso */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">1. Preparar os dados</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Organize os dados do imóvel seguindo a estrutura JSON fornecida acima.
                </p>
                
                <h4 className="font-semibold mb-2">2. Enviar para o sistema</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use um dos métodos de integração (localStorage, postMessage ou URL params).
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">3. Verificar resultado</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Acesse o painel admin para ver os dados preenchidos ou visualize o preview final.
                </p>
                
                <h4 className="font-semibold mb-2">4. Campos obrigatórios</h4>
                <p className="text-sm text-muted-foreground">
                  Apenas <code>titulo</code> e <code>valor</code> são obrigatórios. Campos vazios são ignorados automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações rápidas */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.open('/admin', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Admin
          </Button>
          <Button variant="outline" onClick={() => window.open('/', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Preview
          </Button>
        </div>
      </div>
    </div>
  );
}