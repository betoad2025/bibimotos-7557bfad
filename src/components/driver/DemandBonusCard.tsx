import { useState, useEffect } from "react";
import { Flame, MapPin, Clock, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface DemandBonus {
  id: string;
  name: string;
  bonus_type: string;
  bonus_value: number;
  min_rides_required: number;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[] | null;
  is_active: boolean;
}

interface BonusClaim {
  id: string;
  bonus_id: string;
  rides_completed: number;
  bonus_earned: number;
  status: string;
}

interface DemandBonusCardProps {
  franchiseId: string;
  driverId: string;
}

export function DemandBonusCard({ franchiseId, driverId }: DemandBonusCardProps) {
  const [bonuses, setBonuses] = useState<DemandBonus[]>([]);
  const [claims, setClaims] = useState<Record<string, BonusClaim>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBonuses();
  }, [franchiseId, driverId]);

  const fetchBonuses = async () => {
    try {
      // Fetch active bonuses
      const { data: bonusData, error: bonusError } = await supabase
        .from("demand_bonuses")
        .select("*")
        .eq("franchise_id", franchiseId)
        .eq("is_active", true);

      if (bonusError) throw bonusError;
      setBonuses(bonusData || []);

      // Fetch driver's claims
      const { data: claimData, error: claimError } = await supabase
        .from("demand_bonus_claims")
        .select("*")
        .eq("driver_id", driverId)
        .in("status", ["in_progress", "completed"]);

      if (claimError) throw claimError;

      const claimsMap: Record<string, BonusClaim> = {};
      claimData?.forEach((claim) => {
        claimsMap[claim.bonus_id] = claim;
      });
      setClaims(claimsMap);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const isActiveNow = (bonus: DemandBonus) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    if (bonus.days_of_week && bonus.days_of_week.length > 0) {
      if (!bonus.days_of_week.includes(currentDay)) return false;
    }

    if (bonus.start_time && bonus.end_time) {
      if (currentTime < bonus.start_time || currentTime > bonus.end_time) return false;
    }

    return true;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bonuses.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 text-white">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          <h3 className="font-bold">Bônus por Demanda</h3>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {bonuses.map((bonus) => {
          const claim = claims[bonus.id];
          const progress = claim
            ? (claim.rides_completed / bonus.min_rides_required) * 100
            : 0;
          const isActive = isActiveNow(bonus);

          return (
            <div
              key={bonus.id}
              className={`p-4 rounded-lg border-2 ${
                isActive ? "border-orange-500 bg-orange-50" : "border-muted"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {bonus.name}
                    {isActive && (
                      <Badge variant="default" className="bg-orange-500">
                        ATIVO AGORA
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {bonus.bonus_type === "fixed" && `R$ ${bonus.bonus_value} fixo`}
                    {bonus.bonus_type === "percentage" && `+${bonus.bonus_value}% por corrida`}
                    {bonus.bonus_type === "per_ride" && `R$ ${bonus.bonus_value} por corrida`}
                  </p>
                </div>
                <Gift className="h-8 w-8 text-orange-500" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {bonus.start_time && bonus.end_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {bonus.start_time} - {bonus.end_time}
                    </span>
                  )}
                </div>

                {bonus.min_rides_required > 1 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>
                        {claim?.rides_completed || 0} / {bonus.min_rides_required} corridas
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                )}

                {claim?.status === "completed" && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    ✓ Bônus de R$ {claim.bonus_earned.toFixed(2)} conquistado!
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
