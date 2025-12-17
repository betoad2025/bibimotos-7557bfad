import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  rating?: number | null;
  totalRides?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showRating?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

export function UserAvatar({ 
  avatarUrl, 
  name, 
  rating, 
  totalRides = 0, 
  size = "md",
  showRating = true 
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-1">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl || undefined} alt={name} className="object-cover" />
        <AvatarFallback className={`bg-primary text-primary-foreground ${textSizes[size]}`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showRating && rating !== null && rating !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({totalRides})</span>
        </div>
      )}
    </div>
  );
}
