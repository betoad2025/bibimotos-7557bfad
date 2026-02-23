import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { MapPin, Plus, Pencil, Trash2, Search, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
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

interface FranchiseData {
  payment_gateway: string;
  payment_api_key: string;
  payment_webhook_url: string;
  base_price: string;
  price_per_km: string;
  credit_debit_per_ride: string;
  min_credit_purchase: string;
}

interface MarketingData {
  facebook_pixel_id: string;
  facebook_access_token: string;
  google_ads_id: string;
  google_ads_conversion_id: string;
  google_analytics_id: string;
  tiktok_pixel_id: string;
  taboola_pixel_id: string;
  resend_api_key: string;
}

const emptyFranchiseData: FranchiseData = {
  payment_gateway: "",
  payment_api_key: "",
  payment_webhook_url: "",
  base_price: "",
  price_per_km: "",
  credit_debit_per_ride: "",
  min_credit_purchase: "10",
};

const emptyMarketingData: MarketingData = {
  facebook_pixel_id: "",
  facebook_access_token: "",
  google_ads_id: "",
  google_ads_conversion_id: "",
  google_analytics_id: "",
  tiktok_pixel_id: "",
  taboola_pixel_id: "",
  resend_api_key: "",
};

function PixelStatus({ value }: { value: string }) {
  return value ? (
    <Badge variant="default" className="gap-1 text-xs">
      <CheckCircle2 className="h-3 w-3" /> Configurado
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1 text-xs">
      <AlertCircle className="h-3 w-3" /> Pendente
    </Badge>
  );
}

export function CitiesManagement({ cities, onRefresh }: CitiesManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    subdomain: "",
    population: "",
    lat: "",
    lng: "",
  });
  const [franchiseData, setFranchiseData] = useState<FranchiseData>(emptyFranchiseData);
  const [marketingData, setMarketingData] = useState<MarketingData>(emptyMarketingData);

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadFranchiseAndMarketing = async (cityId: string) => {
    // Load franchise data
    const { data: franchise } = await supabase
      .from("franchises")
      .select("payment_gateway, payment_api_key, payment_webhook_url, base_price, price_per_km, credit_debit_per_ride, min_credit_purchase")
      .eq("city_id", cityId)
      .maybeSingle();

    if (franchise) {
      setFranchiseData({
        payment_gateway: (franchise as any).payment_gateway || "",
        payment_api_key: (franchise as any).payment_api_key || "",
        payment_webhook_url: (franchise as any).payment_webhook_url || "",
        base_price: (franchise as any).base_price?.toString() || "",
        price_per_km: (franchise as any).price_per_km?.toString() || "",
        credit_debit_per_ride: (franchise as any).credit_debit_per_ride?.toString() || "",
        min_credit_purchase: (franchise as any).min_credit_purchase?.toString() || "10",
      });
    }

    // Load marketing data
    const { data: marketing } = await supabase
      .from("city_marketing" as any)
      .select("*")
      .eq("city_id", cityId)
      .maybeSingle();

    if (marketing) {
      const m = marketing as any;
      setMarketingData({
        facebook_pixel_id: m.facebook_pixel_id || "",
        facebook_access_token: m.facebook_access_token || "",
        google_ads_id: m.google_ads_id || "",
        google_ads_conversion_id: m.google_ads_conversion_id || "",
        google_analytics_id: m.google_analytics_id || "",
        tiktok_pixel_id: m.tiktok_pixel_id || "",
        taboola_pixel_id: m.taboola_pixel_id || "",
        resend_api_key: m.resend_api_key || "",
      });
    } else {
      setMarketingData(emptyMarketingData);
    }
  };

  const handleOpenDialog = async (city?: City) => {
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
      await loadFranchiseAndMarketing(city.id);
    } else {
      setEditingCity(null);
      setFormData({ name: "", state: "", subdomain: "", population: "", lat: "", lng: "" });
      setFranchiseData(emptyFranchiseData);
      setMarketingData(emptyMarketingData);
    }
    setShowApiKey(false);
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

      let cityId = editingCity?.id;

      if (editingCity) {
        const { error } = await supabase
          .from("cities")
          .update(cityData)
          .eq("id", editingCity.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("cities").insert(cityData).select().single();
        if (error) throw error;
        cityId = data.id;
      }

      // Update franchise
      if (cityId) {
        const franchiseUpdate: any = {};
        if (franchiseData.payment_gateway) franchiseUpdate.payment_gateway = franchiseData.payment_gateway;
        if (franchiseData.payment_api_key) franchiseUpdate.payment_api_key = franchiseData.payment_api_key;
        if (franchiseData.payment_webhook_url) franchiseUpdate.payment_webhook_url = franchiseData.payment_webhook_url;
        if (franchiseData.base_price) franchiseUpdate.base_price = parseFloat(franchiseData.base_price);
        if (franchiseData.price_per_km) franchiseUpdate.price_per_km = parseFloat(franchiseData.price_per_km);
        if (franchiseData.credit_debit_per_ride) franchiseUpdate.credit_debit_per_ride = parseFloat(franchiseData.credit_debit_per_ride);
        if (franchiseData.min_credit_purchase) franchiseUpdate.min_credit_purchase = parseFloat(franchiseData.min_credit_purchase);

        if (Object.keys(franchiseUpdate).length > 0) {
          await supabase.from("franchises").update(franchiseUpdate).eq("city_id", cityId);
        }

        // Upsert marketing
        const hasMarketing = Object.values(marketingData).some((v) => v);
        if (hasMarketing) {
          const marketingPayload = {
            city_id: cityId,
            ...marketingData,
          };

          // Check if exists
          const { data: existing } = await supabase
            .from("city_marketing" as any)
            .select("id")
            .eq("city_id", cityId)
            .maybeSingle();

          if (existing) {
            await (supabase.from("city_marketing" as any) as any)
              .update(marketingData)
              .eq("city_id", cityId);
          } else {
            await (supabase.from("city_marketing" as any) as any).insert(marketingPayload);
          }
        }
      }

      toast.success(editingCity ? "Cidade atualizada com sucesso!" : "Cidade criada com sucesso!");
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
            <MapPin className="h-5 w-5 text-primary" />
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
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCity ? `Editar ${editingCity.name}` : "Nova Cidade"}
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="dados" className="mt-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dados">Dados</TabsTrigger>
                    <TabsTrigger value="operacional">Operacional</TabsTrigger>
                    <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  </TabsList>

                  {/* TAB: Dados */}
                  <TabsContent value="dados" className="space-y-4 mt-4">
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
                  </TabsContent>

                  {/* TAB: Operacional */}
                  <TabsContent value="operacional" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Gateway de Pagamento</Label>
                      <Select
                        value={franchiseData.payment_gateway}
                        onValueChange={(v) => setFranchiseData({ ...franchiseData, payment_gateway: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gateway" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asaas">Asaas</SelectItem>
                          <SelectItem value="woovi">Woovi / OpenPix</SelectItem>
                          <SelectItem value="uvv">UVV</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Chave de API</Label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={franchiseData.payment_api_key}
                          onChange={(e) => setFranchiseData({ ...franchiseData, payment_api_key: e.target.value })}
                          placeholder="$aas_xxxxxxxxx..."
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={franchiseData.payment_webhook_url}
                        onChange={(e) => setFranchiseData({ ...franchiseData, payment_webhook_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preço Base (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={franchiseData.base_price}
                          onChange={(e) => setFranchiseData({ ...franchiseData, base_price: e.target.value })}
                          placeholder="5.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço por KM (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={franchiseData.price_per_km}
                          onChange={(e) => setFranchiseData({ ...franchiseData, price_per_km: e.target.value })}
                          placeholder="2.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Débito por Corrida</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={franchiseData.credit_debit_per_ride}
                          onChange={(e) => setFranchiseData({ ...franchiseData, credit_debit_per_ride: e.target.value })}
                          placeholder="1.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Recarga Mínima (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={franchiseData.min_credit_purchase}
                          onChange={(e) => setFranchiseData({ ...franchiseData, min_credit_purchase: e.target.value })}
                          placeholder="10.00"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: Marketing */}
                  <TabsContent value="marketing" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      {/* Facebook / Meta */}
                      <div className="space-y-2 p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Facebook / Meta Ads</Label>
                          <PixelStatus value={marketingData.facebook_pixel_id} />
                        </div>
                        <Input
                          value={marketingData.facebook_pixel_id}
                          onChange={(e) => setMarketingData({ ...marketingData, facebook_pixel_id: e.target.value })}
                          placeholder="Pixel ID (ex: 123456789)"
                        />
                        <Input
                          value={marketingData.facebook_access_token}
                          onChange={(e) => setMarketingData({ ...marketingData, facebook_access_token: e.target.value })}
                          placeholder="Access Token (Conversions API)"
                          type="password"
                        />
                      </div>

                      {/* Google Ads */}
                      <div className="space-y-2 p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Google Ads</Label>
                          <PixelStatus value={marketingData.google_ads_id} />
                        </div>
                        <Input
                          value={marketingData.google_ads_id}
                          onChange={(e) => setMarketingData({ ...marketingData, google_ads_id: e.target.value })}
                          placeholder="AW-XXXXXXXXX"
                        />
                        <Input
                          value={marketingData.google_ads_conversion_id}
                          onChange={(e) => setMarketingData({ ...marketingData, google_ads_conversion_id: e.target.value })}
                          placeholder="Conversion ID (ex: AW-123/AbC)"
                        />
                      </div>

                      {/* Google Analytics */}
                      <div className="space-y-2 p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Google Analytics (GA4)</Label>
                          <PixelStatus value={marketingData.google_analytics_id} />
                        </div>
                        <Input
                          value={marketingData.google_analytics_id}
                          onChange={(e) => setMarketingData({ ...marketingData, google_analytics_id: e.target.value })}
                          placeholder="G-XXXXXXXXXX"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-2 p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">TikTok Ads</Label>
                          <PixelStatus value={marketingData.tiktok_pixel_id} />
                        </div>
                        <Input
                          value={marketingData.tiktok_pixel_id}
                          onChange={(e) => setMarketingData({ ...marketingData, tiktok_pixel_id: e.target.value })}
                          placeholder="Pixel ID TikTok"
                        />
                      </div>

                      {/* Taboola */}
                      <div className="space-y-2 p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Taboola</Label>
                          <PixelStatus value={marketingData.taboola_pixel_id} />
                        </div>
                        <Input
                          value={marketingData.taboola_pixel_id}
                          onChange={(e) => setMarketingData({ ...marketingData, taboola_pixel_id: e.target.value })}
                          placeholder="Account ID Taboola"
                        />
                      </div>

                      {/* Resend */}
                      <div className="space-y-2 p-4 rounded-xl border bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Resend (Email)</Label>
                          <PixelStatus value={marketingData.resend_api_key} />
                        </div>
                        <Input
                          value={marketingData.resend_api_key}
                          onChange={(e) => setMarketingData({ ...marketingData, resend_api_key: e.target.value })}
                          placeholder="re_xxxxxxxxx..."
                          type="password"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleSave} className="w-full mt-4">
                  {editingCity ? "Salvar Alterações" : "Criar Cidade"}
                </Button>
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
                <TableCell className="text-primary">{city.subdomain}.bibimotos.com.br</TableCell>
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
                      className="text-destructive hover:text-destructive"
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
