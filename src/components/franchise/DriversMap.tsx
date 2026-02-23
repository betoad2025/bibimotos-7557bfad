import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const onlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const offlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Driver {
  id: string;
  current_lat: number | null;
  current_lng: number | null;
  is_online: boolean;
  vehicle_model: string;
  vehicle_plate: string;
  rating: number;
  credits: number;
  profiles?: { full_name?: string; phone?: string } | null;
}

interface DriversMapProps {
  drivers: Driver[];
  cityLat?: number;
  cityLng?: number;
}

export function DriversMap({ drivers, cityLat, cityLng }: DriversMapProps) {
  const driversWithLocation = useMemo(
    () => drivers.filter((d) => d.current_lat && d.current_lng),
    [drivers]
  );

  const center = useMemo(() => {
    if (cityLat && cityLng) return [cityLat, cityLng] as [number, number];
    if (driversWithLocation.length > 0) {
      const avgLat = driversWithLocation.reduce((s, d) => s + d.current_lat!, 0) / driversWithLocation.length;
      const avgLng = driversWithLocation.reduce((s, d) => s + d.current_lng!, 0) / driversWithLocation.length;
      return [avgLat, avgLng] as [number, number];
    }
    return [-15.78, -47.93] as [number, number]; // Brasília default
  }, [driversWithLocation, cityLat, cityLng]);

  const onlineCount = driversWithLocation.filter((d) => d.is_online).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          <span>{onlineCount} online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
          <span>{driversWithLocation.length - onlineCount} offline</span>
        </div>
        <span className="text-muted-foreground">
          {driversWithLocation.length} com localização
        </span>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ height: 400 }}>
        {driversWithLocation.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
            Nenhum motorista com localização disponível
          </div>
        ) : (
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {driversWithLocation.map((driver) => (
              <Marker
                key={driver.id}
                position={[driver.current_lat!, driver.current_lng!]}
                icon={driver.is_online ? onlineIcon : offlineIcon}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <p className="font-bold">{driver.profiles?.full_name || "Motorista"}</p>
                    <p>{driver.vehicle_model} • {driver.vehicle_plate}</p>
                    <p>⭐ {Number(driver.rating).toFixed(1)} • {driver.credits} créditos</p>
                    <p className={driver.is_online ? "text-green-600 font-medium" : "text-gray-500"}>
                      {driver.is_online ? "🟢 Online" : "⚫ Offline"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
