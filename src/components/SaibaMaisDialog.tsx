import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, MessageSquare, TrendingUp, Shield, Heart, Wand2, FileImage, Star, CheckCircle } from 'lucide-react';

export function SaibaMaisDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-sm px-4 py-2 border-2 border-white bg-white text-primary hover:bg-white/90 hover:text-primary font-semibold transition-all duration-300 hover:scale-105"
        >
          Saiba Mais
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white mx-auto">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-primary">
            ConectaIOS - Sua Plataforma Imobiliária Completa
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra como revolucionar sua carreira no mercado imobiliário com tecnologia de ponta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 sm:space-y-8 py-4">
          {/* Introdução - O Problema */}
          <section className="bg-red-50 p-4 sm:p-6 rounded-lg border-l-4 border-red-500">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-red-700">
              Você já viveu essa situação?
            </h3>
            <div className="space-y-3 text-sm sm:text-base text-muted-foreground">
              <p>🎯 Você já perdeu um cliente porque não tinha exatamente o imóvel que ele buscava?</p>
              <p>💰 Ou já deixou de fechar negócio porque não conseguiu alinhar rápido com outro corretor a divisão justa da comissão?</p>
              <p className="font-semibold text-red-600">
                Se sim, você sabe exatamente a dor que todo corretor independente enfrenta: trabalhar sozinho, com poucas ferramentas, 
                correndo o risco de perder tempo e oportunidades.
              </p>
              <p className="text-base sm:text-lg font-semibold text-primary">
                O Conecta IOS nasceu para mudar esse cenário.
              </p>
            </div>
          </section>

          {/* O que é o ConectaIOS */}
          <section>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              O que é o Conecta IOS
            </h3>
            <div className="bg-primary/5 p-4 sm:p-6 rounded-lg">
              <p className="text-base sm:text-lg mb-4">
                O Conecta IOS é um <strong>portal fechado, exclusivo para corretores de imóveis</strong>, 
                feito para conectar profissionais, imóveis e clientes em um só lugar.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                Aqui, você encontra tudo que precisa para trabalhar de forma organizada, justa e colaborativa:
              </p>
            </div>
          </section>

          {/* Recursos Principais - Simplificado para mobile */}
          <section>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2 text-primary">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
              Principais recursos
            </h3>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Cadastro de imóveis inteligente
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Controle total da visibilidade: oculto, apenas para match ou público no seu mini site.
                </p>
              </div>

              <div className="border rounded-lg p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Mini site exclusivo
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Até 50 imóveis publicados com formulário de contato e compartilhamento WhatsApp.
                </p>
              </div>

              <div className="border rounded-lg p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  CRM completo
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gerencie clientes, oportunidades e tarefas em um kanban organizado.
                </p>
              </div>

              <div className="border rounded-lg p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Match inteligente
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  IA cruza preferências de clientes com imóveis disponíveis automaticamente.
                </p>
              </div>

              <div className="border rounded-lg p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Negociações transparentes
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Acordos documentados com divisão flexível de comissão entre corretores.
                </p>
              </div>

              <div className="border rounded-lg p-4 sm:p-6">
                <h4 className="font-bold text-base sm:text-lg mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Chat em tempo real
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Converse diretamente com outros corretores dentro da plataforma.
                </p>
              </div>
            </div>
          </section>

          {/* Por que usar - Simplificado */}
          <section className="bg-green-50 p-4 sm:p-6 rounded-lg">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-green-700">
              🚀 Por que usar o Conecta IOS?
            </h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-red-500">
                <p className="font-semibold text-red-600 text-sm sm:text-base">Chega de perder cliente por não ter o imóvel certo.</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-orange-500">
                <p className="font-semibold text-orange-600 text-sm sm:text-base">Chega de acordos informais que viram problema.</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded border-l-4 border-red-500">
                <p className="font-semibold text-red-600 text-sm sm:text-base">Chega de trabalhar sem organização.</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-green-100 rounded-lg">
              <h4 className="text-lg sm:text-xl font-bold text-green-700 mb-3 sm:mb-4">
                No Conecta IOS, você terá:
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Organização completa dos imóveis</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Mais oportunidades com match IA</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Acordos documentados e seguros</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Presença profissional online</span>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action Final */}
          <section className="text-center p-6 sm:p-8 bg-primary rounded-lg text-white">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              ⚡ Transforme sua carreira agora
            </h3>
            <p className="text-base sm:text-lg mb-6">
              Seja protagonista do mercado imobiliário de Ilhéus e região. 
              Organize-se, conecte-se e multiplique suas oportunidades.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              className="text-primary font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/auth"}
            >
              🚀 Comece sua transformação!
            </Button>
            <p className="text-xs sm:text-sm mt-4 opacity-90">
              Experimente grátis por 7 dias - Sem compromisso
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}