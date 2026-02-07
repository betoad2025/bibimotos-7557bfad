import { useState, useRef } from "react";
import { Camera, Shield, AlertCircle, Check } from "lucide-react";
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

interface DriverVerificationModalProps {
  open: boolean;
  onClose: () => void;
  driverId: string;
  onVerified: () => void;
}

export function DriverVerificationModal({
  open,
  onClose,
  driverId,
  onVerified,
}: DriverVerificationModalProps) {
  const [step, setStep] = useState<"instructions" | "camera" | "uploading" | "done">("instructions");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("camera");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Erro ao acessar câmera",
        description: "Permita o acesso à câmera para continuar",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setStep("uploading");
    setLoading(true);

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to create blob"));
        }, "image/jpeg", 0.8);
      });

      // Upload to storage
      const fileName = `verification_${driverId}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(`verifications/${fileName}`, blob, {
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(`verifications/${fileName}`);

      const url = urlData.publicUrl;
      setPhotoUrl(url);

      // Create verification record
      const { error: dbError } = await supabase.from("driver_verifications").insert({
        driver_id: driverId,
        verification_type: "selfie_daily",
        photo_url: url,
        status: "approved", // Auto-approve for now
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        verified_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      // Update driver last verification
      await supabase
        .from("drivers")
        .update({
          last_verification_at: new Date().toISOString(),
          requires_verification: false,
        })
        .eq("id", driverId);

      setStep("done");
      toast({ title: "Verificação concluída!" });
      
      setTimeout(() => {
        onVerified();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error uploading verification:", error);
      toast({
        title: "Erro ao enviar verificação",
        description: "Tente novamente",
        variant: "destructive",
      });
      setStep("instructions");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setStep("instructions");
    setPhotoUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificação Diária
          </DialogTitle>
          <DialogDescription>
            {step === "instructions" && "Tire uma selfie para confirmar sua identidade"}
            {step === "camera" && "Posicione seu rosto no centro da câmera"}
            {step === "uploading" && "Processando verificação..."}
            {step === "done" && "Verificação concluída!"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center min-h-[300px]">
          {step === "instructions" && (
            <div className="text-center space-y-4">
              <div className="h-24 w-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm">Para sua segurança, precisamos verificar sua identidade.</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Fique em um local bem iluminado</li>
                  <li>• Retire óculos de sol</li>
                  <li>• Mantenha o rosto visível</li>
                </ul>
              </div>
              <Button onClick={startCamera} className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Abrir Câmera
              </Button>
            </div>
          )}

          {step === "camera" && (
            <div className="w-full space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-white/30 rounded-full m-8 pointer-events-none" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button onClick={capturePhoto} className="w-full gap-2">
                <Camera className="h-4 w-4" />
                Tirar Foto
              </Button>
            </div>
          )}

          {step === "uploading" && (
            <div className="text-center space-y-4">
              <div className="h-24 w-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <p>Verificando sua identidade...</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="h-24 w-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">Verificação concluída!</p>
              <p className="text-sm text-muted-foreground">
                Você pode começar a aceitar corridas.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
