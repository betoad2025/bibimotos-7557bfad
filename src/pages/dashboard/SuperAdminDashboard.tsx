import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/superadmin/SuperAdminSidebar";
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
import { PlatformSettingsPanel } from "@/components/superadmin/PlatformSettingsPanel";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
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
  const isMobile = useIsMobile();

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
        supabase.from("rides").select("*", { count: "exact", head: true }),
        supabase.from("emergency_alerts").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      setStats({
        totalCities: citiesData?.length || 0,
        activeFranchises: franchisesData?.filter((f) => f.is_active).length || 0,
        totalDrivers: driversRes.count || 0,
        totalRides: ridesRes.count || 0,
        totalRevenue: 0,
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

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewCharts franchises={franchises} cities={cities} />;
      case "monitoring":
        return <RideMonitoring />;
      case "emergency":
        return <EmergencyAlerts />;
      case "cities":
        return <CitiesManagement cities={cities} onRefresh={fetchData} />;
      case "franchises":
        return <FranchisesManagement franchises={franchises} cities={cities} onRefresh={fetchData} />;
      case "billing":
        return <FranchiseBillingManagement />;
      case "transfers":
        return (
          <div className="space-y-6">
            <FranchiseTransferManagement />
            <DriverTransferRequests isSuperAdmin />
          </div>
        );
      case "pricing":
        return <FranchisePricingConfig />;
      case "users":
        return <UsersManagement />;
      case "marketing":
        return <GlobalMarketingPanel />;
      case "leads":
        return <LeadsManagement />;
      case "settings":
        return <PlatformSettingsPanel />;
      default:
        return <OverviewCharts franchises={franchises} cities={cities} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <SuperAdminSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingLeads={stats.pendingLeads}
          activeAlerts={stats.activeAlerts}
        />
        
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SidebarTrigger>
            <span className="font-semibold text-primary">Bibi Motos</span>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="hidden md:block">
              <SuperAdminHeader pendingLeads={stats.pendingLeads} />
            </div>

            <div className="p-4 md:p-6 space-y-6 max-w-full min-w-0">
              <StatsCards stats={stats} />
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
