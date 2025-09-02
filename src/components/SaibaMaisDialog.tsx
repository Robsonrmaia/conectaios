import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, MessageSquare, TrendingUp, Shield, Heart, Wand2, FileImage, Star, CheckCircle } from 'lucide-react';

export function SaibaMaisDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="text-lg px-8 py-6 transition-all duration-300 hover:scale-105 hover:shadow-lg border-primary text-primary hover:bg-primary hover:text-white"
        >
          Saiba Mais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            ConectaIOS - Sua Plataforma Imobiliária Completa
          </DialogTitle>
          <DialogDescription className="text-lg">
            Descubra como revolucionar sua carreira no mercado imobiliário
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* O que é o ConectaIOS */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              O que é o ConectaIOS?
            </h3>
            <p className="text-muted-foreground mb-4">
              O ConectaIOS é uma plataforma inovadora que conecta corretores de imóveis em uma rede colaborativa, 
              oferecendo ferramentas avançadas de gestão, inteligência artificial e automação para maximizar 
              suas vendas e simplificar sua rotina profissional.
            </p>
          </section>

          {/* Como Funciona */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Como Funciona a Rede Colaborativa?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">1. Conexão entre Corretores</h4>
                <p className="text-sm text-muted-foreground">
                  Conecte-se com outros profissionais da sua região e amplie seu portfólio de imóveis disponíveis.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">2. Compartilhamento Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Compartilhe seus imóveis com outros corretores e tenha acesso a milhares de oportunidades.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">3. Matches Automáticos</h4>
                <p className="text-sm text-muted-foreground">
                  Nossa IA conecta automaticamente seus clientes aos imóveis perfeitos da rede.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">4. Rateio Transparente</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema de divisão de comissões claro e automático entre os corretores envolvidos.
                </p>
              </div>
            </div>
          </section>

          {/* Recursos Principais */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Recursos Principais
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-2">CRM Completo</h4>
                <p className="text-sm text-muted-foreground">
                  Gerencie leads, clientes e pipeline de vendas em um só lugar
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Gestão de Imóveis</h4>
                <p className="text-sm text-muted-foreground">
                  Organize seu portfólio com níveis de visibilidade flexíveis
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Chat em Tempo Real</h4>
                <p className="text-sm text-muted-foreground">
                  Comunique-se instantaneamente com clientes e parceiros
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <FileImage className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Fotos com IA</h4>
                <p className="text-sm text-muted-foreground">
                  Melhoria automática de qualidade e marca d'água exclusiva
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Wand2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Mobiliário Virtual</h4>
                <p className="text-sm text-muted-foreground">
                  Transforme imóveis vazios em espaços mobiliados com IA
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold mb-2">Site Exclusivo</h4>
                <p className="text-sm text-muted-foreground">
                  Tenha um site profissional para divulgar seus imóveis
                </p>
              </div>
            </div>
          </section>

          {/* Benefícios */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Por que Escolher o ConectaIOS?
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Aumente suas Vendas</h4>
                  <p className="text-sm text-muted-foreground">
                    Acesso a mais imóveis = mais oportunidades de negócio
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Economize Tempo</h4>
                  <p className="text-sm text-muted-foreground">
                    Automação inteligente reduz trabalho manual e burocracia
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Profissionalize seu Negócio</h4>
                  <p className="text-sm text-muted-foreground">
                    Ferramentas profissionais que impressionam seus clientes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Rede de Parceiros</h4>
                  <p className="text-sm text-muted-foreground">
                    Conecte-se com outros corretores e multiplique suas oportunidades
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center p-6 bg-gradient-to-r from-primary/10 to-brand-secondary/10 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              Pronto para Revolucionar sua Carreira?
            </h3>
            <p className="text-muted-foreground mb-4">
              Junte-se a centenas de corretores que já estão vendendo mais com o ConectaIOS
            </p>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = '/auth'}
            >
              Começar Agora - 7 Dias Grátis
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}