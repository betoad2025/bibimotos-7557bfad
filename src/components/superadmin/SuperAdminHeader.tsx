import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, AlertTriangle, Shield, Settings, User, ChevronDown } from "lucide-react";
import logoImage from "@/assets/logo-simbolo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/profile/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserProfileSettings } from "@/components/profile/UserProfileSettings";

interface SuperAdminHeaderProps {
  pendingLeads: number;
}

export function SuperAdminHeader({ pendingLeads }: SuperAdminHeaderProps) {
  const { user, signOut, profile } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime emergency alerts
    const channel = supabase
      .channel("header-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emergency_alerts",
        },
        () => {
          fetchAlerts();
          // Play alert sound
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAMM");
          audio.play().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { count } = await supabase
      .from("emergency_alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    
    setActiveAlerts(count || 0);

    const { data } = await supabase
      .from("emergency_alerts")
      .select("*, franchise:franchises(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);
    
    setRecentAlerts(data || []);
  };

  const totalNotifications = pendingLeads + activeAlerts;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-purple-700">Bibi Motos</h1>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>

          {/* Emergency Alert Banner */}
          {activeAlerts > 0 && (
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg animate-pulse">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {activeAlerts} alerta{activeAlerts > 1 ? "s" : ""} de emergência ativo{activeAlerts > 1 ? "s" : ""}!
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center ${activeAlerts > 0 ? "bg-red-500 animate-pulse" : "bg-blue-500"}`}>
                      {totalNotifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {activeAlerts > 0 && (
                  <>
                    <DropdownMenuLabel className="flex items-center gap-2 text-red-600">
                      <Shield className="h-4 w-4" />
                      Alertas de Emergência
                    </DropdownMenuLabel>
                    {recentAlerts.map((alert) => (
                      <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="font-medium text-sm">
                            {alert.alert_type === "sos" ? "SOS - Socorro" : 
                             alert.alert_type === "accident" ? "Acidente" : 
                             alert.alert_type}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {alert.franchise?.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {pendingLeads > 0 && (
                  <DropdownMenuItem>
                    <span>{pendingLeads} novos leads de franquia</span>
                  </DropdownMenuItem>
                )}
                {totalNotifications === 0 && (
                  <DropdownMenuItem disabled>
                    Nenhuma notificação
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto p-2 hover:bg-muted">
                  <UserAvatar
                    avatarUrl={profile?.avatar_url}
                    name={profile?.full_name || user?.email || "Usuário"}
                    size="sm"
                    showRating={false}
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                    <div className="flex items-center gap-1">
                      <Badge variant="default" className="text-xs bg-purple-600">
                        Super Admin
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile?.full_name || "Usuário"}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Profile Settings Dialog */}
      <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Configurações do Perfil
            </DialogTitle>
          </DialogHeader>
          <UserProfileSettings onClose={() => setShowProfileSettings(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
