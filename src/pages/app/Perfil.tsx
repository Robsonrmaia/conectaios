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
import BrokerSetup from '@/components/BrokerSetup';
import { MinisiteEditorIntegrated } from '@/components/MinisiteEditorIntegrated';
import MinisiteHelpGuide from '@/components/MinisiteHelpGuide';
import { toast } from '@/components/ui/use-toast';
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
    username: '',
    secondaryPhone: '',
    instagram: '',
    linkedin: '',
    specialties: ''
  });

  // If no broker profile exists, show the setup form
  if (!broker) {
    return <BrokerSetup />;
  }

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
          username: broker.username || '',
          secondaryPhone: '',
          instagram: '',
          linkedin: '',
          specialties: ''
        });
    }
  }, [broker]);

  const [notifications, setNotifications] = useState({
    emailLeads: true,
    emailDeals: true,
    emailMarketing: false,
    pushLeads: true,
    pushDeals: true,
    pushMarketing: false,
    smsImportant: true
  });

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
                       <Label htmlFor="username">Username</Label>
                       <Input
                         id="username"
                         value={profile.username}
                         onChange={(e) => setProfile({...profile, username: e.target.value})}
                         placeholder="seunome_corretor"
                         className="h-11"
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="location">Localização</Label>
                       <Input
                         id="location"
                         value={profile.location}
                         onChange={(e) => setProfile({...profile, location: e.target.value})}
                         className="h-11"
                       />
                     </div>
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
                        if (import.meta.env.DEV) {
                          console.log('💾 Perfil: Saving profile changes...');
                        }
                        
                        await updateBrokerProfile({
                          name: profile.name,
                          email: profile.email,
                          phone: profile.phone,
                          bio: profile.bio,
                          creci: profile.creci,
                          username: profile.username
                        });
                        
                        if (import.meta.env.DEV) {
                          console.log('✅ Perfil: Profile saved successfully');
                        }
                        
                        toast({
                          title: "Perfil atualizado!",
                          description: "Suas informações foram salvas com sucesso.",
                        });
                      } catch (error) {
                        if (import.meta.env.DEV) {
                          console.error('❌ Perfil save error:', error);
                        }
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
                        <div className="text-sm text-muted-foreground">Atualizações sobre suas negociações</div>
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
                        <div className="text-sm text-muted-foreground">Novidades e dicas de vendas</div>
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
                  <h4 className="font-medium mb-3">Push Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Leads Importantes</Label>
                      <Switch
                        checked={notifications.pushLeads}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushLeads: checked})
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Negociações</Label>
                      <Switch
                        checked={notifications.pushDeals}
                        onCheckedChange={(checked) => 
                          setNotifications({...notifications, pushDeals: checked})
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">SMS</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Apenas Urgente</Label>
                      <div className="text-sm text-muted-foreground">Leads muito qualificados</div>
                    </div>
                    <Switch
                      checked={notifications.smsImportant}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, smsImportant: checked})
                      }
                    />
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
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade será disponibilizada em breve.",
                  });
                }}>
                  Alterar Senha
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  toast({
                    title: "Em desenvolvimento", 
                    description: "Funcionalidade será disponibilizada em breve.",
                  });
                }}>
                  Configurar 2FA
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  toast({
                    title: "Em desenvolvimento",
                    description: "Funcionalidade será disponibilizada em breve.",
                  });
                }}>
                  Sessões Ativas
                </Button>
                <Separator />
                <Button variant="destructive" className="w-full">
                  Excluir Conta
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conquistas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suas Conquistas</CardTitle>
              <CardDescription>
                Marcos e conquistas na plataforma ConectaIOS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 border rounded-lg ${
                        achievement.earned ? 'bg-success/5 border-success/20' : 'bg-muted/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${
                          achievement.earned ? 'bg-success/20' : 'bg-muted/50'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            achievement.earned ? 'text-success' : 'text-muted-foreground'
                          }`} />
                        </div>
                        {achievement.earned && (
                          <Badge className="bg-success/20 text-success">
                            Conquistado
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      {achievement.earned ? (
                        <div className="text-xs text-success">
                          Conquistado em {new Date(achievement.date!).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Progresso: {achievement.progress}%
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Meu Plano
              </CardTitle>
              <CardDescription>
                Gerencie sua assinatura e forma de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Plano Profissional</h3>
                  <Badge className="bg-primary/20 text-primary">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Acesso completo a todas as funcionalidades da plataforma
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">R$ 197/mês</div>
                    <div className="text-sm text-muted-foreground">Próxima cobrança: 15/02/2024</div>
                  </div>
                  <Button variant="outline">
                    Gerenciar Plano
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Funcionalidades Incluídas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    CRM Completo
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    Match IA Ilimitado
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    Assistente IA
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    Analytics Avançado
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    Suporte Prioritário
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    Integrações Completas
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Forma de Pagamento</h4>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Cartão terminado em 1234</div>
                    <div className="text-sm text-muted-foreground">Expira em 12/2027</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Alterar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}