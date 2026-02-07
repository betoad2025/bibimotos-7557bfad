import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Heart, Plus, Trash2, Home, Briefcase, Star,
  Loader2, Edit2, Check, X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FavoriteAddressesProps {
  userId: string;
  franchiseId: string;
  onSelectAddress?: (address: string, lat: number, lng: number) => void;
}

interface FavoriteAddress {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  is_active: boolean;
}

const CATEGORY_ICONS: Record<string, typeof Home> = {
  home: Home,
  work: Briefcase,
  favorite: Star,
  other: MapPin,
};

const CATEGORY_LABELS: Record<string, string> = {
  home: "Casa",
  work: "Trabalho",
  favorite: "Favorito",
  other: "Outro",
};

export function FavoriteAddresses({ userId, franchiseId, onSelectAddress }: FavoriteAddressesProps) {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    category: "favorite",
  });

  useEffect(() => {
    fetchAddresses();
  }, [userId, franchiseId]);

  const fetchAddresses = async () => {
    try {
      const { data } = await supabase
        .from("known_places")
        .select("*")
        .eq("franchise_id", franchiseId)
        .eq("is_active", true)
        .order("category", { ascending: true });

      // Transform to match interface
      const transformed = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: Number(p.lat),
        lng: Number(p.lng),
        category: p.category || "other",
        is_active: p.is_active !== false,
      }));

      setAddresses(transformed);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
    setLoading(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.address) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Geocode address to get lat/lng
      const { error } = await supabase
        .from("known_places")
        .insert({
          franchise_id: franchiseId,
          name: newAddress.name,
          address: newAddress.address,
          category: newAddress.category,
          lat: 0, // Would be geocoded
          lng: 0,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Endereço salvo!",
      });

      setShowAddModal(false);
      setNewAddress({ name: "", address: "", category: "favorite" });
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from("known_places")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setAddresses(addresses.filter(a => a.id !== id));
      toast({ title: "Endereço removido" });
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectAddress = (addr: FavoriteAddress) => {
    if (onSelectAddress) {
      onSelectAddress(addr.address, addr.lat, addr.lng);
    }
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-red-500" />
              Endereços Favoritos
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {addresses.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum endereço salvo
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Endereço
              </Button>
            </div>
          ) : (
            addresses.map((addr) => {
              const CategoryIcon = CATEGORY_ICONS[addr.category] || MapPin;
              return (
                <button
                  key={addr.id}
                  onClick={() => handleSelectAddress(addr)}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    addr.category === "home" ? "bg-blue-100 text-blue-600" :
                    addr.category === "work" ? "bg-purple-100 text-purple-600" :
                    addr.category === "favorite" ? "bg-yellow-100 text-yellow-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{addr.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {addr.address}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Endereço
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={newAddress.category}
                onValueChange={(v) => setNewAddress({ ...newAddress, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Casa
                    </div>
                  </SelectItem>
                  <SelectItem value="work">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Trabalho
                    </div>
                  </SelectItem>
                  <SelectItem value="favorite">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Favorito
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Outro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Minha Casa"
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço Completo</Label>
              <Input
                placeholder="Rua, número, bairro, cidade"
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
              />
            </div>

            <Button
              onClick={handleAddAddress}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Endereço
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
