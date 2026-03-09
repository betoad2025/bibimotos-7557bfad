import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Shield, Zap, CheckCircle2, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";
import { useState, useEffect } from "react";

export const FinalCTA = () => {
  const sectionRef = useScrollAnimation(0.1);
  const [recentSignups, setRecentSignups] = useState(147);

  useEffect(() => {
    const timer = setInterval(() => {
      setRecentSignups(prev => prev + Math.floor(Math.random() * 2) + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="contato" className="py-24 relative overflow-hidden">
      <img src={landingHappyArrival} alt="Passageira feliz com Bibi Motos" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80" />

      <div
        ref={sectionRef.ref}
        className={`container px-4 relative z-10 text-center transition-all duration-1000 ${
          sectionRef.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="max-w-3xl mx-auto space-y-8 text-white">
          {/* Live counter */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-semibold">
              {recentSignups}+ pessoas se cadastraram esta semana
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 ml-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">Comece agora — é grátis!</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
            Pronto para sua <span className="text-accent">primeira corrida</span>?
          </h2>

          <p className="text-xl text-white/80 max-w-xl mx-auto">
            Cadastre-se em 30 segundos e solicite sua corrida. <strong>Sem cartão, sem compromisso.</strong>
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 py-2">
            {[
              { icon: CheckCircle2, text: "Gratuito" },
              { icon: Shield, text: "Seguro" },
              { icon: Clock, text: "24 horas" },
              { icon: Star, text: "4.9 estrelas" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <item.icon className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 py-7 shadow-2xl hover:scale-105 transition-all group animate-[pulse-glow_2s_ease-in-out_infinite]"
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
              className="border-2 border-white/40 bg-transparent hover:bg-white/10 text-white font-semibold text-lg px-10 py-7 hover:scale-105 transition-all"
              asChild
            >
              <Link to="/register?role=driver">
                <Shield className="mr-2 h-5 w-5" />
                Cadastrar como Motorista
              </Link>
            </Button>
          </div>

          {/* Guarantee */}
          <div className="pt-6">
            <p className="text-sm text-white/60 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Seus dados estão seguros e protegidos pela LGPD
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
