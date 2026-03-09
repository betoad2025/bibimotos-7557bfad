import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Users, DollarSign, Clock, Shield, Star, CheckCircle2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import landingDriver from "@/assets/landing-driver.jpg";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";

export const DriverCTA = () => {
  const sectionRef = useScrollAnimation(0.1);
  const { count: earnings, ref: earningsRef } = useCountUp(4200);

  return (
    <section className="py-24 relative overflow-hidden">
      <img src={landingDriver} alt="Motorista Bibi Motos" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70" />

      <div
        ref={sectionRef.ref}
        className={`container px-4 relative z-10 transition-all duration-1000 ${
          sectionRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-white space-y-6">
            <span className="inline-block px-4 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
              💰 Ganhe Dinheiro
            </span>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Seja motorista e <span className="text-accent">ganhe mais</span>
            </h2>
            <p className="text-xl text-white/85 leading-relaxed">
              Trabalhe no seu horário, sem chefe. Ganhe por corrida com bônus em horários de pico. Milhares de motoristas já aumentaram sua renda com a Bibi Motos.
            </p>

            {/* Earnings highlight */}
            <div ref={earningsRef} className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-accent/30 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <div className="text-3xl font-black text-accent">R$ {earnings.toLocaleString()}</div>
                  <div className="text-sm text-white/70">Ganho médio mensal dos nossos motoristas</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, title: "Ganhos livres", desc: "Sem desconto abusivo de plataforma" },
                { icon: Clock, title: "Flexibilidade", desc: "Você define seus horários" },
                { icon: Shield, title: "Seguro incluso", desc: "Cobertura durante corridas" },
                { icon: Star, title: "Bônus diários", desc: "Ganhe mais em horário de pico" },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors cursor-default group">
                  <item.icon className="h-6 w-6 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <p className="text-xs text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>

            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold text-lg px-8 py-7 shadow-2xl group animate-[pulse-glow_2s_ease-in-out_infinite]" asChild>
              <Link to="/register?role=driver">
                <Bike className="mr-2 h-5 w-5" />
                Cadastrar como Motorista
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <p className="text-sm text-white/60 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Cadastro gratuito • Aprovação em até 24h
            </p>
          </div>

          {/* Testimonial card */}
          <div className="hidden lg:block">
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border hover:shadow-primary/20 transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-primary/30">
                  <img src={landingHappyArrival} alt="Depoimento" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Carlos Silva</h4>
                  <p className="text-sm text-muted-foreground">Motorista há 8 meses</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-accent text-accent" />)}
                  </div>
                </div>
              </div>
              <blockquote className="text-foreground text-lg leading-relaxed italic">
                "Desde que comecei na Bibi Motos, minha renda aumentou 40%. A plataforma é fácil de usar e o suporte sempre me ajuda quando preciso."
              </blockquote>
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-black text-primary">R$4.200</div>
                  <div className="text-xs text-muted-foreground">Ganho mensal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-primary">4.9★</div>
                  <div className="text-xs text-muted-foreground">Avaliação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-primary">320</div>
                  <div className="text-xs text-muted-foreground">Corridas/mês</div>
                </div>
              </div>

              {/* Additional testimonials */}
              <div className="mt-6 space-y-4">
                <div className="bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">MA</div>
                    <span className="text-sm font-semibold text-foreground">Marcos A.</span>
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-accent text-accent" />)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"Melhor plataforma que já trabalhei. Taxa justa e muita demanda."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
