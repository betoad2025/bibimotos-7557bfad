import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  ArrowRightLeft, Building2, Users, Bike, Store,
  AlertTriangle, CheckCircle2, Clock, History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface Franchise {
  id: string;
  name: string;
  owner_id: string | null;
  cities?: { name: string; state: string };
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface TransferHistory {
  id: string;
  franchise_id: string;
  from_owner_id: string | null;
  to_owner_id: string | null;
  transferred_at: string;
  drivers_count: number;
  passengers_count: number;
  merchants_count: number;
  notes: string | null;
}

export function FranchiseTransferManagement() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [history, setHistory] = useState<TransferHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; franchise: Franchise | null }>({
    open: false,
    franchise: null,
  });
  const [transferForm, setTransferForm] = useState({ newOwnerId: "", notes: "" });
  const [stats, setStats] = useState({ drivers: 0, passengers: 0, merchants: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [franchisesRes, rolesRes, historyRes] = await Promise.all([
        supabase
          .from("franchises")
          .select("*, cities(name, state)")
          .order("name"),
        supabase.from("user_roles").select("user_id").eq("role", "franchise_admin"),
        supabase
          .from("franchise_transfer_history")
          .select("*")
          .order("transferred_at", { ascending: false })
          .limit(50),
      ]);

      if (franchisesRes.data) setFranchises(franchisesRes.data);
      if (historyRes.data) setHistory(historyRes.data);

      // Fetch owners profiles
      if (rolesRes.data) {
        const userIds = rolesRes.data.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, email, avatar_url")
          .in("user_id", userIds);
        if (profiles) setOwners(profiles);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchFranchiseStats = async (franchiseId: string) => {
    const [driversRes, passengersRes, merchantsRes] = await Promise.all([
      supabase.from("drivers").select("id", { count: "exact", head: true }).eq("franchise_id", franchiseId),
      supabase.from("passengers").select("id", { count: "exact", head: true }).eq("franchise_id", franchiseId),
      supabase.from("merchants").select("id", { count: "exact", head: true }).eq("franchise_id", franchiseId),
    ]);

    setStats({
      drivers: driversRes.count || 0,
      passengers: passengersRes.count || 0,
      merchants: merchantsRes.count || 0,
    });
  };

  const handleOpenTransfer = async (franchise: Franchise) => {
    setTransferDialog({ open: true, franchise });
    setTransferForm({ newOwnerId: "", notes: "" });
    await fetchFranchiseStats(franchise.id);
  };

  const handleTransfer = async () => {
    if (!transferDialog.franchise || !transferForm.newOwnerId) {
      toast.error("Selecione o novo proprietário");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("transfer_franchise", {
        p_franchise_id: transferDialog.franchise.id,
        p_new_owner_id: transferForm.newOwnerId,
        p_notes: transferForm.notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; drivers_transferred: number; passengers_transferred: number; merchants_transferred: number; error?: string };
      
      if (result.success) {
        toast.success(
          `Franquia transferida! ${result.drivers_transferred} motoristas, ${result.passengers_transferred} passageiros, ${result.merchants_transferred} comerciantes`
        );
        setTransferDialog({ open: false, franchise: null });
        fetchData();
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao transferir franquia");
    }
  };

  const getOwnerProfile = (ownerId: string | null) => {
    if (!ownerId) return null;
    return owners.find((o) => o.user_id === ownerId);
  };

  const getAvailableOwners = () => {
    // Exclude current owner
    const currentOwnerId = transferDialog.franchise?.owner_id;
    return owners.filter((o) => o.user_id !== currentOwnerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowRightLeft className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Transferência de Franquias</h2>
              <p className="text-purple-200">
                Transfira a propriedade mantendo todos os dados (motoristas, passageiros, comerciantes)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Franchises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Franquias Disponíveis para Transferência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franquia</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Proprietário Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchises.map((franchise) => {
                const owner = getOwnerProfile(franchise.owner_id);
                return (
                  <TableRow key={franchise.id}>
                    <TableCell className="font-medium">{franchise.name}</TableCell>
                    <TableCell>
                      {franchise.cities?.name}/{franchise.cities?.state}
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            avatarUrl={owner.avatar_url}
                            name={owner.full_name || owner.email}
                            size="sm"
                            showRating={false}
                          />
                          <div>
                            <p className="font-medium text-sm">{owner.full_name}</p>
                            <p className="text-xs text-muted-foreground">{owner.email}</p>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">
                          Sistema Master
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenTransfer(franchise)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                        Transferir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Transferências
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transferência registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Franquia</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Dados Transferidos</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => {
                  const franchise = franchises.find((f) => f.id === h.franchise_id);
                  const fromOwner = getOwnerProfile(h.from_owner_id);
                  const toOwner = getOwnerProfile(h.to_owner_id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">
                        {franchise?.name || "Franquia removida"}
                      </TableCell>
                      <TableCell>
                        {fromOwner?.full_name || "Sistema Master"}
                      </TableCell>
                      <TableCell>
                        {toOwner?.full_name || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            <Bike className="h-3 w-3 mr-1" />
                            {h.drivers_count}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {h.passengers_count}
                          </Badge>
                          <Badge variant="outline">
                            <Store className="h-3 w-3 mr-1" />
                            {h.merchants_count}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(h.transferred_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog
        open={transferDialog.open}
        onOpenChange={(open) => setTransferDialog({ open, franchise: null })}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              Transferir Franquia
            </DialogTitle>
            <DialogDescription>
              Transfira "{transferDialog.franchise?.name}" para um novo proprietário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Atenção</p>
                  <p className="text-sm text-yellow-700">
                    Esta ação irá transferir todos os dados da franquia para o novo proprietário.
                    O processo é irreversível.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Bike className="h-6 w-6 mx-auto text-purple-600" />
                  <p className="text-2xl font-bold">{stats.drivers}</p>
                  <p className="text-xs text-muted-foreground">Motoristas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto text-blue-600" />
                  <p className="text-2xl font-bold">{stats.passengers}</p>
                  <p className="text-xs text-muted-foreground">Passageiros</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Store className="h-6 w-6 mx-auto text-green-600" />
                  <p className="text-2xl font-bold">{stats.merchants}</p>
                  <p className="text-xs text-muted-foreground">Comerciantes</p>
                </CardContent>
              </Card>
            </div>

            {/* New Owner Select */}
            <div className="space-y-2">
              <Label>Novo Proprietário</Label>
              <Select
                value={transferForm.newOwnerId}
                onValueChange={(v) => setTransferForm({ ...transferForm, newOwnerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo proprietário" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOwners().map((owner) => (
                    <SelectItem key={owner.user_id} value={owner.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{owner.full_name || owner.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={transferForm.notes}
                onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                placeholder="Motivo da transferência..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleTransfer}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!transferForm.newOwnerId}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Transferência
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
