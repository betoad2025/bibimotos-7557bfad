import { useState, useEffect } from "react";
import { Crown, Star, Plus, Edit, Trash2, Check } from "lucide-react";
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

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: string;
  discount_percentage: number | null;
  priority_matching: boolean | null;
  free_cancellations: number | null;
  exclusive_promotions: boolean | null;
  is_active: boolean | null;
}

interface SubscriptionPlansManagementProps {
  franchiseId: string;
}

export function SubscriptionPlansManagement({ franchiseId }: SubscriptionPlansManagementProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_period: "monthly",
    discount_percentage: "",
    priority_matching: false,
    free_cancellations: "",
    exclusive_promotions: false,
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, [franchiseId]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const planData = {
        franchise_id: franchiseId,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        billing_period: formData.billing_period,
        discount_percentage: formData.discount_percentage
          ? parseInt(formData.discount_percentage)
          : 0,
        priority_matching: formData.priority_matching,
        free_cancellations: formData.free_cancellations
          ? parseInt(formData.free_cancellations)
          : 0,
        exclusive_promotions: formData.exclusive_promotions,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", editingPlan.id);
        if (error) throw error;
        toast({ title: "Plano atualizado!" });
      } else {
        const { error } = await supabase.from("subscription_plans").insert(planData);
        if (error) throw error;
        toast({ title: "Plano criado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este plano?")) return;
    
    try {
      const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Plano excluído!" });
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      billing_period: plan.billing_period,
      discount_percentage: plan.discount_percentage?.toString() || "",
      priority_matching: plan.priority_matching || false,
      free_cancellations: plan.free_cancellations?.toString() || "",
      exclusive_promotions: plan.exclusive_promotions || false,
      is_active: plan.is_active || false,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      billing_period: "monthly",
      discount_percentage: "",
      priority_matching: false,
      free_cancellations: "",
      exclusive_promotions: false,
      is_active: true,
    });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "weekly":
        return "/semana";
      case "monthly":
        return "/mês";
      case "yearly":
        return "/ano";
      default:
        return "";
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
            <Crown className="h-5 w-5" />
            Clube de Vantagens
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Editar Plano" : "Novo Plano de Assinatura"}
                </DialogTitle>
                <DialogDescription>
                  Crie planos de assinatura com vantagens exclusivas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Plano Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Benefícios do plano"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="9.90"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select
                      value={formData.billing_period}
                      onValueChange={(v) => setFormData({ ...formData, billing_period: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Desconto nas Corridas (%)</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_percentage: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cancelamentos Grátis</Label>
                    <Input
                      type="number"
                      value={formData.free_cancellations}
                      onChange={(e) =>
                        setFormData({ ...formData, free_cancellations: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Prioridade no Atendimento</p>
                      <p className="text-xs text-muted-foreground">
                        Motoristas veem as corridas primeiro
                      </p>
                    </div>
                    <Switch
                      checked={formData.priority_matching}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, priority_matching: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Promoções Exclusivas</p>
                      <p className="text-xs text-muted-foreground">
                        Acesso a cupons exclusivos
                      </p>
                    </div>
                    <Switch
                      checked={formData.exclusive_promotions}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, exclusive_promotions: checked })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingPlan ? "Salvar Alterações" : "Criar Plano"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano cadastrado</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-4 border-2 rounded-lg ${
                  plan.is_active
                    ? "border-primary bg-primary/5"
                    : "border-muted opacity-60"
                }`}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="mb-3">
                  <Star className="h-8 w-8 text-yellow-500 mb-2" />
                  <h4 className="font-bold text-lg">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    R$ {plan.price.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    {getPeriodLabel(plan.billing_period)}
                  </span>
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.discount_percentage && plan.discount_percentage > 0 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {plan.discount_percentage}% de desconto nas corridas
                    </li>
                  )}
                  {plan.priority_matching && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Prioridade no atendimento
                    </li>
                  )}
                  {plan.free_cancellations && plan.free_cancellations > 0 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {plan.free_cancellations} cancelamentos grátis
                    </li>
                  )}
                  {plan.exclusive_promotions && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Promoções exclusivas
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
