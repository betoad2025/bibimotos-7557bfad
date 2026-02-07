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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface City {
  id: string;
  name: string;
  state: string;
  subdomain: string;
  is_active: boolean | null;
  population: number | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

interface CitiesManagementProps {
  cities: City[];
  onRefresh: () => void;
}

export function CitiesManagement({ cities, onRefresh }: CitiesManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    subdomain: "",
    population: "",
    lat: "",
    lng: "",
  });

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (city?: City) => {
    if (city) {
      setEditingCity(city);
      setFormData({
        name: city.name,
        state: city.state,
        subdomain: city.subdomain,
        population: city.population?.toString() || "",
        lat: city.lat?.toString() || "",
        lng: city.lng?.toString() || "",
      });
    } else {
      setEditingCity(null);
      setFormData({ name: "", state: "", subdomain: "", population: "", lat: "", lng: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const cityData = {
        name: formData.name,
        state: formData.state,
        subdomain: formData.subdomain.toLowerCase().replace(/\s+/g, "-"),
        population: formData.population ? parseInt(formData.population) : null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
      };

      if (editingCity) {
        const { error } = await supabase
          .from("cities")
          .update(cityData)
          .eq("id", editingCity.id);
        if (error) throw error;
        toast.success("Cidade atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("cities").insert(cityData);
        if (error) throw error;
        toast.success("Cidade criada com sucesso!");
      }

      setIsDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cidade");
    }
  };

  const handleToggleActive = async (city: City) => {
    try {
      const { error } = await supabase
        .from("cities")
        .update({ is_active: !city.is_active })
        .eq("id", city.id);
      if (error) throw error;
      toast.success(`Cidade ${!city.is_active ? "ativada" : "desativada"}!`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const handleDelete = async (city: City) => {
    if (!confirm(`Tem certeza que deseja excluir ${city.name}?`)) return;

    try {
      const { error } = await supabase.from("cities").delete().eq("id", city.id);
      if (error) throw error;
      toast.success("Cidade excluída com sucesso!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cidade");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Gerenciamento de Cidades ({cities.length})
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Cidade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCity ? "Editar Cidade" : "Nova Cidade"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Jundiaí"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subdomínio</Label>
                    <Input
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                      placeholder="jundiai"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL: {formData.subdomain || "cidade"}.bibimotos.com.br
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>População</Label>
                      <Input
                        type="number"
                        value={formData.population}
                        onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                        placeholder="400000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        placeholder="-23.186"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        placeholder="-46.897"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    {editingCity ? "Salvar Alterações" : "Criar Cidade"}
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
              <TableHead>Cidade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Subdomínio</TableHead>
              <TableHead>População</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCities.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell>{city.state}</TableCell>
                <TableCell className="text-purple-600">{city.subdomain}.bibimotos.com.br</TableCell>
                <TableCell>{city.population?.toLocaleString() || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={city.is_active || false}
                      onCheckedChange={() => handleToggleActive(city)}
                    />
                    <Badge variant={city.is_active ? "default" : "secondary"}>
                      {city.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(city)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(city)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredCities.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma cidade encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
