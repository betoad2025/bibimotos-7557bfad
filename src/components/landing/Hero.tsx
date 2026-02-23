import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Package, MapPin } from "lucide-react";
import heroRide from "@/assets/hero-ride.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic Background Image */}
      <img
        src={heroRide}
        alt="Bibi Motos - Mobilidade urbana no Brasil"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-background/20 backdrop-blur-md border border-primary/30 animate-fade-in">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white">
              Plataforma líder em mobilidade urbana
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="text-white drop-shadow-lg">Sua cidade,</span>
            <br />
            <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
              sua mobilidade
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in drop-shadow-md" style={{ animationDelay: "0.2s" }}>
            Conectamos passageiros, motoristas e comerciantes em uma plataforma completa de transporte e entregas por moto.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" className="btn-gradient text-lg px-8 py-6 glow-primary">
              Solicitar Corrida
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white">
              Seja um Motoboy
              <Bike className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <ServiceCard
              icon={<Bike className="h-8 w-8" />}
              title="Corridas de Moto"
              description="Transporte rápido e seguro para qualquer lugar da cidade"
            />
            <ServiceCard
              icon={<Package className="h-8 w-8" />}
              title="Entregas"
              description="Delivery de pacotes, farmácias e muito mais"
            />
            <ServiceCard
              icon={<MapPin className="h-8 w-8" />}
              title="Cobertura Local"
              description="Presente nas principais cidades do Brasil"
            />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard = ({ icon, title, description }: ServiceCardProps) => (
  <div className="bg-background/20 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:scale-105 transition-transform duration-300 group">
    <div className="w-14 h-14 mb-4 rounded-xl bg-primary/30 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
    <p className="text-sm text-white/70">{description}</p>
  </div>
);
