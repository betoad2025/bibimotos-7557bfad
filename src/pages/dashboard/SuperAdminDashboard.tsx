import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, Building2, Users, Crown, BarChart3, Activity, Shield, Megaphone,
  CreditCard, ArrowRightLeft, Settings, DollarSign
} from "lucide-react";
import { SuperAdminHeader } from "@/components/superadmin/SuperAdminHeader";
import { StatsCards } from "@/components/superadmin/StatsCards";
import { CitiesManagement } from "@/components/superadmin/CitiesManagement";
import { FranchisesManagement } from "@/components/superadmin/FranchisesManagement";
import { UsersManagement } from "@/components/superadmin/UsersManagement";
import { LeadsManagement } from "@/components/superadmin/LeadsManagement";
import { OverviewCharts } from "@/components/superadmin/OverviewCharts";
import { RideMonitoring } from "@/components/superadmin/RideMonitoring";
import { EmergencyAlerts } from "@/components/superadmin/EmergencyAlerts";
import { GlobalMarketingPanel } from "@/components/superadmin/GlobalMarketingPanel";
import { FranchiseBillingManagement } from "@/components/superadmin/FranchiseBillingManagement";
import { FranchiseTransferManagement } from "@/components/superadmin/FranchiseTransferManagement";
import { FranchisePricingConfig } from "@/components/superadmin/FranchisePricingConfig";
import { DriverTransferRequests } from "@/components/superadmin/DriverTransferRequests";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCities: 0,
    activeFranchises: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    totalMerchants: 0,
    pendingLeads: 0,
    activeAlerts: 0,
  });
  const [cities, setCities] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch cities
      const { data: citiesData } = await supabase.from("cities").select("*").order("name");
      setCities(citiesData || []);

      // Fetch franchises with city info
      const { data: franchisesData } = await supabase
        .from("franchises")
        .select(`*, cities(name, state)`)
        .order("created_at", { ascending: false });
      setFranchises(franchisesData || []);

      // Fetch counts
      const [driversRes, passengersRes, merchantsRes, leadsRes, ridesRes, alertsRes] = await Promise.all([
        supabase.from("drivers").select("*", { count: "exact", head: true }),
        supabase.from("passengers").select("*", { count: "exact", head: true }),
        supabase.from("merchants").select("*", { count: "exact", head: true }),
        supabase.from("franchise_leads").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("rides").select("final_price").limit(1000),
        supabase.from("emergency_alerts").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      const totalRevenue = ridesRes.data?.reduce((sum, r) => sum + (Number(r.final_price) || 0), 0) || 0;

      setStats({
        totalCities: citiesData?.length || 0,
        activeFranchises: franchisesData?.filter((f) => f.is_active).length || 0,
        totalDrivers: driversRes.count || 0,
        totalRides: ridesRes.data?.length || 0,
        totalRevenue,
        totalPassengers: passengersRes.count || 0,
        totalMerchants: merchantsRes.count || 0,
        pendingLeads: leadsRes.count || 0,
        activeAlerts: alertsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminHeader pendingLeads={stats.pendingLeads} />

      <div className="p-6 space-y-6">
        <StatsCards stats={stats} />

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-max min-w-full grid-cols-11 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs md:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-1 text-xs md:text-sm">
                <Activity className="h-4 w-4" />
                <span className="hidden lg:inline">Monitoramento</span>
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex items-center gap-1 text-xs md:text-sm relative">
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">Emergências</span>
                {stats.activeAlerts > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
                    {stats.activeAlerts}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="cities" className="flex items-center gap-1 text-xs md:text-sm">
                <MapPin className="h-4 w-4" />
                <span className="hidden lg:inline">Cidades</span>
              </TabsTrigger>
              <TabsTrigger value="franchises" className="flex items-center gap-1 text-xs md:text-sm">
                <Building2 className="h-4 w-4" />
                <span className="hidden lg:inline">Franquias</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-1 text-xs md:text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden lg:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="transfers" className="flex items-center gap-1 text-xs md:text-sm">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="hidden lg:inline">Transferências</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-1 text-xs md:text-sm">
                <DollarSign className="h-4 w-4" />
                <span className="hidden lg:inline">Preços</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1 text-xs md:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="marketing" className="flex items-center gap-1 text-xs md:text-sm">
                <Megaphone className="h-4 w-4" />
                <span className="hidden lg:inline">Marketing</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-1 text-xs md:text-sm">
                <Crown className="h-4 w-4" />
                <span className="hidden lg:inline">Leads</span>
                {stats.pendingLeads > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {stats.pendingLeads}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <OverviewCharts franchises={franchises} cities={cities} />
          </TabsContent>

          <TabsContent value="monitoring">
            <RideMonitoring />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyAlerts />
          </TabsContent>

          <TabsContent value="cities">
            <CitiesManagement cities={cities} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="franchises">
            <FranchisesManagement franchises={franchises} cities={cities} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="billing">
            <FranchiseBillingManagement />
          </TabsContent>

          <TabsContent value="transfers">
            <div className="space-y-6">
              <FranchiseTransferManagement />
              <DriverTransferRequests isSuperAdmin />
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <FranchisePricingConfig />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="marketing">
            <GlobalMarketingPanel />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
