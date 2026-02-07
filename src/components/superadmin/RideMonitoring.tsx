import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  MapPin,
  Phone,
  User,
  Bike,
  Clock,
  Search,
  Eye,
  AlertTriangle,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ride {
  id: string;
  status: string;
  origin_address: string;
  destination_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  estimated_price: number | null;
  created_at: string;
  started_at: string | null;
  driver_id: string | null;
  passenger_id: string | null;
  franchise_id: string;
}

interface RideWithDetails extends Ride {
  driver?: {
    id: string;
    vehicle_model: string | null;
    vehicle_plate: string | null;
    current_lat: number | null;
    current_lng: number | null;
    user_id: string;
  };
  passenger?: {
    id: string;
    user_id: string;
  };
  driverProfile?: {
    full_name: string;
    phone: string | null;
  };
  passengerProfile?: {
    full_name: string;
    phone: string | null;
  };
  franchise?: {
    name: string;
    cities?: {
      name: string;
      state: string;
    };
  };
}

export function RideMonitoring() {
  const [rides, setRides] = useState<RideWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<RideWithDetails | null>(null);
  const [locationLogs, setLocationLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveRides();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("rides-monitoring")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
          filter: "status=in.pending,accepted,in_progress",
        },
        () => {
          fetchActiveRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveRides = async () => {
    try {
      const { data: ridesData } = await supabase
        .from("rides")
        .select(`
          *,
          franchise:franchises(name, cities(name, state))
        `)
        .in("status", ["pending", "accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (ridesData) {
        // Fetch driver and passenger details separately
        const enrichedRides = await Promise.all(
          ridesData.map(async (ride) => {
            let driverProfile = null;
            let passengerProfile = null;
            let driver = null;

            if (ride.driver_id) {
              const { data: driverData } = await supabase
                .from("drivers")
                .select("id, vehicle_model, vehicle_plate, current_lat, current_lng, user_id")
                .eq("id", ride.driver_id)
                .single();
              
              if (driverData) {
                driver = driverData;
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("full_name, phone")
                  .eq("user_id", driverData.user_id)
                  .single();
                driverProfile = profileData;
              }
            }

            if (ride.passenger_id) {
              const { data: passengerData } = await supabase
                .from("passengers")
                .select("id, user_id")
                .eq("id", ride.passenger_id)
                .single();
              
              if (passengerData) {
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("full_name, phone")
                  .eq("user_id", passengerData.user_id)
                  .single();
                passengerProfile = profileData;
              }
            }

            return {
              ...ride,
              driver,
              driverProfile,
              passengerProfile,
            } as RideWithDetails;
          })
        );

        setRides(enrichedRides);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
    }
    setLoading(false);
  };

  const fetchLocationLogs = async (rideId: string) => {
    const { data } = await supabase
      .from("ride_location_logs")
      .select("*")
      .eq("ride_id", rideId)
      .order("created_at", { ascending: false })
      .limit(50);
    setLocationLogs(data || []);
  };

  const handleViewRide = (ride: RideWithDetails) => {
    setSelectedRide(ride);
    fetchLocationLogs(ride.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aguardando</Badge>;
      case "accepted":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Aceita</Badge>;
      case "in_progress":
        return <Badge className="bg-green-500">Em andamento</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRides = rides.filter(
    (ride) =>
      ride.origin_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driverProfile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.passengerProfile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = rides.filter((r) => r.status === "pending").length;
  const inProgressCount = rides.filter((r) => r.status === "in_progress").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                  <p className="text-sm opacity-80">Aguardando Motorista</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Navigation className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-3xl font-bold">{inProgressCount}</p>
                  <p className="text-sm opacity-80">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-3xl font-bold">{rides.length}</p>
                  <p className="text-sm opacity-80">Total Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button onClick={fetchActiveRides} variant="outline" className="w-full h-full">
                <RefreshCw className="h-5 w-5 mr-2" />
                Atualizar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Rides Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Corridas Ativas em Tempo Real
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar corrida..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Franquia</TableHead>
                  <TableHead>Passageiro</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell>{getStatusBadge(ride.status)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{ride.franchise?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ride.franchise?.cities?.name}/{ride.franchise?.cities?.state}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{ride.passengerProfile?.full_name || "—"}</p>
                          {ride.passengerProfile?.phone && (
                            <a href={`tel:${ride.passengerProfile.phone}`} className="text-xs text-blue-600">
                              {ride.passengerProfile.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ride.driver ? (
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{ride.driverProfile?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ride.driver.vehicle_model} • {ride.driver.vehicle_plate}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Aguardando...</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 max-w-32">
                        <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
                        <span className="text-xs truncate">{ride.origin_address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 max-w-32">
                        <MapPin className="h-3 w-3 text-red-600 flex-shrink-0" />
                        <span className="text-xs truncate">{ride.destination_address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ride.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewRide(ride)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Monitorar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRides.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma corrida ativa no momento
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Ride Details Modal */}
      <Dialog open={!!selectedRide} onOpenChange={() => setSelectedRide(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Monitoramento de Corrida
              {selectedRide && getStatusBadge(selectedRide.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRide && (
            <div className="space-y-6">
              {/* Participants */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Passageiro</p>
                        <p className="font-medium">{selectedRide.passengerProfile?.full_name || "—"}</p>
                        {selectedRide.passengerProfile?.phone && (
                          <a href={`tel:${selectedRide.passengerProfile.phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedRide.passengerProfile.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Bike className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Motorista</p>
                        <p className="font-medium">{selectedRide.driverProfile?.full_name || "Aguardando..."}</p>
                        {selectedRide.driver && (
                          <p className="text-xs text-muted-foreground">
                            {selectedRide.driver.vehicle_model} • {selectedRide.driver.vehicle_plate}
                          </p>
                        )}
                        {selectedRide.driverProfile?.phone && (
                          <a href={`tel:${selectedRide.driverProfile.phone}`} className="text-sm text-blue-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedRide.driverProfile.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Route */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Origem</p>
                      <p className="text-sm">{selectedRide.origin_address}</p>
                    </div>
                  </div>
                  <div className="ml-3 border-l-2 border-dashed h-4" />
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="text-sm">{selectedRide.destination_address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location History */}
              {locationLogs.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Histórico de Localização</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="max-h-40 overflow-auto space-y-2">
                      {locationLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </span>
                          <span>
                            {log.lat.toFixed(5)}, {log.lng.toFixed(5)}
                          </span>
                          {log.speed && (
                            <Badge variant="outline">{log.speed.toFixed(0)} km/h</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Google Maps Link */}
              {selectedRide.driver?.current_lat && (
                <Button
                  className="w-full"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${selectedRide.driver?.current_lat},${selectedRide.driver?.current_lng}`,
                      "_blank"
                    )
                  }
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Ver no Google Maps
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
