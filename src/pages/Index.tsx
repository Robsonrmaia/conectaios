import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { AutoCarousel } from '@/components/AutoCarousel';
import { DevelopmentCarousel } from '@/components/DevelopmentCarousel';
import AnimatedBackground from '@/components/AnimatedBackground';
import ConectaLogo from '@/components/ConectaLogo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from '@/components/PageWrapper';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <PageWrapper>
      <div className="relative min-h-screen">
        <AnimatedBackground />
        
        <div className="relative z-10">
          {/* Header */}
          <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <ConectaLogo className="h-8 w-auto" />
              <div className="flex items-center gap-4">
                {user ? (
                  <Button onClick={() => navigate('/app')}>
                    Dashboard
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/auth')}>
                    Entrar
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
                A Revolução do Mercado Imobiliário
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-6">
                ConectaIOS
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                A plataforma completa para corretores de imóveis. Gerencie propriedades, 
                conecte-se com clientes e revolucione seu negócio.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Começar Agora
                </Button>
              </div>
            </div>
          </section>

          {/* Carousels */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AutoCarousel properties={[]} onPropertyClick={() => {}} />
            </div>
          </section>

          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <DevelopmentCarousel />
            </div>
          </section>

          {/* Features */}
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary">Gestão Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Gerencie todos os seus imóveis em uma plataforma única e intuitiva.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary">Conexões Inteligentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Conecte-se com outros corretores e amplie sua rede de negócios.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary">Ferramentas Avançadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Use IA para descrições, staging virtual e muito mais.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Testimonials */}
          <TestimonialsSection />
        </div>
      </div>
    </PageWrapper>
  );
};

export default Index;