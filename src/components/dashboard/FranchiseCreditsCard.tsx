import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  History,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FranchiseCreditsCardProps {
  franchiseId: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  payment_status: string | null;
  created_at: string;
}

export function FranchiseCreditsCard({ franchiseId }: FranchiseCreditsCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [franchiseId]);

  const fetchData = async () => {
    try {
      // Fetch balance
      const { data: creditsData } = await supabase
        .from('franchise_credits')
        .select('balance')
        .eq('franchise_id', franchiseId)
        .single();

      if (creditsData) {
        setBalance(creditsData.balance);
      }

      // Fetch transactions
      const { data: txData } = await supabase
        .from('franchise_credit_transactions')
        .select('*')
        .eq('franchise_id', franchiseId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txData) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      // TODO: Integrar com gateway de pagamento (Woovi/Asaas)
      // Por enquanto, simular uma transação pendente
      toast({ 
        title: "Funcionalidade em desenvolvimento",
        description: "A integração com PIX será habilitada em breve."
      });
    } catch (error) {
      toast({ title: "Erro ao processar", variant: "destructive" });
    } finally {
      setProcessing(false);
      setShowRecharge(false);
      setRechargeAmount("");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'recharge': 'Recarga',
      'debit': 'Débito',
      'monthly_fee': 'Mensalidade',
      'bonus': 'Bônus',
      'adjustment': 'Ajuste'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">Saldo Disponível</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(balance)}</p>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet className="h-8 w-8" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog open={showRecharge} onOpenChange={setShowRecharge}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recarregar Créditos</DialogTitle>
                  <DialogDescription>
                    Adicione créditos via PIX para sua franquia
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Valor da Recarga</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[50, 100, 200, 500].map((value) => (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        onClick={() => setRechargeAmount(value.toString())}
                      >
                        R$ {value}
                      </Button>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleRecharge}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Gerar PIX
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Movimentações
          </CardTitle>
          <CardDescription>
            Últimas transações da sua franquia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma movimentação ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {getTransactionIcon(tx.type, tx.amount)}
                    </div>
                    <div>
                      <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tx.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </p>
                    {tx.payment_status && (
                      <Badge variant={tx.payment_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {tx.payment_status === 'completed' ? 'Concluído' : tx.payment_status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}