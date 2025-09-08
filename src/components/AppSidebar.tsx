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

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-center">
            <img 
              src="https://hvbdeyuqcliqrmzvyciq.supabase.co/storage/v1/object/public/property-images/logoconectaios.png" 
              alt="ConectaIOS" 
              className="h-8 w-auto" 
            />
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        isActive || (item.exact && currentPath === item.url)
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }
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