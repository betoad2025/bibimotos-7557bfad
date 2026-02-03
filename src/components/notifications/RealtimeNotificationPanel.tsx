import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification } from "@/hooks/useRealtimeNotifications";
import {
  Bell, Bike, Users, DollarSign, Settings, CheckCircle2,
  Trash2, Clock, Package
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RealtimeNotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function RealtimeNotificationPanel({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: RealtimeNotificationPanelProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ride':
        return <Bike className="h-4 w-4" />;
      case 'driver':
        return <Users className="h-4 w-4" />;
      case 'credit':
        return <DollarSign className="h-4 w-4" />;
      case 'franchise':
        return <Package className="h-4 w-4" />;
      case 'system':
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'ride':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'driver':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'credit':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'franchise':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'system':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Notificações em Tempo Real
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar todas lidas
            </Button>
            <Button variant="outline" size="sm" onClick={onClearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma notificação</p>
            <p className="text-sm">As notificações aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    notification.read 
                      ? 'bg-muted/30 opacity-70' 
                      : 'bg-white shadow-sm'
                  }`}
                  onClick={() => !notification.read && onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
