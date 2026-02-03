import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Car, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Package
} from "lucide-react";

interface Stat {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
}

interface StatsGridProps {
  stats: Stat[];
  loading?: boolean;
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-24 mb-4" />
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="group hover:shadow-lg transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              {stat.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            {stat.changeLabel && (
              <p className="text-xs text-muted-foreground mt-1">{stat.changeLabel}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Pre-built stat configurations
export const getDriverStats = (data: {
  total: number;
  online: number;
  pendingApproval: number;
  totalRides: number;
}) => [
  {
    title: "Total de Motoristas",
    value: data.total,
    icon: Users,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Online Agora",
    value: data.online,
    icon: Activity,
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Aguardando Aprovação",
    value: data.pendingApproval,
    icon: Users,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Corridas Realizadas",
    value: data.totalRides,
    icon: Car,
    color: "from-purple-500 to-violet-600",
  },
];

export const getRideStats = (data: {
  today: number;
  week: number;
  month: number;
  revenue: number;
}) => [
  {
    title: "Corridas Hoje",
    value: data.today,
    icon: Car,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Esta Semana",
    value: data.week,
    icon: Activity,
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Este Mês",
    value: data.month,
    icon: TrendingUp,
    color: "from-purple-500 to-violet-600",
  },
  {
    title: "Faturamento",
    value: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.revenue),
    icon: DollarSign,
    color: "from-amber-500 to-orange-600",
  },
];

export const getSuperAdminStats = (data: {
  franchises: number;
  cities: number;
  drivers: number;
  rides: number;
  revenue: number;
}) => [
  {
    title: "Franquias Ativas",
    value: data.franchises,
    icon: MapPin,
    color: "from-purple-500 to-violet-600",
  },
  {
    title: "Cidades",
    value: data.cities,
    icon: MapPin,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "Motoristas",
    value: data.drivers,
    icon: Users,
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Corridas Total",
    value: data.rides,
    icon: Car,
    color: "from-amber-500 to-orange-600",
  },
];