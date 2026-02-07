import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Phone, Shield, Car, Heart, Navigation, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SOSButtonProps {
  rideId?: string;
  deliveryId?: string;
  franchiseId: string;
  reporterType: "driver" | "passenger" | "merchant";
  variant?: "default" | "floating";
}

export function SOSButton({ 
  rideId, 
  deliveryId, 
  franchiseId, 
  reporterType,
  variant = "default" 
}: SOSButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const alertTypes = [
    { id: "sos", label: "SOS - Socorro!", icon: AlertTriangle, color: "bg-red-500" },
    { id: "accident", label: "Acidente", icon: Car, color: "bg-orange-500" },
    { id: "threat", label: "Me sinto ameaçado", icon: Shield, color: "bg-red-600" },
    { id: "medical", label: "Emergência Médica", icon: Heart, color: "bg-pink-500" },
    { id: "route_deviation", label: "Desvio de Rota", icon: Navigation, color: "bg-yellow-500" },
    { id: "other", label: "Outro Problema", icon: HelpCircle, color: "bg-gray-500" },
  ];

  const handleOpen = () => {
    setIsOpen(true);
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("emergency_alerts").insert({
        ride_id: rideId || null,
        delivery_id: deliveryId || null,
        franchise_id: franchiseId,
        reporter_user_id: user.id,
        reporter_type: reporterType,
        alert_type: selectedType,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
        description: description || null,
      });

      if (error) throw error;

      toast.success("Alerta enviado! A central já foi notificada.", {
        duration: 5000,
      });
      
      setIsOpen(false);
      setSelectedType(null);
      setDescription("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar alerta");
    }
    setIsSubmitting(false);
  };

  if (variant === "floating") {
    return (
      <>
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all animate-pulse"
        >
          <AlertTriangle className="h-8 w-8" />
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Precisa de Ajuda?
              </DialogTitle>
              <DialogDescription>
                Selecione o tipo de emergência. A central será notificada imediatamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {alertTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedType === type.id
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full ${type.color} text-white flex items-center justify-center mx-auto mb-2`}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-center">{type.label}</p>
                  </button>
                ))}
              </div>

              {selectedType && (
                <Textarea
                  placeholder="Descreva a situação (opcional)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open("tel:190", "_self")}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar 190
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleSubmit}
                  disabled={!selectedType || isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Alerta"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        onClick={handleOpen}
        className="bg-red-500 hover:bg-red-600"
      >
        <AlertTriangle className="h-5 w-5 mr-2" />
        SOS - Preciso de Ajuda
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Precisa de Ajuda?
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de emergência. A central será notificada imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {alertTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedType === type.id
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full ${type.color} text-white flex items-center justify-center mx-auto mb-2`}>
                    <type.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-center">{type.label}</p>
                </button>
              ))}
            </div>

            {selectedType && (
              <Textarea
                placeholder="Descreva a situação (opcional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open("tel:190", "_self")}
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar 190
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleSubmit}
                disabled={!selectedType || isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Alerta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
