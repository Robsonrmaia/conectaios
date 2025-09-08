import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HelpCircle, 
  User, 
  Home, 
  MessageCircle, 
  Settings, 
  Eye, 
  Share2,
  Palette,
  Phone,
  Camera,
  Building2
} from 'lucide-react';

interface MinisiteHelpGuideProps {
  children?: React.ReactNode;
}

export default function MinisiteHelpGuide({ children }: MinisiteHelpGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const helpSections = [
    {
      id: 'profile',
      title: 'Configuração do Perfil',
      icon: User,
      description: 'Como personalizar suas informações pessoais',
      items: [
        'Adicione sua foto de perfil clicando no avatar',
        'Preencha seu nome, CRECI e biografia',
        'Configure seus contatos: telefone, WhatsApp e email',
        'Defina seu username para ter uma URL personalizada'
      ]
    },
    {
      id: 'properties',
      title: 'Gerenciar Imóveis',
      icon: Home,
      description: 'Como adicionar e configurar seus imóveis',
      items: [
        'Vá para a seção "Imóveis" no menu lateral',
        'Clique em "Adicionar Imóvel" para cadastrar novos imóveis',
        'Configure a visibilidade como "Site Público" para aparecer no minisite',
        'Adicione fotos de qualidade e descrições detalhadas'
      ]
    },
    {
      id: 'design',
      title: 'Personalização Visual',
      icon: Palette,
      description: 'Como customizar a aparência do seu minisite',
      items: [
        'Escolha um template que combine com seu estilo',
        'Personalize as cores primária e secundária',
        'Configure quais seções aparecer: imóveis, sobre, contato',
        'Adicione uma mensagem personalizada para os visitantes'
      ]
    },
    {
      id: 'sharing',
      title: 'Compartilhamento',
      icon: Share2,
      description: 'Como compartilhar seu minisite',
      items: [
        'Copie o link do seu minisite clicando em "Copiar Link"',
        'Compartilhe nas redes sociais e WhatsApp',
        'Use o QR Code para facilitar o acesso em eventos',
        'Adicione o link na sua assinatura de email'
      ]
    }
  ];

  const tips = [
    {
      title: 'Foto de Capa',
      description: 'Adicione uma imagem de capa para tornar seu minisite mais atrativo',
      icon: Camera
    },
    {
      title: 'Imóveis em Destaque',
      description: 'Marque seus melhores imóveis como "Destaque" para aparecerem primeiro',
      icon: Building2
    },
    {
      title: 'Contato Direto',
      description: 'Configure o WhatsApp para receber leads diretamente no seu celular',
      icon: Phone
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Guia do Minisite
          </DialogTitle>
          <DialogDescription>
            Aprenda como configurar e personalizar seu minisite profissional
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guide">Guia Passo a Passo</TabsTrigger>
            <TabsTrigger value="tips">Dicas Importantes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="space-y-4">
            <div className="grid gap-4">
              {helpSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <Icon className="h-5 w-5" />
                        {section.title}
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4">
            <div className="grid gap-4">
              {tips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {tip.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Visualize Sempre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Use o botão "Ver Minisite" regularmente para verificar como suas alterações 
                  ficam na visão dos seus clientes. Teste em diferentes dispositivos!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end pt-4">
          <Button onClick={() => setIsOpen(false)}>
            Entendi!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}