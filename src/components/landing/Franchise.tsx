import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, Users, Headphones, ArrowRight, CheckCircle2, DollarSign, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import landingFranchise from "@/assets/landing-franchise.jpg";

export const Franchise = () => {
  const benefits = [
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Sua Própria Operação",
      description: "Sistema completo de gestão: motoristas, corridas, financeiro e marketing na sua mão",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Alta Rentabilidade",
      description: "Modelo comprovado com ROI superior a 200% já no primeiro ano",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Rede de Motoristas",
      description: "Recrute e gerencie sua frota com ferramentas profissionais de aprovação e verificação",
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "Suporte Completo",
      description: "Treinamento, marketing digital e suporte técnico 24h inclusos na franquia",
    },
  ];

  return (
    <section id="franquias" className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              🚀 Oportunidade de Negócio
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Empreenda com a <span className="text-gradient-primary">Bibi Motos</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Leve a mobilidade urbana para sua cidade. Você administra a operação local com toda a tecnologia e suporte de uma plataforma nacional.
            </p>
            <p className="text-base text-muted-foreground mb-8">
              <strong className="text-foreground">Mais de 50 cidades</strong> já operam com a Bibi Motos. A próxima pode ser a sua.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Urgency trigger */}
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                Vagas limitadas por região — garanta exclusividade na sua cidade
              </p>
            </div>

            <Button size="lg" className="btn-gradient glow-primary group" asChild>
              <Link to="/franquia">
                Quero ser Franqueado
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={landingFranchise}
                alt="Equipe de motoboys Bibi Motos em frente à franquia"
                className="w-full h-[520px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-3xl" />
            </div>

            {/* Floating stats */}
            <div className="absolute -top-4 -right-4 bg-card/95 backdrop-blur-xl border border-border px-5 py-4 rounded-xl shadow-lg animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-lg font-black text-foreground">200%+</div>
                  <div className="text-xs text-muted-foreground">ROI médio</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card/95 backdrop-blur-xl border border-border px-5 py-4 rounded-xl shadow-lg animate-float" style={{ animationDelay: "2s" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-black text-foreground">1.000+</div>
                  <div className="text-xs text-muted-foreground">Motoristas ativos</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-16 -right-4 bg-card/95 backdrop-blur-xl border border-border px-5 py-4 rounded-xl shadow-lg animate-float" style={{ animationDelay: "4s" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-lg font-black text-foreground">R$ 0</div>
                  <div className="text-xs text-muted-foreground">Taxa de adesão</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
