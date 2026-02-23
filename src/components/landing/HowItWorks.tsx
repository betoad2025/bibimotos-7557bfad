import { MapPin, Search, Bike, Star } from "lucide-react";
import howItWorksImg from "@/assets/how-it-works.jpg";

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

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Cinematic Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl hidden lg:block">
            <img
              src={howItWorksImg}
              alt="App Bibi Motos em uso"
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white text-lg font-semibold drop-shadow-lg">
                Solicite sua corrida em segundos
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((item, index) => (
              <div key={index} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {item.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent mt-2" />
                  )}
                </div>
                <div className="pt-2">
                  <span className="text-xs font-bold text-primary mb-1 block">PASSO {item.step}</span>
                  <h3 className="text-lg font-semibold mb-1 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
