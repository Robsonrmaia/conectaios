import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Building2, ArrowRight, Users, MessageSquare, TrendingUp, Shield, Heart, ExternalLink, FileImage, Wand2, Search, Star, Handshake, Globe, Camera, Sofa, MessageCircle, Home } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/PageWrapper';
import AnimatedBackground from '@/components/AnimatedBackground';
// @ts-ignore - Parallax import
import { initParallax } from '@/utils/parallax';
import { BrokerSignupForm } from '@/components/BrokerSignupForm';
import { AsaasPaymentButton } from '@/components/AsaasPaymentButton';
import { SaibaMaisDialog } from '@/components/SaibaMaisDialog';
import { FeatureDetailDialog } from '@/components/FeatureDetailDialog';

import { TestimonialsSection } from '@/components/TestimonialsSection';

const garotonectaImg = 'https://paawojkqrggnuvpnnwrc.supabase.co/storage/v1/object/public/assets/branding/iagohero.png?t=' + Date.now();
import logoconectaiosImg from '@/assets/logoconectaios.png';
import logoSvg from '@/assets/logo.svg';

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
    // Filtered partnerships as requested
    const filteredPartnerships = [
      { id: 1, name: 'CRECI-BA', logo_url: null, icon: '🏢' },
      { id: 2, name: 'Cartório de Ilhéus', logo_url: null, icon: '⚖️' },
      { id: 3, name: 'Material de Construção', logo_url: null, icon: '🧱' },
      { id: 4, name: 'Móveis Planejados', logo_url: null, icon: '🪑' },
      { id: 5, name: 'Correspondente Bancário Caixa', logo_url: null, icon: '🏛️' },
      { id: 6, name: 'Correspondente Multibancos', logo_url: null, icon: '💼' },
      { id: 7, name: 'Serviços Jurídicos', logo_url: null, icon: '⚖️' }
    ];
    
    setPartnerships(filteredPartnerships);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-background">
      {/* Header Transparente e Móvel */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={logoconectaiosImg} 
                alt="ConectaIOS" 
                className="h-10 w-auto object-contain" 
              />
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Layout com Imagem do Rapaz */}
      <main className="bg-background pt-20 relative overflow-hidden">
        {/* Elementos decorativos de fundo com parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl parallax-element" data-speed="0.8"></div>
          <div className="absolute top-60 -left-20 w-60 h-60 bg-blue-500/3 rounded-full blur-3xl parallax-element" data-speed="1.2"></div>
          <div className="absolute bottom-40 right-1/3 w-32 h-32 bg-green-500/4 rounded-full blur-2xl parallax-element" data-speed="0.6"></div>
        </div>

        {/* Animated connecting lines background */}
        <AnimatedBackground />

        {/* Desktop Layout - Duas Colunas (incluindo tablets) */}
        <div className="hidden sm:block relative">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-center pt-8 relative">
              {/* Coluna Esquerda - Conteúdo */}
              <div className="space-y-8 pt-8 relative z-10 lg:pr-8 parallax-element" data-speed="0.4">
                {/* Badge decorativo */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 parallax-element" data-speed="0.3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Plataforma #1 em Inovação Imobiliária
                </div>

                <div className="space-y-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                    Sua rotina <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">imobiliária</span><br />
                    <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">simplificada</span>, <span className="text-foreground">Organizada</span><br />
                    e <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Inteligente</span>
                  </h1>
                  
                  <p className="text-lg xl:text-xl text-muted-foreground leading-relaxed max-w-lg">
                    Deixe para trás a burocracia, as planilhas confusas e as negociações travadas.
                    Com o ConectaIOS, você se conecta a outros corretores, organiza seus imóveis, 
                    encontra clientes certos com inteligência artificial e fecha negócios de forma 
                    simples, rápida e segura.
                  </p>
                </div>

                {/* Stats rápidos */}
                <div className="flex gap-6 py-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Corretores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">10k+</div>
                    <div className="text-sm text-muted-foreground">Imóveis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <div className="text-sm text-muted-foreground">Satisfação</div>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <Button 
                    onClick={() => navigate('/auth')}
                    size="lg"
                    className="text-base px-8 py-3 transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold border-0 shadow-lg hover:shadow-primary/25"
                  >
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <SaibaMaisDialog />
                </div>

                {/* Indicadores visuais */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">Mais de 500 corretores confiam no ConectaIOS</span>
                </div>
              </div>

              {/* Coluna Direita - Imagem do Rapaz */}
              <div className="relative pt-4 flex justify-center lg:justify-start lg:pl-4">
                {/* Elementos decorativos atrás da imagem */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-72 h-72 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-2xl"></div>
                </div>
                
                {/* Cards flutuantes decorativos com parallax */}
                {/* Card Apartamento Vendido - Superior Esquerdo */}
                <div className="absolute top-12 -left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-green-200 animate-bounce parallax-element" data-speed="0.7" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Apartamento Vendido!</span>
                  </div>
                </div>

                {/* Card Cliente Procura - Esquerdo Médio */}
                <div className="absolute top-1/3 -left-8 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-blue-200 animate-bounce parallax-element" data-speed="1.0" style={{ animationDelay: '1.5s', animationDuration: '4s' }}>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Cliente Procura Imóvel</span>
                  </div>
                </div>

                {/* Card Match encontrado - Superior Direito */}
                <div className="absolute top-16 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-purple-200 animate-bounce parallax-element" data-speed="0.9" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Match encontrado!</span>
                  </div>
                </div>

                {/* Card Lançamento à Vista - Direito Inferior */}
                <div className="absolute bottom-32 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-yellow-200 animate-bounce parallax-element" data-speed="0.5" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }}>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700">Lançamento à Vista</span>
                  </div>
                </div>

                {/* Card Negociação Fechada - Inferior */}
                <div className="absolute bottom-16 -right-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-emerald-200 animate-bounce parallax-element" data-speed="0.8" style={{ animationDelay: '3s', animationDuration: '4s' }}>
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Negociação Fechada</span>
                  </div>
                </div>

                {/* Card +3 Imóveis - Esquerdo Inferior */}
                <div className="absolute bottom-20 -left-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-indigo-200 animate-bounce parallax-element" data-speed="0.6" style={{ animationDelay: '2s', animationDuration: '4s' }}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-700">+3 Imóveis Cadastrados</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <img 
                    src={garotonectaImg} 
                    alt="Profissional ConectaIOS" 
                    className="max-w-full h-auto max-h-[700px] xl:max-h-[800px] object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
            
            {/* Seção Vídeos - Grid 3x2 */}
            <div className="mt-20">
              <div className="max-w-6xl mx-auto">
                {/* Badge acima dos vídeos */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Veja como funciona
                  </div>
                </div>

                {/* Grid de Vídeos - 3 colunas e 2 linhas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Vídeo 1 */}
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-primary/10 hover:ring-primary/20 transition-all duration-300 hover:shadow-xl">
                    <wistia-player media-id="k3abf93ih1" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                  </div>

                  {/* Vídeo 2 */}
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-primary/10 hover:ring-primary/20 transition-all duration-300 hover:shadow-xl">
                    <wistia-player media-id="hczxrata2s" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                  </div>

                  {/* Vídeo 3 */}
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200">
                    <wistia-player media-id="wsl23th2kq" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                  </div>

                  {/* Vídeo 4 */}
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200">
                    <wistia-player media-id="e4dk8u41uq" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                  </div>

                  {/* Vídeo 5 */}
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200">
                    <wistia-player media-id="5t311sebkh" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                  </div>

                  {/* Vídeo 6 */}
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200">
                    <wistia-player media-id="rd3fb1xgqj" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Apenas para telas pequenas */}
        <div className="sm:hidden relative">
          <div className="px-6 py-8 space-y-8">
            {/* Badge decorativo mobile */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                #1 em Inovação Imobiliária
              </div>
            </div>

            {/* Título */}
            <div className="text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight text-foreground">
                Sua rotina <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">imobiliária</span><br />
                <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">simplificada</span>, <span className="text-foreground">Organizada</span><br />
                e <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Inteligente</span>
              </h1>
            </div>

            {/* Imagem do Rapaz com Cards Mobile */}
            <div className="flex justify-center py-4 relative">
              {/* Cards flutuantes mobile adaptados */}
              
              {/* Card Vendido - Superior Direito */}
              <div className="absolute top-4 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-green-200 animate-bounce text-xs" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-700">Vendido!</span>
                </div>
              </div>

              {/* Card Procura - Esquerdo Superior */}
              <div className="absolute top-8 left-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-blue-200 animate-bounce text-xs" style={{ animationDelay: '1.2s', animationDuration: '3.5s' }}>
                <div className="flex items-center gap-1">
                  <Search className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-700">Procura</span>
                </div>
              </div>

              {/* Card Match - Direito Meio */}
              <div className="absolute top-1/3 right-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-purple-200 animate-bounce text-xs" style={{ animationDelay: '1.8s', animationDuration: '4s' }}>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-purple-600" />
                  <span className="font-medium text-purple-700">Match!</span>
                </div>
              </div>

              {/* Card Lançamento - Inferior Direito */}
              <div className="absolute bottom-12 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-yellow-200 animate-bounce text-xs" style={{ animationDelay: '2.2s', animationDuration: '3.5s' }}>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-600" />
                  <span className="font-medium text-yellow-700">Lançamento</span>
                </div>
              </div>

              {/* Card Negociação - Inferior Esquerdo */}
              <div className="absolute bottom-8 left-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-2 border border-emerald-200 animate-bounce text-xs" style={{ animationDelay: '2.8s', animationDuration: '4s' }}>
                <div className="flex items-center gap-1">
                  <Handshake className="w-3 h-3 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Fechado</span>
                </div>
              </div>

              <img 
                src={garotonectaImg} 
                alt="Profissional ConectaIOS" 
                className="max-w-[280px] h-auto object-contain drop-shadow-xl relative z-10"
                onError={(e) => {
                  console.error('Erro ao carregar imagem hero:', garotonectaImg);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Imagem hero carregada com sucesso:', garotonectaImg);
                }}
                style={{
                  imageRendering: 'auto',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>

            {/* Texto Descritivo - Após Imagem */}
            <div className="text-center px-4">
              <p className="text-base text-muted-foreground leading-relaxed">
                Deixe para trás a burocracia, as planilhas confusas e as negociações travadas.
                Com o ConectaIOS, você se conecta a outros corretores, organiza seus imóveis, 
                encontra clientes certos com inteligência artificial e fecha negócios de forma 
                simples, rápida e segura.
              </p>
            </div>

            {/* Stats mobile */}
            <div className="flex justify-center gap-4 py-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">500+</div>
                <div className="text-xs text-muted-foreground">Corretores</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">10k+</div>
                <div className="text-xs text-muted-foreground">Imóveis</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">95%</div>
                <div className="text-xs text-muted-foreground">Satisfação</div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                onClick={() => navigate('/auth')}
                size="lg"
                className="w-full sm:w-auto text-base px-6 py-3 transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg"
              >
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <SaibaMaisDialog />
            </div>

            {/* Seção Vídeos Mobile - Grid 2x3 (2 colunas, 3 linhas no mobile) */}
            <div className="mt-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  Veja como funciona
                </div>
              </div>
              
              {/* Grid Mobile - 1 coluna */}
              <div className="grid grid-cols-1 gap-4">
                {/* Vídeo 1 */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-primary/10">
                  <wistia-player media-id="k3abf93ih1" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                </div>

                {/* Vídeo 2 */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-primary/10">
                  <wistia-player media-id="hczxrata2s" aspect="1.7777777777777777" className="w-full h-full"></wistia-player>
                </div>

                {/* Vídeo 3 - Placeholder */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-gray-200 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-8 h-8 mx-auto mb-1 bg-gray-300 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium">Em breve</p>
                  </div>
                </div>

                {/* Vídeo 4 - Placeholder */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-gray-200 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-8 h-8 mx-auto mb-1 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium">Em breve</p>
                  </div>
                </div>

                {/* Vídeo 5 - Placeholder */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-gray-200 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-8 h-8 mx-auto mb-1 bg-gray-300 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium">Em breve</p>
                  </div>
                </div>

                {/* Vídeo 6 - Placeholder */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-md ring-1 ring-gray-200 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-8 h-8 mx-auto mb-1 bg-gray-300 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium">Em breve</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="container mx-auto px-4 py-8 sm:py-16">
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
              <FeatureDetailDialog
                title="CRM Completo"
                description="Sistema de gestão de relacionamento completo para organizar clientes, leads e oportunidades de forma profissional"
                icon={<Users className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-blue-500 to-purple-600"
                howItWorks={{
                  title: "Como funciona o CRM",
                  items: [
                    "Pipeline visual em formato kanban para organizar leads por etapa",
                    "Cadastro completo de clientes com histórico de interações",
                    "Follow-up automatizado com lembretes e notificações",
                    "Relatórios de performance e análise de conversão",
                    "Integração com WhatsApp para comunicação direta"
                  ]
                }}
                benefits={{
                  title: "Benefícios do CRM",
                  items: [
                    "Nunca mais perca uma oportunidade por falta de organização",
                    "Histórico completo de cada cliente sempre à mão",
                    "Acompanhamento visual do progresso de cada negócio",
                    "Automação de tarefas repetitivas",
                    "Análise de performance para melhorar resultados"
                  ]
                }}
                useCases={{
                  title: "Casos de uso práticos",
                  scenarios: [
                    {
                      title: "Cliente interessado em apartamento",
                      description: "Cliente viu um anúncio e demonstrou interesse. O CRM registra automaticamente o lead, programa follow-ups e acompanha toda a jornada até o fechamento."
                    },
                    {
                      title: "Agendamento de visitas",
                      description: "Sistema organiza agenda de visitas, envia lembretes automáticos e registra feedback de cada cliente após a visita."
                    },
                    {
                      title: "Processo de venda completo",
                      description: "Desde o primeiro contato até a assinatura do contrato, tudo fica documentado e organizado no pipeline visual."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Users className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">CRM Completo</h3>
                  <p className="text-muted-foreground text-sm">
                    Organize leads, clientes e pipeline de vendas em um só lugar.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Gestão de Imóveis"
                description="Controle total sobre a visibilidade e apresentação dos seus imóveis com tecnologia avançada"
                icon={<Building2 className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-green-500 to-emerald-600"
                howItWorks={{
                  title: "Como funciona a Gestão",
                  items: [
                    "Três níveis de visibilidade: Privado (só você vê), Parceiros (outros corretores) e Público (no seu mini site)",
                    "Upload de fotos com melhoria automática por IA",
                    "Cadastro completo com dados técnicos e descrição detalhada",
                    "Marca d'água personalizada para proteção de imagens",
                    "Galeria organizada com ferramentas de apresentação"
                  ]
                }}
                benefits={{
                  title: "Vantagens da Gestão",
                  items: [
                    "Flexibilidade total no controle de visibilidade",
                    "Proteção contra uso indevido de suas fotos",
                    "Apresentação profissional automatizada",
                    "Organização eficiente do portfólio",
                    "Facilidade na criação de apresentações"
                  ]
                }}
                useCases={{
                  title: "Situações de uso",
                  scenarios: [
                    {
                      title: "Exclusivo do proprietário",
                      description: "Imóvel fica privado até você conseguir autorização para divulgação ampla. Apenas você tem acesso às informações completas."
                    },
                    {
                      title: "Compartilhamento com parceiros",
                      description: "Libera visibilidade para outros corretores colaborarem na venda, mantendo controle sobre quem pode acessar."
                    },
                    {
                      title: "Marketing público",
                      description: "Imóvel aparece no seu mini site e pode ser compartilhado nas redes sociais com fotos protegidas por marca d'água."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-green-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Building2 className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Gestão de Imóveis</h3>
                  <p className="text-muted-foreground text-sm">
                    Controle total dos seus imóveis com níveis de visibilidade flexíveis: todos, parceiros ou privado.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Negociações Inteligentes"
                description="Sistema transparente de acordos digitais com divisão justa e automática de comissões entre corretores"
                icon={<Handshake className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-orange-500 to-red-600"
                howItWorks={{
                  title: "Como funcionam as Negociações",
                  items: [
                    "Criação de acordos digitais com termos claros e específicos",
                    "Definição flexível de percentuais de comissão por corretor",
                    "Documentação automática de todos os termos acordados",
                    "Notificações para todas as partes envolvidas",
                    "Histórico completo de todas as negociações realizadas"
                  ]
                }}
                benefits={{
                  title: "Benefícios das Negociações",
                  items: [
                    "Transparência total em todos os acordos",
                    "Eliminação de mal-entendidos sobre comissões",
                    "Documentação legal de todos os termos",
                    "Agilidade na formalização de parcerias",
                    "Confiança mútua entre corretores"
                  ]
                }}
                useCases={{
                  title: "Exemplos de negociações",
                  scenarios: [
                    {
                      title: "Parceria entre corretores",
                      description: "Corretor A tem o cliente, Corretor B tem o imóvel. Sistema documenta automaticamente a divisão de 50/50 da comissão."
                    },
                    {
                      title: "Divisão customizada",
                      description: "Acordo específico onde um corretor fica com 60% por ter trazido tanto cliente quanto imóvel, e o parceiro com 40% pelo suporte."
                    },
                    {
                      title: "Histórico transparente",
                      description: "Todos os acordos ficam documentados, criando um histórico de parcerias bem-sucedidas para futuras colaborações."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-orange-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Handshake className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Negociações Inteligentes</h3>
                  <p className="text-muted-foreground text-sm">
                    Gerencie acordos com rateio flexível e contratos automáticos.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Match IA"
                description="Inteligência artificial avançada que conecta automaticamente clientes aos imóveis perfeitos"
                icon={<Heart className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-pink-500 to-rose-600"
                howItWorks={{
                  title: "Como funciona o Match IA",
                  items: [
                    "Algoritmo analisa perfil completo do cliente (orçamento, preferências, localização)",
                    "Cruza dados com características de todos os imóveis disponíveis",
                    "Calcula compatibilidade baseada em múltiplos critérios",
                    "Envia notificações automáticas quando encontra matches perfeitos",
                    "Aprende com feedback para melhorar sugestões futuras"
                  ]
                }}
                benefits={{
                  title: "Vantagens do Match IA",
                  items: [
                    "Economia de tempo na busca por imóveis",
                    "Maior assertividade nas apresentações",
                    "Automatização do processo de prospecção",
                    "Melhoria contínua através de machine learning",
                    "Aumento significativo na taxa de conversão"
                  ]
                }}
                useCases={{
                  title: "Cenários de match",
                  scenarios: [
                    {
                      title: "Cliente com perfil definido",
                      description: "Cliente busca apartamento de 2 quartos, até R$ 300mil, no centro. IA encontra automaticamente opções compatíveis no banco de dados."
                    },
                    {
                      title: "Novo imóvel cadastrado",
                      description: "Corretor cadastra casa de 3 quartos. Sistema identifica automaticamente clientes com esse perfil e notifica sobre a oportunidade."
                    },
                    {
                      title: "Refinamento de critérios",
                      description: "Baseado no feedback do cliente após visualizar sugestões, IA ajusta parâmetros e melhora próximas recomendações."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-pink-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Heart className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Match Inteligente com IA</h3>
                  <p className="text-muted-foreground text-sm">
                    Nossa IA conecta automaticamente clientes ao imóvel perfeito, aumentando suas chances de fechamento.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Mini Site"
                description="Seu portfólio digital profissional com até 50 imóveis, formulário de contato e integração completa"
                icon={<Globe className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-cyan-500 to-blue-600"
                howItWorks={{
                  title: "Como funciona o Mini Site",
                  items: [
                    "Site personalizado com sua marca e informações profissionais",
                    "Galeria automática dos imóveis marcados como públicos",
                    "Formulário de contato integrado com seu CRM",
                    "Compartilhamento direto via WhatsApp",
                    "URL personalizada e responsividade total"
                  ]
                }}
                benefits={{
                  title: "Benefícios do Mini Site",
                  items: [
                    "Presença digital profissional sem custo extra",
                    "Geração automática de leads qualificados",
                    "Credibilidade e confiança com clientes",
                    "Marketing digital 24/7 trabalhando para você",
                    "Integração perfeita com suas redes sociais"
                  ]
                }}
                useCases={{
                  title: "Usos do Mini Site",
                  scenarios: [
                    {
                      title: "Marketing digital",
                      description: "Compartilhe o link do seu mini site nas redes sociais, cartões de visita e materiais promocionais para atrair novos clientes."
                    },
                    {
                      title: "Captação de clientes",
                      description: "Formulário integrado captura leads interessados e alimenta automaticamente seu CRM com novos contatos qualificados."
                    },
                    {
                      title: "Portfólio profissional",
                      description: "Apresente seus melhores imóveis de forma organizada e profissional, demonstrando expertise e qualidade no atendimento."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-cyan-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Globe className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Mini Site Exclusivo</h3>
                  <p className="text-muted-foreground text-sm">
                    Tenha um site profissional para divulgar seus imóveis e fortalecer sua marca.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Chat Tempo Real"
                description="Sistema de comunicação instantânea entre corretores para colaboração eficiente e negociações ágeis"
                icon={<MessageCircle className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-lime-500 to-green-600"
                howItWorks={{
                  title: "Como funciona o Chat",
                  items: [
                    "Mensageria instantânea entre todos os corretores da plataforma",
                    "Notificações em tempo real para mensagens importantes",
                    "Histórico completo de todas as conversas",
                    "Criação de grupos para discussões específicas",
                    "Compartilhamento de imóveis e documentos direto no chat"
                  ]
                }}
                benefits={{
                  title: "Vantagens do Chat",
                  items: [
                    "Comunicação rápida e eficiente",
                    "Eliminação da necessidade de trocar telefones",
                    "Colaboração simplificada entre corretores",
                    "Centralização de todas as conversas profissionais",
                    "Agilidade na resolução de questões"
                  ]
                }}
                useCases={{
                  title: "Situações de uso do Chat",
                  scenarios: [
                    {
                      title: "Negociação com parceiros",
                      description: "Discussão rápida sobre divisão de comissão, detalhes do imóvel ou agendamento de visitas conjuntas."
                    },
                    {
                      title: "Atendimento colaborativo",
                      description: "Corretor consulta colega especialista em determinada região para dar melhor atendimento ao cliente."
                    },
                    {
                      title: "Grupos de trabalho",
                      description: "Criação de grupos para discutir estratégias de mercado, dicas de vendas ou organização de eventos do setor."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-lime-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-lime-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <MessageCircle className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Chat em Tempo Real</h3>
                  <p className="text-muted-foreground text-sm">
                    Comunique-se instantaneamente com clientes e parceiros.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Fotos com IA"
                description="Tecnologia avançada para melhoria automática de fotos e proteção com marca d'água personalizada"
                icon={<Camera className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-purple-500 to-indigo-600"
                howItWorks={{
                  title: "Como funciona a IA de Fotos",
                  items: [
                    "Upload automático com análise de qualidade da imagem",
                    "Melhoria automática de brilho, contraste e nitidez",
                    "Aplicação de marca d'água personalizada com seu nome/logo",
                    "Diferentes tamanhos e resoluções para diversos usos",
                    "Proteção contra download não autorizado"
                  ]
                }}
                benefits={{
                  title: "Benefícios das Fotos IA",
                  items: [
                    "Qualidade profissional sem custo de fotógrafo",
                    "Proteção contra uso indevido das suas fotos",
                    "Padronização visual de todo seu portfólio",
                    "Economia de tempo na edição manual",
                    "Destaque competitivo com imagens superiores"
                  ]
                }}
                useCases={{
                  title: "Aplicações práticas",
                  scenarios: [
                    {
                      title: "Imóveis mal iluminados",
                      description: "Fotos tiradas em condições ruins de luz são automaticamente melhoradas, destacando os pontos fortes do imóvel."
                    },
                    {
                      title: "Proteção de propriedade intelectual",
                      description: "Marca d'água impede que outros corretores usem suas fotos sem autorização, protegendo seu trabalho."
                    },
                    {
                      title: "Marketing profissional",
                      description: "Todas as imagens ficam com padrão visual consistente, transmitindo profissionalismo em todas as suas publicações."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Camera className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Fotos com IA</h3>
                  <p className="text-muted-foreground text-sm">
                    Melhoria automática de qualidade para destacar seus imóveis. Marca d'água exclusiva, protegendo suas fotos contra uso indevido.
                  </p>
                </div>
              </FeatureDetailDialog>

              <FeatureDetailDialog
                title="Mobiliário Virtual"
                description="Inteligência artificial Hugging Face para ambientação virtual com diferentes estilos decorativos"
                icon={<Sofa className="h-8 w-8 text-white" />}
                color="bg-gradient-to-br from-violet-500 to-purple-600"
                howItWorks={{
                  title: "Como funciona o Mobiliário Virtual",
                  items: [
                    "IA Hugging Face analisa o ambiente e dimensões do cômodo",
                    "Seleção entre diversos estilos: moderno, clássico, minimalista, rústico",
                    "Geração automática de ambientação realista",
                    "Múltiplas opções de decoração para o mesmo ambiente",
                    "Renderização em alta qualidade para apresentações"
                  ]
                }}
                benefits={{
                  title: "Vantagens do Mobiliário Virtual",
                  items: [
                    "Transformação de ambientes vazios em lares acolhedores",
                    "Maior apelo visual para potenciais compradores",
                    "Diferencial competitivo significativo",
                    "Custo zero comparado à decoração física",
                    "Versatilidade para diferentes públicos-alvo"
                  ]
                }}
                useCases={{
                  title: "Casos de uso do Mobiliário",
                  scenarios: [
                    {
                      title: "Imóveis vazios",
                      description: "Apartamento sem móveis fica difícil de visualizar. Com IA, cliente vê o potencial real do espaço com decoração adequada."
                    },
                    {
                      title: "Dificuldade de visualização",
                      description: "Cômodos com layout complexo ficam mais claros quando mobiliados virtualmente, ajudando cliente a imaginar possibilidades."
                    },
                    {
                      title: "Marketing premium",
                      description: "Imóveis de alto padrão ganham apresentação sofisticada com ambientação luxuosa, justificando valores mais altos."
                    }
                  ]
                }}
              >
                <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border animate-fade-in hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/25 transition-all duration-300 animate-float hover:animate-bounce">
                    <Sofa className="h-8 w-8 text-white animate-rotate-gentle" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Mobiliário Virtual (Plano Plus)</h3>
                  <p className="text-muted-foreground text-sm">
                    Mostre imóveis vazios já mobiliados virtualmente com inteligência Hugging Face, ajudando o cliente a visualizar todo o potencial do espaço.
                  </p>
                </div>
              </FeatureDetailDialog>
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
                   <AsaasPaymentButton 
                     planName="Básico"
                     planValue={97}
                     planId="basico"
                     className="bg-primary hover:bg-primary/90 text-white mt-4"
                   />
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
                   <AsaasPaymentButton 
                     planName="Profissional"
                     planValue={147}
                     planId="profissional"
                     className="bg-primary hover:bg-primary/90 text-white mt-4"
                   />
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
                   <AsaasPaymentButton 
                     planName="Premium"
                     planValue={197}
                     planId="premium"
                     className="bg-primary hover:bg-primary/90 text-white mt-4"
                   />
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
          <div className="mt-16 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-8">Parceiros & Convênios</h2>
            <div className="relative">
              <div className="flex animate-[scroll_20s_linear_infinite] gap-6">
                {/* First set of partnerships */}
                {partnerships.map((partnership) => (
                  <div key={`first-${partnership.id}`} className="flex-shrink-0 text-center group">
                    <div className="p-4 bg-card border rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 w-32 h-24 flex flex-col items-center justify-center shadow-md">
                      <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">{partnership.icon}</div>
                      <span className="text-xs font-medium text-muted-foreground leading-tight text-center">{partnership.name}</span>
                    </div>
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {partnerships.map((partnership) => (
                  <div key={`second-${partnership.id}`} className="flex-shrink-0 text-center group">
                    <div className="p-4 bg-card border rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 w-32 h-24 flex flex-col items-center justify-center shadow-md">
                      <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">{partnership.icon}</div>
                      <span className="text-xs font-medium text-muted-foreground leading-tight text-center">{partnership.name}</span>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Testimonials Section */}
        <TestimonialsSection />


        {/* Footer */}
      <footer className="border-t bg-slate-800 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Simuladores */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-300 mb-3">Simuladores Oficiais:</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              <a href="https://www.caixa.gov.br/voce/habitacao/simulador/Paginas/default.aspx" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                Caixa Econômica
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://www42.bb.com.br/portalbb/imobiliario/creditoimobiliario/simular,802,2250,2250.bbx" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                Banco do Brasil
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/encontre-seu-credito/simuladores-imoveis.shtm" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                Bradesco
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://www.itau.com.br/credito-financiamento/financiamentos/imoveis" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                Itaú
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://www.santander.com.br/credito-financiamento/financiamento-de-imoveis" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                Santander
              </a>
              <span className="text-slate-500">•</span>
              <a href="https://www.bancointer.com.br/credito-imobiliario/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
                Inter
              </a>
            </div>
          </div>
          
          {/* Info Principal */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img src={logoconectaiosImg} alt="ConectaIOS" className="h-6 w-6 rounded-full" />
            <span className="text-lg font-semibold">ConectaIOS</span>
            <span className="text-sm text-slate-300">• Ilhéus</span>
          </div>
          <p className="text-center text-sm text-slate-300">
            Plataforma exclusiva para corretores independentes
          </p>
        </div>
      </footer>
      </div>
    </PageWrapper>
  );
};

export default Index;
