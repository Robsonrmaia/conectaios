import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  FileText, 
  Image, 
  QrCode, 
  Share2, 
  Download,
  Wrench,
  ExternalLink
} from 'lucide-react';

export default function Ferramentas() {
  const tools = [
    {
      id: 1,
      title: 'Calculadora de Financiamento',
      description: 'Simule financiamentos imobiliários com diferentes bancos',
      icon: Calculator,
      category: 'Simuladores',
      available: true
    },
    {
      id: 2,
      title: 'Gerador de Contratos',
      description: 'Crie contratos personalizados para seus clientes',
      icon: FileText,
      category: 'Documentos',
      available: true
    },
    {
      id: 3,
      title: 'Blog',
      description: 'Publique artigos e conteúdo para seus clientes',
      icon: FileText,
      category: 'Marketing',
      available: true
    },
    {
      id: 4,
      title: 'Guia de Bairros',
      description: 'Informações completas sobre bairros da região',
      icon: QrCode,
      category: 'Relatórios',
      available: true
    },
    {
      id: 5,
      title: 'Avaliação de Imóveis',
      description: 'Ferramenta de avaliação automática de imóveis',
      icon: Calculator,
      category: 'Simuladores',
      available: true
    },
    {
      id: 6,
      title: 'Gerador de Orçamento Temporada',
      description: 'Calcule preços para locação de temporada',
      icon: Calculator,
      category: 'Simuladores',
      available: true
    },
    {
      id: 7,
      title: 'Avaliação Entrada/Saída Locação',
      description: 'Gere relatórios de vistoria para locação',
      icon: FileText,
      category: 'Documentos',
      available: true
    },
    {
      id: 8,
      title: 'Simulador de Empreendimentos',
      description: 'Simule valores e viabilidade de empreendimentos',
      icon: Calculator,
      category: 'Simuladores',
      available: true
    },
    {
      id: 9,
      title: 'Guia de Regularização Documental',
      description: 'Orientações para regularização de documentos',
      icon: FileText,
      category: 'Documentos',
      available: true
    },
    {
      id: 10,
      title: 'Portal de Envios WhatsApp',
      description: 'Envie materiais automaticamente via WhatsApp',
      icon: Share2,
      category: 'Marketing',
      available: true
    },
    {
      id: 11,
      title: 'Guia do Comprador',
      description: 'Material educativo completo para compradores',
      icon: Download,
      category: 'Relatórios',
      available: true
    },
    {
      id: 12,
      title: 'Editor de Imagens',
      description: 'Edite e otimize fotos dos seus imóveis',
      icon: Image,
      category: 'Marketing',
      available: false
    }
  ];

  const categories = ['Todos', 'Simuladores', 'Documentos', 'Marketing', 'Relatórios'];

  const ToolCard = ({ tool }: { tool: any }) => {
    const IconComponent = tool.icon;

    return (
      <Card className={`hover:shadow-md transition-all ${!tool.available ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.category}</CardDescription>
              </div>
            </div>
            {!tool.available && (
              <div className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-md">
                Em breve
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {tool.description}
          </p>
          
          <Button 
            className="w-full" 
            disabled={!tool.available}
            variant={tool.available ? "default" : "secondary"}
          >
            {tool.available ? (
              <>
                Usar Ferramenta
                <ExternalLink className="h-4 w-4 ml-2" />
              </>
            ) : (
              'Em Desenvolvimento'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Ferramentas
          </h1>
          <p className="text-muted-foreground">
            Utilize nossas ferramentas para otimizar seu trabalho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {tools.filter(t => t.available).length} de {tools.length} disponíveis
          </span>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button key={category} variant="outline" size="sm">
            {category}
          </Button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Coming Soon Section */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wrench className="h-5 w-5" />
            Mais Ferramentas em Breve
          </CardTitle>
          <CardDescription>
            Estamos constantemente desenvolvendo novas ferramentas para facilitar seu trabalho
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline">
            Sugerir Ferramenta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}