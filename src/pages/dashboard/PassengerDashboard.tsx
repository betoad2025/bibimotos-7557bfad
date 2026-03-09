import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RideTrackingCard } from "@/components/ride/RideTrackingCard";
import { RideMapTracker } from "@/components/ride/RideMapTracker";
import { EnhancedRatingModal } from "@/components/ride/EnhancedRatingModal";
import { TipModal } from "@/components/ride/TipModal";
import { SOSButton } from "@/components/ride/SOSButton";
import { InAppPayment } from "@/components/payment/InAppPayment";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { useRideService } from "@/hooks/useRideService";
import { BottomNavBar, type PassengerTab } from "@/components/passenger/BottomNavBar";
import { PassengerHomeTab } from "@/components/passenger/PassengerHomeTab";
import { PassengerActivityTab } from "@/components/passenger/PassengerActivityTab";
import { PassengerWalletTab } from "@/components/passenger/PassengerWalletTab";
import { PassengerProfileTab } from "@/components/passenger/PassengerProfileTab";
import logoImage from "@/assets/logo-simbolo.png";
import { MapPin } from "lucide-react";

interface PassengerData {
  id: string;
  rating: number;
  total_rides: number;
  franchise_id: string;
}

export default function PassengerDashboard() {
  const { user, profile, signOut } = useAuth();
  const { rateRide, completeRide } = useRideService();

  const [activeTab, setActiveTab] = useState<PassengerTab>("home");
  const [passengerData, setPassengerData] = useState<PassengerData | null>(null);
  const [cityInfo, setCityInfo] = useState<{ name: string; state: string } | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rideJustCompleted, setRideJustCompleted] = useState(false);

  const { ride, driver, loading: rideLoading } = useRideRealtime(currentRideId);

  useEffect(() => {
    if (user) fetchPassengerData();
  }, [user]);

  useEffect(() => {
    if (passengerData?.id) checkActiveRide();
  }, [passengerData?.id]);

  const fetchPassengerData = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
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

        const { data: franchise } = await supabase
          .from("franchises")
          .select("cities(name, state)")
          .eq("id", data.franchise_id)
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

      if (data) setCurrentRideId(data.id);
    } catch (error) {
      console.error("Error checking active ride:", error);
    }
  };

  const handleRideCreated = (rideId: string) => setCurrentRideId(rideId);

  const handleCompleteRide = async () => {
    if (!ride) return;
    const success = await completeRide(ride.id, ride.final_price || ride.estimated_price || 0);
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
    setShowTipModal(true);
  };

  const handleTipClose = () => {
    setShowTipModal(false);
    setRideJustCompleted(false);
    setCurrentRideId(null);
  };

  const handleCancelRide = () => setCurrentRideId(null);

  const hasActiveRide = currentRideId && ride && !["completed", "cancelled"].includes(ride.status || "");

  // Force home tab when ride is active
  const effectiveTab = hasActiveRide ? "home" : activeTab;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Bibi Motos" className="h-8 w-8" />
            <span className="font-bold text-sm">Bibi Motos</span>
          </div>
          {cityInfo && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {cityInfo.name}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Active Ride takes over */}
        {hasActiveRide ? (
          <div className="space-y-4">
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
          </div>
        ) : !passengerData ? (
          <Card className="border-2">
            <CardContent className="py-8 text-center space-y-4">
              <MapPin className="h-12 w-12 mx-auto text-primary/50" />
              <h3 className="text-lg font-bold">Bem-vindo ao Bibi Motos!</h3>
              <p className="text-muted-foreground">
                Seu cadastro está sendo processado. Complete seus dados para solicitar sua primeira corrida.
              </p>
              <Button onClick={() => (window.location.href = "/complete-registration")}>
                Completar Cadastro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {effectiveTab === "home" && (
              <PassengerHomeTab
                passengerData={passengerData}
                cityInfo={cityInfo}
                userName={profile?.full_name || "Passageiro"}
                favoriteAddresses={[]}
                onRideCreated={handleRideCreated}
                onNavigateToTab={(tab) => setActiveTab(tab as PassengerTab)}
              />
            )}
            {effectiveTab === "activity" && (
              <PassengerActivityTab
                userId={user?.id || ""}
                passengerId={passengerData.id}
              />
            )}
            {effectiveTab === "wallet" && <PassengerWalletTab />}
            {effectiveTab === "profile" && (
              <PassengerProfileTab
                profile={profile}
                passengerData={passengerData}
                userId={user?.id || ""}
                onSignOut={signOut}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab={effectiveTab} onTabChange={setActiveTab} />

      {/* Floating SOS during active ride */}
      {hasActiveRide && passengerData && (
        <SOSButton
          rideId={ride.id}
          franchiseId={passengerData.franchise_id}
          reporterType="passenger"
          variant="floating"
        />
      )}

      {/* Payment Modal */}
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

      {/* Tip Modal */}
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
