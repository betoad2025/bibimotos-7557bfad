import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { UserAvatar } from "@/components/profile/UserAvatar";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  userName: string;
  userAvatar?: string | null;
  userType: "driver" | "passenger";
}

export function RatingModal({ 
  open, 
  onClose, 
  onSubmit, 
  userName, 
  userAvatar,
  userType 
}: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = () => {
    onSubmit(rating);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Avalie o {userType === "driver" ? "Motorista" : "Passageiro"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <UserAvatar
            avatarUrl={userAvatar}
            name={userName}
            size="xl"
            showRating={false}
          />
          <p className="font-semibold text-lg">{userName}</p>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
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
          
          <p className="text-muted-foreground">
            {rating === 5 && "Excelente!"}
            {rating === 4 && "Muito bom!"}
            {rating === 3 && "Regular"}
            {rating === 2 && "Ruim"}
            {rating === 1 && "Muito ruim"}
          </p>

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
