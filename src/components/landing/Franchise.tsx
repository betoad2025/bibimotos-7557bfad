import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, Users, Headphones, ArrowRight } from "lucide-react";

export const Franchise = () => {
  const benefits = [
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Sua Própria Operação",
      description: "Gerencie sua franquia de forma independente com total autonomia",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Alta Rentabilidade",
      description: "Modelo de negócio comprovado com excelente retorno sobre investimento",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Rede de Motoristas",
      description: "Tenha acesso a uma base de motoristas já cadastrados na plataforma",
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "Suporte Completo",
      description: "Treinamento, marketing e suporte técnico inclusos",
    },
  ];

  return (
    <section id="franquias" className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              Franquias
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Seja um <span className="text-gradient-primary">franqueado</span> Bibi Motos
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Expanda nossos serviços para sua cidade e construa um negócio lucrativo com o suporte de uma marca consolidada no mercado de mobilidade urbana.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button size="lg" className="btn-gradient glow-primary">
              Quero ser franqueado
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="glass-card p-8 rounded-3xl">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center glow-primary">
                    <Building2 className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">50+ Cidades</h3>
                  <p className="text-muted-foreground">Em todo o Brasil</p>
                </div>
              </div>

              {/* Floating stats */}
              <div className="absolute -top-4 -right-4 glass-card px-4 py-3 rounded-xl animate-float">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="text-sm font-semibold">ROI de 200%</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 glass-card px-4 py-3 rounded-xl animate-float" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="text-sm font-semibold">+1000 motoristas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
