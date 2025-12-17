import { MapPin, Search, Bike, Star } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: <MapPin className="h-6 w-6" />,
      step: "01",
      title: "Informe seu destino",
      description: "Digite o endereço de partida e chegada no app",
    },
    {
      icon: <Search className="h-6 w-6" />,
      step: "02",
      title: "Encontre um motorista",
      description: "O sistema localiza o motoboy mais próximo",
    },
    {
      icon: <Bike className="h-6 w-6" />,
      step: "03",
      title: "Aproveite a viagem",
      description: "Acompanhe em tempo real e chegue com segurança",
    },
    {
      icon: <Star className="h-6 w-6" />,
      step: "04",
      title: "Avalie o serviço",
      description: "Sua opinião ajuda a melhorar a plataforma",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
            Como Funciona
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simples e <span className="text-gradient-accent">rápido</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas 4 passos você solicita sua corrida ou entrega e acompanha tudo em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-4" />
              )}

              <div className="glass-card p-6 rounded-2xl h-full relative group hover:border-primary/50 transition-all duration-300">
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold glow-primary">
                  {item.step}
                </div>

                <div className="w-14 h-14 mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  {item.icon}
                </div>

                <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
