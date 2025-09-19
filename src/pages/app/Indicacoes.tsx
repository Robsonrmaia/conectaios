import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIndications } from '@/hooks/useIndications';
import { useBroker } from '@/hooks/useBroker';
import { Copy, Share2, Users, TrendingUp, DollarSign, Calendar, ExternalLink, Gift, Star, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Indicacoes() {
  const { indications, discounts, stats, loading } = useIndications();
  const { broker } = useBroker();
  const [copying, setCopying] = useState(false);

  const generateReferralLink = () => {
    if (!broker?.referral_code) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${broker.referral_code}`;
  };

  const copyReferralLink = async () => {
    const link = generateReferralLink();
    if (!link) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado!',
        description: 'O link de indicação foi copiado para a área de transferência.'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive'
      });
    } finally {
      setCopying(false);
    }
  };

  const shareWhatsApp = () => {
    const link = generateReferralLink();
    const message = `🎯 Quer economizar na sua ferramenta imobiliária?\n\n💰 Use meu código de indicação e ganhe 50% de desconto no primeiro mês da ConectaIOS!\n\n🔗 Cadastre-se aqui: ${link}\n\n✨ A ConectaIOS é a plataforma completa para corretores: CRM, gestão de imóveis, IA integrada e muito mais!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'cancelado':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="text-2xl md:text-4xl font-bold">Indique e Ganhe</h1>
        </div>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
          Compartilhe a ConectaIOS com outros corretores e ganhe descontos na sua mensalidade!
        </p>
        
        {/* Destaque principal */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 md:p-6 rounded-lg border-2 border-primary/20">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
            <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="text-base md:text-lg font-semibold text-primary text-center">
              Indique 2 amigos no mesmo mês e sua mensalidade fica 100% grátis!
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Seus indicados também ganham 50% de desconto no primeiro mês
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIndications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicações Confirmadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.confirmedIndications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {stats.totalDiscountApplied.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconto Próximo Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.nextMonthDiscount}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link de Indicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Seu Link de Indicação
          </CardTitle>
          <CardDescription>
            Compartilhe este link para que novos corretores se cadastrem usando sua indicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xs sm:text-sm break-all">
              {generateReferralLink() || 'Carregando...'}
            </div>
            <Button
              onClick={copyReferralLink}
              disabled={copying || !broker?.referral_code}
              variant="outline"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copying ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
          
          <Button 
            onClick={shareWhatsApp} 
            className="w-full min-h-[44px]" 
            disabled={!broker?.referral_code}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Compartilhar no WhatsApp
          </Button>

          {broker?.referral_code && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-1">Seu código de indicação:</p>
              <p className="font-mono text-lg font-bold text-primary">{broker.referral_code}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minhas Indicações */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Indicações</CardTitle>
          <CardDescription>
            Acompanhe o status das suas indicações e descontos aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {indications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Você ainda não possui indicações. Compartilhe seu link e comece a ganhar!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {indications.map((indication) => (
                <div key={indication.id} className="border rounded-lg p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {indication.indicado?.name || 'Nome não informado'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {indication.indicado?.email}
                      </p>
                    </div>
                    <Badge className={getStatusColor(indication.status)}>
                      {indication.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data da Indicação</p>
                      <p className="font-medium">
                        {format(new Date(indication.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    
                    {indication.data_confirmacao && (
                      <div>
                        <p className="text-muted-foreground">Data da Confirmação</p>
                        <p className="font-medium">
                          {format(new Date(indication.data_confirmacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-muted-foreground">Mês da Recompensa</p>
                      <p className="font-medium">
                        {String(indication.mes_recompensa).slice(4, 6)}/{String(indication.mes_recompensa).slice(0, 4)}
                      </p>
                    </div>
                    
                    {indication.desconto_aplicado > 0 && (
                      <div>
                        <p className="text-muted-foreground">Desconto Aplicado</p>
                        <p className="font-medium text-success">
                          R$ {indication.desconto_aplicado.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona o Programa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">Indique</h3>
              <p className="text-sm text-muted-foreground">
                Compartilhe seu link com outros corretores
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold">Eles Se Cadastram</h3>
              <p className="text-sm text-muted-foreground">
                Seus indicados ganham 50% de desconto no primeiro mês
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold">Você Ganha</h3>
              <p className="text-sm text-muted-foreground">
                50% de desconto no mês seguinte (ou mensalidade grátis com 2+ indicações)
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Regras do Programa:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Indicado ganha 50% de desconto no primeiro mês</li>
              <li>• Indicador ganha 50% de desconto no mês seguinte à confirmação</li>
              <li>• Com 2 ou mais indicações confirmadas no mesmo mês, sua mensalidade fica grátis</li>
              <li>• Descontos não acumulam para meses futuros</li>
              <li>• Cada pessoa pode ser indicada apenas uma vez</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}