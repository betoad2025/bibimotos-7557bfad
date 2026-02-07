import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Building2, Bike, Users, Package, Activity, DollarSign, Crown, ArrowUpRight
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
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { icon: MapPin, value: stats.totalCities, label: "Cidades", gradient: "from-purple-500 to-purple-700" },
    { icon: Building2, value: stats.activeFranchises, label: "Franquias", gradient: "from-green-500 to-green-700" },
    { icon: Bike, value: stats.totalDrivers, label: "Motoristas", gradient: "from-blue-500 to-blue-700" },
    { icon: Users, value: stats.totalPassengers, label: "Passageiros", gradient: "from-orange-500 to-orange-700" },
    { icon: Package, value: stats.totalMerchants, label: "Lojistas", gradient: "from-pink-500 to-pink-700" },
    { icon: Activity, value: stats.totalRides, label: "Corridas", gradient: "from-indigo-500 to-indigo-700" },
    { icon: DollarSign, value: `R$ ${(stats.totalRevenue / 1000).toFixed(0)}k`, label: "Faturamento", gradient: "from-yellow-500 to-yellow-700" },
    { icon: Crown, value: stats.pendingLeads, label: "Leads Novos", gradient: "from-red-500 to-red-700", isPulsing: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={`bg-gradient-to-br ${card.gradient} text-white`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <card.icon className="h-8 w-8 opacity-80" />
              {card.isPulsing ? (
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </div>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
            <p className="text-sm opacity-80">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
