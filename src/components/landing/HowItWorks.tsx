import { MapPin, Search, Bike, Star, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import landingDriver from "@/assets/landing-driver.jpg";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";
import { useState, useEffect } from "react";

export const HowItWorks = () => {
  const sectionRef = useScrollAnimation(0.1);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-progress through steps
  useEffect(() => {
    if (!sectionRef.isVisible) return;
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [sectionRef.isVisible]);

  const steps = [
    {
      icon: <MapPin className="h-6 w-6" />,
      step: "01",
      title: "Informe seu destino",
      description: "Abra o app, digite para onde quer ir e veja o preço antes de confirmar. Sem surpresas.",
      color: "bg-primary/20 text-primary",
      activeColor: "bg-primary text-primary-foreground",
    },
    {
      icon: <Search className="h-6 w-6" />,
      step: "02",
      title: "Motoboy a caminho",
      description: "Em segundos encontramos o motorista mais próximo. Você vê o nome, foto e avaliação dele.",
      color: "bg-accent/20 text-accent",
      activeColor: "bg-accent text-accent-foreground",
    },
    {
      icon: <Bike className="h-6 w-6" />,
      step: "03",
      title: "Viaje com segurança",
      description: "Acompanhe o trajeto em tempo real. Compartilhe sua localização com quem quiser.",
      color: "bg-emerald-500/20 text-emerald-500",
      activeColor: "bg-emerald-500 text-white",
    },
    {
      icon: <Star className="h-6 w-6" />,
      step: "04",
      title: "Chegou! Avalie",
      description: "Chegue rápido e avalie o motorista. Acumule corridas para ganhar viagens grátis!",
      color: "bg-amber-500/20 text-amber-500",
      activeColor: "bg-amber-500 text-white",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 relative overflow-hidden">
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
            Como Funciona
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tão fácil que <span className="text-gradient-accent">qualquer um usa</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Do cadastro à primeira corrida em menos de 2 minutos. Sem burocracia, sem complicação.
          </p>
        </div>

        <div
          ref={sectionRef.ref}
          className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${
            sectionRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Images side */}
          <div className="relative hidden lg:block">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img src={landingDriver} alt="Motorista Bibi Motos verificando GPS" className="w-full h-[400px] object-cover" loading="lazy" />
            </div>
            <div className="absolute -bottom-8 -right-4 w-64 h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
              <img src={landingHappyArrival} alt="Passageira feliz chegando ao destino" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="absolute top-4 -left-4 bg-card/95 backdrop-blur-xl border border-border px-4 py-3 rounded-xl shadow-lg animate-float">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Motoristas verificados</span>
              </div>
            </div>
            <div className="absolute top-1/2 -right-4 bg-card/95 backdrop-blur-xl border border-border px-4 py-3 rounded-xl shadow-lg animate-float" style={{ animationDelay: "3s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold">Seguro incluso</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeStep ? 'w-8 bg-primary' : 'w-3 bg-border'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Steps side */}
          <div className="space-y-4">
            {steps.map((item, index) => (
              <div
                key={index}
                className={`flex gap-5 group cursor-pointer p-4 rounded-2xl transition-all duration-500 ${
                  index === activeStep ? 'bg-card shadow-lg border border-border scale-[1.02]' : 'hover:bg-card/50'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    index === activeStep ? item.activeColor + ' shadow-lg scale-110' : item.color
                  }`}>
                    {item.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-8 mt-2 transition-colors duration-500 ${
                      index < activeStep ? 'bg-primary' : 'bg-gradient-to-b from-primary/50 to-transparent'
                    }`} />
                  )}
                </div>
                <div className="pt-1 pb-2 flex-1">
                  <span className="text-xs font-bold text-primary mb-1 block tracking-wider">PASSO {item.step}</span>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className={`text-muted-foreground leading-relaxed transition-all duration-500 ${
                    index === activeStep ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 lg:max-h-20 lg:opacity-100'
                  } overflow-hidden`}>{item.description}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <Button size="lg" className="btn-gradient glow-primary group w-full sm:w-auto" asChild>
                <Link to="/register?role=passenger">
                  Começar Agora — É Grátis!
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
