import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReputationBadge } from "@/components/profile/ReputationBadge";
import { UserProfileSettings } from "@/components/profile/UserProfileSettings";
import { LoyaltyProgressCard } from "@/components/passenger/LoyaltyProgressCard";
import { ReferralCard } from "@/components/referral/ReferralCard";
import {
  Star,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Bike,
  Award,
} from "lucide-react";
import passengerImage from "@/assets/passenger-happy.jpg";

interface PassengerProfileTabProps {
  profile: {
    full_name?: string;
    email?: string;
    avatar_url?: string | null;
  } | null;
  passengerData: {
    id: string;
    rating: number;
    total_rides: number;
    franchise_id: string;
  };
  userId: string;
  onSignOut: () => void;
}

export function PassengerProfileTab({
  profile,
  passengerData,
  userId,
  onSignOut,
}: PassengerProfileTabProps) {
  const [showSettings, setShowSettings] = useState(false);

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (showSettings) {
    return <UserProfileSettings onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Profile Header with cinematic bg */}
      <div className="relative rounded-2xl overflow-hidden -mx-1">
        <img
          src={passengerImage}
          alt="Perfil"
          className="w-full h-32 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Profile Card overlapping hero */}
      <Card className="-mt-16 relative z-10 mx-2">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-card shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {passengerData.rating.toFixed(1)}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Bike className="h-3 w-3" />
                  {passengerData.total_rides} viagens
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reputation */}
      <ReputationBadge
        rating={passengerData.rating}
        totalRides={passengerData.total_rides}
        type="passenger"
      />

      {/* Loyalty */}
      <LoyaltyProgressCard
        userId={userId}
        franchiseId={passengerData.franchise_id}
      />

      {/* Menu Items */}
      <div className="space-y-1">
        <ProfileMenuItem
          icon={Settings}
          label="Configurações da conta"
          onClick={() => setShowSettings(true)}
        />
        <ProfileMenuItem icon={Shield} label="Segurança e privacidade" />
        <ProfileMenuItem icon={HelpCircle} label="Ajuda e suporte" />
        <ProfileMenuItem icon={Award} label="Programa de fidelidade" />
      </div>

      {/* Sign out */}
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3"
        onClick={onSignOut}
      >
        <LogOut className="h-5 w-5" />
        Sair da conta
      </Button>
    </div>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
