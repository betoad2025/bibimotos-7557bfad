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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus, CheckCircle2, XCircle, Clock, Bike, Building2,
  ArrowRight, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TransferRequest {
  id: string;
  driver_id: string;
  from_franchise_id: string;
  to_franchise_id: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

interface Franchise {
  id: string;
  name: string;
}

interface DriverProfile {
  id: string;
  profiles?: { full_name: string; email: string; phone: string };
}

interface DriverTransferRequestsProps {
  franchiseId?: string; // If provided, filter by franchise
  isSuperAdmin?: boolean;
}

export function DriverTransferRequests({ franchiseId, isSuperAdmin = false }: DriverTransferRequestsProps) {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [drivers, setDrivers] = useState<Record<string, DriverProfile>>({});
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: TransferRequest | null }>({
    open: false,
    request: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchData();
  }, [franchiseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("driver_transfer_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (franchiseId) {
        query = query.or(`from_franchise_id.eq.${franchiseId},to_franchise_id.eq.${franchiseId}`);
      }

      const [requestsRes, franchisesRes] = await Promise.all([
        query,
        supabase.from("franchises").select("id, name"),
      ]);

      if (requestsRes.data) setRequests(requestsRes.data);
      if (franchisesRes.data) setFranchises(franchisesRes.data);

      // Fetch driver profiles
      if (requestsRes.data && requestsRes.data.length > 0) {
        const driverIds = [...new Set(requestsRes.data.map((r) => r.driver_id))];
        const { data: driversData } = await supabase
          .from("drivers")
          .select("id, user_id")
          .in("id", driverIds);

        if (driversData) {
          const userIds = driversData.map(d => d.user_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name, email, phone")
            .in("user_id", userIds);
          
          const driversMap: Record<string, DriverProfile> = {};
          driversData.forEach((d) => {
            const profile = profilesData?.find(p => p.user_id === d.user_id);
            driversMap[d.id] = { id: d.id, profiles: profile || undefined };
          });
          setDrivers(driversMap);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const getFranchiseName = (id: string) => {
    return franchises.find((f) => f.id === id)?.name || "Desconhecida";
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers[driverId];
    if (!driver?.profiles) return "Motorista";
    const profile = driver.profiles as unknown as { full_name: string; email: string };
    return profile.full_name || profile.email;
  };

  const handleApprove = async (request: TransferRequest) => {
    try {
      // Update request status
      const { error: requestError } = await supabase
        .from("driver_transfer_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (requestError) throw requestError;

      // Transfer driver to new franchise
      const { error: driverError } = await supabase
        .from("drivers")
        .update({ franchise_id: request.to_franchise_id })
        .eq("id", request.driver_id);

      if (driverError) throw driverError;

      toast.success("Transferência aprovada!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar transferência");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.request) return;

    try {
      const { error } = await supabase
        .from("driver_transfer_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectReason,
        })
        .eq("id", rejectDialog.request.id);

      if (error) throw error;

      toast.success("Transferência rejeitada");
      setRejectDialog({ open: false, request: null });
      setRejectReason("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar transferência");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Aprovada</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            Solicitações de Transferência de Motoristas
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500">{pendingCount} pendentes</Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma solicitação de transferência</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motorista</TableHead>
                <TableHead>De</TableHead>
                <TableHead></TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">{getDriverName(request.driver_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {getFranchiseName(request.from_franchise_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {getFranchiseName(request.to_franchise_id)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(request.requested_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectDialog({ open: true, request })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {request.status === "rejected" && request.rejection_reason && (
                      <span className="text-sm text-red-600 italic">
                        {request.rejection_reason}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ open, request: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejeitar Transferência
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da Rejeição</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleReject}
              variant="destructive"
              className="w-full"
            >
              Confirmar Rejeição
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
