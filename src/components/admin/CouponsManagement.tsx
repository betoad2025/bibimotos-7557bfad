import { useState, useEffect } from "react";
import { Tag, Plus, Edit, Trash2, Percent, DollarSign, Calendar } from "lucide-react";
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
import { format } from "date-fns";

interface Promotion {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  discount_type: string | null;
  discount_value: number;
  max_discount_value: number | null;
  min_ride_value: number | null;
  max_uses: number | null;
  uses_count: number | null;
  first_ride_only: boolean | null;
  new_users_only: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
}

interface CouponsManagementProps {
  franchiseId: string;
}

export function CouponsManagement({ franchiseId }: CouponsManagementProps) {
  const [coupons, setCoupons] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_discount_value: "",
    min_ride_value: "",
    max_uses: "",
    first_ride_only: false,
    new_users_only: false,
    valid_from: "",
    valid_until: "",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, [franchiseId]);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, code });
  };

  const handleSubmit = async () => {
    try {
      const couponData = {
        franchise_id: franchiseId,
        code: formData.code.toUpperCase(),
        name: formData.name || null,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount_value: formData.max_discount_value
          ? parseFloat(formData.max_discount_value)
          : null,
        min_ride_value: formData.min_ride_value
          ? parseFloat(formData.min_ride_value)
          : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        first_ride_only: formData.first_ride_only,
        new_users_only: formData.new_users_only,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("promotions")
          .update(couponData)
          .eq("id", editingCoupon.id);
        if (error) throw error;
        toast({ title: "Cupom atualizado!" });
      } else {
        const { error } = await supabase.from("promotions").insert(couponData);
        if (error) throw error;
        toast({ title: "Cupom criado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este cupom?")) return;
    
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Cupom excluído!" });
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const toggleActive = async (coupon: Promotion) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !coupon.is_active })
        .eq("id", coupon.id);
      if (error) throw error;
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon:", error);
    }
  };

  const openEditDialog = (coupon: Promotion) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      name: coupon.name || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type || "percentage",
      discount_value: coupon.discount_value.toString(),
      max_discount_value: coupon.max_discount_value?.toString() || "",
      min_ride_value: coupon.min_ride_value?.toString() || "",
      max_uses: coupon.max_uses?.toString() || "",
      first_ride_only: coupon.first_ride_only || false,
      new_users_only: coupon.new_users_only || false,
      valid_from: coupon.valid_from?.split("T")[0] || "",
      valid_until: coupon.valid_until?.split("T")[0] || "",
      is_active: coupon.is_active || false,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      max_discount_value: "",
      min_ride_value: "",
      max_uses: "",
      first_ride_only: false,
      new_users_only: false,
      valid_from: "",
      valid_until: "",
      is_active: true,
    });
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
            <Tag className="h-5 w-5" />
            Cupons e Promoções
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                </DialogTitle>
                <DialogDescription>
                  Crie códigos promocionais para seus passageiros
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Código do Cupom</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="Ex: DESCONTO10"
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={generateCode}>
                      Gerar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome (opcional)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Promoção de Verão"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Porcentagem
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Valor Fixo
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: e.target.value })
                      }
                      placeholder={formData.discount_type === "percentage" ? "10" : "5.00"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Mín. da Corrida (R$)</Label>
                    <Input
                      type="number"
                      value={formData.min_ride_value}
                      onChange={(e) =>
                        setFormData({ ...formData, min_ride_value: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto Máximo (R$)</Label>
                    <Input
                      type="number"
                      value={formData.max_discount_value}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount_value: e.target.value })
                      }
                      placeholder="Sem limite"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Limite de Usos</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Válido de</Label>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) =>
                        setFormData({ ...formData, valid_from: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Válido até</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) =>
                        setFormData({ ...formData, valid_until: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Apenas primeira corrida</p>
                      <p className="text-xs text-muted-foreground">
                        Válido só para a primeira corrida do usuário
                      </p>
                    </div>
                    <Switch
                      checked={formData.first_ride_only}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, first_ride_only: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Apenas novos usuários</p>
                      <p className="text-xs text-muted-foreground">
                        Válido só para usuários novos na plataforma
                      </p>
                    </div>
                    <Switch
                      checked={formData.new_users_only}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, new_users_only: checked })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingCoupon ? "Salvar Alterações" : "Criar Cupom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {coupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum cupom cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  !coupon.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {coupon.discount_type === "percentage" ? (
                      <Percent className="h-5 w-5 text-primary" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-mono font-bold">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}% de desconto`
                        : `R$ ${coupon.discount_value.toFixed(2)} de desconto`}
                      {coupon.uses_count !== null && coupon.max_uses && (
                        <span className="ml-2">
                          • {coupon.uses_count}/{coupon.max_uses} usos
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={coupon.is_active || false}
                    onCheckedChange={() => toggleActive(coupon)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(coupon)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(coupon.id)}
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
