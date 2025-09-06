import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Building2, ArrowRight, Users, MessageSquare, TrendingUp, Shield, Heart, ExternalLink, FileImage, Wand2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import { initParallax } from '@/utils/parallax';
import { BrokerSignupForm } from '@/components/BrokerSignupForm';
import { SaibaMaisDialog } from '@/components/SaibaMaisDialog';
import { FooterBankLinks } from '@/components/FooterBankLinks';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);

  // Removido redirecionamento automático para permitir visualização da página inicial

  useEffect(() => {
    fetchBanners();
    fetchPartnerships();
    // Initialize parallax effect
    const cleanup = initParallax();
    return cleanup;
  }, []);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (data) setBanners(data);
  };

  const fetchPartnerships = async () => {
    // Hardcoded partnerships for immediate display
    const hardcodedPartnerships = [
      { id: 1, name: 'Banco do Brasil', logo_url: null, icon: '🏦' },
      { id: 2, name: 'Caixa Econômica', logo_url: null, icon: '🏛️' },
      { id: 3, name: 'Bradesco', logo_url: null, icon: '🏦' },
      { id: 4, name: 'Itaú', logo_url: null, icon: '🏦' },
      { id: 5, name: 'Santander', logo_url: null, icon: '🏦' },
      { id: 6, name: 'Prefeitura Ilhéus', logo_url: null, icon: '🏛️' },
      { id: 7, name: 'CRECI-BA', logo_url: null, icon: '🏢' },
      { id: 8, name: 'Cartório', logo_url: null, icon: '⚖️' },
      { id: 9, name: 'Material Construção', logo_url: null, icon: '🧱' },
      { id: 10, name: 'Móveis Planejados', logo_url: null, icon: '🪑' },
      { id: 11, name: 'Correspondente Bancário', logo_url: null, icon: '💼' },
      { id: 12, name: 'Serviços Jurídicos', logo_url: null, icon: '⚖️' }
    ];
    
    setPartnerships(hardcodedPartnerships);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
      {/* Header Transparente */}
      <header className="absolute top-0 left-0 right-0 z-30 bg-white/10 backdrop-blur-md border-b border-white/10 lg:bg-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="https://hvbdeyuqcliqrmzvyciq.supabase.co/storage/v1/object/public/property-images/logoconectaios.png" alt="ConectaIOS" className="h-12 w-auto" />
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-white border border-white/20"
            >
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative h-[50vh] sm:h-[60vh] lg:h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Video - Wistia */}
        <div className="absolute inset-0 w-full h-full">
          <iframe
            src="https://fast.wistia.net/embed/iframe/wbmvp2di52?playerColor=ffffff&videoFoam=true&autoPlay=true&muted=true&loop=true"
            title="ConectaIOS Hero Video"
            className="w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="autoplay; fullscreen"
            allowFullScreen
          ></iframe>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-16 relative z-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Mobile: Título menor sobre o vídeo */}
            <h1 className="text-xl sm:text-2xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 parallax-element text-white drop-shadow-2xl animate-fade-in leading-tight" data-speed="0.8">
              Sua rotina imobiliária simplificada, Organizada e Inteligente.
            </h1>

            {/* Desktop: Todo o texto sobre o vídeo */}
            <p className="hidden md:block text-sm sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto parallax-element drop-shadow-lg animate-fade-in leading-relaxed px-2" data-speed="0.6">
              Deixe para trás a burocracia, as planilhas confusas e as negociações travadas.
              Com o ConectaIOS, você se conecta a outros corretores, organiza seus imóveis, 
              encontra clientes certos com inteligência artificial e fecha negócios de forma 
              simples, rápida e segura.
            </p>

            <div className="flex gap-4 flex-col sm:flex-row justify-center">
              <Button 
                onClick={() => navigate('/auth')}
                size="sm"
                className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 transition-all duration-300 hover:scale-105 hover:shadow-xl bg-primary hover:bg-primary/90 text-white font-semibold backdrop-blur-sm"
              >
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <SaibaMaisDialog />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile: Seção separada com texto completo abaixo do vídeo */}
      <section className="md:hidden bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              Deixe para trás a burocracia, as planilhas confusas e as negociações travadas.
              Com o ConectaIOS, você se conecta a outros corretores, organiza seus imóveis, 
              encontra clientes certos com inteligência artificial e fecha negócios de forma 
              simples, rápida e segura.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Banners Section - Carousel */}
          {banners.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8 text-primary">Destaques & Empreendimentos</h2>
              <Carousel className="w-full max-w-5xl mx-auto">
                <CarouselContent className="-ml-1">
                  {banners.slice(0, 3).map((banner) => (
                    <CarouselItem key={banner.id} className="pl-1 md:basis-1/2 lg:basis-1/3">
                      <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <img 
                          src={banner.image_url} 
                          alt={banner.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{banner.title}</h3>
                          {banner.link_url && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(banner.link_url, '_blank')}
                              className="w-full"
                            >
                              Ver mais
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          {/* Features Grid - Principais Diferenciais */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Principais Diferenciais</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 CRM Completo</h3>
                <p className="text-muted-foreground text-sm">
                  Organize leads, clientes e pipeline de vendas em um só lugar.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Gestão de Imóveis</h3>
                <p className="text-muted-foreground text-sm">
                  Controle total dos seus imóveis com níveis de visibilidade flexíveis: todos, parceiros ou privado.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Negociações Inteligentes</h3>
                <p className="text-muted-foreground text-sm">
                  Gerencie acordos com rateio flexível e contratos automáticos.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-brand-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-brand-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Match Inteligente com IA</h3>
                <p className="text-muted-foreground text-sm">
                  Nossa IA conecta automaticamente clientes ao imóvel perfeito, aumentando suas chances de fechamento.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-info" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Mini Site Exclusivo</h3>
                <p className="text-muted-foreground text-sm">
                  Tenha um site profissional para divulgar seus imóveis e fortalecer sua marca.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Chat em Tempo Real</h3>
                <p className="text-muted-foreground text-sm">
                  Comunique-se instantaneamente com clientes e parceiros.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Fotos com IA</h3>
                <p className="text-muted-foreground text-sm">
                  Melhoria automática de qualidade para destacar seus imóveis. Marca d'água exclusiva, protegendo suas fotos contra uso indevido.
                </p>
              </div>

              <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover-scale">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🔹 Mobiliário Virtual (Plano Plus)</h3>
                <p className="text-muted-foreground text-sm">
                  Mostre imóveis vazios já mobiliados virtualmente com inteligência Hugging Face, ajudando o cliente a visualizar todo o potencial do espaço.
                </p>
              </div>
            </div>
          </div>

          {/* Por que o ConectaIOS é diferente? */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Por que o ConectaIOS é diferente?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
              <div 
                className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                title="Melhoria automática de qualidade e proteção com marca d'água exclusiva"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileImage className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Imagens mais atrativas e protegidas</p>
              </div>
              <div 
                className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                title="Transforme imóveis vazios em espaços mobiliados virtuais com IA"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Imóveis vazios que ganham vida</p>
              </div>
              <div 
                className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                title="Proteção completa de dados e transações seguras"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Segurança e privacidade em todas as etapas</p>
              </div>
              <div 
                className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                title="Rede colaborativa que multiplica suas oportunidades de negócio"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Mais parcerias, mais negócios</p>
              </div>
              <div 
                className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border hover:shadow-lg transition-all duration-300 hover:scale-105 group"
                title="Automatização que acelera suas vendas e reduz trabalho manual"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Menos burocracia, mais vendas</p>
              </div>
            </div>
          </div>

          {/* Planos e Assinatura */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Planos & Assinatura</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              
              {/* Plano Básico */}
              <Card className="relative border-primary shadow-lg animate-fade-in hover-scale">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Mais Popular
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Básico</CardTitle>
                  <div className="text-3xl font-bold">R$ 97<span className="text-sm font-normal">/mês</span></div>
                  <CardDescription>Até 10 imóveis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Até 10 imóveis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">CRM completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Matches ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Chat em tempo real</span>
                  </div>
                  <Button className="w-full mt-4 bg-primary">
                    Assinar via Asaas
                  </Button>
                </CardContent>
              </Card>

              {/* Plano Profissional */}
              <Card className="relative animate-fade-in hover-scale">
                <CardHeader>
                  <CardTitle>Profissional</CardTitle>
                  <div className="text-3xl font-bold">R$ 147<span className="text-sm font-normal">/mês</span></div>
                  <CardDescription>Até 50 imóveis + site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Até 50 imóveis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Site personalizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">CRM avançado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Contratos digitais</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Assinar via Asaas
                  </Button>
                </CardContent>
              </Card>

              {/* Plano Premium */}
              <Card className="relative animate-fade-in hover-scale">
                <CardHeader>
                  <CardTitle>Premium</CardTitle>
                  <div className="text-3xl font-bold">R$ 197<span className="text-sm font-normal">/mês</span></div>
                  <CardDescription>Orientação jurídica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Imóveis ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Orientação jurídica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Suporte prioritário</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">API personalizada</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Falar com Vendas
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Formas de Pagamento */}
            <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-8">
              <h3 className="text-xl font-semibold text-center mb-6">Formas de Pagamento via Asaas</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">PIX</h4>
                  <p className="text-sm text-muted-foreground">Pagamento instantâneo com desconto de 5%</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Cartão de Crédito</h4>
                  <p className="text-sm text-muted-foreground">Parcelamento em até 12x sem juros</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Boleto</h4>
                  <p className="text-sm text-muted-foreground">Vencimento em 3 dias úteis</p>
                </div>
              </div>
            </div>

            {/* Cadastro */}
            <div className="mt-8">
              <BrokerSignupForm />
            </div>
          </div>
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Parceiros & Convênios</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {partnerships.map((partnership) => (
                <div key={partnership.id} className="text-center group">
                  <div className="p-3 bg-card border rounded-lg hover:shadow-md transition-shadow h-20 flex flex-col items-center justify-center">
                    <div className="text-2xl mb-1">{partnership.icon}</div>
                    <span className="text-xs font-medium text-muted-foreground leading-tight">{partnership.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-white shadow-lg animate-pulse"
          onClick={() => window.open('https://wa.me/5573999999999?text=Olá! Gostaria de saber mais sobre a ConectaIOS', '_blank')}
        >
          <FaWhatsapp className="h-6 w-6" />
        </Button>
      </div>

      {/* Footer */}
      <FooterBankLinks />
      <footer className="border-t bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">ConectaIOS</span>
            <span className="text-sm text-muted-foreground">• Ilhéus</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Plataforma exclusiva para corretores independentes
          </p>
        </div>
      </footer>
      </div>
    </PageWrapper>
  );
};

export default Index;
