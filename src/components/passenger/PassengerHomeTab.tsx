import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bike, Package, Pill, MapPin, Star, ChevronRight, Sparkles } from "lucide-react";
import { RideRequestForm } from "@/components/ride/RideRequestForm";
import heroImage from "@/assets/passenger-hero-ride.jpg";
import deliveryImage from "@/assets/passenger-delivery.jpg";

interface PassengerHomeTabProps {
  passengerData: {
    id: string;
    rating: number;
    total_rides: number;
    franchise_id: string;
  };
  cityInfo: { name: string; state: string } | null;
  userName: string;
  favoriteAddresses: { name: string; address: string }[];
  onRideCreated: (rideId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function PassengerHomeTab({
  passengerData,
  cityInfo,
  userName,
  favoriteAddresses,
  onRideCreated,
  onNavigateToTab,
}: PassengerHomeTabProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = userName?.split(" ")[0] || "Passageiro";

  return (
    <div className="space-y-5 pb-4">
      {/* Hero Banner with greeting */}
      <div className="relative rounded-2xl overflow-hidden -mx-1">
        <img
          src={heroImage}
          alt="Bibi Motos"
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs text-primary-foreground/80 font-medium flex items-center gap-1">
            {cityInfo && (
              <>
                <MapPin className="h-3 w-3" />
                {cityInfo.name}, {cityInfo.state}
              </>
            )}
          </p>
          <h1 className="text-2xl font-bold text-primary-foreground drop-shadow-lg">
            {greeting}, {firstName}! 👋
          </h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avaliação</p>
              <p className="text-lg font-bold">{passengerData.rating.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Bike className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Viagens</p>
              <p className="text-lg font-bold">{passengerData.total_rides}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Service Cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Serviços
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <ServiceQuickCard icon={Bike} label="Mototáxi" color="primary" />
          <ServiceQuickCard icon={Package} label="Entrega" color="accent" />
          <ServiceQuickCard icon={Pill} label="Farmácia" color="destructive" />
        </div>
      </div>

      {/* Ride Request Form */}
      <RideRequestForm
        franchiseId={passengerData.franchise_id}
        passengerId={passengerData.id}
        onRideCreated={onRideCreated}
      />

      {/* Promo Banner */}
      <Card className="relative overflow-hidden border-0">
        <img
          src={deliveryImage}
          alt="Entregas Bibi Motos"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        <CardContent className="relative p-5">
          <Badge className="bg-accent text-accent-foreground mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Novidade
          </Badge>
          <h3 className="text-lg font-bold text-primary-foreground mb-1">
            Entregas rápidas
          </h3>
          <p className="text-sm text-primary-foreground/80 mb-3">
            Envie pacotes e documentos com segurança e agilidade.
          </p>
          <Button size="sm" variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm hover:bg-primary-foreground/30">
            Saiba mais
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceQuickCard({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 active:scale-95">
      <div className={`h-12 w-12 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
