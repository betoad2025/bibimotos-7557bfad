import { 
  MapPin, Building2, Users, Crown, BarChart3, Activity, Shield, Megaphone,
  CreditCard, ArrowRightLeft, DollarSign, ChevronLeft, Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-simbolo.png";

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingLeads: number;
  activeAlerts: number;
}

const menuItems = [
  {
    group: "Monitoramento",
    items: [
      { id: "overview", label: "Visão Geral", icon: BarChart3 },
      { id: "monitoring", label: "Monitoramento", icon: Activity },
      { id: "emergency", label: "Emergências", icon: Shield, alertKey: "activeAlerts" as const },
    ]
  },
  {
    group: "Gestão",
    items: [
      { id: "cities", label: "Cidades", icon: MapPin },
      { id: "franchises", label: "Franquias", icon: Building2 },
      { id: "users", label: "Usuários", icon: Users },
    ]
  },
  {
    group: "Financeiro",
    items: [
      { id: "billing", label: "Faturamento", icon: CreditCard },
      { id: "transfers", label: "Transferências", icon: ArrowRightLeft },
      { id: "pricing", label: "Precificação", icon: DollarSign },
    ]
  },
  {
    group: "Comercial",
    items: [
      { id: "marketing", label: "Marketing", icon: Megaphone },
      { id: "leads", label: "Leads", icon: Crown, alertKey: "pendingLeads" as const },
    ]
  },
  {
    group: "Sistema",
    items: [
      { id: "settings", label: "Configurações", icon: Settings },
    ]
  }
];

export function SuperAdminSidebar({ activeTab, onTabChange, pendingLeads, activeAlerts }: SuperAdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getBadgeCount = (key?: "pendingLeads" | "activeAlerts") => {
    if (!key) return 0;
    if (key === "pendingLeads") return pendingLeads;
    if (key === "activeAlerts") return activeAlerts;
    return 0;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3 px-2">
          <img src={logoImage} alt="Bibi Motos" className="h-9 w-9 shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-primary truncate">Bibi Motos</span>
              <span className="text-xs text-muted-foreground truncate">Super Admin</span>
            </div>
          )}
        </div>
        <SidebarTrigger className={cn(
          "absolute right-2 top-4 transition-transform",
          isCollapsed && "rotate-180"
        )}>
          <ChevronLeft className="h-4 w-4" />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const badgeCount = getBadgeCount(item.alertKey);
                  const isActive = activeTab === item.id;
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "relative transition-all duration-200",
                          isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary rounded-l-none"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground",
                          item.alertKey === "activeAlerts" && badgeCount > 0 && "text-destructive animate-pulse"
                        )} />
                        <span className="truncate">{item.label}</span>
                        {badgeCount > 0 && (
                          <Badge 
                            variant={item.alertKey === "activeAlerts" ? "destructive" : "default"}
                            className={cn(
                              "ml-auto h-5 min-w-[20px] px-1.5 text-xs font-medium",
                              item.alertKey === "activeAlerts" && "animate-pulse"
                            )}
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
