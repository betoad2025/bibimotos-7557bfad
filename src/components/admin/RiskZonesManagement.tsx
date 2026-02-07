import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Plus, Edit, Trash2, Shield, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RiskZone {
  id: string;
  name: string;
  description: string | null;
  risk_level: string;
  is_blocked: boolean;
  block_reason: string | null;
  incidents_count: number;
  center_lat: number | null;
  center_lng: number | null;
  radius_meters: number | null;
  is_active: boolean;
}

interface RiskZonesManagementProps {
  franchiseId: string;
}

const RISK_LEVELS = [
  { value: "low", label: "Baixo", color: "bg-green-500" },
  { value: "medium", label: "Médio", color: "bg-yellow-500" },
  { value: "high", label: "Alto", color: "bg-orange-500" },
  { value: "critical", label: "Crítico", color: "bg-red-500" },
];

export function RiskZonesManagement({ franchiseId }: RiskZonesManagementProps) {
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<RiskZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    risk_level: "medium",
    is_blocked: false,
    block_reason: "",
    center_lat: "",
    center_lng: "",
    radius_meters: "500",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchZones();
  }, [franchiseId]);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from("risk_zones")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("risk_level", { ascending: false });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching risk zones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const zoneData = {
        franchise_id: franchiseId,
        name: formData.name,
        description: formData.description || null,
        risk_level: formData.risk_level,
        is_blocked: formData.is_blocked,
        block_reason: formData.is_blocked ? formData.block_reason : null,
        center_lat: formData.center_lat ? parseFloat(formData.center_lat) : null,
        center_lng: formData.center_lng ? parseFloat(formData.center_lng) : null,
        radius_meters: parseInt(formData.radius_meters) || 500,
        polygon_coords: JSON.stringify([]), // Simplified for now
      };

      if (editingZone) {
        const { error } = await supabase
          .from("risk_zones")
          .update(zoneData)
          .eq("id", editingZone.id);
        if (error) throw error;
        toast({ title: "Área de risco atualizada!" });
      } else {
        const { error } = await supabase.from("risk_zones").insert(zoneData);
        if (error) throw error;
        toast({ title: "Área de risco criada!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchZones();
    } catch (error) {
      console.error("Error saving risk zone:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir esta área de risco?")) return;
    
    try {
      const { error } = await supabase.from("risk_zones").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Área de risco excluída!" });
      fetchZones();
    } catch (error) {
      console.error("Error deleting risk zone:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const openEditDialog = (zone: RiskZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || "",
      risk_level: zone.risk_level,
      is_blocked: zone.is_blocked,
      block_reason: zone.block_reason || "",
      center_lat: zone.center_lat?.toString() || "",
      center_lng: zone.center_lng?.toString() || "",
      radius_meters: zone.radius_meters?.toString() || "500",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingZone(null);
    setFormData({
      name: "",
      description: "",
      risk_level: "medium",
      is_blocked: false,
      block_reason: "",
      center_lat: "",
      center_lng: "",
      radius_meters: "500",
    });
  };

  const getRiskLevelInfo = (level: string) => {
    return RISK_LEVELS.find((r) => r.value === level) || RISK_LEVELS[1];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Áreas de Risco
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Área
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingZone ? "Editar Área de Risco" : "Nova Área de Risco"}
                </DialogTitle>
                <DialogDescription>
                  Defina áreas perigosas para alertar motoristas e passageiros
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Área</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Centro à noite"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes sobre a área de risco"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nível de Risco</Label>
                  <Select
                    value={formData.risk_level}
                    onValueChange={(v) => setFormData({ ...formData, risk_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${level.color}`} />
                            {level.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input
                      value={formData.center_lat}
                      onChange={(e) => setFormData({ ...formData, center_lat: e.target.value })}
                      placeholder="-23.5505"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input
                      value={formData.center_lng}
                      onChange={(e) => setFormData({ ...formData, center_lng: e.target.value })}
                      placeholder="-46.6333"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Raio (metros)</Label>
                  <Input
                    type="number"
                    value={formData.radius_meters}
                    onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Bloquear Corridas</p>
                    <p className="text-sm text-muted-foreground">
                      Impedir corridas nesta área
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_blocked}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_blocked: checked })
                    }
                  />
                </div>

                {formData.is_blocked && (
                  <div className="space-y-2">
                    <Label>Motivo do Bloqueio</Label>
                    <Textarea
                      value={formData.block_reason}
                      onChange={(e) => setFormData({ ...formData, block_reason: e.target.value })}
                      placeholder="Ex: Alto índice de roubos"
                    />
                  </div>
                )}

                <Button onClick={handleSubmit} className="w-full">
                  {editingZone ? "Salvar Alterações" : "Criar Área de Risco"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {zones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma área de risco cadastrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => {
              const levelInfo = getRiskLevelInfo(zone.risk_level);
              return (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full ${levelInfo.color}`} />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {zone.name}
                        {zone.is_blocked && (
                          <Badge variant="destructive" className="text-xs">
                            BLOQUEADA
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {levelInfo.label} • {zone.incidents_count} incidentes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(zone)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(zone.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
