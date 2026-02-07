import { useState } from "react";
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
import { Building2, Plus, Pencil, Trash2, Search, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
  state: string;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city_id: "",
    base_price: "8",
    price_per_km: "2.5",
    monthly_fee: "500",
  });

  const filteredFranchises = franchises.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cities?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableCities = cities.filter(
    (city) => !franchises.some((f) => f.city_id === city.id) || editingFranchise?.city_id === city.id
  );

  const handleOpenDialog = (franchise?: Franchise) => {
    if (franchise) {
      setEditingFranchise(franchise);
      setFormData({
        name: franchise.name,
        city_id: franchise.city_id,
        base_price: franchise.base_price?.toString() || "8",
        price_per_km: franchise.price_per_km?.toString() || "2.5",
        monthly_fee: franchise.monthly_fee?.toString() || "500",
      });
    } else {
      setEditingFranchise(null);
      setFormData({ name: "", city_id: "", base_price: "8", price_per_km: "2.5", monthly_fee: "500" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const franchiseData = {
        name: formData.name,
        city_id: formData.city_id,
        base_price: parseFloat(formData.base_price),
        price_per_km: parseFloat(formData.price_per_km),
        monthly_fee: parseFloat(formData.monthly_fee),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Gerenciamento de Franquias ({franchises.length})
          </span>
          <div className="flex items-center gap-2">
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
              <DialogContent>
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
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Select
                      value={formData.city_id}
                      onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma cidade" />
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
              <TableHead>Preço Base</TableHead>
              <TableHead>Preço/Km</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Status</TableHead>
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
            ))}
            {filteredFranchises.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
