import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ArrowRightLeft, Building2, Users, Bike, Store, Search,
  AlertTriangle, CheckCircle2, History, Crown, User, Megaphone
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
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string;
  status: string | null;
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

type CandidateType = "all" | "profile" | "lead" | "driver" | "passenger" | "merchant" | "franchise_admin";

interface TransferCandidate {
  type: "profile" | "lead";
  id: string;
  user_id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  roles: string[];
  avatar_url?: string | null;
}

export function FranchiseTransferManagement() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [history, setHistory] = useState<TransferHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferDialog, setTransferDialog] = useState<{ open: boolean; franchise: Franchise | null }>({
    open: false,
    franchise: null,
  });
  const [transferForm, setTransferForm] = useState({ newOwnerId: "", notes: "", isLead: false });
  const [stats, setStats] = useState({ drivers: 0, passengers: 0, merchants: 0 });
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateFilter, setCandidateFilter] = useState<CandidateType>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [franchisesRes, profilesRes, rolesRes, leadsRes, historyRes] = await Promise.all([
        supabase.from("franchises").select("*, cities(name, state)").order("name"),
        supabase.from("profiles").select("id, user_id, full_name, email, phone, avatar_url, city").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("franchise_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("franchise_transfer_history").select("*").order("transferred_at", { ascending: false }).limit(50),
      ]);

      if (franchisesRes.data) setFranchises(franchisesRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (rolesRes.data) setUserRoles(rolesRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (historyRes.data) setHistory(historyRes.data);
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

  const getUserRoles = (userId: string) => userRoles.filter(r => r.user_id === userId).map(r => r.role);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      franchise_admin: "Franqueado",
      driver: "Motorista",
      passenger: "Passageiro",
      merchant: "Lojista",
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin": return <Crown className="h-3 w-3" />;
      case "franchise_admin": return <Building2 className="h-3 w-3" />;
      case "driver": return <Bike className="h-3 w-3" />;
      case "passenger": return <User className="h-3 w-3" />;
      case "merchant": return <Store className="h-3 w-3" />;
      default: return null;
    }
  };

  // Build unified candidate list
  const candidates: TransferCandidate[] = useMemo(() => {
    const currentOwnerId = transferDialog.franchise?.owner_id;
    const list: TransferCandidate[] = [];

    // Add profiles
    profiles.forEach(p => {
      if (p.user_id === currentOwnerId) return;
      list.push({
        type: "profile",
        id: p.user_id,
        user_id: p.user_id,
        name: p.full_name,
        email: p.email,
        phone: p.phone,
        city: p.city,
        roles: getUserRoles(p.user_id),
        avatar_url: p.avatar_url,
      });
    });

    // Add leads that don't have a profile
    const profileEmails = new Set(profiles.map(p => p.email?.toLowerCase()));
    leads.forEach(l => {
      if (l.email && profileEmails.has(l.email.toLowerCase())) return;
      list.push({
        type: "lead",
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        city: l.city,
        roles: [],
      });
    });

    return list;
  }, [profiles, leads, userRoles, transferDialog.franchise]);

  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    // Filter by type
    if (candidateFilter === "lead") {
      filtered = filtered.filter(c => c.type === "lead");
    } else if (candidateFilter === "profile") {
      filtered = filtered.filter(c => c.type === "profile");
    } else if (candidateFilter !== "all") {
      filtered = filtered.filter(c => c.roles.includes(candidateFilter));
    }

    // Search
    if (candidateSearch.trim()) {
      const s = candidateSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(s) ||
        (c.email && c.email.toLowerCase().includes(s)) ||
        (c.phone && c.phone.includes(s)) ||
        (c.city && c.city.toLowerCase().includes(s))
      );
    }

    return filtered.slice(0, 50);
  }, [candidates, candidateFilter, candidateSearch]);

  const handleOpenTransfer = async (franchise: Franchise) => {
    setTransferDialog({ open: true, franchise });
    setTransferForm({ newOwnerId: "", notes: "", isLead: false });
    setCandidateSearch("");
    setCandidateFilter("all");
    await fetchFranchiseStats(franchise.id);
  };

  const handleSelectCandidate = (candidate: TransferCandidate) => {
    setTransferForm(prev => ({
      ...prev,
      newOwnerId: candidate.id,
      isLead: candidate.type === "lead",
    }));
  };

  const [inviteLoading, setInviteLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!transferDialog.franchise || !selectedCandidate) return;
    
    if (!selectedCandidate.email) {
      toast.error("O lead não possui email cadastrado. Não é possível enviar convite.");
      return;
    }

    setInviteLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("send-franchise-invite", {
        body: {
          franchise_id: transferDialog.franchise.id,
          lead_id: selectedCandidate.type === "lead" ? selectedCandidate.id : undefined,
          email: selectedCandidate.email,
          phone: selectedCandidate.phone,
          name: selectedCandidate.name,
          notes: transferForm.notes || undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      
      const result = response.data;
      if (result?.success) {
        if (result.method === "direct_transfer") {
          toast.success(result.message);
        } else {
          toast.success(result.message);
        }
        setTransferDialog({ open: false, franchise: null });
        fetchData();
      } else {
        throw new Error(result?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar convite");
    }
    setInviteLoading(false);
  };

  const handleTransfer = async () => {
    if (!transferDialog.franchise || !transferForm.newOwnerId) {
      toast.error("Selecione o novo proprietário");
      return;
    }

    // If it's a lead, send invite instead of blocking
    if (transferForm.isLead) {
      await handleSendInvite();
      return;
    }

    try {
      const { data, error } = await supabase.rpc("transfer_franchise", {
        p_franchise_id: transferDialog.franchise.id,
        p_new_owner_id: transferForm.newOwnerId,
        p_notes: transferForm.notes || null,
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        await supabase
          .from("profiles")
          .update({ profile_complete: false })
          .eq("user_id", transferForm.newOwnerId)
          .is("cpf", null);

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
    return profiles.find(p => p.user_id === ownerId);
  };

  const selectedCandidate = candidates.find(c => c.id === transferForm.newOwnerId);

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
                Transfira a propriedade para qualquer usuário cadastrado — motorista, lojista, passageiro ou novo franqueado
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
                    <TableCell>{franchise.cities?.name}/{franchise.cities?.state}</TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar avatarUrl={owner.avatar_url} name={owner.full_name || owner.email} size="sm" showRating={false} />
                          <div>
                            <p className="font-medium text-sm">{owner.full_name}</p>
                            <p className="text-xs text-muted-foreground">{owner.email}</p>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">Sistema Master</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenTransfer(franchise)}>
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
            <p className="text-center text-muted-foreground py-8">Nenhuma transferência registrada</p>
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
                  const franchise = franchises.find(f => f.id === h.franchise_id);
                  const fromOwner = getOwnerProfile(h.from_owner_id);
                  const toOwner = getOwnerProfile(h.to_owner_id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{franchise?.name || "Franquia removida"}</TableCell>
                      <TableCell>{fromOwner?.full_name || "Sistema Master"}</TableCell>
                      <TableCell>{toOwner?.full_name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="outline"><Bike className="h-3 w-3 mr-1" />{h.drivers_count}</Badge>
                          <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{h.passengers_count}</Badge>
                          <Badge variant="outline"><Store className="h-3 w-3 mr-1" />{h.merchants_count}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(h.transferred_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferDialog.open} onOpenChange={(open) => setTransferDialog({ open, franchise: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Atenção</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Esta ação irá transferir todos os dados da franquia para o novo proprietário.
                    Se o novo dono não tiver cadastro completo, será bloqueado até preencher os dados.
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

            {/* Candidate Search & Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Novo Proprietário</Label>
              
              <div className="flex flex-wrap gap-2">
                <Select value={candidateFilter} onValueChange={(v) => setCandidateFilter(v as CandidateType)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="lead">📋 Leads</SelectItem>
                    <SelectItem value="franchise_admin">👑 Franqueados</SelectItem>
                    <SelectItem value="driver">🏍️ Motoristas</SelectItem>
                    <SelectItem value="passenger">👤 Passageiros</SelectItem>
                    <SelectItem value="merchant">🏪 Lojistas</SelectItem>
                    <SelectItem value="profile">📧 Todos Cadastros</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, telefone ou cidade..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Selected candidate */}
              {selectedCandidate && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{selectedCandidate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCandidate.email} {selectedCandidate.city && `• ${selectedCandidate.city}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {selectedCandidate.type === "lead" && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">Lead</Badge>
                    )}
                    {selectedCandidate.roles.map(r => (
                      <Badge key={r} variant="secondary" className="text-xs flex items-center gap-1">
                        {getRoleIcon(r)}
                        {getRoleLabel(r)}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTransferForm(prev => ({ ...prev, newOwnerId: "", isLead: false }))}>
                    ✕
                  </Button>
                </div>
              )}

              {/* Candidate list */}
              {!selectedCandidate && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      Nenhum resultado encontrado
                    </p>
                  ) : (
                    filteredCandidates.map(candidate => (
                      <button
                        key={`${candidate.type}-${candidate.id}`}
                        onClick={() => handleSelectCandidate(candidate)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 border-b last:border-b-0 text-left transition-colors"
                      >
                        {candidate.type === "profile" ? (
                          <UserAvatar avatarUrl={candidate.avatar_url} name={candidate.name} size="sm" showRating={false} />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Megaphone className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.email || candidate.phone}
                            {candidate.city && ` • ${candidate.city}`}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {candidate.type === "lead" && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">Lead</Badge>
                          )}
                          {candidate.roles.map(r => (
                            <Badge key={r} variant="secondary" className="text-xs flex items-center gap-1">
                              {getRoleIcon(r)}
                              {getRoleLabel(r)}
                            </Badge>
                          ))}
                          {candidate.type === "profile" && candidate.roles.length === 0 && (
                            <Badge variant="outline" className="text-xs">Usuário</Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Lead invite info */}
            {transferForm.isLead && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Este é um lead — será enviado um convite por e-mail</p>
                  <p>
                    O convidado receberá um link para criar a conta. Ao completar o cadastro, 
                    a franquia será transferida automaticamente, sem necessidade de aprovação.
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={transferForm.notes}
                onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Motivo da transferência..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleTransfer}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!transferForm.newOwnerId || inviteLoading}
            >
              {inviteLoading ? (
                <><span className="animate-spin mr-2">⏳</span> Enviando convite...</>
              ) : transferForm.isLead ? (
                <><Mail className="h-4 w-4 mr-2" />Enviar Convite e Transferir</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Confirmar Transferência</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
