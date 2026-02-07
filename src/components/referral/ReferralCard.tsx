import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<{
    code: string;
    total_referrals: number;
    total_earned: number;
    referral_bonus: number;
    referee_bonus: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralCode();
    }
  }, [user]);

  const fetchReferralCode = async () => {
    try {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setReferralCode(data);
    } catch (error) {
      console.error("Error fetching referral code:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      toast({ title: "Código copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const shareViaWhatsApp = () => {
    if (!referralCode) return;
    const text = `Use meu código ${referralCode.code} e ganhe R$ ${referralCode.referee_bonus} de desconto na sua primeira corrida! Baixe o app agora.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!referralCode) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6" />
          <h3 className="font-bold text-lg">Indique e Ganhe!</h3>
        </div>
        <p className="text-sm opacity-90 mt-1">
          Ganhe R$ {referralCode.referral_bonus} para cada amigo que usar seu código
        </p>
      </div>

      <CardContent className="p-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Seu código de indicação</p>
          <div className="flex gap-2">
            <Input
              value={referralCode.code}
              readOnly
              className="text-center font-mono font-bold text-lg"
            />
            <Button size="icon" variant="outline" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-2xl font-bold">{referralCode.total_referrals}</p>
            <p className="text-xs text-muted-foreground">Indicações</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">R$ {referralCode.total_earned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Ganho</p>
          </div>
        </div>

        <Button onClick={shareViaWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
          Compartilhar no WhatsApp
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Seu amigo ganha R$ {referralCode.referee_bonus} na primeira corrida
        </p>
      </CardContent>
    </Card>
  );
}
