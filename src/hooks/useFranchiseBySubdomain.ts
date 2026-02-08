import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Franchise {
  id: string;
  name: string;
  city_id: string;
  is_active: boolean;
  base_price: number | null;
  price_per_km: number | null;
  city: {
    id: string;
    name: string;
    state: string;
    subdomain: string;
  };
}

interface SubdomainInfo {
  subdomain: string | null;
  isMainDomain: boolean;
  franchise: Franchise | null;
  isLoading: boolean;
  error: string | null;
}

export function useFranchiseBySubdomain(): SubdomainInfo {
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detecta o subdomínio atual
  const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;
    
    // Domínios principais que NÃO são subdomínios de cidade
    const mainDomains = [
      'bibimotos.com.br',
      'www.bibimotos.com.br',
      'bibimotos.lovable.app',
      'localhost',
      '127.0.0.1'
    ];
    
    // Preview do Lovable
    if (hostname.includes('lovable.app') || hostname.includes('localhost')) {
      return null;
    }
    
    // Verifica se é o domínio principal
    if (mainDomains.includes(hostname)) {
      return null;
    }
    
    // Extrai o subdomínio de *.bibimotos.com.br
    const match = hostname.match(/^([a-z0-9-]+)\.bibimotos\.com\.br$/i);
    if (match && match[1] !== 'www') {
      return match[1].toLowerCase();
    }
    
    return null;
  };

  const subdomain = getSubdomain();
  const isMainDomain = subdomain === null;

  useEffect(() => {
    const fetchFranchise = async () => {
      if (!subdomain) {
        setIsLoading(false);
        return;
      }

      try {
        // Busca a cidade pelo subdomínio
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('id, name, state, subdomain')
          .eq('subdomain', subdomain)
          .eq('is_active', true)
          .single();

        if (cityError || !cityData) {
          setError(`Cidade não encontrada para o subdomínio: ${subdomain}`);
          setIsLoading(false);
          return;
        }

        // Busca a franquia vinculada à cidade
        const { data: franchiseData, error: franchiseError } = await supabase
          .from('franchises')
          .select('id, name, city_id, is_active, base_price, price_per_km')
          .eq('city_id', cityData.id)
          .eq('is_active', true)
          .single();

        if (franchiseError || !franchiseData) {
          setError(`Franquia não encontrada para a cidade: ${cityData.name}`);
          setIsLoading(false);
          return;
        }

        setFranchise({
          ...franchiseData,
          city: cityData
        });
      } catch (err) {
        setError('Erro ao carregar informações da franquia');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFranchise();
  }, [subdomain]);

  return {
    subdomain,
    isMainDomain,
    franchise,
    isLoading,
    error
  };
}
