import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Building2, Plus, Pencil, Trash2, Search, DollarSign, User, MapPin, Filter, Calendar, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface City {
  id: string;
  name: string;
  state: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface Franchise {
  id: string;
  name: string;
  city_id: string;
  is_active: boolean | null;
  base_price: number | null;
  price_per_km: number | null;
  monthly_fee: number | null;
  owner_id: string | null;
  created_at: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  cities?: {
    name: string;
    state: string;
  };
}

interface FranchisesManagementProps {
  franchises: Franchise[];
  cities: City[];
  onRefresh: () => void;
}

export function FranchisesManagement({ franchises, cities, onRefresh }: FranchisesManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    city_id: "",
    owner_id: "",
    base_price: "8",
    price_per_km: "2.5",
    monthly_fee: "500",
    contract_start_date: "",
    contract_end_date: "",
  });

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      // Get franchise admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "franchise_admin");

      if (adminRoles && adminRoles.length > 0) {
        const userIds = adminRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, email, avatar_url")
          .in("user_id", userIds);
        setOwners(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
    }
  };

  const getOwnerProfile = (ownerId: string | null) => {
    if (!ownerId) return null;
    return owners.find((o) => o.user_id === ownerId);
  };

  const filteredFranchises = franchises.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cities?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && f.is_active) ||
      (statusFilter === "inactive" && !f.is_active);

    const matchesOwner =
      ownerFilter === "all" ||
      (ownerFilter === "assigned" && f.owner_id) ||
      (ownerFilter === "unassigned" && !f.owner_id);

    return matchesSearch && matchesStatus && matchesOwner;
  });

  // All cities available - 1 Franchise = N Cities model
  const availableCities = cities;

  const handleOpenDialog = (franchise?: Franchise) => {
    if (franchise) {
      setEditingFranchise(franchise);
      setFormData({
        name: franchise.name,
        city_id: franchise.city_id,
        owner_id: franchise.owner_id || "",
        base_price: franchise.base_price?.toString() || "8",
        price_per_km: franchise.price_per_km?.toString() || "2.5",
        monthly_fee: franchise.monthly_fee?.toString() || "500",
        contract_start_date: franchise.contract_start_date || "",
        contract_end_date: franchise.contract_end_date || "",
      });
    } else {
      setEditingFranchise(null);
      setFormData({ 
        name: "", 
        city_id: "", 
        owner_id: "",
        base_price: "8", 
        price_per_km: "2.5", 
        monthly_fee: "500",
        contract_start_date: "",
        contract_end_date: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const franchiseData = {
        name: formData.name,
        city_id: formData.city_id,
        owner_id: formData.owner_id === "none" ? null : formData.owner_id || null,
        base_price: parseFloat(formData.base_price),
        price_per_km: parseFloat(formData.price_per_km),
        monthly_fee: parseFloat(formData.monthly_fee),
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
      };

      if (editingFranchise) {
        const { error } = await supabase
          .from("franchises")
          .update(franchiseData)
          .eq("id", editingFranchise.id);
        if (error) throw error;
        toast.success("Franquia atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("franchises").insert(franchiseData);
        if (error) throw error;
        toast.success("Franquia criada com sucesso!");
      }

      setIsDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar franquia");
    }
  };

  const handleToggleActive = async (franchise: Franchise) => {
    try {
      const { error } = await supabase
        .from("franchises")
        .update({ is_active: !franchise.is_active })
        .eq("id", franchise.id);
      if (error) throw error;
      toast.success(`Franquia ${!franchise.is_active ? "ativada" : "desativada"}!`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const handleDelete = async (franchise: Franchise) => {
    if (!confirm(`Tem certeza que deseja excluir a franquia ${franchise.name}?`)) return;

    try {
      const { error } = await supabase.from("franchises").delete().eq("id", franchise.id);
      if (error) throw error;
      toast.success("Franquia excluída com sucesso!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir franquia");
    }
  };

  const assignedCount = franchises.filter((f) => f.owner_id).length;
  const activeCount = franchises.filter((f) => f.is_active).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Gerenciamento de Franquias ({franchises.length})
            <Badge variant="secondary">{activeCount} ativas</Badge>
            <Badge variant="outline">{assignedCount} com dono</Badge>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>

            {/* Owner Filter */}
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Proprietário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="assigned">Com Dono</SelectItem>
                <SelectItem value="unassigned">Sem Dono</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar franquia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Franquia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingFranchise ? "Editar Franquia" : "Nova Franquia"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Franquia</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Bibi Motos Jundiaí"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Cidade
                      </Label>
                      <Select
                        value={formData.city_id}
                        onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name} - {city.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Proprietário
                      </Label>
                      <Select
                        value={formData.owner_id}
                        onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {owners.map((owner) => (
                            <SelectItem key={owner.user_id} value={owner.user_id}>
                              {owner.full_name || owner.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Preço Base (R$)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço/Km (R$)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.price_per_km}
                        onChange={(e) => setFormData({ ...formData, price_per_km: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa Mensal (R$)</Label>
                      <Input
                        type="number"
                        value={formData.monthly_fee}
                        onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Início Contrato
                      </Label>
                      <Input
                        type="date"
                        value={formData.contract_start_date}
                        onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fim Contrato
                      </Label>
                      <Input
                        type="date"
                        value={formData.contract_end_date}
                        onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700">
                    {editingFranchise ? "Salvar Alterações" : "Criar Franquia"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Franquia</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Preço Base</TableHead>
              <TableHead>Preço/Km</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFranchises.map((franchise) => {
              const owner = getOwnerProfile(franchise.owner_id);
              return (
                <TableRow key={franchise.id}>
                  <TableCell className="font-medium">{franchise.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {franchise.cities?.name}/{franchise.cities?.state}
                    </div>
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
                        <div className="text-sm">
                          <p className="font-medium">{owner.full_name}</p>
                          <p className="text-xs text-muted-foreground">{owner.email}</p>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        <User className="h-3 w-3 mr-1" />
                        Sem dono
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {franchise.base_price?.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>R$ {franchise.price_per_km?.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    R$ {franchise.monthly_fee?.toFixed(0)}
                  </TableCell>
                  <TableCell>
                    {franchise.contract_start_date ? (
                      <div className="text-xs">
                        <p>{new Date(franchise.contract_start_date).toLocaleDateString("pt-BR")}</p>
                        {franchise.contract_end_date && (
                          <p className="text-muted-foreground">
                            até {new Date(franchise.contract_end_date).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={franchise.is_active || false}
                        onCheckedChange={() => handleToggleActive(franchise)}
                      />
                      <Badge variant={franchise.is_active ? "default" : "secondary"}>
                        {franchise.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(franchise)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(franchise)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredFranchises.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhuma franquia encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
