import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Wallet, Plus, Check, Copy, Clock,
  QrCode, RefreshCw, Loader2, Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreditsShopProps {
  driverId: string;
  franchiseId: string;
  currentCredits: number;
  onCreditsUpdated: () => void;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "10", credits: 10, price: 10, bonus: 0 },
  { id: "25", credits: 25, price: 25, bonus: 0 },
  { id: "50", credits: 50, price: 45, bonus: 5, popular: true },
  { id: "100", credits: 100, price: 85, bonus: 15 },
  { id: "200", credits: 200, price: 160, bonus: 40 },
];

export function CreditsShop({ driverId, franchiseId, currentCredits, onCreditsUpdated }: CreditsShopProps) {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [minPurchase, setMinPurchase] = useState(10);

  // Load min_credit_purchase from franchise
  useEffect(() => {
    const loadMin = async () => {
      const { data } = await supabase
        .from("franchises")
        .select("min_credit_purchase")
        .eq("id", franchiseId)
        .maybeSingle();
      if (data && (data as any).min_credit_purchase) {
        setMinPurchase(Number((data as any).min_credit_purchase));
      }
    };
    loadMin();
  }, [franchiseId]);

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue > 0) {
      setSelectedPackage({
        id: "custom",
        credits: numValue,
        price: numValue,
        bonus: 0,
      });
      setCustomAmount(value);
    } else {
      setSelectedPackage(null);
      setCustomAmount(value);
    }
  };

  const handleGeneratePix = async () => {
    if (!selectedPackage) return;

    if (selectedPackage.price < minPurchase) {
      toast({
        title: "Valor abaixo do mínimo",
        description: `A recarga mínima é de R$ ${minPurchase.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Create credit transaction in pending state
      const { data: transaction, error: txError } = await supabase
        .from("credit_transactions")
        .insert({
          driver_id: driverId,
          franchise_id: franchiseId,
          amount: selectedPackage.credits + selectedPackage.bonus,
          type: "purchase",
          description: `Compra de ${selectedPackage.credits} créditos${selectedPackage.bonus > 0 ? ` + ${selectedPackage.bonus} bônus` : ""}`,
          payment_status: "pending",
        })
        .select()
        .single();

      if (txError) throw txError;

      setPaymentId(transaction.id);
      
      // Generate a mock PIX code (in production, call payment gateway API)
      const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136${transaction.id}5204000053039865404${selectedPackage.price.toFixed(2)}5802BR5913BIBI MOTOS6008BRASIL62070503***6304`;
      setPixCode(mockPixCode);
      setShowPayment(true);

      toast({
        title: "PIX gerado!",
        description: "Copie o código e pague para liberar seus créditos.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PIX",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleCopyPix = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar.",
      });
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentId) return;

    setCheckingPayment(true);
    try {
      // In production, check with payment gateway
      // For demo, simulate successful payment after button click
      
      // Update transaction status
      await supabase
        .from("credit_transactions")
        .update({ payment_status: "paid" })
        .eq("id", paymentId);

      // Update driver credits
      const { error: updateError } = await supabase
        .from("drivers")
        .update({ 
          credits: currentCredits + (selectedPackage?.credits || 0) + (selectedPackage?.bonus || 0)
        })
        .eq("id", driverId);

      if (updateError) throw updateError;

      toast({
        title: "Pagamento confirmado! 🎉",
        description: `${(selectedPackage?.credits || 0) + (selectedPackage?.bonus || 0)} créditos adicionados à sua conta.`,
      });

      setShowPayment(false);
      setPixCode(null);
      setPaymentId(null);
      setSelectedPackage(null);
      onCreditsUpdated();
    } catch (error: any) {
      toast({
        title: "Erro ao verificar pagamento",
        description: error.message,
        variant: "destructive",
      });
    }
    setCheckingPayment(false);
  };

  const handleCancelPayment = () => {
    setShowPayment(false);
    setPixCode(null);
    setPaymentId(null);
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Comprar Créditos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Balance */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className="text-3xl font-bold text-green-600">
                {currentCredits.toFixed(0)}
              </p>
            </div>
            <CreditCard className="h-10 w-10 text-green-500 opacity-50" />
          </div>

          {/* Credit Packages */}
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <Button
                key={pkg.id}
                variant={selectedPackage?.id === pkg.id ? "default" : "outline"}
                className={`h-auto py-3 px-4 flex flex-col items-center gap-1 relative ${
                  pkg.popular ? "border-primary" : ""
                }`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 -right-2 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
                <span className="text-xl font-bold">{pkg.credits}</span>
                <span className="text-xs text-muted-foreground">créditos</span>
                <span className="font-semibold">R$ {pkg.price.toFixed(0)}</span>
                {pkg.bonus > 0 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    +{pkg.bonus} bônus
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Valor personalizado"
                value={customAmount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                className="pl-9"
                min="1"
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              = R$ {customAmount || "0"}
            </span>
          </div>
          {minPurchase > 0 && (
            <p className="text-xs text-muted-foreground">
              Recarga mínima: <span className="font-semibold text-primary">R$ {minPurchase.toFixed(2)}</span>
            </p>
          )}

          {/* Buy Button */}
          <Button
            onClick={handleGeneratePix}
            disabled={!selectedPackage || loading}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando PIX...
              </>
            ) : (
              <>
                <QrCode className="h-5 w-5 mr-2" />
                Pagar com PIX
              </>
            )}
          </Button>

          {selectedPackage && (
            <p className="text-center text-sm text-muted-foreground">
              Você receberá{" "}
              <span className="font-bold text-primary">
                {selectedPackage.credits + selectedPackage.bonus} créditos
              </span>{" "}
              por R$ {selectedPackage.price.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Pague com PIX
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                R$ {selectedPackage?.price.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPackage?.credits} créditos
                {selectedPackage?.bonus ? ` + ${selectedPackage.bonus} bônus` : ""}
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
              <QrCode className="h-32 w-32 text-muted-foreground" />
            </div>

            {/* PIX Code */}
            <div className="relative">
              <Input
                value={pixCode || ""}
                readOnly
                className="pr-10 font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={handleCopyPix}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button onClick={handleCopyPix} variant="outline" className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copiado!" : "Copiar Código PIX"}
            </Button>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                O PIX expira em 30 minutos
              </p>
            </div>

            <Button
              onClick={handleCheckPayment}
              disabled={checkingPayment}
              className="w-full"
            >
              {checkingPayment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Já paguei
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleCancelPayment}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
