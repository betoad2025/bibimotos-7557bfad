import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ReputationBadge } from "@/components/profile/ReputationBadge";
import { RatingModal } from "@/components/ride/RatingModal";
import logoImage from "@/assets/logo-simbolo.png";
import {
  Wallet,
  MapPin,
  Clock,
  TrendingUp,
  Power,
  Navigation,
  CreditCard,
  History,
  Settings,
  LogOut,
  Star,
  Bike,
} from "lucide-react";

interface DriverData {
  id: string;
  is_online: boolean;
  is_approved: boolean;
  rating: number;
  total_rides: number;
  credits: number;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
}

interface RideRequest {
  id: string;
  origin_address: string;
  destination_address: string;
  distance_km: number;
  estimated_price: number;
  passenger: {
    name: string;
    avatar_url: string | null;
    rating: number;
    total_rides: number;
  };
}

export default function DriverDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchDriverData();
    }
  }, [user]);

  const fetchDriverData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setDriverData({
          id: data.id,
          is_online: data.is_online || false,
          is_approved: data.is_approved || false,
          rating: Number(data.rating) || 5,
          total_rides: data.total_rides || 0,
          credits: Number(data.credits) || 0,
          vehicle_model: data.vehicle_model || "",
          vehicle_plate: data.vehicle_plate || "",
          vehicle_color: data.vehicle_color || "",
        });
        setIsOnline(data.is_online || false);
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const toggleOnline = async () => {
    if (!driverData) return;

    if (!driverData.is_approved) {
      toast({
        title: "Aguarde aprovação",
        description: "Seu cadastro ainda está em análise.",
        variant: "destructive",
      });
      return;
    }

    if (driverData.credits <= 0 && !isOnline) {
      toast({
        title: "Sem créditos",
        description: "Você precisa de créditos para ficar online.",
        variant: "destructive",
      });
      return;
    }

    const newStatus = !isOnline;
    const { error } = await supabase
      .from("drivers")
      .update({ is_online: newStatus })
      .eq("id", driverData.id);

    if (!error) {
      setIsOnline(newStatus);
      toast({
        title: newStatus ? "Você está online!" : "Você está offline",
        description: newStatus ? "Aguardando corridas..." : "Não receberá novas corridas.",
      });
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!driverData || driverData.credits <= 0) {
      toast({
        title: "Sem créditos",
        description: "Compre créditos para aceitar corridas.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Corrida aceita!", description: "Dirija-se ao passageiro." });
    setRideRequests(prev => prev.filter(r => r.id !== rideId));
  };

  if (!driverData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">Carregando dados do motorista...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <h1 className="font-bold text-primary">Bibi Motos</h1>
              <p className="text-xs text-muted-foreground">Motorista</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-500" : ""}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.full_name || "Motorista"}
                rating={driverData.rating}
                totalRides={driverData.total_rides}
                size="lg"
              />
              <div className="flex-1">
                <h2 className="font-bold text-lg">{profile?.full_name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bike className="h-4 w-4" />
                  <span>{driverData.vehicle_model || "Moto"}</span>
                </div>
                <div className="mt-1 inline-block bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-mono font-bold">
                  {driverData.vehicle_plate || "---"}
                </div>
              </div>
            </div>
            
            {!driverData.is_approved && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⏳ Seu cadastro está em análise. Aguarde aprovação para começar a trabalhar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Toggle */}
        <Card className="border-2">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Power className={`h-6 w-6 ${isOnline ? "text-green-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-semibold">{isOnline ? "Você está online" : "Você está offline"}</p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? "Recebendo corridas" : "Ative para receber corridas"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={toggleOnline}
                disabled={!driverData.is_approved}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-2">
            <CardContent className="pt-4 pb-4 text-center">
              <Wallet className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">
                R$ {driverData.credits.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Créditos</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-4 pb-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{driverData.total_rides}</p>
              <p className="text-xs text-muted-foreground">Corridas</p>
            </CardContent>
          </Card>
        </div>

        {/* Reputation */}
        <ReputationBadge
          rating={driverData.rating}
          totalRides={driverData.total_rides}
          type="driver"
        />

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <CreditCard className="h-6 w-6" />
            <span>Comprar Créditos</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <History className="h-6 w-6" />
            <span>Histórico</span>
          </Button>
        </div>

        {/* Ride Requests (Mock) */}
        {isOnline && rideRequests.length > 0 && (
          <Card className="border-2 border-primary animate-pulse">
            <CardHeader>
              <CardTitle className="text-lg">Nova Corrida!</CardTitle>
            </CardHeader>
            <CardContent>
              {rideRequests.map((ride) => (
                <div key={ride.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={ride.passenger.avatar_url}
                      name={ride.passenger.name}
                      rating={ride.passenger.rating}
                      totalRides={ride.passenger.total_rides}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold">{ride.passenger.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{ride.passenger.rating.toFixed(1)}</span>
                        <span>• {ride.passenger.total_rides} viagens</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{ride.origin_address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-sm">{ride.destination_address}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">{ride.distance_km} km</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {ride.estimated_price.toFixed(2)}
                      </p>
                    </div>
                    <Button onClick={() => handleAcceptRide(ride.id)} className="bg-green-500 hover:bg-green-600">
                      Aceitar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Rating Modal */}
      {showRatingModal && ratingData && (
        <RatingModal
          open={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={(rating) => {
            toast({ title: "Avaliação enviada!", description: `Você deu ${rating} estrelas.` });
          }}
          userName={ratingData.name}
          userAvatar={ratingData.avatar}
          userType="passenger"
        />
      )}
    </div>
  );
}
