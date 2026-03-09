import { UserWalletCard } from "@/components/wallet/UserWalletCard";

export function PassengerWalletTab() {
  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-xl font-bold">Carteira</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu saldo e transações
        </p>
      </div>
      <UserWalletCard />
    </div>
  );
}
