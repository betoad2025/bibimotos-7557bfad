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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown, Search, Phone, Mail, MessageCircle, Check, X } from "lucide-react";
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
}

export function LeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data } = await supabase
        .from("franchise_leads")
        .select("*")
        .order("created_at", { ascending: false });
      setLeads(data || []);
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

      const { error } = await supabase
        .from("franchise_leads")
        .update(updates)
        .eq("id", lead.id);

      if (error) throw error;
      toast.success("Status atualizado!");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from("franchise_leads")
        .update({ notes })
        .eq("id", selectedLead.id);

      if (error) throw error;
      toast.success("Notas salvas!");
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar notas");
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Excluir lead ${lead.name}?`)) return;

    try {
      const { error } = await supabase
        .from("franchise_leads")
        .delete()
        .eq("id", lead.id);

      if (error) throw error;
      toast.success("Lead excluído!");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "new":
        return <Badge className="bg-red-500">Novo</Badge>;
      case "contacted":
        return <Badge className="bg-yellow-500">Contactado</Badge>;
      case "negotiating":
        return <Badge className="bg-blue-500">Negociando</Badge>;
      case "converted":
        return <Badge className="bg-green-500">Convertido</Badge>;
      case "rejected":
        return <Badge variant="secondary">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status || "Novo"}</Badge>;
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && (lead.status || "new") === statusFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const newLeadsCount = leads.filter((l) => l.status === "new" || !l.status).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-red-600" />
              Leads de Franquia ({leads.length})
              {newLeadsCount > 0 && (
                <Badge className="bg-red-500 ml-2">{newLeadsCount} novos</Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
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
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    {lead.city}
                    {lead.state && ` - ${lead.state}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </a>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-muted-foreground hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedLead(lead);
                          setNotes(lead.notes || "");
                        }}
                        title="Notas"
                      >
                        <MessageCircle className="h-4 w-4" />
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
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas - {selectedLead?.name}</DialogTitle>
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
    </>
  );
}
