import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Phone, Car, User, Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import logoFull from "@/assets/logo-full.png";

export default function TrackRide() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rideData, setRideData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetchRideByToken();
    }
  }, [token]);

  const fetchRideByToken = async () => {
    try {
      // Fetch share info
      const { data: share, error: shareError } = await supabase
        .from("ride_shares")
        .select("*, rides(*)")
        .eq("share_token", token)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (shareError || !share) {
        setError("Link inválido ou expirado");
        return;
      }

      // Update view count
      await supabase
        .from("ride_shares")
        .update({ views_count: (share.views_count || 0) + 1, last_viewed_at: new Date().toISOString() })
        .eq("id", share.id);

      setRideData(share.rides);
    } catch (err) {
      setError("Erro ao carregar informações");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending": return { label: "Aguardando Motorista", color: "bg-yellow-500" };
      case "accepted": return { label: "Motorista a Caminho", color: "bg-blue-500" };
      case "in_progress": return { label: "Em Andamento", color: "bg-green-500" };
      case "completed": return { label: "Finalizada", color: "bg-gray-500" };
      case "cancelled": return { label: "Cancelada", color: "bg-red-500" };
      default: return { label: status, color: "bg-gray-500" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-xl font-bold mb-2">Link Inválido</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(rideData?.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center py-4">
          <img src={logoFull} alt="Bibi Motos" className="h-10 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Acompanhamento em Tempo Real</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Status da Corrida</h2>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm font-medium">{rideData?.origin_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="text-sm font-medium">{rideData?.destination_address}</p>
                </div>
              </div>
            </div>

            {rideData?.estimated_price && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-muted-foreground">Valor Estimado</span>
                <span className="font-bold text-lg">R$ {Number(rideData.estimated_price).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          <Clock className="inline h-3 w-3 mr-1" />
          Atualizado automaticamente
        </p>
      </div>
    </div>
  );
}
