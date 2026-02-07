import { useState } from "react";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialReportPDFProps {
  driverId: string;
  driverName: string;
  period: "weekly" | "monthly";
}

export function FinancialReportPDF({ driverId, driverName, period }: FinancialReportPDFProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getDateRange = () => {
    const now = new Date();
    if (period === "weekly") {
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    }
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      // Fetch rides
      const { data: rides, error: ridesError } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", driverId)
        .gte("created_at", `${startStr}T00:00:00`)
        .lte("created_at", `${endStr}T23:59:59`);

      if (ridesError) throw ridesError;

      const completedRides = rides?.filter(r => r.status === "completed") || [];
      const cancelledRides = rides?.filter(r => r.status === "cancelled") || [];

      // Fetch tips
      const { data: tips } = await supabase
        .from("tip_transactions")
        .select("amount")
        .eq("driver_id", driverId)
        .gte("created_at", `${startStr}T00:00:00`)
        .lte("created_at", `${endStr}T23:59:59`);

      const totalTips = tips?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalEarnings = completedRides.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0);

      // Fetch credit usage
      const { data: credits } = await supabase
        .from("credit_transactions")
        .select("amount, type")
        .eq("driver_id", driverId)
        .gte("created_at", `${startStr}T00:00:00`)
        .lte("created_at", `${endStr}T23:59:59`);

      const creditsUsed = credits?.filter(c => c.type === "ride_debit")
        .reduce((sum, c) => sum + Math.abs(Number(c.amount)), 0) || 0;

      // Generate HTML for PDF
      const periodLabel = period === "weekly" 
        ? `Semana: ${format(start, "dd/MM")} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`
        : `Mês: ${format(start, "MMMM yyyy", { locale: ptBR })}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório Financeiro - ${driverName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #7c3aed; }
            .period { font-size: 14px; color: #666; margin-top: 10px; }
            .driver-name { font-size: 18px; margin-top: 5px; }
            .summary { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; text-align: center; }
            .summary h2 { font-size: 16px; opacity: 0.9; margin-bottom: 8px; }
            .summary .amount { font-size: 36px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; }
            .stat-card .value { font-size: 24px; font-weight: bold; color: #7c3aed; }
            .stat-card .label { font-size: 12px; color: #666; margin-top: 5px; }
            .breakdown { margin-top: 25px; }
            .breakdown h3 { font-size: 16px; margin-bottom: 15px; color: #333; }
            .breakdown-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
            .breakdown-item:last-child { border-bottom: none; }
            .positive { color: #22c55e; }
            .negative { color: #ef4444; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🏍️ Bibi Motos</div>
            <div class="driver-name">${driverName}</div>
            <div class="period">${periodLabel}</div>
          </div>
          
          <div class="summary">
            <h2>💰 Ganho Líquido</h2>
            <div class="amount">R$ ${(totalEarnings + totalTips - creditsUsed).toFixed(2)}</div>
          </div>
          
          <div class="grid">
            <div class="stat-card">
              <div class="value">${completedRides.length}</div>
              <div class="label">Corridas Completadas</div>
            </div>
            <div class="stat-card">
              <div class="value">${cancelledRides.length}</div>
              <div class="label">Corridas Canceladas</div>
            </div>
            <div class="stat-card">
              <div class="value">R$ ${totalEarnings.toFixed(2)}</div>
              <div class="label">Total em Corridas</div>
            </div>
            <div class="stat-card">
              <div class="value">R$ ${totalTips.toFixed(2)}</div>
              <div class="label">Total em Gorjetas</div>
            </div>
          </div>
          
          <div class="breakdown">
            <h3>📊 Detalhamento</h3>
            <div class="breakdown-item">
              <span>Corridas</span>
              <span class="positive">+ R$ ${totalEarnings.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
              <span>Gorjetas</span>
              <span class="positive">+ R$ ${totalTips.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
              <span>Créditos Utilizados</span>
              <span class="negative">- R$ ${creditsUsed.toFixed(2)}</span>
            </div>
            <div class="breakdown-item" style="font-weight: bold; border-top: 2px solid #7c3aed; padding-top: 15px;">
              <span>Total Líquido</span>
              <span class="${(totalEarnings + totalTips - creditsUsed) >= 0 ? 'positive' : 'negative'}">R$ ${(totalEarnings + totalTips - creditsUsed).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}<br>
            Bibi Motos - Sua Moto, Sua Liberdade
          </div>
        </body>
        </html>
      `;

      // Create and download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${period}-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Relatório gerado!",
        description: "O arquivo foi baixado para seu dispositivo",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generatePDF} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {period === "weekly" ? "Semanal" : "Mensal"}
    </Button>
  );
}
