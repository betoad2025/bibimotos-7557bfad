import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Building2, Bike, Users, Package, Activity, DollarSign, Crown, ArrowUpRight, AlertTriangle
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalCities: number;
    activeFranchises: number;
    totalDrivers: number;
    totalRides: number;
    totalRevenue: number;
    totalPassengers: number;
    totalMerchants: number;
    pendingLeads: number;
    activeAlerts?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { 
      icon: MapPin, 
      value: stats.totalCities, 
      label: "Cidades", 
      gradient: "from-purple-500 to-purple-700",
      trend: "+2 este mês"
    },
    { 
      icon: Building2, 
      value: stats.activeFranchises, 
      label: "Franquias", 
      gradient: "from-green-500 to-green-700",
      trend: "ativas"
    },
    { 
      icon: Bike, 
      value: stats.totalDrivers, 
      label: "Motoristas", 
      gradient: "from-blue-500 to-blue-700",
      trend: "cadastrados"
    },
    { 
      icon: Users, 
      value: stats.totalPassengers, 
      label: "Passageiros", 
      gradient: "from-orange-500 to-orange-700",
      trend: "cadastrados"
    },
    { 
      icon: Package, 
      value: stats.totalMerchants, 
      label: "Lojistas", 
      gradient: "from-pink-500 to-pink-700",
      trend: "ativos"
    },
    { 
      icon: Activity, 
      value: stats.totalRides, 
      label: "Corridas", 
      gradient: "from-indigo-500 to-indigo-700",
      trend: "realizadas"
    },
    { 
      icon: DollarSign, 
      value: `R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`, 
      label: "Faturamento", 
      gradient: "from-yellow-500 to-yellow-700",
      trend: "total"
    },
    { 
      icon: Crown, 
      value: stats.pendingLeads, 
      label: "Leads Novos", 
      gradient: "from-red-500 to-red-700", 
      isPulsing: stats.pendingLeads > 0,
      trend: "pendentes"
    },
  ];

  // Add emergency alerts card if there are active alerts
  if (stats.activeAlerts && stats.activeAlerts > 0) {
    cards.push({
      icon: AlertTriangle,
      value: stats.activeAlerts,
      label: "Emergências",
      gradient: "from-red-600 to-red-800",
      isPulsing: true,
      trend: "ativas"
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={`bg-gradient-to-br ${card.gradient} text-white relative overflow-hidden min-w-0`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <card.icon className="h-6 w-6 sm:h-8 sm:w-8 opacity-80 shrink-0" />
              {card.isPulsing ? (
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              ) : (
                <ArrowUpRight className="h-4 w-4 opacity-60" />
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-2 truncate">{card.value}</p>
            <p className="text-xs sm:text-sm font-medium opacity-90 truncate">{card.label}</p>
            <p className="text-[10px] sm:text-xs opacity-60 mt-1 truncate">{card.trend}</p>
          </CardContent>
          {/* Decorative element */}
          <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/10" />
        </Card>
      ))}
    </div>
  );
}
