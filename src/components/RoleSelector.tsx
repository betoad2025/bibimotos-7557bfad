import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bike, Users, Store, Shield, Car } from "lucide-react";

type AppRole = 'super_admin' | 'franchise_admin' | 'driver' | 'passenger' | 'merchant';

interface RoleSelectorProps {
  open: boolean;
  onSelect: (role: AppRole) => void;
  roles: AppRole[];
  userId: string;
}

const roleConfig: Record<AppRole, { label: string; description: string; icon: any; color: string }> = {
  super_admin: {
    label: "Super Admin",
    description: "Acesso total ao sistema",
    icon: Shield,
    color: "from-red-500 to-red-700",
  },
  franchise_admin: {
    label: "Franqueado",
    description: "Gerenciar sua franquia",
    icon: Users,
    color: "from-purple-500 to-purple-700",
  },
  driver: {
    label: "Motorista",
    description: "Receber e realizar corridas",
    icon: Bike,
    color: "from-green-500 to-green-700",
  },
  passenger: {
    label: "Passageiro",
    description: "Solicitar corridas",
    icon: Car,
    color: "from-blue-500 to-blue-700",
  },
  merchant: {
    label: "Lojista",
    description: "Solicitar entregas",
    icon: Store,
    color: "from-orange-500 to-orange-700",
  },
};

export function RoleSelector({ open, onSelect, roles, userId }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved preference
    const loadPreference = async () => {
      const { data } = await supabase
        .from("user_role_preferences")
        .select("selected_role")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.selected_role && roles.includes(data.selected_role as AppRole)) {
        // Auto-select saved preference
        onSelect(data.selected_role as AppRole);
      }
    };

    if (userId && roles.length > 0) {
      loadPreference();
    }
  }, [userId, roles]);

  const handleSelect = async (role: AppRole) => {
    setSelectedRole(role);
    setIsLoading(true);

    // Save preference
    await supabase
      .from("user_role_preferences")
      .upsert({
        user_id: userId,
        selected_role: role,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    setIsLoading(false);
    onSelect(role);
  };

  // Sort roles by priority
  const sortedRoles = [...roles].sort((a, b) => {
    const priority: Record<AppRole, number> = {
      super_admin: 0,
      franchise_admin: 1,
      driver: 2,
      merchant: 3,
      passenger: 4,
    };
    return priority[a] - priority[b];
  });

  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Como deseja acessar?
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Você possui múltiplos perfis. Selecione como deseja usar o app agora.
          </p>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {sortedRoles.map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;

            return (
              <Button
                key={role}
                variant="outline"
                className={`h-auto p-4 justify-start gap-4 hover:scale-[1.02] transition-all ${
                  selectedRole === role ? "ring-2 ring-primary" : ""
                }`}
                disabled={isLoading}
                onClick={() => handleSelect(role)}
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">{config.label}</p>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </Button>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Você pode trocar de perfil a qualquer momento no menu.
        </p>
      </DialogContent>
    </Dialog>
  );
}
