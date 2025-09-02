import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Heart, 
  FileImage, 
  Wand2, 
  Bot, 
  Globe,
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';

export function SaibaMaisDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="text-lg px-8 py-6"
        >
          Saiba Mais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            ConectaIOS - Plataforma Completa para Corretores
          </DialogTitle>
          <DialogDescription>
            Descubra como o ConectaIOS revoluciona o mercado imobiliário
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-8">
            {/* Visão Geral */}
            <section>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                O que é o ConectaIOS?
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O ConectaIOS é uma plataforma revolucionária que conecta corretores de imóveis em uma rede 
                colaborativa inteligente. Nossa missão é simplificar, organizar e potencializar o trabalho 
                dos profissionais imobiliários através de tecnologia de ponta e inteligência artificial.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-primary/5 p-4 rounded-lg border">
                  <h4 className="font-semibold text-primary mb-2">Rede Colaborativa</h4>
                  <p className="text-sm text-muted-foreground">
                    Conecte-se com outros corretores e multiplique suas oportunidades de negócio
                  </p>
                </div>
                <div className="bg-brand-secondary/5 p-4 rounded-lg border">
                  <h4 className="font-semibold text-brand-secondary mb-2">IA Integrada</h4>
                  <p className="text-sm text-muted-foreground">
                    Inteligência artificial para matches automáticos e insights de mercado
                  </p>
                </div>
                <div className="bg-success/5 p-4 rounded-lg border">
                  <h4 className="font-semibold text-success mb-2">Tudo Integrado</h4>
                  <p className="text-sm text-muted-foreground">
                    CRM, gestão de imóveis, contratos e muito mais em uma única plataforma
                  </p>
                </div>
              </div>
            </section>

            {/* Funcionalidades Principais */}
            <section>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Funcionalidades Principais
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Users className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">CRM Avançado</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Gerencie leads, clientes e pipeline de vendas com sistema de scoring automático
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Building2 className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Gestão de Imóveis</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Controle total com níveis de visibilidade: público, parceiros ou privado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Heart className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Match Inteligente</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        IA conecta automaticamente clientes aos imóveis perfeitos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <MessageSquare className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Chat em Tempo Real</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comunicação instantânea e segura entre corretores e clientes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <FileImage className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Fotos Profissionais com IA</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Melhoria automática de qualidade + marca d'água de proteção
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Wand2 className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Virtual Staging</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Transforme imóveis vazios em ambientes mobiliados virtualmente
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Globe className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Mini Site Exclusivo</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Site profissional personalizado para fortalecer sua marca
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                    <Bot className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Assistente IA</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Insights de mercado, sugestões de preços e estratégias personalizadas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Diferenciais Tecnológicos */}
            <section>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Diferenciais Tecnológicos
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Arquitetura Cloud Escalável</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">IA com Hugging Face e OpenAI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Segurança de Dados LGPD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">API Integrada para Parceiros</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Backup Automático</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Sistema de Notificações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Mobile-First Design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="font-medium">Suporte 24/7</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Planos */}
            <section>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Planos Disponíveis
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <Badge className="mb-2">Mais Popular</Badge>
                  <h4 className="font-semibold text-lg">Básico</h4>
                  <p className="text-2xl font-bold text-primary">R$ 97/mês</p>
                  <p className="text-sm text-muted-foreground mb-3">Até 10 imóveis</p>
                  <ul className="text-sm space-y-1">
                    <li>• CRM completo</li>
                    <li>• Chat em tempo real</li>
                    <li>• Matches ilimitados</li>
                    <li>• Fotos com IA</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg">Profissional</h4>
                  <p className="text-2xl font-bold text-primary">R$ 147/mês</p>
                  <p className="text-sm text-muted-foreground mb-3">Até 50 imóveis + site</p>
                  <ul className="text-sm space-y-1">
                    <li>• Tudo do Básico</li>
                    <li>• Site personalizado</li>
                    <li>• Virtual Staging</li>
                    <li>• Contratos digitais</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg">Premium</h4>
                  <p className="text-2xl font-bold text-primary">R$ 197/mês</p>
                  <p className="text-sm text-muted-foreground mb-3">Orientação jurídica</p>
                  <ul className="text-sm space-y-1">
                    <li>• Tudo do Profissional</li>
                    <li>• Consultoria jurídica</li>
                    <li>• Relatórios avançados</li>
                    <li>• Prioridade no suporte</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="bg-gradient-to-r from-primary/10 to-brand-secondary/10 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Pronto para revolucionar suas vendas?</h3>
              <p className="text-muted-foreground mb-4">
                Junte-se a centenas de corretores que já transformaram seus negócios com o ConectaIOS
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                Começar Agora - 7 Dias Grátis
              </Button>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}