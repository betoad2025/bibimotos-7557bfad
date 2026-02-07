import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Globe, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface OverviewChartsProps {
  franchises: any[];
  cities: any[];
}

export function OverviewCharts({ franchises, cities }: OverviewChartsProps) {
  const [ridesData, setRidesData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      // Fetch rides from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: rides } = await supabase
        .from("rides")
        .select("created_at, final_price, status")
        .gte("created_at", sevenDaysAgo.toISOString());

      // Group by day
      const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const ridesByDay: Record<string, { corridas: number; entregas: number }> = {};
      
      dayNames.forEach((day) => {
        ridesByDay[day] = { corridas: 0, entregas: 0 };
      });

      rides?.forEach((ride) => {
        const date = new Date(ride.created_at);
        const dayName = dayNames[date.getDay()];
        if (ridesByDay[dayName]) {
          ridesByDay[dayName].corridas++;
        }
      });

      setRidesData(
        dayNames.map((name) => ({
          name,
          ...ridesByDay[name],
        }))
      );

      // Fetch revenue for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: revenueRides } = await supabase
        .from("rides")
        .select("created_at, final_price")
        .gte("created_at", sixMonthsAgo.toISOString())
        .not("final_price", "is", null);

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const revenueByMonth: Record<string, number> = {};

      revenueRides?.forEach((ride) => {
        const date = new Date(ride.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (Number(ride.final_price) || 0);
      });

      const sortedMonths = Object.keys(revenueByMonth).sort();
      setRevenueData(
        sortedMonths.slice(-6).map((key) => {
          const [year, month] = key.split("-");
          return {
            name: monthNames[parseInt(month)],
            valor: revenueByMonth[key],
          };
        })
      );
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Corridas e Entregas (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ridesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="corridas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="entregas" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Evolução de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Cities & Franchises */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Cidades Cadastradas ({cities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cities.slice(0, 8).map((city, index) => {
                const hasFranchise = franchises.some((f) => f.city_id === city.id);
                return (
                  <div
                    key={city.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          city.is_active ? "bg-green-500" : hasFranchise ? "bg-purple-500" : "bg-gray-400"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{city.name}</p>
                        <p className="text-xs text-muted-foreground">{city.state}</p>
                      </div>
                    </div>
                    <Badge variant={city.is_active ? "default" : hasFranchise ? "secondary" : "outline"}>
                      {city.is_active ? "Ativa" : hasFranchise ? "Com Franquia" : "Disponível"}
                    </Badge>
                  </div>
                );
              })}
              {cities.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma cidade cadastrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              Franquias ({franchises.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {franchises.slice(0, 8).map((franchise) => (
                <div
                  key={franchise.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        franchise.is_active ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{franchise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {franchise.cities?.name}/{franchise.cities?.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={franchise.is_active ? "default" : "secondary"}>
                      {franchise.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <p className="text-xs text-green-600 font-medium mt-1">
                      R$ {franchise.monthly_fee?.toFixed(0)}/mês
                    </p>
                  </div>
                </div>
              ))}
              {franchises.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma franquia cadastrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
