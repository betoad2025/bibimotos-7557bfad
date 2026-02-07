import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Building2,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FranchiseMarketing {
  id: string;
  franchise_id: string;
  google_ads_id: string | null;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  instagram_business_id: string | null;
  franchise?: {
    name: string;
    is_active: boolean;
    cities?: {
      name: string;
      state: string;
    };
  };
}

export function GlobalMarketingPanel() {
  const [marketingData, setMarketingData] = useState<FranchiseMarketing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    try {
      const { data: franchises } = await supabase
        .from("franchises")
        .select(`
          id,
          name,
          is_active,
          cities(name, state)
        `)
        .order("name");

      const { data: marketing } = await supabase
        .from("franchise_marketing")
        .select("*");

      // Merge data
      const merged = franchises?.map((franchise) => {
        const marketingRecord = marketing?.find((m) => m.franchise_id === franchise.id);
        return {
          id: marketingRecord?.id || franchise.id,
          franchise_id: franchise.id,
          google_ads_id: marketingRecord?.google_ads_id || null,
          google_analytics_id: marketingRecord?.google_analytics_id || null,
          facebook_pixel_id: marketingRecord?.facebook_pixel_id || null,
          tiktok_pixel_id: marketingRecord?.tiktok_pixel_id || null,
          instagram_business_id: marketingRecord?.instagram_business_id || null,
          franchise: {
            name: franchise.name,
            is_active: franchise.is_active || false,
            cities: franchise.cities,
          },
        };
      }) || [];

      setMarketingData(merged);
    } catch (error) {
      console.error("Error fetching marketing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfiguredCount = (item: FranchiseMarketing) => {
    let count = 0;
    if (item.google_ads_id) count++;
    if (item.google_analytics_id) count++;
    if (item.facebook_pixel_id) count++;
    if (item.tiktok_pixel_id) count++;
    if (item.instagram_business_id) count++;
    return count;
  };

  const filteredData = marketingData.filter((item) => {
    const matchesSearch = 
      item.franchise?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.franchise?.cities?.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "configured") return matchesSearch && getConfiguredCount(item) > 0;
    if (statusFilter === "pending") return matchesSearch && getConfiguredCount(item) === 0;
    return matchesSearch;
  });

  const totalConfigured = marketingData.filter((m) => getConfiguredCount(m) > 0).length;
  const totalPending = marketingData.filter((m) => getConfiguredCount(m) === 0).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{marketingData.length}</p>
              <p className="text-sm text-muted-foreground">Total Franquias</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalConfigured}</p>
              <p className="text-sm text-muted-foreground">Com Marketing</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {marketingData.length > 0 
                  ? Math.round((totalConfigured / marketingData.length) * 100) 
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Taxa Config.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Visão Global de Marketing
            </span>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="configured">Configurado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar franquia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Status das configurações de marketing de todas as franquias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Franquia</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-center">🎯 Google Ads</TableHead>
                <TableHead className="text-center">📊 Analytics</TableHead>
                <TableHead className="text-center">📘 Facebook</TableHead>
                <TableHead className="text-center">🎵 TikTok</TableHead>
                <TableHead className="text-center">📸 Instagram</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const configCount = getConfiguredCount(item);
                return (
                  <TableRow key={item.franchise_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          item.franchise?.is_active ? "bg-green-500" : "bg-gray-400"
                        }`} />
                        {item.franchise?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.franchise?.cities?.name}/{item.franchise?.cities?.state}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.google_ads_id ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.google_analytics_id ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.facebook_pixel_id ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.tiktok_pixel_id ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.instagram_business_id ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {configCount === 5 ? (
                        <Badge className="bg-green-500">Completo</Badge>
                      ) : configCount > 0 ? (
                        <Badge className="bg-yellow-500">{configCount}/5</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma franquia encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
