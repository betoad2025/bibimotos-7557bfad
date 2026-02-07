import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RideMapTrackerProps {
  rideId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  driverLat?: number | null;
  driverLng?: number | null;
  status: string;
}

export function RideMapTracker({
  rideId,
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  driverLat,
  driverLng,
  status,
}: RideMapTrackerProps) {
  const [currentDriverLat, setCurrentDriverLat] = useState(driverLat);
  const [currentDriverLng, setCurrentDriverLng] = useState(driverLng);
  const [eta, setEta] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Subscribe to driver location updates
  useEffect(() => {
    const channel = supabase
      .channel(`ride-location-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.driver_current_lat && newData.driver_current_lng) {
            setCurrentDriverLat(newData.driver_current_lat);
            setCurrentDriverLng(newData.driver_current_lng);
            setLastUpdate(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  // Calculate ETA
  useEffect(() => {
    if (currentDriverLat && currentDriverLng) {
      const targetLat = status === "accepted" ? originLat : destinationLat;
      const targetLng = status === "accepted" ? originLng : destinationLng;

      // Simple distance calculation (Haversine)
      const R = 6371; // Earth radius in km
      const dLat = ((targetLat - currentDriverLat) * Math.PI) / 180;
      const dLon = ((targetLng - currentDriverLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((currentDriverLat * Math.PI) / 180) *
          Math.cos((targetLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Assume average speed of 30 km/h in urban areas
      const timeInMinutes = Math.round((distance / 30) * 60);
      
      if (timeInMinutes < 1) {
        setEta("Chegando!");
      } else if (timeInMinutes === 1) {
        setEta("1 minuto");
      } else {
        setEta(`${timeInMinutes} minutos`);
      }
    }
  }, [currentDriverLat, currentDriverLng, originLat, originLng, destinationLat, destinationLng, status]);

  // Generate static map URL (using OpenStreetMap tiles via a simple embed)
  const getMapUrl = () => {
    const dLat = currentDriverLat || originLat;
    const dLng = currentDriverLng || originLng;
    
    // Center between origin and destination
    const centerLat = (originLat + destinationLat) / 2;
    const centerLng = (originLng + destinationLng) / 2;
    
    // Calculate zoom based on distance
    const latDiff = Math.abs(originLat - destinationLat);
    const lngDiff = Math.abs(originLng - destinationLng);
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 14;
    if (maxDiff > 0.1) zoom = 12;
    if (maxDiff > 0.2) zoom = 11;
    if (maxDiff > 0.5) zoom = 10;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.02},${centerLat - 0.02},${centerLng + 0.02},${centerLat + 0.02}&layer=mapnik&marker=${dLat},${dLng}`;
  };

  const getStatusMessage = () => {
    switch (status) {
      case "accepted":
        return "Motorista indo até você";
      case "in_progress":
        return "Viagem em andamento";
      case "completed":
        return "Viagem concluída";
      default:
        return "Aguardando motorista";
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Map Container */}
      <div className="relative h-48 bg-muted">
        <iframe
          src={getMapUrl()}
          className="w-full h-full border-0"
          title="Mapa da corrida"
          loading="lazy"
        />
        
        {/* Overlay with status */}
        <div className="absolute top-2 left-2 right-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full animate-pulse ${
                status === "in_progress" ? "bg-green-500" : "bg-blue-500"
              }`} />
              <span className="text-sm font-medium">{getStatusMessage()}</span>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 shadow-lg"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        {/* ETA Display */}
        {eta && (status === "accepted" || status === "in_progress") && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {status === "accepted" ? "Chegada estimada" : "Tempo restante"}
              </span>
            </div>
            <span className="text-xl font-bold text-primary">{eta}</span>
          </div>
        )}

        {/* Route Points */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Origem</p>
              <p className="text-sm truncate font-medium">
                {originLat.toFixed(4)}, {originLng.toFixed(4)}
              </p>
            </div>
          </div>
          
          <div className="ml-4 border-l-2 border-dashed border-muted h-4" />
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Destino</p>
              <p className="text-sm truncate font-medium">
                {destinationLat.toFixed(4)}, {destinationLng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Last update indicator */}
        {currentDriverLat && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
