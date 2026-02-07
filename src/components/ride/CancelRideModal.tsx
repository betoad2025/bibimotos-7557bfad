import { useState } from "react";
import { XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CancelRideModalProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  isDriver: boolean;
  onCancelled: () => void;
}

const PASSENGER_REASONS = [
  { value: "changed_mind", label: "Mudei de ideia" },
  { value: "found_alternative", label: "Encontrei outra alternativa" },
  { value: "driver_delay", label: "Motorista demorou muito" },
  { value: "wrong_address", label: "Endereço errado" },
  { value: "other", label: "Outro motivo" },
];

const DRIVER_REASONS = [
  { value: "passenger_not_found", label: "Passageiro não encontrado" },
  { value: "safety_concern", label: "Preocupação com segurança" },
  { value: "vehicle_issue", label: "Problema no veículo" },
  { value: "wrong_location", label: "Localização errada" },
  { value: "other", label: "Outro motivo" },
];

export function CancelRideModal({
  open,
  onClose,
  rideId,
  isDriver,
  onCancelled,
}: CancelRideModalProps) {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reasons = isDriver ? DRIVER_REASONS : PASSENGER_REASONS;

  const handleCancel = async () => {
    if (!reason) {
      toast({
        title: "Selecione um motivo",
        variant: "destructive",
      });
      return;
    }

    const finalReason = reason === "other" ? otherReason : reasons.find(r => r.value === reason)?.label;

    if (reason === "other" && !otherReason.trim()) {
      toast({
        title: "Descreva o motivo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("rides")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: isDriver ? "driver" : "passenger",
          cancellation_reason: finalReason,
        })
        .eq("id", rideId);

      if (error) throw error;

      toast({
        title: "Corrida cancelada",
        description: "A corrida foi cancelada com sucesso",
      });
      onCancelled();
      onClose();
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast({
        title: "Erro ao cancelar",
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancelar Corrida
          </DialogTitle>
          <DialogDescription>
            Por favor, informe o motivo do cancelamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Cancelamentos frequentes podem afetar sua reputação</span>
          </div>

          <RadioGroup value={reason} onValueChange={setReason}>
            {reasons.map((r) => (
              <div key={r.value} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="flex-1 cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason === "other" && (
            <Textarea
              placeholder="Descreva o motivo..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              rows={3}
            />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading || !reason}
              className="flex-1"
            >
              {loading ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
