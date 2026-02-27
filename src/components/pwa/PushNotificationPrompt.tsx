import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationPromptProps {
  userId?: string;
}

const PROMPT_KEY = "bibi-push-prompted";

export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const [show, setShow] = useState(false);
  const { isSupported, permission, requestPermission } = usePushNotifications(userId);

  useEffect(() => {
    if (!isSupported) return;
    if (permission === "granted" || permission === "denied") return;

    // Show after 3 seconds, only once per session
    const prompted = sessionStorage.getItem(PROMPT_KEY);
    if (prompted) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  const handleEnable = async () => {
    sessionStorage.setItem(PROMPT_KEY, "true");
    await requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(PROMPT_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm">
              Ative as notificações
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Não perca nenhuma corrida ou atualização importante. Receba alertas em tempo real.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-1 text-xs"
          >
            Agora não
          </Button>
          <Button
            size="sm"
            onClick={handleEnable}
            className="flex-1 text-xs btn-gradient"
          >
            Ativar notificações
          </Button>
        </div>
      </div>
    </div>
  );
}
