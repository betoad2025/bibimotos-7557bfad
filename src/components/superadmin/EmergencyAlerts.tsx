import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Phone,
  MapPin,
  User,
  Bike,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Navigation,
  Bell,
  Car,
  Heart,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmergencyAlert {
  id: string;
  ride_id: string | null;
  delivery_id: string | null;
  franchise_id: string;
  reporter_user_id: string;
  reporter_type: string;
  alert_type: string;
  status: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  description: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface AlertWithDetails extends EmergencyAlert {
  reporterProfile?: {
    full_name: string;
    phone: string | null;
  };
  ride?: {
    origin_address: string;
    destination_address: string;
    driver_id: string | null;
    passenger_id: string | null;
  };
  franchise?: {
    name: string;
    cities?: {
      name: string;
      state: string;
    };
  };
}

export function EmergencyAlerts() {
  const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedAlert, setSelectedAlert] = useState<AlertWithDetails | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("emergency-alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emergency_alerts",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast.error("🚨 NOVO ALERTA DE EMERGÊNCIA!", {
              duration: 10000,
              description: "Um usuário acionou o botão de socorro!",
            });
            // Play alert sound
            const audio = new Audio("/alert-sound.mp3");
            audio.play().catch(() => {});
          }
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const fetchAlerts = async () => {
    try {
      let query = supabase
        .from("emergency_alerts")
        .select(`
          *,
          franchise:franchises(name, cities(name, state))
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: alertsData } = await query;

      if (alertsData) {
        const enrichedAlerts = await Promise.all(
          alertsData.map(async (alert) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", alert.reporter_user_id)
              .single();

            let rideData = null;
            if (alert.ride_id) {
              const { data: ride } = await supabase
                .from("rides")
                .select("origin_address, destination_address, driver_id, passenger_id")
                .eq("id", alert.ride_id)
                .single();
              rideData = ride;
            }

            return {
              ...alert,
              reporterProfile: profileData,
              ride: rideData,
            } as AlertWithDetails;
          })
        );

        setAlerts(enrichedAlerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    try {
      const updates: any = {
        status: newStatus,
      };

      if (newStatus === "resolved" || newStatus === "false_alarm") {
        updates.resolved_at = new Date().toISOString();
        updates.resolution_notes = resolutionNotes;
      }

      const { error } = await supabase
        .from("emergency_alerts")
        .update(updates)
        .eq("id", alertId);

      if (error) throw error;

      toast.success("Status atualizado!");
      setSelectedAlert(null);
      setResolutionNotes("");
      fetchAlerts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar");
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "sos":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "accident":
        return <Car className="h-4 w-4 text-orange-600" />;
      case "medical":
        return <Heart className="h-4 w-4 text-pink-600" />;
      case "threat":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "route_deviation":
        return <Navigation className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sos: "SOS - Socorro",
      accident: "Acidente",
      threat: "Ameaça",
      medical: "Emergência Médica",
      vehicle_issue: "Problema no Veículo",
      route_deviation: "Desvio de Rota",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-red-500 animate-pulse">🚨 ATIVO</Badge>;
      case "responding":
        return <Badge className="bg-yellow-500">Em Atendimento</Badge>;
      case "resolved":
        return <Badge className="bg-green-500">Resolvido</Badge>;
      case "false_alarm":
        return <Badge variant="secondary">Falso Alarme</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReporterIcon = (type: string) => {
    switch (type) {
      case "driver":
        return <Bike className="h-4 w-4" />;
      case "passenger":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Alert Banner */}
        {activeAlertsCount > 0 && (
          <Card className="bg-red-50 border-red-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-red-700 text-lg">
                      {activeAlertsCount} ALERTA{activeAlertsCount > 1 ? "S" : ""} ATIVO{activeAlertsCount > 1 ? "S" : ""}!
                    </p>
                    <p className="text-red-600 text-sm">
                      Usuários precisam de ajuda imediata
                    </p>
                  </div>
                </div>
                <Bell className="h-8 w-8 text-red-500 animate-bounce" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Central de Emergências
                {activeAlertsCount > 0 && (
                  <Badge className="bg-red-500 ml-2">{activeAlertsCount}</Badge>
                )}
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="responding">Em Atendimento</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                  <SelectItem value="false_alarm">Falsos Alarmes</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quem Acionou</TableHead>
                  <TableHead>Franquia</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={alert.status === "active" ? "bg-red-50" : ""}
                  >
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAlertTypeIcon(alert.alert_type)}
                        <span className="text-sm">{getAlertTypeLabel(alert.alert_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getReporterIcon(alert.reporter_type)}
                        <div>
                          <p className="text-sm font-medium">
                            {alert.reporterProfile?.full_name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {alert.reporter_type === "driver" ? "Motorista" : "Passageiro"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{alert.franchise?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.franchise?.cities?.name}/{alert.franchise?.cities?.state}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.location_lat && alert.location_lng ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`,
                              "_blank"
                            )
                          }
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Ver no mapa
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não disponível</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {alert.reporterProfile?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${alert.reporterProfile?.phone}`, "_self")}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant={alert.status === "active" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          {alert.status === "active" ? "Atender" : "Ver"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {alerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum alerta {statusFilter !== "all" ? `com status "${statusFilter}"` : ""}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Alert Details Modal */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Detalhes do Alerta
              {selectedAlert && getStatusBadge(selectedAlert.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* Alert Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {getAlertTypeIcon(selectedAlert.alert_type)}
                    <div>
                      <p className="font-medium">{getAlertTypeLabel(selectedAlert.alert_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedAlert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {selectedAlert.description && (
                    <p className="text-sm bg-muted p-2 rounded">{selectedAlert.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Reporter Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {getReporterIcon(selectedAlert.reporter_type)}
                      </div>
                      <div>
                        <p className="font-medium">{selectedAlert.reporterProfile?.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {selectedAlert.reporter_type === "driver" ? "Motorista" : "Passageiro"}
                        </p>
                      </div>
                    </div>
                    {selectedAlert.reporterProfile?.phone && (
                      <Button
                        onClick={() => window.open(`tel:${selectedAlert.reporterProfile?.phone}`, "_self")}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              {selectedAlert.location_lat && selectedAlert.location_lng && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${selectedAlert.location_lat},${selectedAlert.location_lng}`,
                      "_blank"
                    )
                  }
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Localização no Mapa
                </Button>
              )}

              {/* Status Actions */}
              {(selectedAlert.status === "active" || selectedAlert.status === "responding") && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Notas sobre o atendimento..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {selectedAlert.status === "active" && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedAlert.id, "responding")}
                      >
                        Em Atendimento
                      </Button>
                    )}
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus(selectedAlert.id, "resolved")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolver
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleUpdateStatus(selectedAlert.id, "false_alarm")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Falso Alarme
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedAlert.resolution_notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Notas da Resolução:</p>
                    <p className="text-sm">{selectedAlert.resolution_notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
