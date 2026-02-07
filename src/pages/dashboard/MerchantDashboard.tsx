import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/profile/UserAvatar";
import logoImage from "@/assets/logo-simbolo.png";
import {
  Package, TrendingUp, Clock, MapPin, Plus, History,
  LogOut, Store, Phone, CheckCircle, XCircle, Loader2,
  Navigation, DollarSign
} from "lucide-react";
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

interface MerchantData {
  id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_type: string;
  is_approved: boolean;
  franchise_id: string;
  business_lat: number | null;
  business_lng: number | null;
}

interface DeliveryData {
  id: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  package_description: string;
  package_size: string;
  recipient_name: string;
  recipient_phone: string;
  estimated_price: number;
  final_price: number;
  distance_km: number;
  created_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  driver?: {
    id: string;
    vehicle_model: string;
    vehicle_plate: string;
    rating: number;
  };
}

export default function MerchantDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showNewDelivery, setShowNewDelivery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newDelivery, setNewDelivery] = useState({
    delivery_address: "",
    recipient_name: "",
    recipient_phone: "",
    package_description: "",
    package_size: "small",
  });

  useEffect(() => {
    if (user) {
      fetchMerchantData();
    }
  }, [user]);

  const fetchMerchantData = async () => {
    if (!user) return;
    
    try {
      // Fetch merchant
      const { data: merchant, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (merchant) {
        setMerchantData(merchant);
        
        // Fetch deliveries
        const { data: deliveriesData } = await supabase
          .from("deliveries")
          .select(`
            *,
            driver:drivers(
              id,
              vehicle_model,
              vehicle_plate,
              rating,
              user_id
            )
          `)
          .eq("merchant_id", merchant.id)
          .order("created_at", { ascending: false })
          .limit(50);
        
        // Transform data
        const transformedDeliveries: DeliveryData[] = (deliveriesData || []).map(d => ({
          id: d.id,
          status: d.status || "pending",
          pickup_address: d.pickup_address,
          delivery_address: d.delivery_address,
          package_description: d.package_description || "",
          package_size: d.package_size || "small",
          recipient_name: d.recipient_name || "",
          recipient_phone: d.recipient_phone || "",
          estimated_price: Number(d.estimated_price) || 0,
          final_price: Number(d.final_price) || 0,
          distance_km: Number(d.distance_km) || 0,
          created_at: d.created_at,
          picked_up_at: d.picked_up_at,
          delivered_at: d.delivered_at,
          driver: d.driver ? {
            id: d.driver.id,
            vehicle_model: d.driver.vehicle_model || "",
            vehicle_plate: d.driver.vehicle_plate || "",
            rating: Number(d.driver.rating) || 5,
          } : undefined,
        }));
        
        setDeliveries(transformedDeliveries);
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const completedToday = deliveriesData?.filter(d => 
          d.delivered_at?.startsWith(today)
        ).length || 0;
        
        const pending = deliveriesData?.filter(d => 
          ['pending', 'accepted', 'picked_up'].includes(d.status)
        ).length || 0;
        
        const totalSpent = deliveriesData?.reduce((sum, d) => 
          sum + (Number(d.final_price) || 0), 0
        ) || 0;
        
        setStats({
          totalDeliveries: deliveriesData?.length || 0,
          pendingDeliveries: pending,
          completedToday,
          totalSpent,
        });
      }
    } catch (error) {
      console.error("Error fetching merchant data:", error);
    }
    setLoading(false);
  };

  const handleCreateDelivery = async () => {
    if (!merchantData) return;
    
    if (!newDelivery.delivery_address || !newDelivery.recipient_name || !newDelivery.recipient_phone) {
      toast({
        title: "Preencha todos os campos",
        description: "Endereço, nome e telefone do destinatário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Calculate price based on distance
      const estimatedPrice = 15.00; // Placeholder
      
      const { data, error } = await supabase
        .from("deliveries")
        .insert({
          franchise_id: merchantData.franchise_id,
          merchant_id: merchantData.id,
          pickup_address: merchantData.business_address,
          pickup_lat: merchantData.business_lat || 0,
          pickup_lng: merchantData.business_lng || 0,
          delivery_address: newDelivery.delivery_address,
          delivery_lat: 0, // TODO: Geocode
          delivery_lng: 0,
          recipient_name: newDelivery.recipient_name,
          recipient_phone: newDelivery.recipient_phone,
          package_description: newDelivery.package_description,
          package_size: newDelivery.package_size,
          estimated_price: estimatedPrice,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Entrega solicitada!",
        description: "Aguarde um motorista aceitar sua entrega.",
      });

      setShowNewDelivery(false);
      setNewDelivery({
        delivery_address: "",
        recipient_name: "",
        recipient_phone: "",
        package_description: "",
        package_size: "small",
      });
      fetchMerchantData();
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar entrega",
        description: error.message,
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Aguardando", variant: "secondary" },
      accepted: { label: "Aceita", variant: "default" },
      picked_up: { label: "Coletada", variant: "default" },
      delivered: { label: "Entregue", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!merchantData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md p-8 text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Cadastro de Lojista</h2>
          <p className="text-muted-foreground mb-4">
            Você ainda não possui cadastro como lojista.
          </p>
          <Button onClick={() => window.location.href = "/complete-registration"}>
            Completar Cadastro
          </Button>
        </Card>
      </div>
    );
  }

  if (!merchantData.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md p-8 text-center">
          <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Aguardando Aprovação</h2>
          <p className="text-muted-foreground mb-4">
            Seu cadastro como lojista está em análise. Você receberá uma notificação assim que for aprovado.
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">{merchantData.business_name}</p>
            <p className="text-sm text-muted-foreground">{merchantData.business_address}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <h1 className="font-bold text-primary">Bibi Motos</h1>
              <p className="text-xs text-muted-foreground">Entregas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium">{merchantData.business_name}</p>
              <p className="text-xs text-muted-foreground">{merchantData.business_type}</p>
            </div>
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name || merchantData.business_name}
              size="sm"
              showRating={false}
            />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
              <p className="text-xs text-muted-foreground">Total de Entregas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{stats.pendingDeliveries}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.completedToday}</p>
              <p className="text-xs text-muted-foreground">Entregas Hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">R$ {stats.totalSpent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Gasto</p>
            </CardContent>
          </Card>
        </div>

        {/* New Delivery Button */}
        <Dialog open={showNewDelivery} onOpenChange={setShowNewDelivery}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Nova Entrega
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Solicitar Nova Entrega
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Endereço de Coleta</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {merchantData.business_address}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_address">Endereço de Entrega *</Label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="delivery_address"
                    placeholder="Rua, número, bairro"
                    value={newDelivery.delivery_address}
                    onChange={(e) => setNewDelivery({ ...newDelivery, delivery_address: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Nome do Destinatário *</Label>
                  <Input
                    id="recipient_name"
                    placeholder="Nome completo"
                    value={newDelivery.recipient_name}
                    onChange={(e) => setNewDelivery({ ...newDelivery, recipient_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient_phone">Telefone *</Label>
                  <Input
                    id="recipient_phone"
                    placeholder="(00) 00000-0000"
                    value={newDelivery.recipient_phone}
                    onChange={(e) => setNewDelivery({ ...newDelivery, recipient_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package_size">Tamanho do Pacote</Label>
                <Select
                  value={newDelivery.package_size}
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, package_size: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno (até 5kg)</SelectItem>
                    <SelectItem value="medium">Médio (5-15kg)</SelectItem>
                    <SelectItem value="large">Grande (15-30kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package_description">Descrição do Pacote</Label>
                <Textarea
                  id="package_description"
                  placeholder="Ex: Caixa com produtos alimentícios"
                  value={newDelivery.package_description}
                  onChange={(e) => setNewDelivery({ ...newDelivery, package_description: e.target.value })}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleCreateDelivery}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Solicitar Entrega
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Deliveries Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em Andamento ({stats.pendingDeliveries})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {deliveries.filter(d => ['pending', 'accepted', 'picked_up'].includes(d.status)).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma entrega em andamento</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowNewDelivery(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Primeira Entrega
                  </Button>
                </CardContent>
              </Card>
            ) : (
              deliveries
                .filter(d => ['pending', 'accepted', 'picked_up'].includes(d.status))
                .map((delivery) => (
                  <Card key={delivery.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(delivery.status)}
                            <span className="text-xs text-muted-foreground">
                              #{delivery.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {delivery.estimated_price && (
                          <p className="font-bold text-lg">
                            R$ {delivery.estimated_price.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Coleta</p>
                            <p className="text-sm">{delivery.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className="h-4 w-4 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Entrega</p>
                            <p className="text-sm">{delivery.delivery_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Para: {delivery.recipient_name}</p>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {delivery.recipient_phone}
                          </p>
                        </div>
                        {delivery.driver && (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              avatarUrl={undefined}
                              name="Motorista"
                              size="sm"
                              showRating={false}
                            />
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                Motorista
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.driver.vehicle_plate}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {deliveries.filter(d => ['delivered', 'cancelled'].includes(d.status)).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma entrega no histórico</p>
                </CardContent>
              </Card>
            ) : (
              deliveries
                .filter(d => ['delivered', 'cancelled'].includes(d.status))
                .map((delivery) => (
                  <Card key={delivery.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(delivery.status)}
                            <span className="text-xs text-muted-foreground">
                              #{delivery.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="font-bold">
                          R$ {(delivery.final_price || delivery.estimated_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Navigation className="h-3 w-3" />
                        <span>{delivery.delivery_address}</span>
                      </div>
                      <p className="text-sm mt-1">Para: {delivery.recipient_name}</p>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
