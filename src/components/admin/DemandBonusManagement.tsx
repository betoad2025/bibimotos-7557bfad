import { useState, useEffect } from "react";
import { Flame, Plus, Edit, Trash2, Clock, Calendar } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DemandBonus {
  id: string;
  name: string;
  bonus_type: string;
  bonus_value: number;
  min_rides_required: number | null;
  start_time: string | null;
  end_time: string | null;
  days_of_week: string[] | null;
  max_claims: number | null;
  current_claims: number | null;
  is_active: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
}

interface DemandBonusManagementProps {
  franchiseId: string;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Seg" },
  { value: "tuesday", label: "Ter" },
  { value: "wednesday", label: "Qua" },
  { value: "thursday", label: "Qui" },
  { value: "friday", label: "Sex" },
  { value: "saturday", label: "Sáb" },
  { value: "sunday", label: "Dom" },
];

export function DemandBonusManagement({ franchiseId }: DemandBonusManagementProps) {
  const [bonuses, setBonuses] = useState<DemandBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<DemandBonus | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bonus_type: "fixed",
    bonus_value: "",
    min_rides_required: "1",
    start_time: "",
    end_time: "",
    days_of_week: [] as string[],
    max_claims: "",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBonuses();
  }, [franchiseId]);

  const fetchBonuses = async () => {
    try {
      const { data, error } = await supabase
        .from("demand_bonuses")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBonuses(data || []);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const bonusData = {
        franchise_id: franchiseId,
        name: formData.name,
        bonus_type: formData.bonus_type,
        bonus_value: parseFloat(formData.bonus_value),
        min_rides_required: parseInt(formData.min_rides_required) || 1,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        days_of_week: formData.days_of_week.length > 0 ? formData.days_of_week : null,
        max_claims: formData.max_claims ? parseInt(formData.max_claims) : null,
        is_active: formData.is_active,
      };

      if (editingBonus) {
        const { error } = await supabase
          .from("demand_bonuses")
          .update(bonusData)
          .eq("id", editingBonus.id);
        if (error) throw error;
        toast({ title: "Bônus atualizado!" });
      } else {
        const { error } = await supabase.from("demand_bonuses").insert(bonusData);
        if (error) throw error;
        toast({ title: "Bônus criado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchBonuses();
    } catch (error) {
      console.error("Error saving bonus:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este bônus?")) return;
    
    try {
      const { error } = await supabase.from("demand_bonuses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Bônus excluído!" });
      fetchBonuses();
    } catch (error) {
      console.error("Error deleting bonus:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const toggleDay = (day: string) => {
    const current = formData.days_of_week;
    if (current.includes(day)) {
      setFormData({ ...formData, days_of_week: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, days_of_week: [...current, day] });
    }
  };

  const openEditDialog = (bonus: DemandBonus) => {
    setEditingBonus(bonus);
    setFormData({
      name: bonus.name,
      bonus_type: bonus.bonus_type,
      bonus_value: bonus.bonus_value.toString(),
      min_rides_required: bonus.min_rides_required?.toString() || "1",
      start_time: bonus.start_time || "",
      end_time: bonus.end_time || "",
      days_of_week: bonus.days_of_week || [],
      max_claims: bonus.max_claims?.toString() || "",
      is_active: bonus.is_active || false,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBonus(null);
    setFormData({
      name: "",
      bonus_type: "fixed",
      bonus_value: "",
      min_rides_required: "1",
      start_time: "",
      end_time: "",
      days_of_week: [],
      max_claims: "",
      is_active: true,
    });
  };

  const getBonusTypeLabel = (type: string) => {
    switch (type) {
      case "fixed":
        return "Valor Fixo";
      case "percentage":
        return "Porcentagem";
      case "per_ride":
        return "Por Corrida";
      default:
        return type;
    }
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
            <Flame className="h-5 w-5 text-orange-500" />
            Bônus por Demanda
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Bônus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBonus ? "Editar Bônus" : "Novo Bônus por Demanda"}
                </DialogTitle>
                <DialogDescription>
                  Incentive motoristas em horários de pico
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome do Bônus</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Happy Hour"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Bônus</Label>
                    <Select
                      value={formData.bonus_type}
                      onValueChange={(v) => setFormData({ ...formData, bonus_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="per_ride">Por Corrida (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={formData.bonus_value}
                      onChange={(e) => setFormData({ ...formData, bonus_value: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mínimo de Corridas</Label>
                  <Input
                    type="number"
                    value={formData.min_rides_required}
                    onChange={(e) =>
                      setFormData({ ...formData, min_rides_required: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário Início</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário Fim</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dias da Semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.days_of_week.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Limite de Participantes</Label>
                  <Input
                    type="number"
                    value={formData.max_claims}
                    onChange={(e) => setFormData({ ...formData, max_claims: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Ativo</p>
                    <p className="text-xs text-muted-foreground">
                      Motoristas podem ver e participar
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingBonus ? "Salvar Alterações" : "Criar Bônus"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {bonuses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum bônus cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bonuses.map((bonus) => (
              <div
                key={bonus.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  !bonus.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {bonus.name}
                      {bonus.is_active && <Badge variant="default">Ativo</Badge>}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {bonus.bonus_type === "fixed" && `R$ ${bonus.bonus_value} fixo`}
                        {bonus.bonus_type === "percentage" && `+${bonus.bonus_value}%`}
                        {bonus.bonus_type === "per_ride" && `R$ ${bonus.bonus_value}/corrida`}
                      </span>
                      {bonus.start_time && bonus.end_time && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {bonus.start_time} - {bonus.end_time}
                          </span>
                        </>
                      )}
                      {bonus.current_claims !== null && bonus.max_claims && (
                        <>
                          <span>•</span>
                          <span>{bonus.current_claims}/{bonus.max_claims} participantes</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(bonus)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(bonus.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
