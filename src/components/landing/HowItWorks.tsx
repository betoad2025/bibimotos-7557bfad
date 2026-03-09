import { MapPin, Search, Bike, Star, Shield, CheckCircle2 } from "lucide-react";
import landingDriver from "@/assets/landing-driver.jpg";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";

export const HowItWorks = () => {
  const steps = [
    {
      icon: <MapPin className="h-6 w-6" />,
      step: "01",
      title: "Informe seu destino",
      description: "Abra o app e digite para onde quer ir. Simples como mandar uma mensagem.",
      color: "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
    },
    {
      icon: <Search className="h-6 w-6" />,
      step: "02",
      title: "Motoboy a caminho",
      description: "Em segundos encontramos o motorista mais próximo. Você vê o nome, foto e avaliação.",
      color: "bg-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
    },
    {
      icon: <Bike className="h-6 w-6" />,
      step: "03",
      title: "Viaje com segurança",
      description: "Acompanhe o trajeto em tempo real. Compartilhe com quem quiser.",
      color: "bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white",
    },
    {
      icon: <Star className="h-6 w-6" />,
      step: "04",
      title: "Chegou! Avalie",
      description: "Chegue rápido e avalie o motorista. Sua nota ajuda toda a comunidade.",
      color: "bg-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-white",
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

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Images side */}
          <div className="relative hidden lg:block">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={landingDriver}
                alt="Motorista Bibi Motos verificando GPS no celular"
                className="w-full h-[400px] object-cover"
                loading="lazy"
              />
            </div>
            {/* Overlay second image */}
            <div className="absolute -bottom-8 -right-4 w-64 h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
              <img
                src={landingHappyArrival}
                alt="Passageira feliz chegando ao destino"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Floating trust badge */}
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
          </div>

          {/* Steps side */}
          <div className="space-y-6">
            {steps.map((item, index) => (
              <div key={index} className="flex gap-5 group cursor-default">
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${item.color}`}>
                    {item.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-10 bg-gradient-to-b from-primary/50 to-transparent mt-2" />
                  )}
                </div>
                <div className="pt-1 pb-4">
                  <span className="text-xs font-bold text-primary mb-1 block tracking-wider">PASSO {item.step}</span>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
