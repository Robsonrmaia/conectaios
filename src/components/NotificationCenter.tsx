import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { SimpleNotification } from '@/hooks/useSimpleNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getNotificationBorderColor = (type: string) => {
  switch (type) {
    case 'warning':
      return 'border-l-amber-500';
    case 'error':
      return 'border-l-destructive';
    case 'success':
      return 'border-l-green-500';
    default:
      return 'border-l-blue-500';
  }
};

export function NotificationCenter() {
  const { notifications, loading, unreadCount, markAsRead } = useNotifications();
  
  // Funções mockadas para compatibilidade
  const markAllAsRead = () => {
    notifications.forEach(n => !n.read && markAsRead(n.id));
  };
  const deleteNotification = (id: string) => {
    console.log('Delete notification:', id);
  };
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: SimpleNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle specific notification actions based on meta
    if (notification.meta?.property_id) {
      // Could navigate to property page
      console.log('Navigate to property:', notification.meta.property_id);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3">
          <DropdownMenuLabel className="text-base font-semibold">
            Notificações
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs h-6"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer hover:bg-muted/50 border-l-4 ${getNotificationBorderColor(notification.type)} ${
                  !notification.read ? 'bg-muted/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between w-full mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <span className={`text-sm font-medium truncate ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                      onClick={(e) => handleDelete(e, notification.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-2">
                    {notification.body}
                  </p>
                  
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marcar lida
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}