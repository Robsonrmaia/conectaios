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
          className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-white/30 bg-white text-primary hover:bg-white/90 hover:text-primary backdrop-blur-sm font-semibold"
        >
          Saiba Mais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-brand-secondary rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
            ConectaIOS - Sua Plataforma Imobiliária Completa
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra como revolucionar sua carreira no mercado imobiliário com tecnologia de ponta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Introdução - O Problema */}
          <section className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-l-4 border-red-500">
            <h3 className="text-xl font-semibold mb-4 text-red-700">
              Você já viveu essa situação?
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <p>🎯 Você já perdeu um cliente porque não tinha exatamente o imóvel que ele buscava?</p>
              <p>💰 Ou já deixou de fechar negócio porque não conseguiu alinhar rápido com outro corretor a divisão justa da comissão?</p>
              <p className="font-semibold text-red-600">
                Se sim, você sabe exatamente a dor que todo corretor independente enfrenta: trabalhar sozinho, com poucas ferramentas, 
                correndo o risco de perder tempo e oportunidades.
              </p>
              <p className="text-lg font-semibold text-primary">
                O Conecta IOS nasceu para mudar esse cenário.
              </p>
            </div>
          </section>

          {/* O que é o ConectaIOS */}
          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
              <Building2 className="h-6 w-6" />
              O que é o Conecta IOS
            </h3>
            <div className="bg-gradient-to-r from-primary/5 to-brand-secondary/5 p-6 rounded-lg">
              <p className="text-lg mb-4">
                O Conecta IOS é um <strong>portal fechado, exclusivo para corretores de imóveis</strong>, 
                feito para conectar profissionais, imóveis e clientes em um só lugar.
              </p>
              <p className="text-muted-foreground">
                Aqui, você encontra tudo que precisa para trabalhar de forma organizada, justa e colaborativa:
              </p>
            </div>
          </section>

          {/* Recursos Detalhados */}
          <section>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Recursos Completos da Plataforma
            </h3>
            
            <div className="space-y-6">
              {/* Cadastro de Imóveis */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  📋 Cadastro de imóveis com opções de visibilidade
                </h4>
                <div className="grid md:grid-cols-3 gap-4 ml-6">
                  <div className="p-3 bg-gray-50 rounded">
                    <strong className="text-red-600">Oculto (Hidden):</strong>
                    <p className="text-sm text-muted-foreground">só você enxerga, para controle interno.</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <strong className="text-blue-600">Match Only:</strong>
                    <p className="text-sm text-muted-foreground">aparece apenas no motor de compatibilidade com clientes.</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <strong className="text-green-600">Público (Site):</strong>
                    <p className="text-sm text-muted-foreground">aparece no seu mini site personalizado.</p>
                  </div>
                </div>
              </div>

              {/* Mini Site */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  🌐 Mini site exclusivo para cada corretor
                </h4>
                <ul className="ml-6 space-y-2 text-muted-foreground">
                  <li>• Até 50 imóveis publicados</li>
                  <li>• Formulário de contato integrado</li>
                  <li>• Compartilhamento direto pelo WhatsApp</li>
                </ul>
              </div>

              {/* CRM */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  📊 CRM integrado
                </h4>
                <ul className="ml-6 space-y-2 text-muted-foreground">
                  <li>• Cadastre clientes</li>
                  <li>• Acompanhe oportunidades</li>
                  <li>• Organize seu pipeline em um kanban simples</li>
                  <li>• Registre tarefas e notas</li>
                </ul>
              </div>

              {/* Match Inteligente */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  🎯 Match inteligente
                </h4>
                <p className="ml-6 text-muted-foreground">
                  O sistema cruza automaticamente preferências de clientes com imóveis disponíveis, 
                  acelerando seu processo de atendimento.
                </p>
              </div>

              {/* Negociações */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  🤝 Negociações transparentes
                </h4>
                <p className="ml-6 text-muted-foreground mb-3">
                  Crie acordos com outros corretores com divisão flexível de comissão (50/50, 60/40 ou até 3 partes).
                </p>
                <p className="ml-6 text-sm text-muted-foreground">
                  Tudo documentado em contrato simples em PDF, válido como um acordo de cavalheiros.
                </p>
              </div>

              {/* Chat */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  💬 Chat interno em tempo real
                </h4>
                <p className="ml-6 text-muted-foreground">
                  Converse diretamente com outros corretores dentro da plataforma, 
                  sem depender de grupos soltos de WhatsApp.
                </p>
              </div>

              {/* Ferramentas Extras */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  🛠️ Ferramentas extras por plano
                </h4>
                <ul className="ml-6 space-y-2 text-muted-foreground">
                  <li>• Simuladores de financiamento</li>
                  <li>• Guia de bairros</li>
                  <li>• Relatórios</li>
                  <li>• E muito mais</li>
                </ul>
              </div>

              {/* Conteúdo Promocional */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  📢 Conteúdo promocional
                </h4>
                <ul className="ml-6 space-y-2 text-muted-foreground">
                  <li>• Banners de lançamentos</li>
                  <li>• Convênios</li>
                  <li>• Vídeos demonstrativos</li>
                  <li>• Programa Indique e Ganhe</li>
                </ul>
              </div>

              {/* Billing */}
              <div className="border rounded-lg p-6">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  💳 Billing recorrente via Asaas
                </h4>
                <p className="ml-6 text-muted-foreground">
                  Sua assinatura é simples, segura e sem burocracia.
                </p>
              </div>
            </div>
          </section>

          {/* Por que usar */}
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-6 text-green-700">
              🚀 Por que usar o Conecta IOS?
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border-l-4 border-red-500">
                <h4 className="font-semibold text-red-600 mb-2">Chega de perder cliente porque você não tinha o imóvel certo.</h4>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-orange-500">
                <h4 className="font-semibold text-orange-600 mb-2">Chega de acordos no boca a boca, sem registro, que depois viram dor de cabeça.</h4>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-red-500">
                <h4 className="font-semibold text-red-600 mb-2">Chega de trabalhar no improviso sem CRM, sem histórico e sem organização.</h4>
              </div>
            </div>

            <div className="mt-6 p-6 bg-green-100 rounded-lg">
              <h4 className="text-xl font-bold text-green-700 mb-4">
                No Conecta IOS, você terá visibilidade, credibilidade e praticidade:
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <span>Organiza seu estoque de imóveis</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <span>Amplia suas chances de fechamento com o motor de match</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <span>Garante acordos claros e registrados com outros corretores</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <span>Mostra profissionalismo ao cliente final com seu mini site exclusivo</span>
                </div>
              </div>
            </div>
          </section>

          {/* O que você ganha */}
          <section className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-6 text-blue-700">
              🎁 O que você ganha assinando agora
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                <span>Um ambiente profissional e seguro para crescer como corretor</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                <span>Mais oportunidades de fechamento ao estar conectado a outros profissionais</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                <span>Organização do seu dia a dia com CRM integrado</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                <span>Um mini site pronto, sem precisar contratar desenvolvedor</span>
              </div>
            </div>
          </section>

          {/* Call to Action Final */}
          <section className="text-center p-8 bg-gradient-to-r from-primary to-brand-secondary rounded-lg text-white">
            <h3 className="text-2xl font-bold mb-4">
              ⚡ A decisão está nas suas mãos
            </h3>
            <div className="space-y-4 mb-6">
              <p className="text-lg">
                Enquanto muitos corretores ainda estão perdendo tempo em planilhas, grupos informais e acordos de boca, 
                você pode estar à frente: <strong>organizado, conectado e com mais oportunidades de negócio.</strong>
              </p>
              <p className="text-lg">
                O Conecta IOS foi criado para quem quer ser <strong>protagonista do mercado imobiliário de Ilhéus e região.</strong>
              </p>
            </div>
            <Button 
              size="lg"
              variant="secondary"
              className="text-primary font-bold text-lg px-8 py-4 hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/auth"}
            >
              🚀 Assine agora e transforme a forma como você trabalha!
            </Button>
            <p className="text-sm mt-4 opacity-90">
              Experimente grátis por 7 dias - Sem compromisso
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}