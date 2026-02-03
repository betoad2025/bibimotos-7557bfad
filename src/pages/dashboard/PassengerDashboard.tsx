import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ReputationBadge } from "@/components/profile/ReputationBadge";
import { DriverCard } from "@/components/ride/DriverCard";
import { RatingModal } from "@/components/ride/RatingModal";
import logoImage from "@/assets/logo-simbolo.png";
import {
  MapPin,
  Navigation,
  Search,
  Clock,
  History,
  User,
  LogOut,
  Loader2,
  X,
  Phone,
} from "lucide-react";

interface PassengerData {
  id: string;
  rating: number;
  total_rides: number;
}

type RideStatus = "idle" | "searching" | "found" | "arriving" | "in_progress" | "completed";

export default function PassengerDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [rideStatus, setRideStatus] = useState<RideStatus>("idle");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null);
  
  const [assignedDriver, setAssignedDriver] = useState<{
    name: string;
    avatarUrl: string | null;
    rating: number;
    totalRides: number;
    phone: string;
    vehicleModel: string;
    vehiclePlate: string;
    vehicleColor: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPassengerData();
    }
  }, [user]);

  const fetchPassengerData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("passengers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setPassengerData({
          id: data.id,
          rating: Number(data.rating) || 5,
          total_rides: data.total_rides || 0,
        });
      } else {
        // Se não existe registro de passageiro, usar valores padrão
        setPassengerData({
          id: user.id,
          rating: 5,
          total_rides: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching passenger data:", error);
      setPassengerData({
        id: user?.id || "",
        rating: 5,
        total_rides: 0,
      });
    }
  };

  const calculatePrice = () => {
    if (!origin || !destination) return;
    // Mock price calculation
    const basePrice = 5;
    const pricePerKm = 2;
    const distance = 3 + Math.random() * 10;
    const price = basePrice + (distance * pricePerKm);
    setEstimatedPrice(Math.round(price * 100) / 100);
  };

  const requestRide = async () => {
    if (!origin || !destination) {
      toast({
        title: "Preencha os endereços",
        description: "Informe origem e destino para solicitar.",
        variant: "destructive",
      });
      return;
    }

    calculatePrice();
    setRideStatus("searching");

    // Simulate finding a driver
    setTimeout(() => {
      setAssignedDriver({
        name: "Carlos Silva",
        avatarUrl: null,
        rating: 4.9,
        totalRides: 324,
        phone: "(11) 99999-9999",
        vehicleModel: "Honda CG 160",
        vehiclePlate: "ABC-1234",
        vehicleColor: "Preta",
      });
      setRideStatus("found");
      toast({ title: "Motorista encontrado!", description: "Ele está a caminho." });
    }, 3000);
  };

  const cancelRide = () => {
    setRideStatus("idle");
    setAssignedDriver(null);
    setEstimatedPrice(null);
    toast({ title: "Corrida cancelada" });
  };

  const completeRide = () => {
    setRideStatus("completed");
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (rating: number) => {
    toast({ 
      title: "Avaliação enviada!", 
      description: `Você deu ${rating} estrelas para ${assignedDriver?.name}.` 
    });
    setRideStatus("idle");
    setAssignedDriver(null);
    setEstimatedPrice(null);
    setOrigin("");
    setDestination("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <h1 className="font-bold text-primary">Bibi Motos</h1>
              <p className="text-xs text-muted-foreground">Passageiro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name || "Usuário"}
              rating={passengerData?.rating}
              totalRides={passengerData?.total_rides}
              size="sm"
            />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Summary */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.full_name || "Usuário"}
                rating={passengerData?.rating || 5}
                totalRides={passengerData?.total_rides || 0}
                size="lg"
              />
              <div className="flex-1">
                <h2 className="font-bold text-lg">{profile?.full_name}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                {passengerData && (
                  <p className="text-sm text-muted-foreground">
                    {passengerData.total_rides} viagens realizadas
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ride Status: Idle - Request Form */}
        {rideStatus === "idle" && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Para onde você vai?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  <Input
                    placeholder="Onde você está?"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  <Input
                    placeholder="Para onde você vai?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {estimatedPrice && (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Valor estimado</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {estimatedPrice.toFixed(2)}
                  </p>
                </div>
              )}

              <Button 
                className="w-full bg-primary" 
                size="lg"
                onClick={requestRide}
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar Motorista
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ride Status: Searching */}
        {rideStatus === "searching" && (
          <Card className="border-2">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold mb-2">Buscando motorista...</h3>
              <p className="text-muted-foreground mb-6">
                Aguarde, estamos procurando o melhor motorista para você
              </p>
              <Button variant="outline" onClick={cancelRide}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ride Status: Found / Arriving / In Progress */}
        {(rideStatus === "found" || rideStatus === "arriving" || rideStatus === "in_progress") && assignedDriver && (
          <div className="space-y-4">
            <Card className="border-2 border-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-600">
                  {rideStatus === "found" && "🏍️ Motorista a caminho!"}
                  {rideStatus === "arriving" && "📍 Motorista chegando!"}
                  {rideStatus === "in_progress" && "🚀 Em viagem"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DriverCard
                  driver={assignedDriver}
                  onCall={() => window.open(`tel:${assignedDriver.phone}`)}
                  onMessage={() => window.open(`https://wa.me/55${assignedDriver.phone.replace(/\D/g, "")}`)}
                />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Origem</p>
                      <p className="font-medium">{origin}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Navigation className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="font-medium">{destination}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {estimatedPrice && (
              <Card className="border-2">
                <CardContent className="py-4 flex justify-between items-center">
                  <span className="font-medium">Valor da corrida</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {estimatedPrice.toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={cancelRide} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              {rideStatus === "in_progress" && (
                <Button onClick={completeRide} className="flex-1 bg-green-500 hover:bg-green-600">
                  Finalizar Corrida
                </Button>
              )}
              {rideStatus === "found" && (
                <Button onClick={() => setRideStatus("in_progress")} className="flex-1">
                  Embarquei
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Reputation Card (always visible when idle) */}
        {rideStatus === "idle" && passengerData && (
          <ReputationBadge
            rating={passengerData.rating}
            totalRides={passengerData.total_rides}
            type="passenger"
          />
        )}

        {/* Quick Actions */}
        {rideStatus === "idle" && (
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <History className="h-6 w-6" />
              <span>Histórico</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <User className="h-6 w-6" />
              <span>Meu Perfil</span>
            </Button>
          </div>
        )}
      </main>

      {/* Rating Modal */}
      {showRatingModal && assignedDriver && (
        <RatingModal
          open={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRideStatus("idle");
            setAssignedDriver(null);
          }}
          onSubmit={handleRatingSubmit}
          userName={assignedDriver.name}
          userAvatar={assignedDriver.avatarUrl}
          userType="driver"
        />
      )}
    </div>
  );
}
