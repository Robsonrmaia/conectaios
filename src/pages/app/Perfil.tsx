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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBroker } from '@/hooks/useBroker';
import { useMinisite } from '@/hooks/useMinisite';
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
import { AsaasSubscriptionFlow } from '@/components/AsaasSubscriptionFlow';
import { useImageUpload } from '@/hooks/useImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { SubscriptionBlocker } from '@/components/SubscriptionBlocker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NextPaymentCard } from '@/components/NextPaymentCard';
import { SubscriptionPaymentHistory } from '@/components/SubscriptionPaymentHistory';

export default function Perfil() {
  const { broker, updateBrokerProfile } = useBroker();
  const { ensureMinisiteConfig } = useMinisite();
  const { createFileInput, isUploading } = useImageUpload();
  const { 
    isActive, 
    isTrial, 
    isOverdue, 
    isSuspended,
    daysUntilExpiration,
    getBlockMessage 
  } = useSubscriptionGuard();
  
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
          website: broker.website || '',
          avatar: broker.avatar_url || '',
          username: broker.username || '',
          secondaryPhone: '',
          instagram: broker.instagram || '',
          linkedin: broker.linkedin || '',
          specialties: broker.specialties || ''
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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-12 gap-1 p-1 min-w-max">
            <TabsTrigger value="perfil" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Perfil</TabsTrigger>
            <TabsTrigger value="minisite" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Minisite</TabsTrigger>
            <TabsTrigger value="assinatura" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap min-h-[44px] touch-target">Assinatura</TabsTrigger>
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
                        
                        // Get user session
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error('User not authenticated');

                        // Use RPC function for unified save
                        const { error } = await supabase.rpc('fn_profile_save', {
                          p_user_id: user.id,
                          p_name: profile.name?.trim() || null,
                          p_phone: profile.phone?.trim() || null,
                          p_bio: profile.bio?.trim() || null,
                          p_avatar_url: profile.avatar || null
                        });

                        if (error) throw error;

                        // After saving profile, ensure minisite config exists (best-effort)
                        try {
                          await ensureMinisiteConfig(user.id, profile);
                        } catch (minisiteError) {
                          console.warn('[Perfil] Minisite config creation failed (non-blocking):', minisiteError);
                          // Don't throw - this is best-effort provisioning
                        }
                        
                        if (import.meta.env.DEV) {
                          console.log('✅ Perfil: Profile saved successfully');
                        }
                        
                        toast({
                          title: "Perfil atualizado!",
                          description: "Suas informações foram salvas com sucesso.",
                        });
                      } catch (error: any) {
                        console.error('[Perfil] save error:', {
                          error,
                          message: error?.message,
                          code: error?.code,
                          details: error?.details,
                          hint: error?.hint
                        });
                        toast({
                          title: "Erro",
                          description: error?.message || "Erro ao salvar as alterações.",
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

        <TabsContent value="assinatura" className="space-y-6">
          {/* Status da Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Assinatura</CardTitle>
              <CardDescription>
                Gerencie sua assinatura e acompanhe pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Card de Status Atual */}
              <div className="p-6 rounded-lg border-2 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Status Atual
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {broker?.subscription_status === 'active' && 'Sua assinatura está ativa e funcionando perfeitamente'}
                      {broker?.subscription_status === 'trial' && 'Você está no período de teste gratuito'}
                      {broker?.subscription_status === 'overdue' && 'Seu pagamento está pendente'}
                      {broker?.subscription_status === 'suspended' && 'Sua assinatura está suspensa'}
                    </p>
                  </div>
                  
                  <Badge 
                    variant={
                      isActive ? 'default' : 
                      isTrial ? 'secondary' : 
                      isOverdue ? 'outline' : 
                      'destructive'
                    }
                    className="text-base px-4 py-2"
                  >
                    {isActive && '✓ Ativa'}
                    {isTrial && '🎁 Trial'}
                    {isOverdue && '⏰ Atrasada'}
                    {isSuspended && '🔒 Suspensa'}
                  </Badge>
                </div>
                
                {/* Informações de Vencimento */}
                {broker?.subscription_expires_at && (
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Próxima cobrança</p>
                        <p className="text-lg font-semibold">
                          {format(new Date(broker.subscription_expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      
                      {daysUntilExpiration !== null && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {daysUntilExpiration > 0 ? 'Tempo restante' : 'Dias em atraso'}
                          </p>
                          <p className={`text-lg font-semibold ${
                            daysUntilExpiration > 7 ? 'text-success' : 
                            daysUntilExpiration > 0 ? 'text-warning' : 
                            'text-destructive'
                          }`}>
                            {daysUntilExpiration > 0 
                              ? `${daysUntilExpiration} dia${daysUntilExpiration !== 1 ? 's' : ''}`
                              : `${Math.abs(daysUntilExpiration)} dia${Math.abs(daysUntilExpiration) !== 1 ? 's' : ''} atrasado`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Ações Rápidas */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => window.location.href = '/app/checkout'}
                    className="flex-1"
                    variant={isOverdue || isSuspended ? 'default' : 'outline'}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isOverdue || isSuspended ? 'Regularizar Pagamento' : 'Atualizar Plano'}
                  </Button>
                  
                  {broker?.referral_code && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(broker.referral_code || '');
                        toast({
                          title: "Código copiado!",
                          description: "Compartilhe com outros corretores para ganhar benefícios",
                        });
                      }}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Código de Indicação: {broker.referral_code}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Bloqueador se necessário */}
              {(isOverdue || isSuspended) && (
                <SubscriptionBlocker
                  status={isSuspended ? 'suspended' : 'overdue'}
                  daysOverdue={daysUntilExpiration ? Math.abs(daysUntilExpiration) : 0}
                  message={getBlockMessage()}
                />
              )}
              
              {/* Informações do Plano */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {isTrial ? 'Trial' : 'Premium'}
                    </div>
                    <div className="text-sm text-muted-foreground">Plano Atual</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-success mb-2">
                      R$ 97,00
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Mensal</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold mb-2">
                      {isActive || isTrial ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-muted-foreground">Acesso Total</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Nota de rodapé */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  💳 Pagamentos processados de forma segura via Asaas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard de Pagamentos - Só renderiza se broker estiver carregado */}
          {broker?.id && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <NextPaymentCard />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo da Conta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plano Atual</span>
                      <span className="font-semibold">
                        {isTrial ? 'Trial Gratuito' : 'Premium'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valor Mensal</span>
                      <span className="font-semibold text-primary">
                        R$ 97,00/mês
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Cliente desde</span>
                      <span className="font-semibold">
                        {format(new Date(), 'MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = '/app/checkout'}
                    >
                      Alterar Plano
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico Completo de Pagamentos */}
              <SubscriptionPaymentHistory />
            </>
          )}
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
          {broker?.subscription_status && broker.subscription_status !== 'trial' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Meu Plano Ativo
                </CardTitle>
                <CardDescription>
                  Gerencie sua assinatura atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Plano Atual</h3>
                    <Badge className="bg-primary/20 text-primary">
                      {broker.subscription_status === 'active' ? 'Ativo' : broker.subscription_status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {broker.subscription_expires_at && (
                      <p>Próxima cobrança: {new Date(broker.subscription_expires_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://www.asaas.com/login', '_blank')}
                    className="w-full sm:w-auto"
                  >
                    Gerenciar no Asaas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AsaasSubscriptionFlow />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}