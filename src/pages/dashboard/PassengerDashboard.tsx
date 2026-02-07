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
import { EnhancedRatingModal } from "@/components/ride/EnhancedRatingModal";
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
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

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
      setShowRatingModal(true);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!ride) return;
    
    await rateRide(ride.id, rating, false);
    setCurrentRideId(null);
    setShowRatingModal(false);
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

        {/* Active Ride or Request Form */}
        {hasActiveRide ? (
          <RideTrackingCard
            ride={ride}
            driver={driver}
            isDriver={false}
            onCancel={handleCancelRide}
            onComplete={handleCompleteRide}
            onRate={() => setShowRatingModal(true)}
          />
        ) : passengerData ? (
          <RideRequestForm
            franchiseId={passengerData.franchise_id}
            passengerId={passengerData.id}
            onRideCreated={handleRideCreated}
          />
        ) : (
          <Card className="border-2">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Carregando dados do passageiro...
              </p>
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

      {/* Rating Modal */}
      {showRatingModal && driver && ride && (
        <EnhancedRatingModal
          open={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setCurrentRideId(null);
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
    </div>
  );
}
