import { useState, useEffect, useCallback } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "bibi-install-dismissed";

export function InstallAppBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // @ts-ignore
    if ((window.navigator as any).standalone === true) return;

    // Dismissed recently (24h)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    if (isiOS) {
      setShow(true);
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    setShowIOSInstructions(false);
  };

  if (!show) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary via-primary/90 to-accent text-white shadow-lg animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {showIOSInstructions ? "Como instalar no iPhone" : "Instale o Bibi Motos"}
            </p>
            {showIOSInstructions ? (
              <div className="flex items-center gap-1 text-xs text-white/90">
                <span>Toque em</span>
                <Share className="h-3.5 w-3.5 inline" />
                <span>e depois em</span>
                <span className="font-semibold">"Adicionar à Tela de Início"</span>
                <Plus className="h-3.5 w-3.5 inline" />
              </div>
            ) : (
              <p className="text-xs text-white/80 truncate">
                Use como app no seu celular
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!showIOSInstructions && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="h-8 px-4 text-xs font-bold bg-white text-primary hover:bg-white/90 rounded-full"
            >
              {isIOS ? "Como instalar" : "Instalar"}
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
