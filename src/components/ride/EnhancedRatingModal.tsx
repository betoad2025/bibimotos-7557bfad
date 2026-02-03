import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface EnhancedRatingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  userName: string;
  userAvatar?: string | null;
  userRating?: number;
  userTotalRides?: number;
  userType: "driver" | "passenger";
  ridePrice?: number;
  rideDistance?: number;
}

export function EnhancedRatingModal({ 
  open, 
  onClose, 
  onSubmit, 
  userName, 
  userAvatar,
  userRating,
  userTotalRides,
  userType,
  ridePrice,
  rideDistance,
}: EnhancedRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, comment || undefined);
    onClose();
  };

  const getRatingText = (r: number) => {
    switch (r) {
      case 5: return "Excelente! 🌟";
      case 4: return "Muito bom! 👍";
      case 3: return "Regular 😐";
      case 2: return "Ruim 😕";
      case 1: return "Muito ruim 😞";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Como foi sua viagem?
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* User Info */}
          <div className="flex flex-col items-center gap-2">
            <UserAvatar
              avatarUrl={userAvatar}
              name={userName}
              rating={userRating}
              totalRides={userTotalRides}
              size="xl"
              showRating={false}
            />
            <p className="font-semibold text-lg">{userName}</p>
            <p className="text-sm text-muted-foreground">
              {userType === "driver" ? "Motorista" : "Passageiro"}
            </p>
          </div>

          {/* Ride Summary */}
          {(ridePrice || rideDistance) && (
            <div className="flex gap-6 text-center">
              {rideDistance && (
                <div>
                  <p className="text-2xl font-bold">{rideDistance.toFixed(1)} km</p>
                  <p className="text-xs text-muted-foreground">Distância</p>
                </div>
              )}
              {ridePrice && (
                <div>
                  <p className="text-2xl font-bold text-primary">R$ {ridePrice.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              )}
            </div>
          )}
          
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-lg font-medium text-primary">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Optional Comment */}
          <div className="w-full space-y-2">
            <Textarea
              placeholder="Deixe um comentário (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Pular
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-primary">
              Avaliar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
