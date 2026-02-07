import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import logoImage from "@/assets/logo-simbolo.png";
import { useAuth } from "@/hooks/useAuth";

interface SuperAdminHeaderProps {
  pendingLeads: number;
}

export function SuperAdminHeader({ pendingLeads }: SuperAdminHeaderProps) {
  const { user, signOut, profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold text-purple-700">Bibi Motos</h1>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {pendingLeads > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {pendingLeads}
              </span>
            )}
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">Super Administrador</p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
