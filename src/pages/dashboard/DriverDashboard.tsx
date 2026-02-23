import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ReputationBadge } from "@/components/profile/ReputationBadge";
import { RideRequestCard } from "@/components/ride/RideRequestCard";
import { RideTrackingCard } from "@/components/ride/RideTrackingCard";
import { RideMapTracker } from "@/components/ride/RideMapTracker";
import { EnhancedRatingModal } from "@/components/ride/EnhancedRatingModal";
import { SOSButton } from "@/components/ride/SOSButton";
import { DemandBonusCard } from "@/components/driver/DemandBonusCard";
import { usePendingRides, useRideRealtime } from "@/hooks/useRideRealtime";
import { useRideService } from "@/hooks/useRideService";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import logoImage from "@/assets/logo-simbolo.png";
import {
  Wallet,
  TrendingUp,
  Power,
  CreditCard,
  History,
  LogOut,
  Bike,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";
import { CreditsShop } from "@/components/driver/CreditsShop";
import { RideHistory } from "@/components/ride/RideHistory";
import { DriverTransferRequest } from "@/components/driver/DriverTransferRequest";
import { FinancialReportCard } from "@/components/driver/FinancialReportCard";
import { FinancialReportPDF } from "@/components/driver/FinancialReportPDF";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  franchise_id: string;
}

export default function DriverDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { rateRide, completeRide, updateDriverLocation } = useRideService();
  
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Realtime hooks
  const { rides: pendingRides } = usePendingRides(driverData?.franchise_id || null, isOnline);
  const { ride, passenger, loading: rideLoading } = useRideRealtime(currentRideId);

  const hasActiveRide = currentRideId && ride && !["completed", "cancelled"].includes(ride.status || "");

  // GPS tracking during active ride
  useLocationTracking({
    rideId: currentRideId || "",
    driverId: driverData?.id || "",
    isActive: !!hasActiveRide,
  });

  useEffect(() => {
    if (user) {
      fetchDriverData();
    }
  }, [user]);

  useEffect(() => {
    if (driverData?.id) {
      checkActiveRide();
    }
  }, [driverData?.id]);

  useEffect(() => {
    if (!isOnline || !driverData?.id) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateDriverLocation(
            driverData.id,
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => console.error("Location error:", error),
        { enableHighAccuracy: true }
      );
    };

    updateLocation();
    const interval = setInterval(updateLocation, 30000);

    return () => clearInterval(interval);
  }, [isOnline, driverData?.id, updateDriverLocation]);

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
          franchise_id: data.franchise_id,
        });
        setIsOnline(data.is_online || false);
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const checkActiveRide = async () => {
    if (!driverData?.id) return;

    try {
      const { data } = await supabase
        .from("rides")
        .select("id")
        .eq("driver_id", driverData.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setCurrentRideId(data.id);
      }
    } catch (error) {
      console.error("Error checking active ride:", error);
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

  const handleCompleteRide = async () => {
    if (!ride) return;
    
    const success = await completeRide(
      ride.id,
      ride.final_price || ride.estimated_price || 0
    );
    
    if (success) {
      setShowRatingModal(true);
      fetchDriverData();
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!ride) return;
    
    await rateRide(ride.id, rating, true);
    setCurrentRideId(null);
    setShowRatingModal(false);
  };

  const handleCancelRide = () => {
    setCurrentRideId(null);
  };

  if (!driverData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
        <Bike className="h-16 w-16 text-primary/50" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Cadastro de Motorista</h2>
          <p className="text-muted-foreground max-w-sm">
            Você ainda não possui cadastro como motorista ou seu registro está sendo processado. Complete seus dados para começar a trabalhar.
          </p>
        </div>
        <Button onClick={() => window.location.href = "/complete-registration"}>
          Completar Cadastro
        </Button>
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
            <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-600" : ""}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Low Credits Alert */}
        {driverData.credits <= 0 && (
          <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-700 dark:text-red-400">Sem créditos!</p>
                  <p className="text-sm text-red-600 dark:text-red-300">Você não pode ficar online. Recarregue para receber corridas.</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => {
                  const el = document.getElementById('credits-tab');
                  if (el) el.click();
                }}>
                  Recarregar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {driverData.credits > 0 && driverData.credits < 3 && (
          <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">Créditos acabando!</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">Restam R$ {driverData.credits.toFixed(2)}. Recarregue em breve.</p>
                </div>
                <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-700" onClick={() => {
                  const el = document.getElementById('credits-tab');
                  if (el) el.click();
                }}>
                  Recarregar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                <Power className={`h-6 w-6 ${isOnline ? "text-green-600" : "text-muted-foreground"}`} />
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

        {/* Demand Bonus Card - shows when online */}
        {isOnline && !hasActiveRide && (
          <DemandBonusCard
            franchiseId={driverData.franchise_id}
            driverId={driverData.id}
          />
        )}

        {/* Active Ride with Map */}
        {hasActiveRide && (
          <>
            <RideMapTracker
              rideId={ride.id}
              originLat={Number(ride.origin_lat) || 0}
              originLng={Number(ride.origin_lng) || 0}
              destinationLat={Number(ride.destination_lat) || 0}
              destinationLng={Number(ride.destination_lng) || 0}
              status={ride.status || "accepted"}
            />
            <RideTrackingCard
              ride={ride}
              driver={null}
              passenger={passenger}
              isDriver={true}
              onCancel={handleCancelRide}
              onComplete={handleCompleteRide}
              onRate={() => setShowRatingModal(true)}
            />
          </>
        )}

        {/* Pending Ride Requests */}
        {!hasActiveRide && isOnline && pendingRides.length > 0 && (
          <div className="space-y-4">
            {pendingRides.slice(0, 3).map((rideRequest) => (
              <RideRequestCard
                key={rideRequest.id}
                ride={rideRequest}
                driverId={driverData.id}
                onAccepted={() => {
                  setCurrentRideId(rideRequest.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {!hasActiveRide && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-2">
              <CardContent className="pt-4 pb-4 text-center">
                <Wallet className="h-8 w-8 mx-auto text-green-600 mb-2" />
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
        )}

        {/* Reputation */}
        {!hasActiveRide && (
          <ReputationBadge
            rating={driverData.rating}
            totalRides={driverData.total_rides}
            type="driver"
          />
        )}

        {/* Actions Tabs */}
        {!hasActiveRide && (
          <Tabs defaultValue="credits" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="credits" id="credits-tab">💳 Créditos</TabsTrigger>
              <TabsTrigger value="report">📊 Relatório</TabsTrigger>
              <TabsTrigger value="history">📜 Histórico</TabsTrigger>
              <TabsTrigger value="transfer">🔄 Transferir</TabsTrigger>
            </TabsList>
            <TabsContent value="credits">
              <CreditsShop
                driverId={driverData.id}
                franchiseId={driverData.franchise_id}
                currentCredits={driverData.credits}
                onCreditsUpdated={fetchDriverData}
              />
            </TabsContent>
            <TabsContent value="report" className="space-y-4">
              <FinancialReportCard
                driverId={driverData.id}
                franchiseId={driverData.franchise_id}
              />
              <div className="flex gap-2">
                <FinancialReportPDF
                  driverId={driverData.id}
                  driverName={profile?.full_name || "Motorista"}
                  period="weekly"
                />
                <FinancialReportPDF
                  driverId={driverData.id}
                  driverName={profile?.full_name || "Motorista"}
                  period="monthly"
                />
              </div>
            </TabsContent>
            <TabsContent value="history">
              <RideHistory
                userId={user?.id || ""}
                userType="driver"
                driverId={driverData.id}
              />
            </TabsContent>
            <TabsContent value="transfer">
              <DriverTransferRequest
                driverId={driverData.id}
                currentFranchiseId={driverData.franchise_id}
                currentFranchiseName="Franquia Atual"
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Floating SOS Button during active ride */}
      {hasActiveRide && (
        <SOSButton
          rideId={ride.id}
          franchiseId={driverData.franchise_id}
          reporterType="driver"
          variant="floating"
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && passenger && ride && (
        <EnhancedRatingModal
          open={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setCurrentRideId(null);
          }}
          onSubmit={handleRatingSubmit}
          userName={passenger.name}
          userAvatar={passenger.avatarUrl}
          userRating={passenger.rating}
          userTotalRides={passenger.totalRides}
          userType="passenger"
          ridePrice={ride.final_price || ride.estimated_price || undefined}
          rideDistance={ride.distance_km || undefined}
        />
      )}
    </div>
  );
}
