import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { useRideRealtime, type PassengerInfo, type RideData } from '@/hooks/useRideRealtime';
import { useRideService } from '@/hooks/useRideService';
import { MapPin, Navigation, Clock, Phone, MessageCircle, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RideRequestCardProps {
  ride: RideData;
  passenger?: PassengerInfo;
  driverId: string;
  onAccepted?: () => void;
}

export function RideRequestCard({ ride, passenger, driverId, onAccepted }: RideRequestCardProps) {
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo | null>(passenger || null);
  const { acceptRide, loading } = useRideService();

  // Fetch passenger info if not provided
  useEffect(() => {
    if (!passenger && ride.passenger_id) {
      // Will be fetched by parent component
    }
  }, [passenger, ride.passenger_id]);

  const handleAccept = async () => {
    const success = await acceptRide(ride.id, driverId);
    if (success && onAccepted) {
      onAccepted();
    }
  };

  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - new Date(ride.created_at).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    return `há ${minutes} min`;
  };

  return (
    <Card className="border-2 border-primary animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-primary">🔔 Nova Corrida!</CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Passenger Info */}
        {passengerInfo && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <UserAvatar
              avatarUrl={passengerInfo.avatarUrl}
              name={passengerInfo.name}
              rating={passengerInfo.rating}
              totalRides={passengerInfo.totalRides}
              size="md"
            />
            <div className="flex-1">
              <p className="font-semibold">{passengerInfo.name}</p>
              <p className="text-xs text-muted-foreground">
                {passengerInfo.totalRides} viagens
              </p>
            </div>
            {passengerInfo.phone && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`tel:${passengerInfo.phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`https://wa.me/55${passengerInfo.phone?.replace(/\D/g, '')}`)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Route Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm line-clamp-2">{ride.origin_address}</span>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm line-clamp-2">{ride.destination_address}</span>
          </div>
        </div>

        {/* Price & Distance */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">
              {ride.distance_km?.toFixed(1)} km
            </p>
            <p className="text-2xl font-bold text-green-600">
              R$ {ride.estimated_price?.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Decline silently */}}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Aceitar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
