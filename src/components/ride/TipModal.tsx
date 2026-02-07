import { useState } from "react";
import { Heart, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TipModalProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  driverId: string;
  passengerId: string;
  franchiseId: string;
  driverName: string;
}

const TIP_OPTIONS = [2, 5, 10, 20];

export function TipModal({
  open,
  onClose,
  rideId,
  driverId,
  passengerId,
  franchiseId,
  driverName,
}: TipModalProps) {
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTip = async () => {
    const tipAmount = selectedTip || parseFloat(customTip);
    if (!tipAmount || tipAmount <= 0) {
      toast({
        title: "Selecione um valor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert tip transaction
      const { error: tipError } = await supabase.from("tip_transactions").insert({
        ride_id: rideId,
        driver_id: driverId,
        passenger_id: passengerId,
        franchise_id: franchiseId,
        amount: tipAmount,
      });

      if (tipError) throw tipError;

      // Update ride with tip amount
      const { error: rideError } = await supabase
        .from("rides")
        .update({ tip_amount: tipAmount, tip_paid_at: new Date().toISOString() })
        .eq("id", rideId);

      if (rideError) throw rideError;

      toast({
        title: "Gorjeta enviada! 💚",
        description: `R$ ${tipAmount.toFixed(2)} enviado para ${driverName}`,
      });
      onClose();
    } catch (error) {
      console.error("Error sending tip:", error);
      toast({
        title: "Erro ao enviar gorjeta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Heart className="h-5 w-5 text-red-500" />
            Dar Gorjeta
          </DialogTitle>
          <DialogDescription className="text-center">
            Gostou da corrida com {driverName}? Deixe uma gorjeta!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {TIP_OPTIONS.map((amount) => (
              <Button
                key={amount}
                variant={selectedTip === amount ? "default" : "outline"}
                onClick={() => {
                  setSelectedTip(amount);
                  setCustomTip("");
                }}
                className="h-14"
              >
                R$ {amount}
              </Button>
            ))}
          </div>

          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              placeholder="Outro valor"
              value={customTip}
              onChange={(e) => {
                setCustomTip(e.target.value);
                setSelectedTip(null);
              }}
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-center text-lg"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Não, obrigado
            </Button>
            <Button
              onClick={handleTip}
              disabled={loading || (!selectedTip && !customTip)}
              className="flex-1"
            >
              {loading ? "Enviando..." : "Enviar Gorjeta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
