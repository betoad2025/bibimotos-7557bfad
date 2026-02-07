import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  History, MapPin, Navigation, Clock, Star, 
  DollarSign, ChevronRight, Calendar, Filter 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface RideHistoryProps {
  userId: string;
  userType: "driver" | "passenger";
  driverId?: string;
  passengerId?: string;
}

interface RideRecord {
  id: string;
  status: string;
  origin_address: string;
  destination_address: string;
  distance_km: number;
  estimated_price: number;
  final_price: number;
  driver_rating: number | null;
  passenger_rating: number | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  driver?: {
    id: string;
    vehicle_model: string;
    vehicle_plate: string;
    rating: number;
  };
  passenger?: {
    id: string;
    rating: number;
  };
}

export function RideHistory({ userId, userType, driverId, passengerId }: RideHistoryProps) {
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<RideRecord | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    avgRating: 0,
    cancelledRides: 0,
  });

  useEffect(() => {
    fetchRides();
  }, [driverId, passengerId, filter]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("rides")
        .select(`
          *,
          driver:drivers(
            id,
            vehicle_model,
            vehicle_plate,
            rating,
            user_id
          ),
          passenger:passengers(
            id,
            rating,
            user_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (userType === "driver" && driverId) {
        query = query.eq("driver_id", driverId);
      } else if (userType === "passenger" && passengerId) {
        query = query.eq("passenger_id", passengerId);
      }

      if (filter !== "all") {
        if (filter === "completed") {
          query = query.eq("status", "completed" as const);
        } else if (filter === "cancelled") {
          query = query.eq("status", "cancelled" as const);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match interface
      const transformedRides: RideRecord[] = (data || []).map(ride => ({
        id: ride.id,
        status: ride.status || "pending",
        origin_address: ride.origin_address,
        destination_address: ride.destination_address,
        distance_km: Number(ride.distance_km) || 0,
        estimated_price: Number(ride.estimated_price) || 0,
        final_price: Number(ride.final_price) || 0,
        driver_rating: ride.driver_rating,
        passenger_rating: ride.passenger_rating,
        created_at: ride.created_at,
        completed_at: ride.completed_at,
        cancelled_at: ride.cancelled_at,
        driver: ride.driver ? {
          id: ride.driver.id,
          vehicle_model: ride.driver.vehicle_model || "",
          vehicle_plate: ride.driver.vehicle_plate || "",
          rating: Number(ride.driver.rating) || 5,
        } : undefined,
        passenger: ride.passenger ? {
          id: ride.passenger.id,
          rating: Number(ride.passenger.rating) || 5,
        } : undefined,
      }));

      setRides(transformedRides);

      // Calculate stats
      const completed = transformedRides.filter(r => r.status === "completed");
      const cancelled = transformedRides.filter(r => r.status === "cancelled");
      const totalEarnings = completed.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0);
      const ratings = userType === "driver" 
        ? completed.filter(r => r.driver_rating).map(r => r.driver_rating!)
        : completed.filter(r => r.passenger_rating).map(r => r.passenger_rating!);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      setStats({
        totalRides: completed.length,
        totalEarnings,
        avgRating,
        cancelledRides: cancelled.length,
      });
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Aguardando", variant: "secondary" },
      accepted: { label: "Aceita", variant: "default" },
      in_progress: { label: "Em andamento", variant: "default" },
      completed: { label: "Concluída", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Corridas
            </CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xl font-bold">{stats.totalRides}</p>
              <p className="text-xs text-muted-foreground">Corridas</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">
                R$ {stats.totalEarnings.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {userType === "driver" ? "Ganhos" : "Gasto"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avaliação</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-500">{stats.cancelledRides}</p>
              <p className="text-xs text-muted-foreground">Canceladas</p>
            </div>
          </div>

          {/* Rides List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma corrida encontrada</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {rides.map((ride) => (
                <button
                  key={ride.id}
                  onClick={() => setSelectedRide(ride)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(ride.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(ride.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold">
                        R$ {(ride.final_price || ride.estimated_price || 0).toFixed(2)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="truncate">{ride.origin_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Navigation className="h-3 w-3 text-red-500 flex-shrink-0" />
                    <span className="truncate">{ride.destination_address}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ride Detail Modal */}
      <Dialog open={!!selectedRide} onOpenChange={() => setSelectedRide(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhes da Corrida
            </DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedRide.status)}
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedRide.created_at)}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {userType === "passenger" && selectedRide.driver ? (
                  <>
                    <UserAvatar
                      avatarUrl={undefined}
                      name="Motorista"
                      rating={selectedRide.driver.rating}
                      size="md"
                      showRating={false}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Motorista</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRide.driver.vehicle_model} • {selectedRide.driver.vehicle_plate}
                      </p>
                    </div>
                    {selectedRide.driver_rating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="font-bold">{selectedRide.driver_rating}</span>
                      </div>
                    )}
                  </>
                ) : userType === "driver" && selectedRide.passenger ? (
                  <>
                    <UserAvatar
                      avatarUrl={undefined}
                      name="Passageiro"
                      rating={selectedRide.passenger.rating}
                      size="md"
                      showRating={false}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Passageiro</p>
                      <p className="text-sm text-muted-foreground">Passageiro</p>
                    </div>
                    {selectedRide.passenger_rating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="font-bold">{selectedRide.passenger_rating}</span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Addresses */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <p className="text-sm">{selectedRide.origin_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <Navigation className="h-3 w-3 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Destino</p>
                    <p className="text-sm">{selectedRide.destination_address}</p>
                  </div>
                </div>
              </div>

              {/* Ride Info */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {selectedRide.distance_km?.toFixed(1) || "0"} km
                  </p>
                  <p className="text-xs text-muted-foreground">Distância</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    R$ {(selectedRide.final_price || selectedRide.estimated_price || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Valor</p>
                </div>
                <div className="text-center">
                  {selectedRide.completed_at ? (
                    <>
                      <p className="text-lg font-bold">
                        {Math.round(
                          (new Date(selectedRide.completed_at).getTime() -
                            new Date(selectedRide.created_at).getTime()) /
                            60000
                        )}min
                      </p>
                      <p className="text-xs text-muted-foreground">Duração</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold">-</p>
                      <p className="text-xs text-muted-foreground">Duração</p>
                    </>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Criada: {formatDate(selectedRide.created_at)}</p>
                {selectedRide.completed_at && (
                  <p>Concluída: {formatDate(selectedRide.completed_at)}</p>
                )}
                {selectedRide.cancelled_at && (
                  <p>Cancelada: {formatDate(selectedRide.cancelled_at)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
