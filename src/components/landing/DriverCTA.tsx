import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Users, DollarSign, Clock, Shield, Star, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import landingDriver from "@/assets/landing-driver.jpg";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";

export const DriverCTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background image */}
      <img
        src={landingDriver}
        alt="Motorista Bibi Motos"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70" />

      <div className="container px-4 relative z-10">
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

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, title: "Ganhos livres", desc: "Sem desconto de plataforma abusivo" },
                { icon: Clock, title: "Flexibilidade", desc: "Você define seus horários" },
                { icon: Shield, title: "Seguro incluso", desc: "Cobertura durante corridas" },
                { icon: Star, title: "Bônus diários", desc: "Ganhe mais em horário de pico" },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <item.icon className="h-6 w-6 text-accent mb-2" />
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  <p className="text-xs text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>

            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold text-lg px-8 py-7 shadow-2xl group" asChild>
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
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden">
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
                  <div className="text-xs text-muted-foreground">Ganho mensal médio</div>
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
