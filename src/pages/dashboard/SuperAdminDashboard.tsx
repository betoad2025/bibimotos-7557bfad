import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin, Users, Bike, TrendingUp, DollarSign, Building2,
  Activity, BarChart3, Globe, ArrowUpRight, ArrowDownRight,
  Clock, Star, Package, MessageCircle, Shield, Settings,
  LogOut, ChevronRight, Search, Bell, Crown
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import logoImage from "@/assets/logo-simbolo.png";

const COLORS = ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff'];

export default function SuperAdminDashboard() {
  const { user, signOut, profile } = useAuth();
  const [stats, setStats] = useState({
    totalCities: 0,
    activeFranchises: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    totalMerchants: 0,
    pendingLeads: 0,
  });
  const [cities, setCities] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [topCities, setTopCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch cities
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      setCities(citiesData || []);

      // Fetch franchises with city info
      const { data: franchisesData } = await supabase
        .from('franchises')
        .select(`*, cities(name, state)`)
        .order('created_at', { ascending: false });
      setFranchises(franchisesData || []);

      // Fetch counts
      const { count: driversCount } = await supabase.from('drivers').select('*', { count: 'exact', head: true });
      const { count: passengersCount } = await supabase.from('passengers').select('*', { count: 'exact', head: true });
      const { count: merchantsCount } = await supabase.from('merchants').select('*', { count: 'exact', head: true });
      const { count: leadsCount } = await supabase.from('franchise_leads').select('*', { count: 'exact', head: true }).eq('status', 'new');

      // Fetch rides for stats
      const { data: ridesData } = await supabase.from('rides').select('final_price, franchise_id').limit(1000);
      const totalRevenue = ridesData?.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0) || 0;

      setStats({
        totalCities: citiesData?.length || 0,
        activeFranchises: franchisesData?.filter(f => f.is_active).length || 0,
        totalDrivers: driversCount || 0,
        totalRides: ridesData?.length || 0,
        totalRevenue,
        totalPassengers: passengersCount || 0,
        totalMerchants: merchantsCount || 0,
        pendingLeads: leadsCount || 0,
      });

      // Mock top cities data
      setTopCities([
        { name: 'Jundiaí', rides: 245, revenue: 4580 },
        { name: 'Franca', rides: 189, revenue: 3420 },
        { name: 'Rio Preto', rides: 156, revenue: 2890 },
        { name: 'Salvador', rides: 134, revenue: 2560 },
        { name: 'Passos', rides: 98, revenue: 1890 },
      ]);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const chartData = [
    { name: 'Seg', corridas: 120, entregas: 45 },
    { name: 'Ter', corridas: 145, entregas: 52 },
    { name: 'Qua', corridas: 138, entregas: 48 },
    { name: 'Qui', corridas: 167, entregas: 61 },
    { name: 'Sex', corridas: 189, entregas: 72 },
    { name: 'Sáb', corridas: 234, entregas: 89 },
    { name: 'Dom', corridas: 198, entregas: 67 },
  ];

  const revenueData = [
    { name: 'Jan', valor: 12500 },
    { name: 'Fev', valor: 14800 },
    { name: 'Mar', valor: 16200 },
    { name: 'Abr', valor: 15900 },
    { name: 'Mai', valor: 18400 },
    { name: 'Jun', valor: 21000 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-purple-700">Bibi Motos</h1>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {stats.pendingLeads > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {stats.pendingLeads}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">Super Administrador</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <MapPin className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalCities}</p>
              <p className="text-sm opacity-80">Cidades</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.activeFranchises}</p>
              <p className="text-sm opacity-80">Franquias</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Bike className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalDrivers}</p>
              <p className="text-sm opacity-80">Motoristas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalPassengers}</p>
              <p className="text-sm opacity-80">Passageiros</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalMerchants}</p>
              <p className="text-sm opacity-80">Lojistas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Activity className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalRides}</p>
              <p className="text-sm opacity-80">Corridas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">R$ {(stats.totalRevenue / 1000).toFixed(0)}k</p>
              <p className="text-sm opacity-80">Faturamento</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Crown className="h-8 w-8 opacity-80" />
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.pendingLeads}</p>
              <p className="text-sm opacity-80">Leads Novos</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Corridas e Entregas (Semana)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="corridas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entregas" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Evolução de Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value}`} />
                  <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Cities & Franchises */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Top Cidades por Corridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCities.map((city, index) => (
                  <div key={city.name} className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{city.name}</span>
                        <span className="text-sm text-muted-foreground">{city.rides} corridas</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${(city.rides / topCities[0].rides) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-green-600 font-bold">R$ {city.revenue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Franquias Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {franchises.slice(0, 5).map((franchise) => (
                  <div key={franchise.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${franchise.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium">{franchise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {franchise.cities?.name}/{franchise.cities?.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={franchise.is_active ? "default" : "secondary"}>
                        {franchise.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                Todas as Cidades ({cities.length})
              </span>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cities.map((city) => {
                const hasFranchise = franchises.some(f => f.city_id === city.id);
                return (
                  <div
                    key={city.id}
                    className={`p-3 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                      city.is_active ? 'border-green-300 bg-green-50' : 
                      hasFranchise ? 'border-purple-300 bg-purple-50' : 'hover:border-purple-200'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{city.name}</p>
                    <p className="text-xs text-muted-foreground">{city.state}</p>
                    <div className="mt-2">
                      {city.is_active ? (
                        <Badge variant="default" className="text-xs bg-green-500">Ativa</Badge>
                      ) : hasFranchise ? (
                        <Badge variant="secondary" className="text-xs">Reservada</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Disponível</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
