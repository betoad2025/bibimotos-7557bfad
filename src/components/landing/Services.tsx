import { Bike, Package, Pill, Clock, Shield, MapPin, ArrowRight, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollAnimation, useCountUp } from "@/hooks/useScrollAnimation";
import landingRequesting from "@/assets/landing-requesting.jpg";
import landingDelivery from "@/assets/landing-delivery.jpg";
import landingPharmacy from "@/assets/landing-pharmacy.jpg";

export const Services = () => {
  const section1 = useScrollAnimation();
  const section2 = useScrollAnimation();
  const section3 = useScrollAnimation();
  const statsRef = useScrollAnimation(0.2);

  const { count: ridesCount, ref: ridesRef } = useCountUp(10000);
  const { count: citiesCount, ref: citiesRef } = useCountUp(50);

  return (
    <section id="servicos" className="py-24 bg-secondary/30 overflow-hidden">
      <div className="container px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4 animate-fade-in">
            Nossos Serviços
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Soluções completas de <span className="text-gradient-primary">mobilidade</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada serviço pensado para facilitar a vida de quem precisa se locomover ou entregar com rapidez.
          </p>
        </div>

        {/* Service 1 - Mototáxi */}
        <div
          ref={section1.ref}
          className={`grid lg:grid-cols-2 gap-12 items-center mb-24 transition-all duration-1000 ${
            section1.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
          }`}
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
            <img src={landingRequesting} alt="Passageira solicitando corrida pelo celular" className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
                <Clock className="h-4 w-4 text-accent" />
                <span>Motorista em 5 minutos na sua porta</span>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute top-4 right-4 bg-accent/90 text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-float">
              ⚡ MAIS POPULAR
            </div>
          </div>
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bike className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Corridas de <span className="text-primary">Mototáxi</span>
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Chega de esperar ônibus ou pagar caro em aplicativo de carro. Com a Bibi Motos, você solicita uma corrida e em minutos um motorista verificado chega até você. <strong className="text-foreground">Rápido, seguro e pelo melhor preço.</strong>
            </p>
            <ul className="space-y-3">
              {["Motoristas verificados com CNH e antecedentes", "Capacete fornecido para passageiro", "Rastreamento em tempo real pelo app", "Pagamento via app, PIX ou dinheiro"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="btn-gradient glow-primary group" asChild>
                <Link to="/register?role=passenger">
                  Pedir Corrida Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 self-center">
                <Zap className="h-3.5 w-3.5 text-accent" /> Cadastro em 30 segundos
              </p>
            </div>
          </div>
        </div>

        {/* Service 2 - Entregas */}
        <div
          ref={section2.ref}
          className={`grid lg:grid-cols-2 gap-12 items-center mb-24 transition-all duration-1000 ${
            section2.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'
          }`}
        >
          <div className="space-y-6 lg:order-1">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Package className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Entregas <span className="text-amber-500">Expressas</span>
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Precisa enviar um documento, compra ou encomenda? Nossos entregadores levam seu pacote com segurança e você acompanha cada passo no app. <strong className="text-foreground">Ideal para quem vende online.</strong>
            </p>
            <ul className="space-y-3">
              {["Entrega no mesmo dia garantida", "Seguro incluso em todos os envios", "Foto de comprovação na entrega", "Integração para e-commerces e lojas"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg group" asChild>
              <Link to="/register?role=merchant">
                Enviar Entrega
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group lg:order-2">
            <img src={landingDelivery} alt="Entregador de moto entregando pacote para cliente satisfeita" className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
                <Shield className="h-4 w-4 text-amber-300" />
                <span>Seguro incluso em todas as entregas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service 3 - Farmácia */}
        <div
          ref={section3.ref}
          className={`grid lg:grid-cols-2 gap-12 items-center mb-16 transition-all duration-1000 ${
            section3.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'
          }`}
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
            <img src={landingPharmacy} alt="Entregador entregando medicamentos para senhora idosa" className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 text-white text-sm font-medium bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
                <Pill className="h-4 w-4 text-emerald-300" />
                <span>Medicamentos entregues com cuidado</span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-emerald-500/90 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-float">
              🏥 SAÚDE
            </div>
          </div>
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Pill className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Delivery de <span className="text-emerald-500">Farmácia</span>
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Seus medicamentos chegam até você com cuidado especial. Serviço especializado para farmácias e drogarias, com manuseio seguro e entrega ágil. <strong className="text-foreground">Não saia de casa quando não estiver bem.</strong>
            </p>
            <ul className="space-y-3">
              {["Manuseio especializado de medicamentos", "Entregas urgentes prioritárias", "Disponível 7 dias por semana", "Parceria com farmácias locais"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold shadow-lg group" asChild>
              <Link to="/register?role=merchant">
                Cadastrar Farmácia
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats bar with scroll animation */}
        <div
          ref={statsRef.ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 pt-12 border-t border-border transition-all duration-1000 ${
            statsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div ref={ridesRef} className="text-center group cursor-default hover:scale-110 transition-transform">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Bike className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{ridesCount.toLocaleString()}+</div>
            <div className="text-sm text-muted-foreground">Corridas realizadas</div>
          </div>
          <div ref={citiesRef} className="text-center group cursor-default hover:scale-110 transition-transform">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{citiesCount}+</div>
            <div className="text-sm text-muted-foreground">Cidades atendidas</div>
          </div>
          <div className="text-center group cursor-default hover:scale-110 transition-transform">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Clock className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">5min</div>
            <div className="text-sm text-muted-foreground">Tempo médio</div>
          </div>
          <div className="text-center group cursor-default hover:scale-110 transition-transform">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Shield className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">100%</div>
            <div className="text-sm text-muted-foreground">Segurança</div>
          </div>
        </div>
      </div>
    </section>
  );
};
