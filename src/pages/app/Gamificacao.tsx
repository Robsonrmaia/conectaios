import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSimpleGamification } from '@/hooks/useSimpleGamification';
import { useBroker } from '@/hooks/useBroker';
import { ScrollableRow } from '@/components/layout/ResponsiveRow';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Gift, 
  Users, 
  Target, 
  Award, 
  Zap,
  Medal,
  Crown,
  Camera,
  Share2,
  Heart,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Flame,
  Clock,
  Calendar,
  MessageCircle,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Gamificacao() {
  const { broker } = useBroker();
  const {
    stats,
    recentEvents,
    leaderboard,
    loading,
    getTierInfo,
    getBadgeInfo,
    getProgressToNextTier
  } = useSimpleGamification(broker?.id);

  const propertyQualities = [];
  const pointsRules = [];
  const badgeDefinitions = [];
  const forceRefreshRules = () => {};

  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const tierInfo = getTierInfo(stats.tier);
  const progress = getProgressToNextTier();

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Elite': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'Premium': return <Medal className="h-5 w-5 text-purple-500" />;
      case 'Participativo': return <Star className="h-5 w-5 text-blue-500" />;
      default: return <Target className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBadgeIcon = (badgeSlug: string) => {
    switch (badgeSlug) {
      case 'fast_responder': return '⚡';
      case 'anunciante_premium': return '🏆'; 
      case 'parceiro_ouro': return '🥇';
      case 'champion': return '👑';
      default: return '🏅';
    }
  };

  const getRuleIcon = (ruleKey: string) => {
    switch (ruleKey) {
      case 'imovel_vendido':
        return <Award className="h-4 w-4" />;
      case 'match_1h':
        return <Zap className="h-4 w-4" />;
      case 'match_12h':
        return <Clock className="h-4 w-4" />;
      case 'match_24h':
        return <Calendar className="h-4 w-4" />;
      case 'imovel_qualidade':
        return <Star className="h-4 w-4" />;
      case 'imovel_8_fotos':
        return <Camera className="h-4 w-4" />;
      case 'indicacao':
        return <Users className="h-4 w-4" />;
      case 'social_share':
        return <Share2 className="h-4 w-4" />;
      case 'social_like':
        return <Heart className="h-4 w-4" />;
      case 'social_comment':
        return <MessageCircle className="h-4 w-4" />;
      case 'perfil_completo':
        return <User className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <div className="container-responsive space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gamificação ConectaIOS
          </h1>
        </div>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
          Ganhe pontos por boas práticas e desbloqueie benefícios exclusivos!
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm whitespace-nowrap px-2 py-2 min-h-[44px]"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="ranking" 
            className="text-xs sm:text-sm whitespace-nowrap px-2 py-2 min-h-[44px]"
          >
            Ranking
          </TabsTrigger>
          <TabsTrigger 
            value="quality" 
            className="text-xs sm:text-sm whitespace-nowrap px-2 py-2 min-h-[44px]"
          >
            Qualidade
          </TabsTrigger>
          <TabsTrigger 
            value="rules" 
            className="text-xs sm:text-sm whitespace-nowrap px-2 py-2 min-h-[44px]"
          >
            Como Ganhar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-mobile">
          {/* Current Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Tier Card */}
            <Card className="lg:col-span-2 card-mobile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-responsive">
                  {getTierIcon(stats.tier)}
                  Tier Atual: {stats.tier}
                </CardTitle>
                <CardDescription>
                  {tierInfo.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{stats.pontos}</span>
                  <span className="text-sm text-muted-foreground">pontos este mês</span>
                </div>
                
                {progress.nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso para {progress.nextTier}</span>
                      <span>{progress.pointsNeeded} pontos restantes</span>
                    </div>
                    <Progress value={progress.percentage} className="h-3" />
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>{stats.desconto_percent}% desconto</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>#{stats.current_rank} de {stats.total_users}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Card */}
            <Card className="card-mobile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-responsive">
                  <Award className="h-5 w-5" />
                  Badges Conquistados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.badges.length > 0 ? (
                  <div className="space-y-3">
                    {stats.badges.map(badgeSlug => {
                      const badgeInfo = getBadgeInfo(badgeSlug);
                      return (
                        <div key={badgeSlug} className="flex items-center gap-2">
                          <span className="text-lg">{getBadgeIcon(badgeSlug)}</span>
                          <div>
                            <p className="font-medium text-sm">{badgeInfo?.label || badgeSlug}</p>
                            <p className="text-xs text-muted-foreground">{badgeInfo?.descricao}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Continue participando para conquistar seus primeiros badges!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-responsive">
                <Flame className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Seus últimos ganhos de pontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {recentEvents.slice(0, 8).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRuleIcon(event.rule_key)}
                        <div>
                          <p className="font-medium text-sm">
                            {pointsRules.find(rule => rule.key === event.rule_key)?.label || event.rule_key}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        +{event.pontos}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Suas atividades aparecerão aqui quando você começar a ganhar pontos!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-mobile">
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-responsive">
                <Trophy className="h-5 w-5" />
                Ranking do Mês
              </CardTitle>
              <CardDescription>
                Top 10 corretores com mais pontos este mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.conectaios_brokers.avatar_url && (
                            <img 
                              src={entry.conectaios_brokers.avatar_url} 
                              alt={entry.conectaios_brokers.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{entry.conectaios_brokers.name}</p>
                            <div className="flex items-center gap-2">
                              {getTierIcon(entry.tier)}
                              <span className="text-xs text-muted-foreground">{entry.tier}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{entry.pontos}</p>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    O ranking será atualizado assim que houver atividade!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-mobile">
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-responsive">
                <Star className="h-5 w-5" />
                Qualidade dos Seus Anúncios
              </CardTitle>
              <CardDescription>
                Melhore a qualidade dos seus anúncios para ganhar mais pontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertyQualities.length > 0 ? (
                <div className="space-y-4">
                  {propertyQualities.slice(0, 10).map(property => (
                    <div key={property.imovel_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {property.percentual >= 90 ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Imóvel #{property.imovel_id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {property.tem_8_fotos ? '8+ fotos' : 'Menos de 8 fotos'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{property.percentual}%</p>
                        <p className="text-xs text-muted-foreground">qualidade</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Seus anúncios aparecerão aqui quando você criar propriedades!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-mobile">
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-responsive">
                <Gift className="h-5 w-5" />
                Como Ganhar Pontos
              </CardTitle>
              <CardDescription>
                Conheça todas as formas de ganhar pontos no ConectaIOS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-muted rounded" />
                        <div>
                          <div className="h-4 w-32 bg-muted rounded mb-2" />
                          <div className="h-3 w-48 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-12 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : pointsRules.length > 0 ? (
                <div className="space-y-4">
                  {pointsRules.map(rule => (
                    <div key={rule.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRuleIcon(rule.key)}
                        <div>
                          <p className="font-medium">{rule.label}</p>
                          <p className="text-sm text-muted-foreground">{rule.descricao}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-bold text-lg">
                        +{rule.pontos}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma regra de pontuação encontrada.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Debug: {pointsRules?.length || 0} regras | Loading: {loading.toString()} | Mobile: {/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent).toString()}
                  </p>
                  <div className="button-group-mobile justify-center">
                    <Button 
                      onClick={forceRefreshRules} 
                      size="sm"
                      className="w-full sm:w-auto touch-target"
                    >
                      🔥 Force Refresh
                    </Button>
                    <Button 
                      onClick={forceRefreshRules} 
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto touch-target"
                    >
                      🔄 Atualizar Regras
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tier System */}
          <Card className="card-mobile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-responsive">
                <Medal className="h-5 w-5" />
                Sistema de Tiers e Benefícios
              </CardTitle>
              <CardDescription>
                Alcance diferentes níveis e ganhe descontos na mensalidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { tier: 'Sem Desconto', points: '0-299', discount: '0%' },
                  { tier: 'Participativo', points: '300-599', discount: '10%' },
                  { tier: 'Premium', points: '600-899', discount: '25%' },
                  { tier: 'Elite', points: '900+', discount: '50%' }
                ].map(tierData => (
                  <div key={tierData.tier} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    stats.tier === tierData.tier ? 'border-primary bg-primary/10' : 'border-muted bg-muted/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {getTierIcon(tierData.tier)}
                      <div>
                        <p className="font-medium">{tierData.tier}</p>
                        <p className="text-sm text-muted-foreground">{tierData.points} pontos</p>
                      </div>
                    </div>
                    <Badge variant={stats.tier === tierData.tier ? 'default' : 'secondary'}>
                      {tierData.discount} desconto
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <p className="font-semibold text-yellow-800">Benefício Especial</p>
                </div>
                <p className="text-sm text-yellow-700">
                  O #1 do ranking no mês anterior ganha mensalidade grátis e o badge de Campeão! 🏆
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}