import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRightLeft, Building2, MapPin, Clock, Check,
  X, Loader2, Send, AlertCircle
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

interface DriverTransferRequestProps {
  driverId: string;
  currentFranchiseId: string;
  currentFranchiseName: string;
}

interface Franchise {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface TransferRequest {
  id: string;
  status: string;
  to_franchise_id: string;
  notes: string | null;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
  to_franchise?: {
    name: string;
    cities?: {
      name: string;
      state: string;
    };
  };
}

export function DriverTransferRequest({ 
  driverId, 
  currentFranchiseId, 
  currentFranchiseName 
}: DriverTransferRequestProps) {
  const { toast } = useToast();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [availableFranchises, setAvailableFranchises] = useState<Franchise[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<TransferRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<TransferRequest[]>([]);

  useEffect(() => {
    fetchData();
  }, [driverId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch available franchises (excluding current)
      const { data: franchises } = await supabase
        .from("franchises")
        .select(`
          id,
          name,
          cities(name, state)
        `)
        .eq("is_active", true)
        .neq("id", currentFranchiseId);

      const formattedFranchises = (franchises || []).map(f => ({
        id: f.id,
        name: f.name,
        city: (f.cities as any)?.name || "",
        state: (f.cities as any)?.state || "",
      }));
      setAvailableFranchises(formattedFranchises);

      // Fetch existing requests
      const { data: requests } = await supabase
        .from("driver_transfer_requests")
        .select(`
          *,
          to_franchise:franchises!driver_transfer_requests_to_franchise_id_fkey(
            name,
            cities(name, state)
          )
        `)
        .eq("driver_id", driverId)
        .order("requested_at", { ascending: false });

      if (requests && requests.length > 0) {
        const pending = requests.find(r => r.status === "pending");
        if (pending) {
          setPendingRequest(pending as any);
        }
        setRequestHistory(requests as any);
      }
    } catch (error) {
      console.error("Error fetching transfer data:", error);
    }
    setLoading(false);
  };

  const handleSubmitRequest = async () => {
    if (!selectedFranchise) {
      toast({
        title: "Selecione uma franquia",
        description: "Escolha a franquia para a qual deseja ser transferido.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("driver_transfer_requests")
        .insert({
          driver_id: driverId,
          from_franchise_id: currentFranchiseId,
          to_franchise_id: selectedFranchise,
          notes: notes || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Aguarde a aprovação do administrador da franquia de destino.",
      });

      setShowRequestModal(false);
      setSelectedFranchise("");
      setNotes("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;

    try {
      const { error } = await supabase
        .from("driver_transfer_requests")
        .update({ status: "cancelled" })
        .eq("id", pendingRequest.id);

      if (error) throw error;

      toast({
        title: "Solicitação cancelada",
      });

      setPendingRequest(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      approved: { label: "Aprovada", variant: "default" },
      rejected: { label: "Rejeitada", variant: "destructive" },
      cancelled: { label: "Cancelada", variant: "outline" },
    };
    const c = config[status] || { label: status, variant: "secondary" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferência de Franquia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Franchise */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Franquia Atual</p>
            <div className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium">{currentFranchiseName}</span>
            </div>
          </div>

          {/* Pending Request */}
          {pendingRequest ? (
            <div className="p-4 border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Solicitação Pendente
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Transferência para:{" "}
                    <span className="font-medium">
                      {(pendingRequest.to_franchise as any)?.name}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviada em {new Date(pendingRequest.requested_at).toLocaleDateString("pt-BR")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelRequest}
                    className="mt-3"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar Solicitação
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowRequestModal(true)} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Solicitar Transferência
            </Button>
          )}

          {/* Request History */}
          {requestHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Histórico de Solicitações
              </p>
              {requestHistory.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2 border rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {(req.to_franchise as any)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.requested_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Solicitar Transferência
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">De</p>
              <p className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {currentFranchiseName}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Para qual franquia?</label>
              <Select value={selectedFranchise} onValueChange={setSelectedFranchise}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a franquia de destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableFranchises.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {f.name} - {f.city}/{f.state}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo da Transferência (opcional)
              </label>
              <Textarea
                placeholder="Ex: Mudança de cidade, oportunidade de trabalho..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Sua solicitação será enviada ao administrador da franquia de destino. 
                Se aprovada, você será transferido automaticamente.
              </p>
            </div>

            <Button
              onClick={handleSubmitRequest}
              disabled={submitting || !selectedFranchise}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
