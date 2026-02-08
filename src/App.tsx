import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ChatSupport } from "@/components/support/ChatSupport";
import FranchiseLanding from "./pages/FranchiseLanding";
import CityLanding from "./pages/CityLanding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CompleteRegistration from "./pages/CompleteRegistration";
import ForgotPassword from "./pages/ForgotPassword";
import TrackRide from "./pages/TrackRide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Detecta se está num subdomínio de cidade
const getIsSubdomain = (): boolean => {
  const hostname = window.location.hostname;
  
  // Domínios principais
  const mainDomains = [
    'bibimotos.com.br',
    'www.bibimotos.com.br',
    'bibimotos.lovable.app',
    'localhost',
    '127.0.0.1'
  ];
  
  // Preview do Lovable
  if (hostname.includes('lovable.app') || hostname.includes('localhost')) {
    return false;
  }
  
  // Verifica se é o domínio principal
  if (mainDomains.includes(hostname)) {
    return false;
  }
  
  // Extrai o subdomínio de *.bibimotos.com.br
  const match = hostname.match(/^([a-z0-9-]+)\.bibimotos\.com\.br$/i);
  if (match && match[1] !== 'www') {
    return true;
  }
  
  return false;
};

const isSubdomain = getIsSubdomain();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Se for subdomínio de cidade, mostra landing específica */}
            <Route path="/" element={isSubdomain ? <CityLanding /> : <FranchiseLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/complete-registration" element={<CompleteRegistration />} />
            <Route path="/acompanhar/:token" element={<TrackRide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatSupport />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
