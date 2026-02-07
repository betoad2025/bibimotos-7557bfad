import { useState } from "react";
import { CreditCard, QrCode, Banknote, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InAppPaymentProps {
  open: boolean;
  onClose: () => void;
  rideId: string;
  amount: number;
  onPaymentComplete: (method: string) => void;
}

type PaymentMethod = "cash" | "pix" | "card" | "wallet";

export function InAppPayment({
  open,
  onClose,
  rideId,
  amount,
  onPaymentComplete,
}: InAppPaymentProps) {
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      if (method === "cash") {
        // Cash payment - just mark as pending cash
        await supabase
          .from("rides")
          .update({ 
            payment_method: "cash",
            payment_status: "pending_cash"
          })
          .eq("id", rideId);

        toast({
          title: "Pagamento em dinheiro",
          description: "Pague diretamente ao motorista",
        });
        onPaymentComplete("cash");
        onClose();
        return;
      }

      if (method === "pix") {
        // Generate PIX code (mock - in production would call payment gateway)
        const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${amount.toFixed(2)}5802BR5913BIBI MOTOS6008SAOPAULO62070503***6304`;
        setPixCode(mockPixCode);
        
        await supabase
          .from("rides")
          .update({ 
            payment_method: "pix",
            payment_status: "pending"
          })
          .eq("id", rideId);

        toast({
          title: "PIX gerado!",
          description: "Copie o código e pague no app do seu banco",
        });
        return;
      }

      if (method === "wallet") {
        // Use wallet balance
        const { data: wallet } = await supabase
          .from("user_wallets")
          .select("balance")
          .single();

        if (!wallet || wallet.balance < amount) {
          toast({
            title: "Saldo insuficiente",
            description: "Seu saldo na carteira não é suficiente",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Deduct from wallet
        await supabase.rpc("process_wallet_payment", {
          p_ride_id: rideId,
          p_amount: amount,
        });

        toast({
          title: "Pagamento realizado!",
          description: `R$ ${amount.toFixed(2)} debitado da sua carteira`,
        });
        onPaymentComplete("wallet");
        onClose();
        return;
      }

      // Card payment would integrate with payment gateway
      toast({
        title: "Cartão",
        description: "Pagamento por cartão será implementado em breve",
      });
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Erro no pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixCode) {
      await navigator.clipboard.writeText(pixCode);
      toast({ title: "Código PIX copiado!" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription>
            Valor da corrida: <span className="font-bold text-lg">R$ {amount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        {!pixCode ? (
          <div className="space-y-4">
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <div className="grid gap-3">
                <Label
                  htmlFor="pix"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    method === "pix" ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <RadioGroupItem value="pix" id="pix" />
                  <QrCode className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">PIX</p>
                    <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </Label>

                <Label
                  htmlFor="wallet"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    method === "wallet" ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <RadioGroupItem value="wallet" id="wallet" />
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-medium">Saldo da Carteira</p>
                    <p className="text-xs text-muted-foreground">Use seus créditos</p>
                  </div>
                </Label>

                <Label
                  htmlFor="cash"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    method === "cash" ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="h-5 w-5 text-green-700" />
                  <div className="flex-1">
                    <p className="font-medium">Dinheiro</p>
                    <p className="text-xs text-muted-foreground">Pague ao motorista</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <Button onClick={handlePayment} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {method === "cash" ? "Pagar em Dinheiro" : "Continuar"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Código PIX Copia e Cola:</p>
              <p className="text-xs break-all font-mono bg-background p-2 rounded border">
                {pixCode}
              </p>
            </div>

            <Button onClick={copyPixCode} className="w-full">
              Copiar Código PIX
            </Button>

            <Button 
              variant="outline" 
              onClick={() => {
                onPaymentComplete("pix");
                onClose();
              }} 
              className="w-full"
            >
              Já paguei
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
