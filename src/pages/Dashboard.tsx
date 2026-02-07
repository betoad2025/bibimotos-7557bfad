import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SuperAdminDashboard from "./dashboard/SuperAdminDashboard";
import FranchiseAdminDashboard from "./dashboard/FranchiseAdminDashboard";
import DriverDashboard from "./dashboard/DriverDashboard";
import PassengerDashboard from "./dashboard/PassengerDashboard";
import MerchantDashboard from "./dashboard/MerchantDashboard";

export default function Dashboard() {
  const { user, loading, roles, isSuperAdmin, isFranchiseAdmin, isDriver, isPassenger, isMerchant } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Route to appropriate dashboard based on role
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isFranchiseAdmin) {
    return <FranchiseAdminDashboard />;
  }

  if (isDriver) {
    return <DriverDashboard />;
  }

  if (isPassenger) {
    return <PassengerDashboard />;
  }

  if (isMerchant) {
    return <MerchantDashboard />;
  }

  // Default: user without role - show complete registration
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-background">
      <div className="text-center max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4">Bem-vindo!</h1>
        <p className="text-muted-foreground mb-6">
          Seu cadastro está em análise. Em breve você terá acesso ao sistema.
        </p>
        <button 
          onClick={() => navigate('/complete-registration')}
          className="text-primary hover:underline"
        >
          Completar cadastro
        </button>
      </div>
    </div>
  );
}
