import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DriverCTA } from "@/components/landing/DriverCTA";
import { Franchise } from "@/components/landing/Franchise";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <DriverCTA />
        <Franchise />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
