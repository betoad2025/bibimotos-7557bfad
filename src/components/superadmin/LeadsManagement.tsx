import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, Search, Phone, Mail, MessageCircle, Check, X, Building2, AlertTriangle, Globe, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  state: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  contacted_at: string | null;
  source_page: string | null;
  city_id: string | null;
}

interface City {
  id: string;
  name: string;
  state: string;
}

interface Franchise {
  id: string;
  name: string;
  city_id: string;
  owner_id: string | null;
}

export function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [convertFranchiseId, setConvertFranchiseId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<Record<string, Lead[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, citiesRes, franchisesRes] = await Promise.all([
        supabase.from("franchise_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("cities").select("id, name, state").order("name"),
        supabase.from("franchises").select("id, name, city_id, owner_id"),
      ]);
      
      const leadsData = (leadsRes.data || []) as unknown as Lead[];
      setLeads(leadsData);
      setCities(citiesRes.data || []);
      setFranchises(franchisesRes.data || [] as unknown as Franchise[]);

      // Detect duplicates by phone or email
      const phoneMap: Record<string, Lead[]> = {};
      const emailMap: Record<string, Lead[]> = {};
      const dupMap: Record<string, Lead[]> = {};

      leadsData.forEach(lead => {
        const phone = lead.phone.replace(/\D/g, '');
        if (!phoneMap[phone]) phoneMap[phone] = [];
        phoneMap[phone].push(lead);

        if (lead.email) {
          const email = lead.email.toLowerCase();
          if (!emailMap[email]) emailMap[email] = [];
          emailMap[email].push(lead);
        }
      });

      Object.values(phoneMap).forEach(group => {
        if (group.length > 1) {
          group.forEach(l => { dupMap[l.id] = group.filter(g => g.id !== l.id); });
        }
      });
      Object.values(emailMap).forEach(group => {
        if (group.length > 1) {
          group.forEach(l => { 
            dupMap[l.id] = [...(dupMap[l.id] || []), ...group.filter(g => g.id !== l.id)];
          });
        }
      });

      setDuplicates(dupMap);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (lead: Lead, status: string) => {
    try {
      const updates: any = { status };
      if (status === "contacted" && !lead.contacted_at) {
        updates.contacted_at = new Date().toISOString();
      }
      const { error } = await supabase.from("franchise_leads").update(updates).eq("id", lead.id);
      if (error) throw error;
      toast.success("Status atualizado!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    try {
      const { error } = await supabase.from("franchise_leads").update({ notes }).eq("id", selectedLead.id);
      if (error) throw error;
      toast.success("Notas salvas!");
      setSelectedLead(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar notas");
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Excluir lead ${lead.name}?`)) return;
    try {
      const { error } = await supabase.from("franchise_leads").delete().eq("id", lead.id);
      if (error) throw error;
      toast.success("Lead excluído!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  const handleConvertToOwner = async () => {
    if (!convertLead || !convertFranchiseId) return;

    try {
      // First check if lead has a user account by email
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", convertLead.email || convertLead.phone)
        .maybeSingle();

      if (existingProfile) {
        // User exists - assign franchise ownership
        const { error: franchiseError } = await supabase
          .from("franchises")
          .update({ owner_id: existingProfile.user_id })
          .eq("id", convertFranchiseId);

        if (franchiseError) throw franchiseError;

        // Add franchise_admin role
        await supabase.from("user_roles").upsert({
          user_id: existingProfile.user_id,
          role: "franchise_admin" as any,
        }, { onConflict: "user_id,role" });

        // Update lead status
        await supabase.from("franchise_leads").update({ status: "converted" }).eq("id", convertLead.id);

        toast.success(`${convertLead.name} convertido(a) em dono(a) de franquia!`);
      } else {
        // No user account - just update lead status and add notes
        await supabase.from("franchise_leads").update({ 
          status: "converted",
          notes: `${convertLead.notes || ''}\n[CONVERSÃO] Marcado para conversão em dono de franquia. Aguardando criação de conta.`.trim()
        }).eq("id", convertLead.id);

        toast.success("Lead marcado como convertido. O usuário precisa criar uma conta primeiro.");
      }

      setConvertLead(null);
      setConvertFranchiseId("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro na conversão");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "new": return <Badge className="bg-red-500">Novo</Badge>;
      case "contacted": return <Badge className="bg-yellow-500">Contactado</Badge>;
      case "negotiating": return <Badge className="bg-blue-500">Negociando</Badge>;
      case "converted": return <Badge className="bg-green-500">Convertido</Badge>;
      case "rejected": return <Badge variant="secondary">Rejeitado</Badge>;
      default: return <Badge variant="outline">{status || "Novo"}</Badge>;
    }
  };

  const getSourceLabel = (source: string | null) => {
    const labels: Record<string, string> = {
      franquia: "Pág. Franquia",
      landing: "Landing Page",
      city_landing: "Landing Cidade",
      dashboard: "Dashboard",
    };
    return source ? labels[source] || source : "—";
  };

  // Unique cities from leads for filtering
  const leadCities = [...new Set(leads.map(l => l.city))].sort();

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || (lead.status || "new") === statusFilter;
    const matchesCity = cityFilter === "all" || lead.city === cityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const newLeadsCount = leads.filter((l) => l.status === "new" || !l.status).length;
  const duplicateCount = Object.keys(duplicates).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-red-600" />
              Leads de Franquia ({leads.length})
              {newLeadsCount > 0 && (
                <Badge className="bg-red-500 ml-2">{newLeadsCount} novos</Badge>
              )}
              {duplicateCount > 0 && (
                <Badge variant="destructive" className="ml-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {duplicateCount / 2} duplicados
                </Badge>
              )}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Cidades</SelectItem>
                  {leadCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="contacted">Contactados</SelectItem>
                  <SelectItem value="negotiating">Negociando</SelectItem>
                  <SelectItem value="converted">Convertidos</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const isDuplicate = !!duplicates[lead.id];
                return (
                  <TableRow key={lead.id} className={isDuplicate ? "bg-red-50 dark:bg-red-950/20" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {lead.name}
                        {isDuplicate && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            DUP
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {lead.city}
                        {lead.state && ` - ${lead.state}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </a>
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-muted-foreground hover:underline text-sm">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                        <Globe className="h-3 w-3" />
                        {getSourceLabel(lead.source_page)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ""); }}
                          title="Notas"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setConvertLead(lead); setConvertFranchiseId(""); }}
                          title="Converter em Dono de Franquia"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                        <Select
                          value={lead.status || "new"}
                          onValueChange={(status) => handleUpdateStatus(lead, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="negotiating">Negociando</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lead)}
                          className="text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas - {selectedLead?.name}</DialogTitle>
            <DialogDescription>
              {selectedLead?.city}{selectedLead?.state && ` - ${selectedLead.state}`} • {selectedLead?.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione notas sobre este lead..."
              rows={5}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveNotes} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Salvar Notas
              </Button>
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Franchise Owner Dialog */}
      <AlertDialog open={!!convertLead} onOpenChange={() => setConvertLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Converter em Dono de Franquia
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Converter <strong>{convertLead?.name}</strong> ({convertLead?.city}) em proprietário de franquia.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Selecione a franquia:</label>
                  <Select value={convertFranchiseId} onValueChange={setConvertFranchiseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha a franquia" />
                    </SelectTrigger>
                    <SelectContent>
                      {franchises.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} {f.owner_id ? "(já tem dono)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {convertFranchiseId && franchises.find(f => f.id === convertFranchiseId)?.owner_id && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Esta franquia já possui um proprietário. A conversão irá substituí-lo.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToOwner}
              disabled={!convertFranchiseId}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Converter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
