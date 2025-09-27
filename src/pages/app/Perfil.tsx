import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBroker } from '@/hooks/useBroker';
import BrokerSetupFixed from '@/components/BrokerSetupFixed';
import { MinisiteEditorIntegrated } from '@/components/MinisiteEditorIntegrated';
import MinisiteHelpGuide from '@/components/MinisiteHelpGuide';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Bell, 
  Shield, 
  CreditCard,
  Award,
  TrendingUp,
  Target
} from 'lucide-react';
import { AsaasTestButton } from '@/components/AsaasTestButton';
import { useImageUpload } from '@/hooks/useImageUpload';

export default function Perfil() {
  const { broker, updateBrokerProfile } = useBroker();
  const { createFileInput, isUploading } = useImageUpload();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    creci: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    secondaryPhone: '',
    instagram: '',
    linkedin: '',
    specialties: ''
  });

  const [notifications, setNotifications] = useState({
    emailLeads: true,
    emailDeals: true,
    emailMarketing: false,
    pushLeads: true,
    pushDeals: true,
    pushMarketing: false,
    smsImportant: true
  });

  // Update profile data when broker data changes
  useEffect(() => {
    if (broker) {
        setProfile({
          name: broker.name || '',
          email: broker.email || '',
          phone: broker.phone || '',
          creci: broker.creci || '',
          bio: broker.bio || '',
          location: '',
          website: '',
          avatar: broker.avatar_url || '',
          secondaryPhone: '',
          instagram: '',
          linkedin: '',
          specialties: ''
        });
    }
  }, [broker]);

  // If no broker profile exists, show the setup form
  if (!broker) {
    return <BrokerSetupFixed />;
  }

  const stats = {
    totalVendas: 45,
    comissaoTotal: 450000,
    avaliacaoMedia: 4.8,
    clientesAtivos: 23
  };

  const achievements = [
    {
      id: 1,
      title: 'Vendedor do Mês',
      description: 'Maior número de vendas em Janeiro 2024',
      icon: Award,
      earned: true,
      date: '2024-01-31'
    },
    {
      id: 2,
      title: 'Meta Batida',
      description: 'Atingiu 100% da meta trimestral',
      icon: Target,
      earned: true,
      date: '2024-01-15'
    },
    {
      id: 3,
      title: 'Cliente Satisfeito',
      description: 'Manteve avaliação 5 estrelas por 3 meses',
      icon: TrendingUp,
      earned: false,
      progress: 85
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações e configurações
          </p>
        </div>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth-tabs">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-12 gap-1 p-1 min-w-max">
            <TabsTrigger value="perfil" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Perfil</TabsTrigger>
            <TabsTrigger value="minisite" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Minisite</TabsTrigger>
            <TabsTrigger value="configuracoes" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Config</TabsTrigger>
            <TabsTrigger value="conquistas" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Awards</TabsTrigger>
            <TabsTrigger value="plano" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Plano</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="perfil" className="space-y-6">
          {/* Profile Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalVendas}</div>
                <div className="text-sm text-muted-foreground">Total de Vendas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-success break-words">
                {stats.comissaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
                <div className="text-sm text-muted-foreground">Comissão Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">{stats.avaliacaoMedia}</div>
                <div className="text-sm text-muted-foreground">Avaliação Média</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.clientesAtivos}</div>
                <div className="text-sm text-muted-foreground">Clientes Ativos</div>
              </CardContent>
            </Card>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle>Foto do Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col items-center space-y-3">
                  <Avatar className="w-24 h-24 mx-auto mb-4 aspect-square">
                      <AvatarImage 
                        src={broker?.avatar_url || profile.avatar} 
                        className="object-cover w-full h-full aspect-square" 
                      />
                      <AvatarFallback className="text-xl aspect-square">
                        {broker?.name?.charAt(0)?.toUpperCase() || profile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => {
                           const input = createFileInput('avatar');
                           input.click();
                         }} 
                         disabled={isUploading}
                         className="w-full sm:w-auto px-3 sm:px-4 text-sm sm:text-base min-h-[44px] touch-target"
                       >
                           <Camera className="h-4 w-4 mr-2" />
                           {isUploading ? 'Enviando...' : 'Alterar Foto'}
                         </Button>
                       <p className="text-xs text-muted-foreground mt-2">
                         PNG, JPG até 5MB
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>

            {/* Basic Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
                <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="name">Nome Completo</Label>
                     <Input
                       id="name"
                       value={profile.name}
                       onChange={(e) => setProfile({...profile, name: e.target.value})}
                       className="h-11"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       type="email"
                       value={profile.email}
                       onChange={(e) => setProfile({...profile, email: e.target.value})}
                       className="h-11"
                     />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="phone">Telefone</Label>
                       <Input
                         id="phone"
                         value={profile.phone}
                         onChange={(e) => setProfile({...profile, phone: e.target.value})}
                         className="h-11"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="secondary-phone">Telefone Secundário</Label>
                       <Input
                         id="secondary-phone"
                         value={profile.secondaryPhone || ''}
                         onChange={(e) => setProfile({...profile, secondaryPhone: e.target.value})}
                         placeholder="(opcional)"
                         className="h-11"
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="creci">CRECI</Label>
                       <Input
                         id="creci"
                         value={profile.creci}
                         onChange={(e) => setProfile({...profile, creci: e.target.value})}
                         className="h-11"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="location">Localização</Label>
                       <Input
                         id="location"
                         value={profile.location}
                         onChange={(e) => setProfile({...profile, location: e.target.value})}
                         placeholder="Cidade, Estado"
                         className="h-11"
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="website">Website</Label>
                       <Input
                         id="website"
                         value={profile.website}
                         onChange={(e) => setProfile({...profile, website: e.target.value})}
                         placeholder="https://seusiteimobiliario.com"
                         className="h-11"
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label htmlFor="instagram">Instagram</Label>
                         <Input
                           id="instagram"
                           value={profile.instagram || ''}
                           onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                           placeholder="@seuusuario"
                           className="h-11"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="linkedin">LinkedIn</Label>
                         <Input
                           id="linkedin"
                           value={profile.linkedin || ''}
                           onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                           placeholder="linkedin.com/in/perfil"
                           className="h-11"
                         />
                       </div>
                   </div>
                   <div className="space-y-2">
                         <Label htmlFor="specialties">Especialidades</Label>
                         <Input
                           id="specialties"
                           value={profile.specialties || ''}
                           onChange={(e) => setProfile({...profile, specialties: e.target.value})}
                           placeholder="Ex: Imóveis de luxo, Comercial, Residencial..."
                           className="h-11"
                         />
                   </div>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    rows={3}
                  />
                </div>
                  <Button 
                    onClick={async () => {
                      try {
                        await updateBrokerProfile({
                          name: profile.name,
                          email: profile.email,
                          phone: profile.phone,
                          bio: profile.bio,
                          creci: profile.creci
                        });
                        toast({
                          title: "Perfil atualizado!",
                          description: "Suas informações foram salvas com sucesso.",
                        });
                      } catch (error) {
                        console.error('Erro ao salvar perfil:', error);
                        toast({
                          title: "Erro",
                          description: "Erro ao salvar as alterações.",
                          variant: "destructive",
                        });
                      }
                    }}
                   className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto min-h-[44px] touch-target"
                 >
                   Salvar Alterações
                 </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="minisite" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Editor do Mini Site</CardTitle>
                  <CardDescription>
                    Personalize a aparência e configurações do seu mini site
                  </CardDescription>
                </div>
                <MinisiteHelpGuide />
              </div>
            </CardHeader>
            <CardContent>
              <MinisiteEditorIntegrated />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Email</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Novos Leads</Label>
                        <div className="text-sm text-muted-foreground">Quando você receber novos leads</div>
                      </div>
                      <Switch
                        checked={notifications.emailLeads}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailLeads: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Negociações</Label>
                        <div className="text-sm text-muted-foreground">Atualizações de negócios</div>
                      </div>
                      <Switch
                        checked={notifications.emailDeals}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailDeals: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing</Label>
                        <div className="text-sm text-muted-foreground">Novidades e promoções</div>
                      </div>
                      <Switch
                        checked={notifications.emailMarketing}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, emailMarketing: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Push</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Novos Leads</Label>
                        <div className="text-sm text-muted-foreground">Notificações no navegador</div>
                      </div>
                      <Switch
                        checked={notifications.pushLeads}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushLeads: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Negociações</Label>
                        <div className="text-sm text-muted-foreground">Atualizações de negócios</div>
                      </div>
                      <Switch
                        checked={notifications.pushDeals}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushDeals: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança
                </CardTitle>
                <CardDescription>
                  Configurações de segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autenticação de Dois Fatores</Label>
                      <div className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Senha</Label>
                      <div className="text-sm text-muted-foreground">Última alteração há 30 dias</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Alterar
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sessões Ativas</Label>
                      <div className="text-sm text-muted-foreground">Gerencie seus dispositivos conectados</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Todas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conquistas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Conquistas e Badges
              </CardTitle>
              <CardDescription>
                Acompanhe seu progresso e conquistas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <Card key={achievement.id} className={`relative ${
                      achievement.earned ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
                    }`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              achievement.earned ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{achievement.title}</CardTitle>
                              <CardDescription className="text-sm">{achievement.description}</CardDescription>
                            </div>
                          </div>
                          {achievement.earned && (
                            <Badge className="bg-primary">
                              Conquistado
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {achievement.earned ? (
                          <p className="text-sm text-muted-foreground">
                            Conquistado em{' '}
                            {new Date(achievement.date!).toLocaleDateString('pt-BR')}
                          </p>
                        ) : achievement.progress ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{achievement.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${achievement.progress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Continue trabalhando para conquistar este badge!</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plano Atual
                </CardTitle>
                <CardDescription>
                  Informações sobre sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-primary">Plano Trial</div>
                  <div className="text-muted-foreground">Gratuito por 30 dias</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Imóveis cadastrados</span>
                    <span>5 / 10</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-1/2" />
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full">
                    Fazer Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teste de Pagamento</CardTitle>
                <CardDescription>
                  Componente de teste para integração com Asaas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AsaasTestButton />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}