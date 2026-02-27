import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  sendNativeNotification: (title: string, options?: NotificationOptions) => void;
  updateBadge: (count: number) => void;
  clearBadge: () => void;
}

export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isSupported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      setIsSubscribed(Notification.permission === "granted");
    }
  }, [isSupported]);

  // Clear badge when app becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && "clearAppBadge" in navigator) {
        (navigator as any).clearAppBadge?.();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      const granted = result === "granted";
      setIsSubscribed(granted);

      // Save subscription status to profile
      if (granted && userId) {
        await supabase
          .from("profiles")
          .update({ push_subscription: { enabled: true, subscribedAt: new Date().toISOString() } as any })
          .eq("user_id", userId);
      }

      return granted;
    } catch {
      return false;
    }
  }, [isSupported, userId]);

  const sendNativeNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return;

      // Only send native notification when app is in background
      if (document.visibilityState === "hidden") {
        try {
          const notification = new Notification(title, {
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            ...options,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Vibrate for critical notifications
          if (options?.tag === "critical" && "vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        } catch {
          // SW notification fallback – silently fail
        }
      }
    },
    [isSupported, permission]
  );

  const updateBadge = useCallback((count: number) => {
    if ("setAppBadge" in navigator) {
      (navigator as any).setAppBadge(count).catch(() => {});
    }
  }, []);

  const clearBadge = useCallback(() => {
    if ("clearAppBadge" in navigator) {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    sendNativeNotification,
    updateBadge,
    clearBadge,
  };
}
