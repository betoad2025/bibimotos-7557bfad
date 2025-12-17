import { Bike, Package, Pill, Clock, Shield, MapPin } from "lucide-react";

export const Services = () => {
  return (
    <section id="servicos" className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
            Nossos Serviços
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Soluções completas de <span className="text-gradient-primary">mobilidade</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oferecemos uma variedade de serviços para atender todas as suas necessidades de transporte e entregas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ServiceCard
            icon={<Bike className="h-8 w-8" />}
            title="Corridas de Moto"
            description="Transporte rápido e eficiente de passageiros. Chegue ao seu destino com segurança e agilidade."
            features={["Motoristas verificados", "Preço justo", "Rastreamento em tempo real"]}
          />
          <ServiceCard
            icon={<Package className="h-8 w-8" />}
            title="Entregas Expressas"
            description="Delivery de pacotes e documentos com rapidez. Ideal para e-commerces e empresas."
            features={["Entrega no mesmo dia", "Seguro incluso", "Prova de entrega"]}
          />
          <ServiceCard
            icon={<Pill className="h-8 w-8" />}
            title="Entregas de Farmácia"
            description="Serviço especializado para farmácias e drogarias com máxima segurança."
            features={["Temperatura controlada", "Urgência médica", "24 horas"]}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          <StatCard icon={<Bike />} value="10k+" label="Corridas realizadas" />
          <StatCard icon={<MapPin />} value="50+" label="Cidades atendidas" />
          <StatCard icon={<Clock />} value="15min" label="Tempo médio" />
          <StatCard icon={<Shield />} value="100%" label="Segurança" />
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const ServiceCard = ({ icon, title, description, features }: ServiceCardProps) => (
  <div className="glass-card p-8 rounded-2xl hover:border-primary/50 transition-all duration-300 group">
    <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground glow-primary">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatCard = ({ icon, value, label }: StatCardProps) => (
  <div className="text-center">
    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);
