import { Star, Shield, Award, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReputationBadgeProps {
  rating: number;
  totalRides: number;
  type: "driver" | "passenger";
}

export function ReputationBadge({ rating, totalRides, type }: ReputationBadgeProps) {
  const getLevel = () => {
    if (totalRides >= 500 && rating >= 4.8) return { label: "Diamante", icon: Crown, color: "bg-purple-500" };
    if (totalRides >= 200 && rating >= 4.5) return { label: "Ouro", icon: Award, color: "bg-yellow-500" };
    if (totalRides >= 50 && rating >= 4.0) return { label: "Prata", icon: Shield, color: "bg-gray-400" };
    return { label: "Bronze", icon: Star, color: "bg-orange-400" };
  };

  const level = getLevel();
  const Icon = level.icon;

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border">
      <div className={`p-3 rounded-full ${level.color} text-white`}>
        <Icon className="h-6 w-6" />
      </div>
      <Badge variant="secondary" className="font-bold">
        {type === "driver" ? "Motorista" : "Passageiro"} {level.label}
      </Badge>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xl font-bold">{rating.toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalRides} {type === "driver" ? "corridas realizadas" : "viagens feitas"}
        </p>
      </div>
    </div>
  );
}
