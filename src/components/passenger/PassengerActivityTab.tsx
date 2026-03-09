import { RideHistory } from "@/components/ride/RideHistory";
import cityViewImage from "@/assets/passenger-city-view.jpg";

interface PassengerActivityTabProps {
  userId: string;
  passengerId: string;
}

export function PassengerActivityTab({ userId, passengerId }: PassengerActivityTabProps) {
  return (
    <div className="space-y-5 pb-4">
      {/* Hero — pessoas na cidade */}
      <div className="relative rounded-2xl overflow-hidden -mx-1">
        <img
          src={cityViewImage}
          alt="Pessoas em uma praça brasileira com motos — vida urbana"
          className="w-full h-32 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-bold text-primary-foreground drop-shadow-lg">
            Suas viagens
          </h1>
          <p className="text-xs text-primary-foreground/70 drop-shadow-md">
            Cada corrida conta uma história
          </p>
        </div>
      </div>

      <RideHistory
        userId={userId}
        userType="passenger"
        passengerId={passengerId}
      />
    </div>
  );
}
