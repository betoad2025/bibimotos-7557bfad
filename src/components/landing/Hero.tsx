import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Package, Shield, Star, Clock, Users, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroRide from "@/assets/hero-ride.jpg";
import { useEffect, useState } from "react";

export const Hero = () => {
  const [count, setCount] = useState({ rides: 0, cities: 0, drivers: 0 });
  const [showBadge, setShowBadge] = useState(false);
  const [liveUsers, setLiveUsers] = useState(47);

  useEffect(() => {
    const targets = { rides: 10000, cities: 50, drivers: 1000 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount({
        rides: Math.round(targets.rides * eased),
        cities: Math.round(targets.cities * eased),
        drivers: Math.round(targets.drivers * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    setTimeout(() => setShowBadge(true), 3000);

    // Simulate live users
    const liveTimer = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);

    return () => { clearInterval(timer); clearInterval(liveTimer); };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img
        src={heroRide}
        alt="Bibi Motos - Passageira e motorista com capacete roxo em corrida de moto"
        className="absolute inset-0 w-full h-full object-cover scale-105 animate-[slowZoom_20s_ease-in-out_infinite_alternate]"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-4 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 animate-fade-in">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white tracking-wide">
              🔴 {liveUsers} pessoas online agora
            </span>
          </div>

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-background/20 backdrop-blur-md border border-primary/30 animate-fade-in ml-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-white tracking-wide">
              🏆 Plataforma #1 em mobilidade urbana por moto no Brasil
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 animate-fade-in leading-[0.95]" style={{ animationDelay: "0.1s" }}>
            <span className="text-white drop-shadow-lg">Sua cidade,</span>
            <br />
            <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite]">
              sua mobilidade
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/85 mb-6 max-w-3xl mx-auto animate-fade-in drop-shadow-md leading-relaxed" style={{ animationDelay: "0.2s" }}>
            Milhares de pessoas já confiam na Bibi Motos para <strong className="text-accent">corridas seguras</strong>, entregas rápidas e oportunidades de renda.
          </p>

          {/* Animated counters */}
          <div className="flex flex-wrap justify-center gap-8 mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            {[
              { icon: Bike, value: `${count.rides.toLocaleString()}+`, label: "Corridas" },
              { icon: Star, value: `${count.cities}+`, label: "Cidades" },
              { icon: Users, value: `${count.drivers.toLocaleString()}+`, label: "Motoristas" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 text-white group hover:scale-110 transition-transform cursor-default">
                <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-primary/30 transition-colors">
                  <stat.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-black tabular-nums">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="bg-gradient-to-r from-accent via-yellow-400 to-accent hover:from-accent/90 hover:to-yellow-500 text-primary-foreground font-bold text-lg px-8 py-7 shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transition-all group animate-[pulse-glow_2s_ease-in-out_infinite]" asChild>
              <Link to="/register?role=passenger">
                <Bike className="mr-2 h-5 w-5" />
                Solicitar Corrida
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-7 border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold hover:scale-105 transition-all" asChild>
              <Link to="/register?role=driver">
                <Shield className="mr-2 h-5 w-5" />
                Seja um Motoboy
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-7 border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold hover:scale-105 transition-all" asChild>
              <Link to="/register?role=merchant">
                <Package className="mr-2 h-5 w-5" />
                Para Empresas
              </Link>
            </Button>
          </div>

          {/* Urgency message */}
          <div className={`transition-all duration-700 ${showBadge ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 mb-6">
              <span className="text-sm font-semibold text-white">
                ⚡ 23 pessoas se cadastraram nas últimas 2 horas
              </span>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { icon: CheckCircle2, text: "Cadastro gratuito" },
              { icon: Shield, text: "100% seguro" },
              { icon: Clock, text: "Disponível 24h" },
              { icon: Star, text: "Avaliação 4.9★" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/80 text-sm hover:text-white transition-colors cursor-default">
                <item.icon className="h-4 w-4 text-accent" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-[scrollDown_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
