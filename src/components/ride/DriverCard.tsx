import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Phone, MessageCircle, MapPin, Car, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DriverCardProps {
  driver: {
    name: string;
    avatarUrl?: string | null;
    rating: number;
    totalRides: number;
    phone?: string;
    vehicleModel?: string;
    vehiclePlate?: string;
    vehicleColor?: string;
  };
  showActions?: boolean;
  onCall?: () => void;
  onMessage?: () => void;
}

export function DriverCard({ driver, showActions = true, onCall, onMessage }: DriverCardProps) {
  return (
    <Card className="p-4 border-2">
      <div className="flex items-start gap-4">
        <UserAvatar
          avatarUrl={driver.avatarUrl}
          name={driver.name}
          rating={driver.rating}
          totalRides={driver.totalRides}
          size="lg"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg truncate">{driver.name}</h3>
            <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Car className="h-4 w-4" />
            <span>{driver.vehicleModel || "Moto"}</span>
            {driver.vehicleColor && <span>• {driver.vehicleColor}</span>}
          </div>
          
          {driver.vehiclePlate && (
            <div className="mt-2 inline-block bg-yellow-400 text-black px-3 py-1 rounded font-mono font-bold text-sm">
              {driver.vehiclePlate}
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onCall}
          >
            <Phone className="h-4 w-4 mr-2" />
            Ligar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onMessage}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Mensagem
          </Button>
        </div>
      )}
    </Card>
  );
}
