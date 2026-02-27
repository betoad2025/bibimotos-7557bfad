import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  type: 'ride' | 'driver' | 'credit' | 'system' | 'franchise';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

interface UseRealtimeNotificationsProps {
  franchiseId: string;
  userId?: string;
}

export function useRealtimeNotifications({ franchiseId, userId }: UseRealtimeNotificationsProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add notification helper
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => {
      const newCount = prev + 1;
      // Update app badge
      if ("setAppBadge" in navigator) {
        (navigator as any).setAppBadge(newCount).catch(() => {});
      }
      return newCount;
    });

    // Show toast for new notification
    toast({
      title: notification.title,
      description: notification.message,
    });

    // Send native push notification when app is in background
    if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
      try {
        const isCritical = notification.type === 'ride' && notification.title.includes('SOS');
        new window.Notification(notification.title, {
          body: notification.message,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: isCritical ? "critical" : notification.type,
        });
        if (isCritical && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {}
    }
  }, [toast]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    if ("clearAppBadge" in navigator) {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!franchiseId) return;

    // Subscribe to rides changes
    const ridesChannel = supabase
      .channel(`rides-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addNotification({
              type: 'ride',
              title: '🏍️ Nova corrida solicitada',
              message: `Corrida de ${(payload.new as any).origin_address?.substring(0, 30)}...`,
              data: payload.new as Record<string, any>,
            });
          } else if (payload.eventType === 'UPDATE') {
            const ride = payload.new as any;
            if (ride.status === 'completed') {
              addNotification({
                type: 'ride',
                title: '✅ Corrida finalizada',
                message: `Valor: R$ ${Number(ride.final_price).toFixed(2)}`,
                data: ride,
              });
            } else if (ride.status === 'cancelled') {
              addNotification({
                type: 'ride',
                title: '❌ Corrida cancelada',
                message: ride.cancellation_reason || 'Sem motivo informado',
                data: ride,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to drivers changes
    const driversChannel = supabase
      .channel(`drivers-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const driver = payload.new as any;
            // Fetch driver profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', driver.user_id)
              .single();

            addNotification({
              type: 'driver',
              title: '👤 Novo motorista cadastrado',
              message: profile?.full_name || 'Aguardando aprovação',
              data: { ...driver, profile },
            });
          } else if (payload.eventType === 'UPDATE') {
            const oldDriver = payload.old as any;
            const newDriver = payload.new as any;

            // Driver went online
            if (!oldDriver.is_online && newDriver.is_online) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', newDriver.user_id)
                .single();

              addNotification({
                type: 'driver',
                title: '🟢 Motorista online',
                message: profile?.full_name || 'Motorista',
                data: newDriver,
              });
            }

            // Driver registration complete
            if (!oldDriver.registration_complete && newDriver.registration_complete) {
              addNotification({
                type: 'driver',
                title: '📋 Cadastro completo',
                message: 'Novo motorista aguardando aprovação',
                data: newDriver,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to credit transactions
    const creditsChannel = supabase
      .channel(`credits-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          const transaction = payload.new as any;
          const isDebit = transaction.type === 'debit';

          addNotification({
            type: 'credit',
            title: isDebit ? '💸 Débito de crédito' : '💰 Crédito adicionado',
            message: `R$ ${Math.abs(transaction.amount).toFixed(2)} - ${transaction.description || 'Transação'}`,
            data: transaction,
          });
        }
      )
      .subscribe();

    // Subscribe to franchise credit transactions
    const franchiseCreditsChannel = supabase
      .channel(`franchise-credits-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'franchise_credit_transactions',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          const transaction = payload.new as any;
          const isDebit = transaction.type === 'debit';

          addNotification({
            type: 'franchise',
            title: isDebit ? '📉 Débito na franquia' : '📈 Recarga na franquia',
            message: `R$ ${Math.abs(transaction.amount).toFixed(2)}`,
            data: transaction,
          });
        }
      )
      .subscribe();

    // Subscribe to driver approval requests
    const approvalChannel = supabase
      .channel(`approvals-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_approval_requests',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          addNotification({
            type: 'driver',
            title: '⚠️ Aprovação pendente',
            message: 'Novo motorista aguardando sua análise',
            data: payload.new as Record<string, any>,
          });
        }
      )
      .subscribe();

    // Subscribe to deliveries
    const deliveriesChannel = supabase
      .channel(`deliveries-${franchiseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `franchise_id=eq.${franchiseId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addNotification({
              type: 'ride',
              title: '📦 Nova entrega solicitada',
              message: `Entrega para ${(payload.new as any).delivery_address?.substring(0, 30)}...`,
              data: payload.new as Record<string, any>,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ridesChannel);
      supabase.removeChannel(driversChannel);
      supabase.removeChannel(creditsChannel);
      supabase.removeChannel(franchiseCreditsChannel);
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(deliveriesChannel);
    };
  }, [franchiseId, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
