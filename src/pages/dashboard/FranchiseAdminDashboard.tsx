import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  Bike, Users, TrendingUp, DollarSign, MapPin,
  Activity, BarChart3, ArrowUpRight, Star, Package,
  Clock, Bell, LogOut, Settings, CheckCircle2, XCircle,
  CreditCard, MessageCircle, Percent, Calendar, Wallet, Target
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import logoImage from "@/assets/logo-simbolo.png";
import { MarketingPanel } from "@/components/dashboard/MarketingPanel";
import { FranchiseCreditsCard } from "@/components/dashboard/FranchiseCreditsCard";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { RealtimeNotificationPanel } from "@/components/notifications/RealtimeNotificationPanel";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))', 'hsl(var(--destructive))', 'hsl(var(--chart-1))'];

export default function FranchiseAdminDashboard() {
  const { user, signOut, profile } = useAuth();
  const [franchises, setFranchises] = useState<any[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);
  const franchise = franchises.find(f => f.id === selectedFranchiseId) || franchises[0] || null;
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    onlineDrivers: 0,
    pendingApproval: 0,
    totalRides: 0,
    todayRides: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalPassengers: 0,
    totalMerchants: 0,
    avgRating: 4.8,
  });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [neighborhoodStats, setNeighborhoodStats] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Realtime notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useRealtimeNotifications({ franchiseId: franchise?.id || '', userId: user?.id });

  useEffect(() => {
    if (user) fetchFranchises();
  }, [user]);

  useEffect(() => {
    if (selectedFranchiseId) fetchFranchiseData(selectedFranchiseId);
  }, [selectedFranchiseId]);

  const fetchFranchises = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('franchises')
      .select('*, cities(name, state)')
      .eq('owner_id', user.id);
    
    if (data && data.length > 0) {
      setFranchises(data);
      setSelectedFranchiseId(data[0].id);
    }
    setLoading(false);
  };

  const fetchFranchiseData = async (franchiseId: string) => {
    if (!user) return;
    
    try {
      // Fetch drivers for this franchise
      const { data: driversData } = await supabase
        .from('drivers')
        .select(`*, profiles:user_id(full_name, email, phone)`)
        .eq('franchise_id', franchiseId);
      setDrivers(driversData || []);

      // Fetch rides
      const { data: ridesData } = await supabase
        .from('rides')
        .select('*')
        .eq('franchise_id', franchiseId);

      const today = new Date().toISOString().split('T')[0];
      const todayRides = ridesData?.filter(r => r.created_at.startsWith(today)) || [];
      const todayRevenue = todayRides.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0);
      const totalRevenue = ridesData?.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0) || 0;

      // Fetch passengers count
      const { count: passengersCount } = await supabase
        .from('passengers')
        .select('*', { count: 'exact', head: true })
        .eq('franchise_id', franchiseId);

      // Fetch merchants count
      const { count: merchantsCount } = await supabase
        .from('merchants')
        .select('*', { count: 'exact', head: true })
        .eq('franchise_id', franchiseId);

      // Fetch neighborhood stats
      const { data: nStats } = await supabase
        .from('neighborhood_stats')
        .select('*')
        .eq('franchise_id', franchiseId)
        .order('ride_count', { ascending: false })
        .limit(10);
      setNeighborhoodStats(nStats || []);

      // Calculate average rating from drivers
      const avgRating = driversData && driversData.length > 0
        ? driversData.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / driversData.length
        : 5.0;

      setStats({
        totalDrivers: driversData?.length || 0,
        onlineDrivers: driversData?.filter(d => d.is_online).length || 0,
        pendingApproval: driversData?.filter(d => !d.is_approved).length || 0,
        totalRides: ridesData?.length || 0,
        todayRides: todayRides.length,
        totalRevenue,
        todayRevenue,
        totalPassengers: passengersCount || 0,
        totalMerchants: merchantsCount || 0,
        avgRating: Number(avgRating.toFixed(1)),
      });

      // Build real chart data from rides
      buildChartData(ridesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const buildChartData = (rides: any[]) => {
    // Weekly chart - group by day of week
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyMap: Record<string, { corridas: number; entregas: number }> = {};
    dayNames.forEach(d => { weeklyMap[d] = { corridas: 0, entregas: 0 }; });
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    rides.filter(r => new Date(r.created_at) >= lastWeek).forEach(r => {
      const day = dayNames[new Date(r.created_at).getDay()];
      if (r.service_type === 'delivery') {
        weeklyMap[day].entregas++;
      } else {
        weeklyMap[day].corridas++;
      }
    });
    
    setChartData(dayNames.map(name => ({ name, ...weeklyMap[name] })));

    // Hourly chart - today's rides by hour
    const today = new Date().toISOString().split('T')[0];
    const hourlyMap: Record<string, number> = {};
    for (let h = 6; h <= 23; h += 2) {
      hourlyMap[`${h.toString().padStart(2, '0')}h`] = 0;
    }
    
    rides.filter(r => r.created_at.startsWith(today)).forEach(r => {
      const hour = new Date(r.created_at).getHours();
      const bucket = Math.floor(hour / 2) * 2;
      const key = `${bucket.toString().padStart(2, '0')}h`;
      if (hourlyMap[key] !== undefined) hourlyMap[key]++;
    });
    
    setHourlyData(Object.entries(hourlyMap).map(([hour, rides]) => ({ hour, rides })));

    // Service type pie chart
    const typeMap: Record<string, number> = { ride: 0, delivery: 0, pharmacy: 0 };
    rides.forEach(r => {
      const type = r.service_type || 'ride';
      if (typeMap[type] !== undefined) typeMap[type]++;
      else typeMap.ride++;
    });
    const total = Object.values(typeMap).reduce((a, b) => a + b, 0) || 1;
    setServiceTypeData([
      { name: 'Corridas', value: Math.round((typeMap.ride / total) * 100) },
      { name: 'Entregas', value: Math.round((typeMap.delivery / total) * 100) },
      { name: 'Farmácia', value: Math.round((typeMap.pharmacy / total) * 100) },
    ]);
  };

  const handleApproveDriver = async (driverId: string) => {
    await supabase.from('drivers').update({ is_approved: true }).eq('id', driverId);
    if (selectedFranchiseId) fetchFranchiseData(selectedFranchiseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Nenhuma franquia encontrada</h2>
          <p className="text-muted-foreground">Você ainda não possui uma franquia vinculada.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary">{franchise?.name || 'Franquia'}</h1>
              <p className="text-xs text-muted-foreground">
                {franchise?.cities?.name}/{franchise?.cities?.state} • Franqueado
              </p>
            </div>
            {franchises.length > 1 && (
              <Select value={selectedFranchiseId || ''} onValueChange={setSelectedFranchiseId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecionar cidade" />
                </SelectTrigger>
                <SelectContent>
                  {franchises.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.cities?.name} - {f.cities?.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {(stats.pendingApproval > 0 || unreadCount > 0) && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {stats.pendingApproval + unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">Franqueado</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Bike className="h-8 w-8 opacity-80" />
                <div className="flex items-center gap-1 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  {stats.onlineDrivers}
                </div>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalDrivers}</p>
              <p className="text-sm opacity-80">Motoristas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Activity className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.todayRides}</p>
              <p className="text-sm opacity-80">Corridas Hoje</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 opacity-80" />
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold mt-2">R$ {stats.todayRevenue.toFixed(0)}</p>
              <p className="text-sm opacity-80">Faturamento Hoje</p>
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

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Star className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.avgRating}</p>
              <p className="text-sm opacity-80">Avaliação Média</p>
            </CardContent>
          </Card>
        </div>

        {/* Notification Panel Dropdown */}
        {showNotifications && (
          <div className="mb-6">
            <RealtimeNotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearAll={clearAll}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-8 w-full max-w-5xl">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="drivers">Motoristas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="credits">Créditos</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="settings">Integrações</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Corridas e Entregas (Semana)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="corridas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="entregas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Corridas por Horário (Hoje)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="rides" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Neighborhood Stats & Service Types */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Top Bairros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {neighborhoodStats.length > 0 ? (
                    <div className="space-y-3">
                      {neighborhoodStats.map((n, i) => (
                        <div key={n.id} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium">{n.neighborhood}</p>
                            <p className="text-xs text-muted-foreground">{n.ride_count} corridas</p>
                          </div>
                          <span className="text-green-600 font-bold">R$ {Number(n.total_revenue).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Sem dados de bairros ainda</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Tipos de Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={serviceTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {serviceTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4">
                    {serviceTypeData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            {/* Pending Approval */}
            {stats.pendingApproval > 0 && (
              <Card className="border-orange-300 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Clock className="h-5 w-5" />
                    Aguardando Aprovação ({stats.pendingApproval})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {drivers.filter(d => !d.is_approved).map((driver) => (
                      <div key={driver.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium">{driver.profiles?.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{driver.profiles?.phone}</p>
                          <p className="text-xs text-muted-foreground">{driver.vehicle_model} - {driver.vehicle_plate}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveDriver(driver.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Drivers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5 text-purple-600" />
                  Todos os Motoristas ({stats.totalDrivers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drivers.filter(d => d.is_approved).map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-3 w-3 rounded-full ${driver.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <div>
                          <p className="font-medium">{driver.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{driver.vehicle_model} - {driver.vehicle_plate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{Number(driver.rating).toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{driver.total_rides} corridas</p>
                        <p className="text-sm font-medium text-green-600">R$ {Number(driver.credits).toFixed(2)} créditos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total de Corridas</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Faturamento Total</p>
                  <p className="text-3xl font-bold text-green-600">R$ {stats.totalRevenue.toFixed(0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-3xl font-bold text-blue-600">
                    R$ {stats.totalRides > 0 ? (stats.totalRevenue / stats.totalRides).toFixed(2) : '0.00'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Lojistas</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalMerchants}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Preço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Preço Base</p>
                    <p className="text-2xl font-bold text-purple-600">R$ {Number(franchise.base_price).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Preço por KM</p>
                    <p className="text-2xl font-bold text-purple-600">R$ {Number(franchise.price_per_km).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Débito por Corrida</p>
                    <p className="text-2xl font-bold text-orange-600">R$ {Number(franchise.credit_debit_per_ride).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Taxa Dinâmica</p>
                    <p className="text-2xl font-bold text-green-600">{Number(franchise.surge_percentage)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Gateway de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Gateway Ativo</p>
                  <p className="font-bold">{franchise.payment_gateway || 'Não configurado'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationCenter franchiseId={franchise.id} franchiseName={`${franchise.name} - ${franchise.cities?.name}`} />
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <FranchiseCreditsCard franchiseId={franchise.id} />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing">
            <MarketingPanel franchiseId={franchise.id} />
          </TabsContent>

          {/* Settings/Integrations Tab */}
          <TabsContent value="settings">
            <SettingsPanel franchiseId={franchise.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
