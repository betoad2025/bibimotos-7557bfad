import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DollarSign, Percent, Settings, Save, Building2, Bike, Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Franchise {
  id: string;
  name: string;
  base_price: number | null;
  price_per_km: number | null;
  credit_debit_per_ride: number | null;
  driver_charge_type: string | null;
  driver_charge_value: number | null;
  loyalty_enabled: boolean | null;
  loyalty_rides_for_free: number | null;
  promo_absorb_cost: boolean | null;
  cities?: { name: string; state: string };
}

export function FranchisePricingConfig() {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Franchise>>({});

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    try {
      const { data, error } = await supabase
        .from("franchises")
        .select("*, cities(name, state)")
        .order("name");

      if (error) throw error;
      setFranchises(data as Franchise[]);
    } catch (error) {
      console.error("Error fetching franchises:", error);
    }
    setLoading(false);
  };

  const handleEdit = (franchise: Franchise) => {
    setEditingId(franchise.id);
    setEditForm({
      base_price: franchise.base_price,
      price_per_km: franchise.price_per_km,
      credit_debit_per_ride: franchise.credit_debit_per_ride,
      driver_charge_type: franchise.driver_charge_type || "per_ride",
      driver_charge_value: franchise.driver_charge_value,
      loyalty_enabled: franchise.loyalty_enabled || false,
      loyalty_rides_for_free: franchise.loyalty_rides_for_free,
      promo_absorb_cost: franchise.promo_absorb_cost || false,
    });
  };

  const handleSave = async (franchiseId: string) => {
    try {
      const { error } = await supabase
        .from("franchises")
        .update({
          base_price: editForm.base_price,
          price_per_km: editForm.price_per_km,
          credit_debit_per_ride: editForm.credit_debit_per_ride,
          driver_charge_type: editForm.driver_charge_type,
          driver_charge_value: editForm.driver_charge_value,
          loyalty_enabled: editForm.loyalty_enabled,
          loyalty_rides_for_free: editForm.loyalty_rides_for_free,
          promo_absorb_cost: editForm.promo_absorb_cost,
        })
        .eq("id", franchiseId);

      if (error) throw error;
      
      toast.success("Configurações salvas!");
      setEditingId(null);
      fetchFranchises();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-green-600" />
          Configuração de Preços e Cobranças
        </CardTitle>
        <CardDescription>
          Configure preços, cobrança de motoristas e programa de fidelidade por franquia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Franquia</TableHead>
              <TableHead>Preço Base</TableHead>
              <TableHead>R$/Km</TableHead>
              <TableHead>Cobrança Motoboy</TableHead>
              <TableHead>Fidelidade</TableHead>
              <TableHead>Absorve Promo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {franchises.map((franchise) => {
              const isEditing = editingId === franchise.id;
              return (
                <TableRow key={franchise.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{franchise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {franchise.cities?.name}/{franchise.cities?.state}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.5"
                        value={editForm.base_price || ""}
                        onChange={(e) => setEditForm({ ...editForm, base_price: parseFloat(e.target.value) })}
                        className="w-20"
                      />
                    ) : (
                      <span className="font-medium">R$ {(franchise.base_price || 0).toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.price_per_km || ""}
                        onChange={(e) => setEditForm({ ...editForm, price_per_km: parseFloat(e.target.value) })}
                        className="w-20"
                      />
                    ) : (
                      <span>R$ {(franchise.price_per_km || 0).toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={editForm.driver_charge_type || "per_ride"}
                          onValueChange={(v) => setEditForm({ ...editForm, driver_charge_type: v })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_ride">Por Corrida</SelectItem>
                            <SelectItem value="percentage">Percentual</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.1"
                          value={editForm.driver_charge_value || ""}
                          onChange={(e) => setEditForm({ ...editForm, driver_charge_value: parseFloat(e.target.value) })}
                          className="w-16"
                        />
                      </div>
                    ) : (
                      <Badge variant="outline">
                        {franchise.driver_charge_type === "percentage" ? (
                          <><Percent className="h-3 w-3 mr-1" />{franchise.driver_charge_value}%</>
                        ) : (
                          <><DollarSign className="h-3 w-3 mr-1" />R$ {(franchise.driver_charge_value || 2).toFixed(2)}</>
                        )}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editForm.loyalty_enabled || false}
                          onCheckedChange={(v) => setEditForm({ ...editForm, loyalty_enabled: v })}
                        />
                        {editForm.loyalty_enabled && (
                          <Input
                            type="number"
                            value={editForm.loyalty_rides_for_free || ""}
                            onChange={(e) => setEditForm({ ...editForm, loyalty_rides_for_free: parseInt(e.target.value) })}
                            className="w-16"
                            placeholder="Corridas"
                          />
                        )}
                      </div>
                    ) : franchise.loyalty_enabled ? (
                      <Badge className="bg-green-500">
                        <Gift className="h-3 w-3 mr-1" />
                        {franchise.loyalty_rides_for_free} → 1 grátis
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Desativado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Switch
                        checked={editForm.promo_absorb_cost || false}
                        onCheckedChange={(v) => setEditForm({ ...editForm, promo_absorb_cost: v })}
                      />
                    ) : franchise.promo_absorb_cost ? (
                      <Badge className="bg-purple-500">Sim</Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleSave(franchise.id)}>
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEdit(franchise)}>
                        <Settings className="h-4 w-4 mr-1" />
                        Editar
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
  );
}
