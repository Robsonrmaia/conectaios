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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  HandHeart,
  Wrench,
  User,
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
    title: 'CRM',
    url: '/app/crm',
    icon: Users,
  },
  {
    title: 'Mensagens',
    url: '/app/inbox',
    icon: MessageSquare,
  },
  {
    title: 'Match',
    url: '/app/match',
    icon: HandHeart,
  },
  {
    title: 'Ferramentas',
    url: '/app/ferramentas',
    icon: Wrench,
  },
  {
    title: 'Perfil',
    url: '/app/perfil',
    icon: User,
  },
];

export function AppSidebar() {
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

  console.log('[AppSidebar] navigationItems:', navigationItems);

  return (
    <Sidebar className="border-r bg-blue-50">
      <SidebarContent>
        {/* Debug Info */}
        <div className="p-2 bg-yellow-200 text-xs">
          Rota: {currentPath} | Items: {navigationItems.length}
        </div>
        
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-center">
            <div className="text-sm font-bold">ConectaIOS</div>
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal ({navigationItems.length} items)</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item, index) => {
                console.log('[AppSidebar] Rendering item:', item.title, item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => {
                          console.log('[NavLink]', item.title, 'isActive:', isActive);
                          return isActive || (item.exact && currentPath === item.url)
                            ? 'bg-primary text-primary-foreground font-medium' 
                            : 'hover:bg-accent hover:text-accent-foreground';
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Simple test buttons */}
        <div className="p-4 space-y-2">
          <div className="text-xs font-semibold">Teste direto:</div>
          <div className="bg-gray-100 p-2 rounded text-xs">Dashboard</div>
          <div className="bg-gray-100 p-2 rounded text-xs">Imóveis</div>
          <div className="bg-gray-100 p-2 rounded text-xs">CRM</div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}