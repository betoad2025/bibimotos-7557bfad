import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Gift, Settings, Save, Trophy, Users, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LoyaltyProgramManagementProps {
  franchiseId: string;
}

interface LoyaltyStats {
  totalUsers: number;
  activeProgresses: number;
  freeRidesGiven: number;
}

export function LoyaltyProgramManagement({ franchiseId }: LoyaltyProgramManagementProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    loyalty_enabled: false,
    loyalty_rides_for_free: 10,
    promo_absorb_cost: false,
  });
  const [stats, setStats] = useState<LoyaltyStats>({
    totalUsers: 0,
    activeProgresses: 0,
    freeRidesGiven: 0,
  });

  useEffect(() => {
    fetchData();
  }, [franchiseId]);

  const fetchData = async () => {
    try {
      const [franchiseRes, loyaltyRes] = await Promise.all([
        supabase
          .from("franchises")
          .select("loyalty_enabled, loyalty_rides_for_free, promo_absorb_cost")
          .eq("id", franchiseId)
          .single(),
        supabase
          .from("loyalty_progress")
          .select("id, free_rides_earned, free_rides_used")
          .eq("franchise_id", franchiseId),
      ]);

      if (franchiseRes.data) {
        setConfig({
          loyalty_enabled: franchiseRes.data.loyalty_enabled || false,
          loyalty_rides_for_free: franchiseRes.data.loyalty_rides_for_free || 10,
          promo_absorb_cost: franchiseRes.data.promo_absorb_cost || false,
        });
      }

      if (loyaltyRes.data) {
        setStats({
          totalUsers: loyaltyRes.data.length,
          activeProgresses: loyaltyRes.data.filter(p => (p.free_rides_earned || 0) > (p.free_rides_used || 0)).length,
          freeRidesGiven: loyaltyRes.data.reduce((sum, p) => sum + (p.free_rides_earned || 0), 0),
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("franchises")
        .update({
          loyalty_enabled: config.loyalty_enabled,
          loyalty_rides_for_free: config.loyalty_rides_for_free,
          promo_absorb_cost: config.promo_absorb_cost,
        })
        .eq("id", franchiseId);

      if (error) throw error;
      toast.success("Configurações salvas!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <Users className="h-6 w-6 text-blue-600" />
            <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Usuários no Programa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <p className="text-2xl font-bold mt-2">{stats.activeProgresses}</p>
            <p className="text-sm text-muted-foreground">Com Corridas Grátis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Gift className="h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold mt-2">{stats.freeRidesGiven}</p>
            <p className="text-sm text-muted-foreground">Corridas Grátis Dadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Programa de Fidelidade
          </CardTitle>
          <CardDescription>
            Configure o programa "Faça X corridas, ganhe 1 grátis"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Ativar Programa de Fidelidade</p>
              <p className="text-sm text-muted-foreground">
                Passageiros ganham corridas grátis após completarem um número de corridas
              </p>
            </div>
            <Switch
              checked={config.loyalty_enabled}
              onCheckedChange={(v) => setConfig({ ...config, loyalty_enabled: v })}
            />
          </div>

          {config.loyalty_enabled && (
            <>
              {/* Rides Required */}
              <div className="space-y-2">
                <Label>Corridas necessárias para 1 grátis</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={2}
                    max={50}
                    value={config.loyalty_rides_for_free}
                    onChange={(e) => setConfig({ ...config, loyalty_rides_for_free: parseInt(e.target.value) })}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    Ex: Faça {config.loyalty_rides_for_free} corridas e a próxima é grátis!
                  </p>
                </div>
              </div>

              {/* Absorb Cost */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Franquia absorve custo da promoção</p>
                  <p className="text-sm text-muted-foreground">
                    Se ativado, o motorista recebe crédito automático quando aceita corrida promocional
                  </p>
                </div>
                <Switch
                  checked={config.promo_absorb_cost}
                  onCheckedChange={(v) => setConfig({ ...config, promo_absorb_cost: v })}
                />
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-purple-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Como Funciona
          </h4>
          <ul className="text-sm text-purple-700 mt-2 space-y-1 list-disc list-inside">
            <li>Cada corrida completada pelo passageiro conta para o programa</li>
            <li>Ao atingir {config.loyalty_rides_for_free} corridas, ganha 1 grátis</li>
            <li>O contador reinicia após usar a corrida grátis</li>
            {config.promo_absorb_cost && (
              <li className="font-medium">
                O motorista recebe crédito automático por corridas grátis
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
