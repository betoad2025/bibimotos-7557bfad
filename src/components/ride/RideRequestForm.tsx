import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useRideService } from '@/hooks/useRideService';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Bike, Package, Pill, MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type ServiceType = Database['public']['Enums']['service_type'];

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface CityInfo {
  lat: number;
  lng: number;
  name: string;
  state: string;
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

const CITY_RADIUS_KM = 30;

// Haversine distance in km
function haversineDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [originOutOfBounds, setOriginOutOfBounds] = useState(false);
  const [destinationOutOfBounds, setDestinationOutOfBounds] = useState(false);
  const [autoLocating, setAutoLocating] = useState(false);

  const { loading, calculatePrice, createRide } = useRideService();
  const { getCurrentLocation, reverseGeocode } = useGoogleMaps();

  // Fetch city info for this franchise
  useEffect(() => {
    const fetchCityInfo = async () => {
      const { data: franchise } = await supabase
        .from('franchises')
        .select('cities(name, state, lat, lng)')
        .eq('id', franchiseId)
        .single();

      if (franchise?.cities) {
        const city = franchise.cities as unknown as CityInfo;
        if (city.lat && city.lng) {
          setCityInfo(city);
        }
      }
    };
    fetchCityInfo();
  }, [franchiseId]);

  // Auto-detect location on mount
  useEffect(() => {
    if (!cityInfo) return;

    const autoDetect = async () => {
      setAutoLocating(true);
      try {
        const coords = await getCurrentLocation();
        if (coords) {
          const dist = haversineDistance(coords, { lat: cityInfo.lat, lng: cityInfo.lng });
          if (dist <= CITY_RADIUS_KM) {
            const address = await reverseGeocode(coords.lat, coords.lng);
            if (address) {
              setOriginText(address);
              setOrigin({ ...coords, address });
              setOriginOutOfBounds(false);
            }
          }
        }
      } catch (err) {
        console.log('Auto-detect location failed:', err);
      } finally {
        setAutoLocating(false);
      }
    };
    autoDetect();
  }, [cityInfo, getCurrentLocation, reverseGeocode]);

  // Validate location is within city bounds
  const validateBounds = useCallback((loc: Location, type: 'origin' | 'destination') => {
    if (!cityInfo) return true;
    const dist = haversineDistance(loc, { lat: cityInfo.lat, lng: cityInfo.lng });
    const outOfBounds = dist > CITY_RADIUS_KM;
    if (type === 'origin') setOriginOutOfBounds(outOfBounds);
    else setDestinationOutOfBounds(outOfBounds);
    return !outOfBounds;
  }, [cityInfo]);

  // Calculate price when both addresses are set and valid
  useEffect(() => {
    if (origin && destination && !originOutOfBounds && !destinationOutOfBounds) {
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
  }, [origin, destination, franchiseId, calculatePrice, originOutOfBounds, destinationOutOfBounds]);

  const handleOriginSelect = (loc: Location) => {
    setOrigin(loc);
    setOriginText(loc.address);
    validateBounds(loc, 'origin');
  };

  const handleDestinationSelect = (loc: Location) => {
    setDestination(loc);
    setDestinationText(loc.address);
    validateBounds(loc, 'destination');
  };

  const handleUseMyLocation = async () => {
    setAutoLocating(true);
    try {
      const coords = await getCurrentLocation();
      if (coords) {
        const address = await reverseGeocode(coords.lat, coords.lng);
        if (address) {
          const loc = { ...coords, address };
          setOriginText(address);
          setOrigin(loc);
          validateBounds(loc, 'origin');
        }
      }
    } finally {
      setAutoLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!origin || !destination || originOutOfBounds || destinationOutOfBounds) return;

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

  const canSubmit = origin && destination && !loading && !calculating && !originOutOfBounds && !destinationOutOfBounds;
  const anyOutOfBounds = originOutOfBounds || destinationOutOfBounds;

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-primary" />
          Para onde você vai?
        </CardTitle>
        {cityInfo && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Área de cobertura: {cityInfo.name} - {cityInfo.state}
          </p>
        )}
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
            onSelect={handleOriginSelect}
            placeholder="Onde você está?"
            icon="origin"
            showCurrentLocation
            cityBias={cityInfo}
          />
          {originOutOfBounds && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Endereço fora da área de cobertura de {cityInfo?.name}
            </p>
          )}
        </div>

        {/* Use my location button */}
        {!origin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleUseMyLocation}
            disabled={autoLocating}
          >
            {autoLocating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Usar minha localização atual
          </Button>
        )}

        {/* Destination Input */}
        <div className="space-y-2">
          <Label>Destino</Label>
          <AddressAutocomplete
            value={destinationText}
            onChange={setDestinationText}
            onSelect={handleDestinationSelect}
            placeholder="Para onde você vai?"
            icon="destination"
            cityBias={cityInfo}
          />
          {destinationOutOfBounds && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Endereço fora da área de cobertura de {cityInfo?.name}
            </p>
          )}
        </div>

        {/* Out of bounds alert */}
        {anyOutOfBounds && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Endereço fora da área de cobertura. O serviço está disponível apenas na região de {cityInfo?.name} - {cityInfo?.state}.
            </AlertDescription>
          </Alert>
        )}

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
