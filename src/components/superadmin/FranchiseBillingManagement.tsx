import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  CreditCard, DollarSign, Calendar, AlertTriangle, CheckCircle2,
  XCircle, Clock, Gift, Lock, Unlock, Search, Filter, RefreshCw,
  Building2, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Franchise {
  id: string;
  name: string;
  owner_id: string | null;
  is_active: boolean | null;
  monthly_fee: number | null;
  billing_status: string | null;
  billing_blocked_at: string | null;
  billing_grace_until: string | null;
  trial_ends_at: string | null;
  next_billing_date: string | null;
  last_payment_date: string | null;
  courtesy_days: number | null;
  courtesy_until: string | null;
  courtesy_reason: string | null;
  contract_start_date: string | null;
  cities?: { name: string; state: string };
}

interface FranchiseBilling {
  id: string;
  franchise_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  status: string;
  is_prorated: boolean;
  created_at: string;
}

export function FranchiseBillingManagement() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [billings, setBillings] = useState<FranchiseBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [courtesyDialog, setCourtesyDialog] = useState<{ open: boolean; franchise: Franchise | null }>({
    open: false,
    franchise: null,
  });
  const [courtesyForm, setCourtesyForm] = useState({ days: "30", reason: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [franchisesRes, billingsRes] = await Promise.all([
        supabase
          .from("franchises")
          .select("*, cities(name, state)")
          .order("name"),
        supabase
          .from("franchise_billing")
          .select("*")
          .order("due_date", { ascending: false })
          .limit(100),
      ]);

      if (franchisesRes.data) setFranchises(franchisesRes.data as Franchise[]);
      if (billingsRes.data) setBillings(billingsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const getBillingStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</Badge>;
      case "blocked":
        return <Badge variant="destructive"><Lock className="h-3 w-3 mr-1" /> Bloqueado</Badge>;
      case "grace_period":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Cortesia</Badge>;
      case "trial":
        return <Badge className="bg-blue-500"><Gift className="h-3 w-3 mr-1" /> Trial</Badge>;
      default:
        return <Badge variant="secondary">Indefinido</Badge>;
    }
  };

  const handleGrantCourtesy = async () => {
    if (!courtesyDialog.franchise) return;

    try {
      const { data, error } = await supabase.rpc("grant_franchise_courtesy", {
        p_franchise_id: courtesyDialog.franchise.id,
        p_days: parseInt(courtesyForm.days),
        p_reason: courtesyForm.reason || null,
      });

      if (error) throw error;
      
      toast.success(`Cortesia de ${courtesyForm.days} dias concedida!`);
      setCourtesyDialog({ open: false, franchise: null });
      setCourtesyForm({ days: "30", reason: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao conceder cortesia");
    }
  };

  const handleToggleBlock = async (franchise: Franchise) => {
    const newStatus = franchise.billing_status === "blocked" ? "active" : "blocked";
    const shouldBlock = newStatus === "blocked";

    try {
      const { error } = await supabase
        .from("franchises")
        .update({
          billing_status: newStatus,
          billing_blocked_at: shouldBlock ? new Date().toISOString() : null,
          is_active: !shouldBlock,
        })
        .eq("id", franchise.id);

      if (error) throw error;
      
      toast.success(shouldBlock ? "Franquia bloqueada" : "Franquia desbloqueada");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const handleMarkAsPaid = async (billing: FranchiseBilling) => {
    try {
      const { error } = await supabase
        .from("franchise_billing")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "manual",
        })
        .eq("id", billing.id);

      if (error) throw error;

      // Update franchise last payment date
      await supabase
        .from("franchises")
        .update({
          last_payment_date: new Date().toISOString().split("T")[0],
          billing_status: "active",
          is_active: true,
        })
        .eq("id", billing.franchise_id);

      toast.success("Pagamento registrado!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar pagamento");
    }
  };

  const handleGenerateBilling = async (franchise: Franchise) => {
    const dueDate = new Date();
    dueDate.setDate(30);
    if (dueDate < new Date()) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Check if prorated
    const contractStart = franchise.contract_start_date ? new Date(franchise.contract_start_date) : new Date();
    const dayOfMonth = contractStart.getDate();
    const isProrated = dayOfMonth > 1;
    const proratedDays = isProrated ? 30 - dayOfMonth + 1 : 30;
    const amount = isProrated
      ? ((franchise.monthly_fee || 299) / 30) * proratedDays
      : franchise.monthly_fee || 299;

    try {
      const { error } = await supabase.from("franchise_billing").insert({
        franchise_id: franchise.id,
        amount,
        due_date: dueDate.toISOString().split("T")[0],
        is_prorated: isProrated,
        prorate_days: proratedDays,
      });

      if (error) throw error;
      toast.success("Cobrança gerada!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar cobrança");
    }
  };

  const filteredFranchises = franchises.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cities?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || f.billing_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: franchises.length,
    active: franchises.filter((f) => f.billing_status === "active").length,
    blocked: franchises.filter((f) => f.billing_status === "blocked").length,
    trial: franchises.filter((f) => f.billing_status === "trial").length,
    grace: franchises.filter((f) => f.billing_status === "grace_period").length,
    totalMRR: franchises
      .filter((f) => f.billing_status === "active")
      .reduce((sum, f) => sum + (f.monthly_fee || 299), 0),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
          <CardContent className="p-4">
            <DollarSign className="h-6 w-6 opacity-80" />
            <p className="text-2xl font-bold mt-2">R$ {stats.totalMRR.toFixed(0)}</p>
            <p className="text-sm opacity-80">MRR Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <p className="text-2xl font-bold mt-2">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Lock className="h-6 w-6 text-red-600" />
            <p className="text-2xl font-bold mt-2">{stats.blocked}</p>
            <p className="text-sm text-muted-foreground">Bloqueados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Gift className="h-6 w-6 text-blue-600" />
            <p className="text-2xl font-bold mt-2">{stats.trial}</p>
            <p className="text-sm text-muted-foreground">Trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Clock className="h-6 w-6 text-yellow-600" />
            <p className="text-2xl font-bold mt-2">{stats.grace}</p>
            <p className="text-sm text-muted-foreground">Cortesia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Building2 className="h-6 w-6 text-purple-600" />
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gestão de Mensalidades
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="grace_period">Cortesia</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franquia</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Pagamento</TableHead>
                <TableHead>Cortesia</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFranchises.map((franchise) => (
                <TableRow key={franchise.id}>
                  <TableCell className="font-medium">{franchise.name}</TableCell>
                  <TableCell>
                    {franchise.cities?.name}/{franchise.cities?.state}
                  </TableCell>
                  <TableCell className="font-bold text-green-600">
                    R$ {(franchise.monthly_fee || 299).toFixed(2)}
                  </TableCell>
                  <TableCell>{getBillingStatusBadge(franchise.billing_status)}</TableCell>
                  <TableCell>
                    {franchise.last_payment_date
                      ? format(new Date(franchise.last_payment_date), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {franchise.courtesy_until ? (
                      <div className="text-sm">
                        <p className="text-yellow-600 font-medium">
                          Até {format(new Date(franchise.courtesy_until), "dd/MM/yyyy")}
                        </p>
                        {franchise.courtesy_reason && (
                          <p className="text-xs text-muted-foreground truncate max-w-32">
                            {franchise.courtesy_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCourtesyDialog({ open: true, franchise })}
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        Cortesia
                      </Button>
                      <Button
                        size="sm"
                        variant={franchise.billing_status === "blocked" ? "default" : "destructive"}
                        onClick={() => handleToggleBlock(franchise)}
                      >
                        {franchise.billing_status === "blocked" ? (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            Desbloquear
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Bloquear
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateBilling(franchise)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Gerar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Billings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cobranças Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franquia</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billings.slice(0, 20).map((billing) => {
                const franchise = franchises.find((f) => f.id === billing.franchise_id);
                return (
                  <TableRow key={billing.id}>
                    <TableCell className="font-medium">{franchise?.name || "-"}</TableCell>
                    <TableCell>
                      R$ {billing.amount.toFixed(2)}
                      {billing.is_prorated && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Proporcional
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(billing.due_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {billing.status === "paid" ? (
                        <Badge className="bg-green-500">Pago</Badge>
                      ) : billing.status === "overdue" ? (
                        <Badge variant="destructive">Vencido</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {billing.paid_at
                        ? format(new Date(billing.paid_at), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {billing.status !== "paid" && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(billing)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marcar Pago
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Courtesy Dialog */}
      <Dialog
        open={courtesyDialog.open}
        onOpenChange={(open) => setCourtesyDialog({ open, franchise: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-600" />
              Conceder Cortesia
            </DialogTitle>
            <DialogDescription>
              Libere acesso temporário para {courtesyDialog.franchise?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dias de Cortesia</Label>
              <Select
                value={courtesyForm.days}
                onValueChange={(v) => setCourtesyForm({ ...courtesyForm, days: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={courtesyForm.reason}
                onChange={(e) => setCourtesyForm({ ...courtesyForm, reason: e.target.value })}
                placeholder="Ex: Período de testes, negociação em andamento..."
                rows={3}
              />
            </div>

            <Button onClick={handleGrantCourtesy} className="w-full">
              <Gift className="h-4 w-4 mr-2" />
              Conceder {courtesyForm.days} dias de Cortesia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
