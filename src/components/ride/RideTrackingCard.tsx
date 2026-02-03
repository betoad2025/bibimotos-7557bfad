import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/profile/UserAvatar';
import { DriverCard } from './DriverCard';
import { useRideService } from '@/hooks/useRideService';
import { MapPin, Navigation, Clock, Phone, MessageCircle, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import type { RideData, DriverInfo, PassengerInfo } from '@/hooks/useRideRealtime';

interface RideTrackingCardProps {
  ride: RideData;
  driver: DriverInfo | null;
  passenger?: PassengerInfo | null;
  isDriver?: boolean;
  onCancel?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onRate?: () => void;
}

export function RideTrackingCard({
  ride,
  driver,
  passenger,
  isDriver = false,
  onCancel,
  onStart,
  onComplete,
  onRate,
}: RideTrackingCardProps) {
  const { loading, cancelRide, startRide } = useRideService();

  const handleCancel = async () => {
    const success = await cancelRide(ride.id);
    if (success && onCancel) {
      onCancel();
    }
  };

  const handleStart = async () => {
    const success = await startRide(ride.id);
    if (success && onStart) {
      onStart();
    }
  };

  const getStatusInfo = () => {
    switch (ride.status) {
      case 'pending':
        return {
          title: '🔍 Buscando motorista...',
          color: 'border-yellow-500',
          textColor: 'text-yellow-600',
        };
      case 'accepted':
        return {
          title: '🏍️ Motorista a caminho!',
          color: 'border-green-500',
          textColor: 'text-green-600',
        };
      case 'in_progress':
        return {
          title: '🚀 Em viagem',
          color: 'border-blue-500',
          textColor: 'text-blue-600',
        };
      case 'completed':
        return {
          title: '✅ Corrida finalizada',
          color: 'border-green-500',
          textColor: 'text-green-600',
        };
      case 'cancelled':
        return {
          title: '❌ Corrida cancelada',
          color: 'border-red-500',
          textColor: 'text-red-600',
        };
      default:
        return {
          title: 'Corrida',
          color: 'border-muted',
          textColor: 'text-muted-foreground',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className={`border-2 ${statusInfo.color}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-lg ${statusInfo.textColor}`}>
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* For passenger: Show driver info */}
          {!isDriver && driver && ride.status !== 'pending' && (
            <DriverCard
              driver={{
                name: driver.name,
                avatarUrl: driver.avatarUrl,
                rating: driver.rating,
                totalRides: driver.totalRides,
                phone: driver.phone || undefined,
                vehicleModel: driver.vehicleModel || undefined,
                vehiclePlate: driver.vehiclePlate || undefined,
                vehicleColor: driver.vehicleColor || undefined,
              }}
              onCall={() => driver.phone && window.open(`tel:${driver.phone}`)}
              onMessage={() => driver.phone && window.open(`https://wa.me/55${driver.phone.replace(/\D/g, '')}`)}
            />
          )}

          {/* For driver: Show passenger info */}
          {isDriver && passenger && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <UserAvatar
                avatarUrl={passenger.avatarUrl}
                name={passenger.name}
                rating={passenger.rating}
                totalRides={passenger.totalRides}
                size="lg"
              />
              <div className="flex-1">
                <p className="font-semibold text-lg">{passenger.name}</p>
                <p className="text-sm text-muted-foreground">
                  {passenger.totalRides} viagens
                </p>
              </div>
              {passenger.phone && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${passenger.phone}`)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Ligar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/55${passenger.phone?.replace(/\D/g, '')}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Msg
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Searching animation */}
          {ride.status === 'pending' && !isDriver && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Aguarde, estamos buscando...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Card */}
      <Card className="border-2">
        <CardContent className="py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="font-medium">{ride.origin_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="font-medium">{ride.destination_address}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Card */}
      <Card className="border-2">
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {ride.distance_km?.toFixed(1)} km
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-primary">
                R$ {(ride.final_price || ride.estimated_price)?.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {ride.status !== 'completed' && ride.status !== 'cancelled' && (
        <div className="flex gap-3">
          {/* Cancel button - always available before completion */}
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>

          {/* For driver: Start ride button */}
          {isDriver && ride.status === 'accepted' && (
            <Button
              className="flex-1"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Iniciar Corrida
            </Button>
          )}

          {/* For passenger: Confirm boarding */}
          {!isDriver && ride.status === 'accepted' && (
            <Button
              className="flex-1"
              onClick={handleStart}
              disabled={loading}
            >
              Embarquei
            </Button>
          )}

          {/* Complete ride button */}
          {ride.status === 'in_progress' && (
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={onComplete}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          )}
        </div>
      )}

      {/* Rate button after completion */}
      {ride.status === 'completed' && onRate && (
        <Button
          className="w-full"
          onClick={onRate}
        >
          ⭐ Avaliar {isDriver ? 'Passageiro' : 'Motorista'}
        </Button>
      )}

      {/* Emergency button */}
      <Button
        variant="ghost"
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Emergência / Suporte
      </Button>
    </div>
  );
}
