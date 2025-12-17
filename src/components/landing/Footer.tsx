import { Bike, Mail, Phone, MapPin, Instagram, Facebook, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Bike className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-foreground">Bibi</span>
                <span className="text-accent">Motos</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Plataforma líder em mobilidade urbana, conectando passageiros, motoristas e comerciantes.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={<Instagram className="h-5 w-5" />} href="#" />
              <SocialLink icon={<Facebook className="h-5 w-5" />} href="#" />
              <SocialLink icon={<Linkedin className="h-5 w-5" />} href="#" />
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Serviços</h4>
            <ul className="space-y-3">
              <FooterLink href="#">Corridas de Moto</FooterLink>
              <FooterLink href="#">Entregas Expressas</FooterLink>
              <FooterLink href="#">Entregas de Farmácia</FooterLink>
              <FooterLink href="#">Para Empresas</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-3">
              <FooterLink href="#">Sobre Nós</FooterLink>
              <FooterLink href="#">Franquias</FooterLink>
              <FooterLink href="#">Seja um Motoboy</FooterLink>
              <FooterLink href="#">Termos de Uso</FooterLink>
              <FooterLink href="#">Privacidade</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                contato@bibimotos.com.br
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                (11) 99999-9999
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                São Paulo, SP - Brasil
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Bibi Motos. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Feito com 💜 no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <a href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </a>
  </li>
);

const SocialLink = ({ icon, href }: { icon: React.ReactNode; href: string }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
  >
    {icon}
  </a>
);
