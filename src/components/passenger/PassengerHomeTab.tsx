import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bike, Package, Pill, MapPin, Star, ChevronRight, Sparkles, Shield, Clock } from "lucide-react";
import { RideRequestForm } from "@/components/ride/RideRequestForm";
import heroImage from "@/assets/passenger-hero-ride.jpg";
import deliveryImage from "@/assets/passenger-delivery.jpg";
import requestingImage from "@/assets/passenger-requesting.jpg";
import driverImage from "@/assets/passenger-driver-friendly.jpg";

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

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "🌙";
  if (hour < 12) return "☀️";
  if (hour < 18) return "🌤️";
  return "🌆";
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
  const emoji = useMemo(() => getGreetingEmoji(), []);
  const firstName = userName?.split(" ")[0] || "Passageiro";

  return (
    <div className="space-y-5 pb-4">
      {/* Hero Banner — passageira feliz na garupa */}
      <div className="relative rounded-2xl overflow-hidden -mx-1">
        <img
          src={heroImage}
          alt="Passageira sorrindo na garupa de uma moto — Bibi Motos"
          className="w-full h-44 object-cover object-top"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs text-primary-foreground/90 font-medium flex items-center gap-1 drop-shadow-md">
            {cityInfo && (
              <>
                <MapPin className="h-3 w-3" />
                {cityInfo.name}, {cityInfo.state}
              </>
            )}
          </p>
          <h1 className="text-2xl font-bold text-primary-foreground drop-shadow-lg">
            {greeting}, {firstName}! {emoji}
          </h1>
          <p className="text-sm text-primary-foreground/70 drop-shadow-md mt-0.5">
            Para onde vamos hoje?
          </p>
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

      {/* Service Cards with images */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          O que você precisa?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <ServiceQuickCard icon={Bike} label="Mototáxi" description="Vá rápido" color="primary" />
          <ServiceQuickCard icon={Package} label="Entrega" description="Envie já" color="accent" />
          <ServiceQuickCard icon={Pill} label="Farmácia" description="Receba em casa" color="destructive" />
        </div>
      </div>

      {/* Ride Request Form */}
      <RideRequestForm
        franchiseId={passengerData.franchise_id}
        passengerId={passengerData.id}
        onRideCreated={onRideCreated}
      />

      {/* Trust section — motorista amigável */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src={driverImage}
          alt="Motorista parceiro Bibi Motos sorrindo"
          className="w-full h-36 object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="absolute inset-0 p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Segurança</span>
          </div>
          <h3 className="text-base font-bold leading-tight">
            Motoristas verificados<br />e avaliados por você
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Todos os parceiros passam por aprovação e verificação.
          </p>
        </div>
      </div>

      {/* Delivery Promo — entregador entregando pacote */}
      <Card className="relative overflow-hidden border-0 rounded-2xl">
        <img
          src={deliveryImage}
          alt="Entregador Bibi Motos entregando pacote para cliente sorrindo"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/30" />
        <CardContent className="relative p-5 min-h-[140px] flex flex-col justify-center">
          <Badge className="bg-accent text-accent-foreground w-fit mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Novidade
          </Badge>
          <h3 className="text-lg font-bold text-primary-foreground mb-1">
            Entregas na sua porta
          </h3>
          <p className="text-sm text-primary-foreground/80 mb-3">
            Pacotes, farmácia e documentos com rapidez e um sorriso.
          </p>
          <Button size="sm" variant="secondary" className="w-fit bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm hover:bg-primary-foreground/30">
            Pedir agora
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* How it works — pessoa pedindo corrida */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src={requestingImage}
          alt="Jovem sorrindo pedindo corrida pelo celular"
          className="w-full h-32 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/70 to-transparent" />
        <div className="absolute inset-0 p-4 flex flex-col justify-center items-end text-right">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">Rápido</span>
          </div>
          <h3 className="text-base font-bold leading-tight">
            Peça em segundos,<br />chegue em minutos
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Motorista mais próximo em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}

function ServiceQuickCard({ icon: Icon, label, description, color }: { icon: React.ElementType; label: string; description: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 active:scale-95">
      <div className={`h-11 w-11 rounded-xl ${colorMap[color]} flex items-center justify-center`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold">{label}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{description}</span>
    </button>
  );
}
