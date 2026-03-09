import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";

export const FinalCTA = () => {
  return (
    <section id="contato" className="py-24 relative overflow-hidden">
      <img
        src={landingHappyArrival}
        alt="Passageira feliz com Bibi Motos"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80" />

      <div className="container px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-8 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Comece agora — é grátis!</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
            Pronto para sua <span className="text-accent">primeira corrida</span>?
          </h2>

          <p className="text-xl text-white/80 max-w-xl mx-auto">
            Cadastre-se em 30 segundos e solicite sua corrida. Sem cartão, sem compromisso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 py-7 shadow-2xl hover:scale-105 transition-all group"
              asChild
            >
              <Link to="/register?role=passenger">
                <Bike className="mr-2 h-5 w-5" />
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white/40 bg-transparent hover:bg-white/10 text-white font-semibold text-lg px-10 py-7"
              asChild
            >
              <Link to="/register?role=driver">
                <Shield className="mr-2 h-5 w-5" />
                Cadastrar como Motorista
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
