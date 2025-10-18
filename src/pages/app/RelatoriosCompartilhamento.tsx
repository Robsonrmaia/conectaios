import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShareTracking } from '@/hooks/useShareTracking';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Share2, Eye, Clock, MousePointerClick, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShareLinkWithDetails {
  id: string;
  share_id: string;
  property_id: string;
  broker_id: string;
  share_channel: string;
  created_at: string;
  view_count: number;
  first_view_at: string | null;
  last_view_at: string | null;
  property_link_views: Array<{
    id: string;
    viewed_at: string;
  }>;
  property_interactions: Array<{
    id: string;
    interaction_type: string;
    interaction_data: any;
    created_at: string;
  }>;
  imoveis?: {
    id: string;
    titulo: string;
    valor: number;
    bairro: string;
    cover_url?: string | null;
  };
}

export default function RelatoriosCompartilhamento() {
  const { session } = useAuth();
  const { getShareStats } = useShareTracking();
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const [shareData, setShareData] = useState<ShareLinkWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) return;
      
      setLoading(true);
      const data = await getShareStats();
      if (data) {
        setShareData(data as ShareLinkWithDetails[]);
      }
      setLoading(false);
    };

    fetchStats();
  }, [session?.user?.id]); // ✅ Removido getShareStats para evitar loop infinito

  // Filtrar por imóvel se houver parâmetro
  const filteredShareData = propertyFilter
    ? shareData.filter(s => s.property_id === propertyFilter)
    : shareData;

  // Agrupar por imóvel
  const groupedByProperty = filteredShareData.reduce((acc, share) => {
    const propId = share.property_id;
    if (!acc[propId]) {
      acc[propId] = [];
    }
    acc[propId].push(share);
    return acc;
  }, {} as Record<string, ShareLinkWithDetails[]>);

  // Calcular estatísticas gerais (sobre dados filtrados)
  const totalShares = filteredShareData.length;
  const totalViews = filteredShareData.reduce((sum, s) => sum + s.view_count, 0);
  const totalInteractions = filteredShareData.reduce(
    (sum, s) => sum + (s.property_interactions?.length || 0), 
    0
  );
  const conversionRate = totalShares > 0 ? ((totalViews / totalShares) * 100).toFixed(1) : '0';

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'photo_gallery_opened':
        return '📸';
      case 'schedule_visit_clicked':
        return '📅';
      case 'tour_360_opened':
        return '🎥';
      case 'map_opened':
        return '🗺️';
      default:
        return '👆';
    }
  };

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'photo_gallery_opened':
        return 'Abriu galeria de fotos';
      case 'schedule_visit_clicked':
        return 'Clicou para agendar visita';
      case 'tour_360_opened':
        return 'Abriu tour 360°';
      case 'map_opened':
        return 'Visualizou no mapa';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">📊 Relatórios de Compartilhamento</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho dos seus compartilhamentos
          </p>
          
          {/* Breadcrumb quando filtrado por imóvel */}
          {propertyFilter && filteredShareData.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="gap-2"
              >
                <Link to="/app/relatorios-compartilhamento">
                  <ArrowLeft className="h-4 w-4" />
                  Ver Todos os Relatórios
                </Link>
              </Button>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">
                {filteredShareData[0]?.imoveis?.titulo || 'Imóvel Selecionado'}
              </span>
            </div>
          )}
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Compartilhamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                <span className="text-3xl font-bold">{totalShares}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold">{totalViews}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-3xl font-bold">{conversionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalViews} views / {totalShares} shares
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-orange-600" />
                <span className="text-3xl font-bold">{totalInteractions}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Imóveis Compartilhados */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Imóveis Compartilhados</h2>

          {Object.entries(groupedByProperty).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum compartilhamento registrado ainda.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece compartilhando seus imóveis para ver estatísticas aqui!
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByProperty).map(([propertyId, shares]) => {
              const property = shares[0]?.imoveis;
              if (!property) return null;

              const propertyShares = shares.length;
              const propertyViews = shares.reduce((sum, s) => sum + s.view_count, 0);
              const propertyInteractions = shares.reduce(
                (sum, s) => sum + (s.property_interactions?.length || 0),
                0
              );
              const propertyConversion = propertyShares > 0 
                ? ((propertyViews / propertyShares) * 100).toFixed(0)
                : '0';

              const isExpanded = expandedProperty === propertyId;

              return (
                <Card key={propertyId} className="overflow-hidden">
                  <div 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedProperty(isExpanded ? null : propertyId)}
                  >
                    <CardHeader>
                      <div className="flex gap-4">
                        {/* Foto do imóvel */}
                        {property.cover_url && (
                          <img
                            src={property.cover_url}
                            alt={property.titulo}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}

                        {/* Informações do imóvel */}
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {property.titulo}
                          </CardTitle>
                          <CardDescription>
                            {property.bairro && `${property.bairro} • `}
                            {formatCurrency(property.valor)}
                          </CardDescription>

                          {/* Badges de métricas */}
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {propertyShares} compartilhamentos
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {propertyViews} views
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {propertyConversion}%
                            </Badge>
                            {propertyInteractions > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <MousePointerClick className="h-3 w-3" />
                                {propertyInteractions} interações
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </div>

                  {/* Timeline detalhada (expandida) */}
                  {isExpanded && (
                    <CardContent className="border-t">
                      <div className="space-y-4 mt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground">
                          Timeline de Compartilhamentos
                        </h4>

                        {shares.map((share) => (
                          <div key={share.id} className="border-l-2 border-blue-300 pl-4 pb-4">
                            {/* Cabeçalho do share */}
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(share.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {share.share_channel}
                              </Badge>
                            </div>

                            {/* Estatísticas do share */}
                            <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {share.view_count} {share.view_count === 1 ? 'view' : 'views'}
                              </span>
                              {share.first_view_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Primeira view: {format(new Date(share.first_view_at), 'dd/MM HH:mm')}
                                </span>
                              )}
                            </div>

                            {/* Interações */}
                            {share.property_interactions && share.property_interactions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {share.property_interactions.map((interaction) => (
                                  <div 
                                    key={interaction.id}
                                    className="text-sm flex items-center gap-2 text-muted-foreground"
                                  >
                                    <span>{getInteractionIcon(interaction.interaction_type)}</span>
                                    <span>{getInteractionLabel(interaction.interaction_type)}</span>
                                    <span className="text-xs">
                                      • {format(new Date(interaction.created_at), 'HH:mm')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Insights */}
                            {share.view_count === 0 && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                💡 <strong>Insight:</strong> Nenhuma visualização ainda. 
                                Considere reenviar o link ou melhorar a apresentação.
                              </div>
                            )}

                            {share.view_count >= 3 && share.property_interactions.length === 0 && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                💡 <strong>Cliente engajado!</strong> Visualizou {share.view_count}x mas ainda não interagiu. 
                                Considere fazer um follow-up.
                              </div>
                            )}

                            {share.property_interactions.some(i => i.interaction_type === 'schedule_visit_clicked') && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                ✅ <strong>Lead quente!</strong> Cliente solicitou agendamento de visita.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
