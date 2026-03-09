import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock, FileText, CheckCircle, LogOut } from "lucide-react";
import SuperAdminDashboard from "./dashboard/SuperAdminDashboard";
import FranchiseAdminDashboard from "./dashboard/FranchiseAdminDashboard";
import DriverDashboard from "./dashboard/DriverDashboard";
import PassengerDashboard from "./dashboard/PassengerDashboard";
import MerchantDashboard from "./dashboard/MerchantDashboard";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";
import { PushNotificationPrompt } from "@/components/pwa/PushNotificationPrompt";
import pendingHero from "@/assets/pending-hero.jpg";
import logoFull from "@/assets/logo-full.png";

export default function Dashboard() {
  const { user, loading, roles, isSuperAdmin, isFranchiseAdmin, isDriver, isPassenger, isMerchant, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={logoFull} alt="Bibi Motos" className="h-16 animate-pulse" />
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check profile completeness for non-super-admins
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || isSuperAdmin) {
      setProfileComplete(true);
      return;
    }
    const checkProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_complete, cpf, cnpj, phone, city, state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const isComplete = data.profile_complete === true || 
          ((data.cpf || data.cnpj) && data.phone && data.city && data.state);
        setProfileComplete(!!isComplete);
        if (isComplete && !data.profile_complete) {
          await supabase.from("profiles").update({ profile_complete: true }).eq("user_id", user.id);
        }
      } else {
        setProfileComplete(false);
      }
    };
    checkProfile();
  }, [user, isSuperAdmin]);

  // If profile is incomplete and user has a role, force them to complete registration
  if (profileComplete === false && roles.length > 0) {
    navigate("/complete-registration");
    return null;
  }

  // Route to appropriate dashboard based on role
  const dashboardContent = isSuperAdmin ? <SuperAdminDashboard /> :
    isFranchiseAdmin ? <FranchiseAdminDashboard /> :
    isDriver ? <DriverDashboard /> :
    isPassenger ? <PassengerDashboard /> :
    isMerchant ? <MerchantDashboard /> : null;

  if (dashboardContent) {
    return (
      <>
        <InstallAppBanner />
        <PushNotificationPrompt userId={user.id} />
        {dashboardContent}
      </>
    );
  }

  // Default: user without role - premium pending screen
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <img src={logoFull} alt="Bibi Motos" className="h-14 mb-10" />
          
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Cadastro em análise
              </h1>
              <p className="text-muted-foreground text-lg">
                Estamos verificando seus dados. Você receberá uma notificação assim que seu acesso for liberado.
              </p>
            </div>

            {/* Status steps */}
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Conta criada</p>
                  <p className="text-sm text-muted-foreground">Cadastro realizado com sucesso</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Em análise</p>
                  <p className="text-sm text-muted-foreground">Nosso time está verificando seus dados</p>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-40">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Acesso liberado</p>
                  <p className="text-sm text-muted-foreground">Dashboard completo disponível</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={() => navigate('/complete-registration')}
                className="w-full h-12 btn-gradient text-base rounded-xl font-semibold"
              >
                Completar cadastro
              </Button>
              <Button
                variant="ghost"
                onClick={async () => { await signOut(); navigate('/'); }}
                className="w-full gap-2 text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Hero image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={pendingHero}
          alt="Bibi Motos - Mobilidade urbana"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">
            Bibi Motos <span className="text-accent">Brasil</span>
          </h2>
          <p className="text-white/80 text-lg max-w-md drop-shadow-md">
            Em breve você fará parte da maior rede de mobilidade urbana do Brasil.
          </p>
        </div>
      </div>
    </div>
  );
}
