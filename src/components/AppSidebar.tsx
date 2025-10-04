import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useGamification } from '@/hooks/useGamification';
import { useChatExternal } from '@/hooks/useChatExternal';
import { GamificationBadge } from '@/components/GamificationBadge';
import { GamificationFeatureFlag } from '@/components/GamificationFeatureFlag';
import logoconectaiosImg from '@/assets/logoconectaios.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  HandHeart,
  Wrench,
  Video,
  Gift,
  Handshake,
  Settings,
  User,
  Bot,
  Shield,
  Search,
  FileText,
  Activity,
  HelpCircle,
  Trophy,
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/app',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: 'Meus Imóveis',
    url: '/app/imoveis',
    icon: Building2,
  },
  {
    title: 'Minhas Buscas',
    url: '/app/minhas-buscas',
    icon: Search,
  },
  {
    title: 'Marketplace',
    url: '/app/marketplace',
    icon: Search,
  },
  {
    title: 'Match',
    url: '/app/match',
    icon: HandHeart,
  },
  {
    title: 'Negociações',
    url: '/app/deals',
    icon: FileText,
  },
  {
    title: 'Mensagens',
    url: '/app/inbox', // Mantido para compatibilidade, mas será interceptado
    icon: MessageSquare,
    isExternal: true, // Flag para indicar que abre chat externo
  },
  {
    title: 'CRM',
    url: '/app/crm',
    icon: Users,
  },
];

const toolsItems = [
  {
    title: 'Ferramentas',
    url: '/app/ferramentas',
    icon: Wrench,
  },
  {
    title: 'Gamificação',
    url: '/app/gamificacao',
    icon: Trophy,
  },
  {
    title: 'Vídeos',
    url: '/app/videos',
    icon: Video,
  },
  {
    title: 'Indique e Ganhe',
    url: '/app/indicacoes',
    icon: Gift,
  },
  {
    title: 'Patrocínios',
    url: '/app/patrocinios',
    icon: Handshake,
  },
  {
    title: 'IA Assistant',
    url: '/app/ai-assistant',
    icon: Bot,
  },
];

const configItems = [
  {
    title: 'Perfil',
    url: '/app/perfil',
    icon: User,
  },
  {
    title: 'Social Conecta',
    url: 'http://social.conectaios.com.br',
    icon: Users,
    external: true,
  },
  {
    title: 'Central de Ajuda',
    url: '/app/ajuda',
    icon: HelpCircle,
  },
  {
    title: 'Suporte',
    url: '/app/suporte',
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useAdminAuth();
  const { stats } = useGamification();
  const { openChat } = useChatExternal();

  const isActive = (url: string, exact = false) => {
    if (exact) return currentPath === url;
    return currentPath.startsWith(url);
  };

  const getNavClassName = (url: string, exact = false) => {
    return isActive(url, exact) 
      ? 'bg-primary text-primary-foreground font-medium' 
      : 'hover:bg-accent hover:text-accent-foreground';
  };

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r"
    >
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center justify-center">
            <img 
              src={logoconectaiosImg} 
              alt="ConectaIOS" 
              className="h-8 w-auto object-contain" 
            />
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {(item as any).isExternal ? (
                      <button
                        type="button"
                        onClick={() => openChat()}
                        className="w-full hover:bg-accent hover:text-accent-foreground flex items-center"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url, item.exact)}
                        data-tour={item.title === 'Dashboard' ? 'dashboard' : 
                                   item.title === 'Meus Imóveis' ? 'properties' : 
                                   item.title === 'CRM' ? 'crm' : undefined}
                       >
                         <item.icon className="h-4 w-4" />
                         <span>{item.title}</span>
                       </NavLink>
                    )}
                   </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      data-tour={item.title === 'Ferramentas' ? 'tools' : undefined}
                     >
                       <item.icon className="h-4 w-4" />
                       <span>{item.title}</span>
                       {item.title === 'Gamificação' ? (
                         <GamificationFeatureFlag>
                           <GamificationBadge 
                             tier={stats.tier}
                             badges={stats.badges}
                             pontos={stats.pontos}
                             size="sm"
                             showTooltip={false}
                             className="ml-2"
                           />
                         </GamificationFeatureFlag>
                       ) : null}
                     </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {(item as any).external ? (
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:bg-accent hover:text-accent-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url)}
                        data-tour={item.title === 'Perfil' && item.url === '/app/perfil' ? 'minisite' : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/app/admin" 
                      className={getNavClassName('/app/admin')}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Administração</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}