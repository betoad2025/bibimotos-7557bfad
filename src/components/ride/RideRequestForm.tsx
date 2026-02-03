import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useRideService } from '@/hooks/useRideService';
import { Loader2, Search, Bike, Package, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ServiceType = Database['public']['Enums']['service_type'];

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface RideRequestFormProps {
  franchiseId: string;
  passengerId: string;
  onRideCreated: (rideId: string) => void;
  className?: string;
}

const SERVICE_TYPES: { value: ServiceType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'ride', label: 'Mototáxi', icon: Bike, description: 'Transporte de passageiro' },
  { value: 'delivery', label: 'Entrega', icon: Package, description: 'Envio de pacotes' },
  { value: 'pharmacy', label: 'Farmácia', icon: Pill, description: 'Entrega de medicamentos' },
];

export function RideRequestForm({
  franchiseId,
  passengerId,
  onRideCreated,
  className,
}: RideRequestFormProps) {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>('ride');
  const [promoCode, setPromoCode] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const { loading, calculatePrice, createRide } = useRideService();

  // Calculate price when both addresses are set
  useEffect(() => {
    if (origin && destination) {
      setCalculating(true);
      calculatePrice(franchiseId, origin, destination)
        .then((result) => {
          if (result) {
            setEstimatedPrice(result.price);
            setDistance(result.distance);
            setDuration(result.duration);
          }
        })
        .finally(() => setCalculating(false));
    } else {
      setEstimatedPrice(null);
      setDistance(null);
      setDuration(null);
    }
  }, [origin, destination, franchiseId, calculatePrice]);

  const handleSubmit = async () => {
    if (!origin || !destination) return;

    const rideId = await createRide({
      franchiseId,
      passengerId,
      origin,
      destination,
      serviceType,
      promoCode: promoCode || undefined,
    });

    if (rideId) {
      onRideCreated(rideId);
    }
  };

  const canSubmit = origin && destination && !loading && !calculating;

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-primary" />
          Para onde você vai?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Type Selection */}
        <div className="grid grid-cols-3 gap-2">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setServiceType(type.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                serviceType === type.value
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <type.icon className={cn(
                'h-5 w-5',
                serviceType === type.value ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-xs font-medium',
                serviceType === type.value ? 'text-primary' : 'text-muted-foreground'
              )}>
                {type.label}
              </span>
            </button>
          ))}
        </div>

        {/* Origin Input */}
        <div className="space-y-2">
          <Label>Origem</Label>
          <AddressAutocomplete
            value={originText}
            onChange={setOriginText}
            onSelect={(loc) => {
              setOrigin(loc);
              setOriginText(loc.address);
            }}
            placeholder="Onde você está?"
            icon="origin"
            showCurrentLocation
          />
        </div>

        {/* Destination Input */}
        <div className="space-y-2">
          <Label>Destino</Label>
          <AddressAutocomplete
            value={destinationText}
            onChange={setDestinationText}
            onSelect={(loc) => {
              setDestination(loc);
              setDestinationText(loc.address);
            }}
            placeholder="Para onde você vai?"
            icon="destination"
          />
        </div>

        {/* Promo Code */}
        <div className="space-y-2">
          <Label>Cupom de desconto (opcional)</Label>
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="CODIGO"
            className="uppercase"
          />
        </div>

        {/* Price Estimate */}
        {(calculating || estimatedPrice !== null) && (
          <div className="p-4 bg-muted rounded-lg">
            {calculating ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Calculando...</span>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Valor estimado</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {estimatedPrice?.toFixed(2)}
                </p>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <span>{distance?.toFixed(1)} km</span>
                  <span>•</span>
                  <span>~{duration} min</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-5 w-5 mr-2" />
              Buscar Motorista
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
