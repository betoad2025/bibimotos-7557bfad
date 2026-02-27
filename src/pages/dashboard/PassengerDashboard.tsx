import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ReputationBadge } from "@/components/profile/ReputationBadge";
import { RideRequestForm } from "@/components/ride/RideRequestForm";
import { RideTrackingCard } from "@/components/ride/RideTrackingCard";
import { RideMapTracker } from "@/components/ride/RideMapTracker";
import { EnhancedRatingModal } from "@/components/ride/EnhancedRatingModal";
import { TipModal } from "@/components/ride/TipModal";
import { SOSButton } from "@/components/ride/SOSButton";
import { InAppPayment } from "@/components/payment/InAppPayment";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { useRideService } from "@/hooks/useRideService";
import logoImage from "@/assets/logo-simbolo.png";
import { History, User, LogOut, MapPin, Wallet } from "lucide-react";
import { LoyaltyProgressCard } from "@/components/passenger/LoyaltyProgressCard";
import { FavoriteAddresses } from "@/components/passenger/FavoriteAddresses";
import { RideHistory } from "@/components/ride/RideHistory";
import { UserWalletCard } from "@/components/wallet/UserWalletCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PassengerData {
  id: string;
  rating: number;
  total_rides: number;
  franchise_id: string;
}

export default function PassengerDashboard() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { rateRide, completeRide } = useRideService();
  
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null);
  const [cityInfo, setCityInfo] = useState<{ name: string; state: string } | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rideJustCompleted, setRideJustCompleted] = useState(false);

  const { ride, driver, loading: rideLoading } = useRideRealtime(currentRideId);

  useEffect(() => {
    if (user) {
      fetchPassengerData();
    }
  }, [user]);

  // Check for active ride on mount
  useEffect(() => {
    if (passengerData?.id) {
      checkActiveRide();
    }
  }, [passengerData?.id]);

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
          franchise_id: data.franchise_id,
        });

        // Fetch city info
        const { data: franchise } = await supabase
          .from('franchises')
          .select('cities(name, state)')
          .eq('id', data.franchise_id)
          .single();
        
        if (franchise?.cities) {
          const city = franchise.cities as unknown as { name: string; state: string };
          setCityInfo(city);
        }
      }
    } catch (error) {
      console.error("Error fetching passenger data:", error);
    }
  };

  const checkActiveRide = async () => {
    if (!passengerData?.id) return;

    try {
      const { data } = await supabase
        .from("rides")
        .select("id")
        .eq("passenger_id", passengerData.id)
        .in("status", ["pending", "accepted", "in_progress"])
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

  const handleRideCreated = (rideId: string) => {
    setCurrentRideId(rideId);
  };

  const handleCompleteRide = async () => {
    if (!ride) return;
    
    const success = await completeRide(
      ride.id,
      ride.final_price || ride.estimated_price || 0
    );
    
    if (success) {
      setRideJustCompleted(true);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!ride) return;
    
    await rateRide(ride.id, rating, false);
    setShowRatingModal(false);
    // Show tip modal after rating
    setShowTipModal(true);
  };

  const handleTipClose = () => {
    setShowTipModal(false);
    setRideJustCompleted(false);
    setCurrentRideId(null);
  };

  const handleCancelRide = () => {
    setCurrentRideId(null);
  };

  // Determine if there's an active ride
  const hasActiveRide = currentRideId && ride && !["completed", "cancelled"].includes(ride.status || "");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {cityInfo && (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>{cityInfo.name} - {cityInfo.state}</span>
                    <span className="mx-0.5">•</span>
                  </>
                )}
                Passageiro
              </p>
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

        {/* Active Ride with Map */}
        {hasActiveRide ? (
          <>
            {/* Real-time map tracker */}
            <RideMapTracker
              rideId={ride.id}
              originLat={Number(ride.origin_lat) || 0}
              originLng={Number(ride.origin_lng) || 0}
              destinationLat={Number(ride.destination_lat) || 0}
              destinationLng={Number(ride.destination_lng) || 0}
              driverLat={driver?.currentLat}
              driverLng={driver?.currentLng}
              status={ride.status || "pending"}
            />
            <RideTrackingCard
              ride={ride}
              driver={driver}
              isDriver={false}
              onCancel={handleCancelRide}
              onComplete={handleCompleteRide}
              onRate={() => setShowRatingModal(true)}
            />
          </>
        ) : passengerData ? (
          <RideRequestForm
            franchiseId={passengerData.franchise_id}
            passengerId={passengerData.id}
            onRideCreated={handleRideCreated}
          />
        ) : (
          <Card className="border-2">
            <CardContent className="py-8 text-center space-y-4">
              <MapPin className="h-12 w-12 mx-auto text-primary/50" />
              <h3 className="text-lg font-bold">Bem-vindo ao Bibi Motos!</h3>
              <p className="text-muted-foreground">
                Seu cadastro está sendo processado. Complete seus dados para solicitar sua primeira corrida.
              </p>
              <Button onClick={() => window.location.href = "/complete-registration"}>
                Completar Cadastro
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Extra features when idle */}
        {!hasActiveRide && passengerData && (
          <Tabs defaultValue="ride" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ride">🏍️ Corrida</TabsTrigger>
              <TabsTrigger value="wallet">💳 Carteira</TabsTrigger>
              <TabsTrigger value="places">📍 Lugares</TabsTrigger>
              <TabsTrigger value="history">📜 Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ride" className="space-y-4">
              <LoyaltyProgressCard
                userId={user?.id || ""}
                franchiseId={passengerData.franchise_id}
              />
              <ReputationBadge
                rating={passengerData.rating}
                totalRides={passengerData.total_rides}
                type="passenger"
              />
            </TabsContent>
            
            <TabsContent value="wallet">
              <UserWalletCard />
            </TabsContent>
            
            <TabsContent value="places">
              <FavoriteAddresses
                userId={user?.id || ""}
                franchiseId={passengerData.franchise_id}
              />
            </TabsContent>
            
            <TabsContent value="history">
              <RideHistory
                userId={user?.id || ""}
                userType="passenger"
                passengerId={passengerData.id}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Floating SOS Button during active ride */}
      {hasActiveRide && passengerData && (
        <SOSButton
          rideId={ride.id}
          franchiseId={passengerData.franchise_id}
          reporterType="passenger"
          variant="floating"
        />
      )}

      {/* Payment Modal after ride completion */}
      {showPaymentModal && ride && (
        <InAppPayment
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setShowRatingModal(true);
          }}
          rideId={ride.id}
          amount={ride.final_price || ride.estimated_price || 0}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && driver && ride && (
        <EnhancedRatingModal
          open={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setShowTipModal(true);
          }}
          onSubmit={handleRatingSubmit}
          userName={driver.name}
          userAvatar={driver.avatarUrl}
          userRating={driver.rating}
          userTotalRides={driver.totalRides}
          userType="driver"
          ridePrice={ride.final_price || ride.estimated_price || undefined}
          rideDistance={ride.distance_km || undefined}
        />
      )}

      {/* Tip Modal after rating */}
      {showTipModal && driver && ride && passengerData && (
        <TipModal
          open={showTipModal}
          onClose={handleTipClose}
          rideId={ride.id}
          driverId={ride.driver_id || ""}
          passengerId={passengerData.id}
          franchiseId={passengerData.franchise_id}
          driverName={driver.name}
        />
      )}
    </div>
  );
}
