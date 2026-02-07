import { useState } from "react";
import { Share2, Copy, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareRideButtonProps {
  rideId: string;
}

export function ShareRideButton({ rideId }: ShareRideButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const { toast } = useToast();

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_ride_share", {
        p_ride_id: rideId,
        p_recipient_name: recipientName || null,
        p_recipient_phone: recipientPhone || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; token?: string; error?: string };
      if (result.success && result.token) {
        const link = `${window.location.origin}/acompanhar/${result.token}`;
        setShareLink(link);
        toast({ title: "Link gerado com sucesso!" });
      } else {
        throw new Error(result.error || "Erro ao gerar link");
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      toast({
        title: "Erro ao gerar link",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    if (!shareLink) return;
    const text = `Acompanhe minha corrida em tempo real: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compartilhar Viagem
          </DialogTitle>
          <DialogDescription>
            Envie este link para um familiar ou amigo acompanhar sua viagem em tempo real.
          </DialogDescription>
        </DialogHeader>

        {!shareLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do destinatário (opcional)</Label>
              <Input
                id="name"
                placeholder="Ex: Mãe, Esposa..."
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>
            <Button onClick={generateShareLink} disabled={loading} className="w-full">
              {loading ? "Gerando..." : "Gerar Link de Acompanhamento"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={shareLink} readOnly className="flex-1 text-xs" />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={shareViaWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                Enviar via WhatsApp
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Link válido por 24 horas
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
