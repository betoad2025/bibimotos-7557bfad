import { useState, useEffect } from "react";
import { FileText, Download, TrendingUp, Clock, Star, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialReportCardProps {
  driverId: string;
  franchiseId: string;
}

interface ReportData {
  totalRides: number;
  totalEarnings: number;
  totalTips: number;
  averageRating: number;
  cancelledRides: number;
  peakHoursRides: number;
}

export function FinancialReportCard({ driverId, franchiseId }: FinancialReportCardProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [driverId, period]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "daily":
        return {
          start: format(now, "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        };
      case "weekly":
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "monthly":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch rides for period
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", driverId)
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);

      if (error) throw error;

      const completedRides = rides?.filter((r) => r.status === "completed") || [];
      const cancelledRides = rides?.filter((r) => r.status === "cancelled") || [];

      // Fetch tips
      const { data: tips } = await supabase
        .from("tip_transactions")
        .select("amount")
        .eq("driver_id", driverId)
        .gte("created_at", `${start}T00:00:00`)
        .lte("created_at", `${end}T23:59:59`);

      const totalTips = tips?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalEarnings = completedRides.reduce(
        (sum, r) => sum + (Number(r.final_price) || 0),
        0
      );
      const ratings = completedRides
        .filter((r) => r.passenger_rating)
        .map((r) => r.passenger_rating as number);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 5;

      // Peak hours (7-9 and 17-20)
      const peakHoursRides = completedRides.filter((r) => {
        const hour = new Date(r.created_at).getHours();
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
      }).length;

      setReport({
        totalRides: completedRides.length,
        totalEarnings,
        totalTips,
        averageRating: avgRating,
        cancelledRides: cancelledRides.length,
        peakHoursRides,
      });
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    const { start, end } = getDateRange();
    if (period === "daily") {
      return format(new Date(start), "dd 'de' MMMM", { locale: ptBR });
    }
    return `${format(new Date(start), "dd/MM")} - ${format(new Date(end), "dd/MM")}`;
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Extrato Financeiro
          </span>
          <Button variant="ghost" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Hoje</TabsTrigger>
            <TabsTrigger value="weekly">Semana</TabsTrigger>
            <TabsTrigger value="monthly">Mês</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-sm text-center text-muted-foreground">{getPeriodLabel()}</p>

        {report && (
          <>
            <div className="text-center py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
              <p className="text-sm opacity-80">Ganhos Totais</p>
              <p className="text-3xl font-bold">
                R$ {(report.totalEarnings + report.totalTips).toFixed(2)}
              </p>
              {report.totalTips > 0 && (
                <p className="text-xs mt-1">
                  Inclui R$ {report.totalTips.toFixed(2)} em gorjetas
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{report.totalRides}</p>
                  <p className="text-xs text-muted-foreground">Corridas</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xl font-bold">{report.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avaliação Média</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{report.peakHoursRides}</p>
                  <p className="text-xs text-muted-foreground">Horário de Pico</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-xl font-bold">{report.cancelledRides}</p>
                  <p className="text-xs text-muted-foreground">Canceladas</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Média por corrida: R${" "}
              {report.totalRides > 0
                ? (report.totalEarnings / report.totalRides).toFixed(2)
                : "0.00"}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
