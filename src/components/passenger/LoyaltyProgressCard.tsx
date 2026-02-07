import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Star, Trophy, Sparkles, Check } from "lucide-react";

interface LoyaltyProgressCardProps {
  userId: string;
  franchiseId: string;
}

interface LoyaltyData {
  rides_count: number;
  free_rides_earned: number;
  free_rides_used: number;
  last_free_ride_at: string | null;
}

interface FranchiseLoyalty {
  loyalty_enabled: boolean;
  loyalty_rides_for_free: number;
}

export function LoyaltyProgressCard({ userId, franchiseId }: LoyaltyProgressCardProps) {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [franchiseConfig, setFranchiseConfig] = useState<FranchiseLoyalty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, [userId, franchiseId]);

  const fetchLoyaltyData = async () => {
    try {
      // Fetch franchise loyalty config
      const { data: franchiseData } = await supabase
        .from("franchises")
        .select("loyalty_enabled, loyalty_rides_for_free")
        .eq("id", franchiseId)
        .single();

      if (franchiseData) {
        setFranchiseConfig(franchiseData);
      }

      // Fetch user's loyalty progress
      const { data: loyaltyData } = await supabase
        .from("loyalty_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("franchise_id", franchiseId)
        .maybeSingle();

      if (loyaltyData) {
        setLoyalty({
          rides_count: loyaltyData.rides_count || 0,
          free_rides_earned: loyaltyData.free_rides_earned || 0,
          free_rides_used: loyaltyData.free_rides_used || 0,
          last_free_ride_at: loyaltyData.last_free_ride_at,
        });
      } else {
        setLoyalty({
          rides_count: 0,
          free_rides_earned: 0,
          free_rides_used: 0,
          last_free_ride_at: null,
        });
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
    setLoading(false);
  };

  // Don't show if loyalty is not enabled
  if (!franchiseConfig?.loyalty_enabled || !franchiseConfig?.loyalty_rides_for_free) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-2 animate-pulse">
        <CardContent className="py-8">
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const ridesForFree = franchiseConfig.loyalty_rides_for_free;
  const currentRides = loyalty?.rides_count || 0;
  const freeRidesAvailable = (loyalty?.free_rides_earned || 0) - (loyalty?.free_rides_used || 0);
  const progress = (currentRides / ridesForFree) * 100;
  const ridesRemaining = ridesForFree - currentRides;

  return (
    <Card className="border-2 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Programa Fidelidade</h3>
            <p className="text-sm text-white/80">
              Complete {ridesForFree} corridas e ganhe 1 grátis!
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Free Rides Available */}
        {freeRidesAvailable > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="font-bold text-green-700 dark:text-green-300">
                {freeRidesAvailable} corrida{freeRidesAvailable > 1 ? "s" : ""} grátis disponível!
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Use na sua próxima viagem
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {currentRides} / {ridesForFree} corridas
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {ridesRemaining > 0 
              ? `Faltam ${ridesRemaining} corrida${ridesRemaining > 1 ? "s" : ""} para ganhar 1 grátis!`
              : "Você ganhou uma corrida grátis!"
            }
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {Array.from({ length: ridesForFree }).map((_, i) => (
            <div
              key={i}
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentRides
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentRides ? (
                <Check className="h-3 w-3" />
              ) : (
                i + 1
              )}
            </div>
          ))}
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
            <Gift className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="font-bold">{loyalty?.free_rides_earned || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Grátis conquistadas</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <Star className="h-4 w-4" />
              <span className="font-bold">{loyalty?.free_rides_used || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Grátis utilizadas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
