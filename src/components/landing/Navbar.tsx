import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-simbolo.png";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-accent/30 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-11 w-11 rounded-full bg-white ring-2 ring-accent/60 shadow-md flex items-center justify-center p-1">
                <img src={logoImage} alt="Bibi Motos" className="h-full w-full object-contain" />
              </div>
            </div>
            <span className="text-xl font-bold">
              <span className="text-foreground">Bibi</span>
              <span className="text-accent">Motos</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLinks />
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button className="btn-gradient" asChild>
              <Link to="/register">Cadastre-se</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              <NavLinks mobile />
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button className="btn-gradient" asChild>
                  <Link to="/register">Cadastre-se</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
  const links = [
    { href: "#servicos", label: "Serviços" },
    { href: "#como-funciona", label: "Como Funciona" },
    { href: "#franquias", label: "Franquias" },
    { href: "#contato", label: "Contato" },
  ];

  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={`text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${
            mobile ? "block py-2" : ""
          }`}
        >
          {link.label}
        </a>
      ))}
    </>
  );
};
