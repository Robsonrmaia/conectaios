import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Play, Clock, Eye, Search, Filter, Upload } from 'lucide-react';

export default function Videos() {
  const [searchTerm, setSearchTerm] = useState('');

  const videos = [
    {
      id: 1,
      title: 'Como Fazer uma Boa Apresentação de Imóvel',
      description: 'Aprenda as melhores técnicas para apresentar imóveis aos seus clientes',
      thumbnail: '/placeholder.svg',
      duration: '12:30',
      views: 1250,
      category: 'Vendas',
      date: '2024-01-20',
      url: '#'
    },
    {
      id: 2,
      title: 'Negociação Imobiliária: Técnicas Avançadas',
      description: 'Domine as técnicas de negociação para fechar mais vendas',
      thumbnail: '/placeholder.svg',
      duration: '18:45',
      views: 980,
      category: 'Negociação',
      date: '2024-01-18',
      url: '#'
    },
    {
      id: 3,
      title: 'Marketing Digital para Corretores',
      description: 'Como usar as redes sociais para atrair mais clientes',
      thumbnail: '/placeholder.svg',
      duration: '25:12',
      views: 2100,
      category: 'Marketing',
      date: '2024-01-15',
      url: '#'
    },
    {
      id: 4,
      title: 'CRM: Organizando seu Funil de Vendas',
      description: 'Aprenda a usar nosso CRM para organizar seus leads',
      thumbnail: '/placeholder.svg',
      duration: '15:20',
      views: 750,
      category: 'Treinamento',
      date: '2024-01-12',
      url: '#'
    },
    {
      id: 5,
      title: 'Tour Virtual: Criando Experiências Imersivas',
      description: 'Como criar tours virtuais que vendem',
      thumbnail: '/placeholder.svg',
      duration: '20:30',
      views: 1500,
      category: 'Tecnologia',
      date: '2024-01-10',
      url: '#'
    },
    {
      id: 6,
      title: 'Captação de Imóveis: Estratégias Eficazes',
      description: 'Métodos comprovados para captar mais imóveis',
      thumbnail: '/placeholder.svg',
      duration: '22:15',
      views: 1800,
      category: 'Captação',
      date: '2024-01-08',
      url: '#'
    }
  ];

  const categories = ['Todos', 'Vendas', 'Negociação', 'Marketing', 'Treinamento', 'Tecnologia', 'Captação'];

  const filterVideos = (category?: string) => {
    let filtered = videos;
    if (category && category !== 'Todos') {
      filtered = filtered.filter(video => video.category === category);
    }
    if (searchTerm) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const VideoCard = ({ video }: { video: any }) => {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-video bg-muted">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button size="lg" className="rounded-full">
              <Play className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
            {video.duration}
          </div>
        </div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{video.title}</CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {video.category}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            {video.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {video.views.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(video.date).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Vídeos de Treinamento
          </h1>
          <p className="text-muted-foreground">
            Aprimore suas habilidades com nossos vídeos educativos
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90">
          <Upload className="h-4 w-4 mr-2" />
          Sugerir Tópico
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{videos.length}</div>
                <div className="text-sm text-muted-foreground">Vídeos Disponíveis</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {Math.floor(videos.reduce((total, video) => {
                const [min, sec] = video.duration.split(':').map(Number);
                return total + min + sec / 60;
              }, 0))}h
            </div>
            <div className="text-sm text-muted-foreground">Horas de Conteúdo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {videos.reduce((total, video) => total + video.views, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Visualizações Totais</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Videos Tabs */}
      <Tabs defaultValue="Todos" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category} ({category === 'Todos' ? videos.length : filterVideos(category).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterVideos(category).map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}