import { NavLink, useLocation } from 'react-router-dom';
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
    url: '/app/inbox',
    icon: MessageSquare,
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
    title: 'Logs de Auditoria',
    url: '/app/audit-logs',
    icon: Activity,
  },
  {
    title: 'Admin',
    url: '/app/admin',
    icon: Shield,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

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
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-center">
            <img src="https://hvbdeyuqcliqrmzvyciq.supabase.co/storage/v1/object/public/property-images/logoconectaios.png" alt="ConectaIOS" className="h-8 w-auto" />
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
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url, item.exact)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
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
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}