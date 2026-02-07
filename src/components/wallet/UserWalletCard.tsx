import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
}

interface UserWallet {
  id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  referral_bonus: { label: "Bônus de Indicação", color: "text-green-500" },
  promotional_credit: { label: "Crédito Promocional", color: "text-purple-500" },
  ride_payment: { label: "Pagamento de Corrida", color: "text-red-500" },
  refund: { label: "Reembolso", color: "text-blue-500" },
  subscription: { label: "Assinatura", color: "text-orange-500" },
  tip_refund: { label: "Reembolso de Gorjeta", color: "text-yellow-500" },
};

export function UserWalletCard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (walletError && walletError.code !== "PGRST116") throw walletError;
      setWallet(walletData);

      if (walletData) {
        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", walletData.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (txError) throw txError;
        setTransactions(txData || []);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Minha Carteira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
          <p className="text-sm opacity-80">Saldo disponível</p>
          <p className="text-3xl font-bold">R$ {wallet.balance.toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <ArrowDownLeft className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Recebido</p>
              <p className="font-semibold text-green-600">R$ {wallet.total_earned.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <ArrowUpRight className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Usado</p>
              <p className="font-semibold text-red-600">R$ {wallet.total_spent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <History className="h-4 w-4" />
              Ver Extrato
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Extrato da Carteira</SheetTitle>
              <SheetDescription>Histórico de transações</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-full mt-4 pr-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const typeInfo = TYPE_LABELS[tx.type] || {
                      label: tx.type,
                      color: "text-gray-500",
                    };
                    const isPositive = tx.amount > 0;

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              isPositive ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.description ||
                                format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? "+" : ""}R$ {Math.abs(tx.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: R$ {tx.balance_after.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
