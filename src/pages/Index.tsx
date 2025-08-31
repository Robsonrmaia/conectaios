import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Users, MessageSquare, TrendingUp, Shield, Heart } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              ConectaIOS
            </span>
          </div>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90"
          >
            Entrar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            A plataforma dos{' '}
            <span className="bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              corretores de Ilhéus
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Conecte-se com outros corretores, gerencie seus imóveis, 
            encontre matches inteligentes e feche mais negócios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-brand-secondary hover:opacity-90 text-lg px-8 py-6"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6"
            >
              Saiba Mais
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Imóveis</h3>
              <p className="text-muted-foreground">
                Controle total dos seus imóveis com diferentes níveis de visibilidade
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
              <div className="w-12 h-12 bg-brand-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-brand-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Match Inteligente</h3>
              <p className="text-muted-foreground">
                IA conecta automaticamente clientes aos imóveis ideais
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat em Tempo Real</h3>
              <p className="text-muted-foreground">
                Comunique-se instantaneamente com clientes e parceiros
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">CRM Completo</h3>
              <p className="text-muted-foreground">
                Gerencie leads, clientes e pipeline de vendas
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Negociações</h3>
              <p className="text-muted-foreground">
                Gerencie deals com rateio flexível e contratos automáticos
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
              <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mini Site</h3>
              <p className="text-muted-foreground">
                Seu site personalizado para divulgar imóveis
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur-sm mt-16">
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
  );
};

export default Index;
