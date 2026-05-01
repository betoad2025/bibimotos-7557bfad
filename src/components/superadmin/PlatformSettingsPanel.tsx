import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Key, Mail, Brain, MessageSquare, Shield, Eye, EyeOff, 
  CheckCircle2, XCircle, Save, RefreshCw, AlertTriangle 
} from "lucide-react";

interface ApiKeyConfig {
  service_name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  category: "email" | "ai" | "sms" | "payment" | "maps";
  required: boolean;
}

const API_KEYS_CONFIG: ApiKeyConfig[] = [
  {
    service_name: "resend",
    label: "Resend API Key",
    description: "Envio de emails de autenticação, recuperação de senha e notificações do sistema",
    icon: <Mail className="h-5 w-5" />,
    placeholder: "re_xxxxxxxxxxxx",
    category: "email",
    required: true,
  },
  {
    service_name: "google_ai",
    label: "Google AI API Key (Gemini)",
    description: "Inteligência artificial para extração de documentos e geração de notificações",
     icon: <Brain className="h-5 w-5" />,
     placeholder: "AIzaxxxxxxxxxxxxxxxxxxxxxxx",
     category: "ai",
     required: false,
   },
   {
     service_name: "openai",
     label: "OpenAI API Key (GPT-4o)",
     description: "Alternativa ao Gemini para extração de documentos e geração de notificações",
     icon: <Brain className="h-5 w-5" />,
     placeholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     category: "ai",
     required: false,
   },
   {
    service_name: "comtele",
    label: "Comtele API Key",
    description: "Envio de SMS para motoristas e passageiros",
    icon: <MessageSquare className="h-5 w-5" />,
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    category: "sms",
    required: false,
  },
  {
    service_name: "google_maps",
    label: "Google Maps API Key",
    description: "Geocodificação, autocomplete de endereços e mapa de rastreamento",
    icon: <Key className="h-5 w-5" />,
    placeholder: "AIzaxxxxxxxxxxxxxxxxxxxxxxx",
    category: "maps",
    required: false,
  },
];

export function PlatformSettingsPanel() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [existingKeys, setExistingKeys] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExistingKeys();
  }, []);

  const fetchExistingKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("default_api_keys")
        .select("service_name, is_active")
        .eq("environment", "production");

      if (error) throw error;

      const existing: Record<string, boolean> = {};
      (data || []).forEach((k) => {
        existing[k.service_name] = k.is_active;
      });
      setExistingKeys(existing);
    } catch (err) {
      console.error("Error fetching keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (serviceName: string) => {
    const value = keys[serviceName];
    if (!value?.trim()) {
      toast.error("Insira a chave antes de salvar");
      return;
    }

    setSaving(serviceName);
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from("default_api_keys")
        .select("id")
        .eq("service_name", serviceName)
        .eq("environment", "production")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("default_api_keys")
          .update({
            api_key_encrypted: value.trim(),
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("default_api_keys")
          .insert({
            service_name: serviceName,
            api_key_encrypted: value.trim(),
            environment: "production",
            is_active: true,
          });

        if (error) throw error;
      }

      toast.success(`Chave ${serviceName} salva com sucesso!`);
      setExistingKeys((prev) => ({ ...prev, [serviceName]: true }));
      setKeys((prev) => ({ ...prev, [serviceName]: "" }));
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      email: "📧 Email",
      ai: "🤖 Inteligência Artificial",
      sms: "📱 SMS",
      payment: "💳 Pagamento",
      maps: "🗺️ Mapas",
    };
    return labels[cat] || cat;
  };

  const categories = [...new Set(API_KEYS_CONFIG.map((k) => k.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Configuração obrigatória para produção</p>
            <p className="text-sm text-amber-700 mt-1">
              As chaves marcadas como <Badge variant="destructive" className="text-[10px] px-1 py-0">obrigatória</Badge>{" "}
              são necessárias para o funcionamento do sistema. Sem elas, emails e IA não funcionarão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-800">100% Independente</p>
            <p className="text-sm text-blue-700 mt-1">
              Todas as chaves são armazenadas no <strong>seu</strong> banco de dados. Nenhum serviço externo 
              proprietário é utilizado. Emails via Resend, IA via Google Gemini — tudo na sua infraestrutura.
            </p>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const categoryKeys = API_KEYS_CONFIG.filter((k) => k.category === category);

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3">{getCategoryLabel(category)}</h3>
            <div className="space-y-3">
              {categoryKeys.map((config) => {
                const isConfigured = existingKeys[config.service_name] === true;
                const isVisible = showKey[config.service_name];

                return (
                  <Card key={config.service_name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">{config.icon}</div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {config.label}
                              {config.required && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  obrigatória
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">{config.description}</CardDescription>
                          </div>
                        </div>
                        {isConfigured ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Configurada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={isVisible ? "text" : "password"}
                            placeholder={isConfigured ? "••••••••••••••••" : config.placeholder}
                            value={keys[config.service_name] || ""}
                            onChange={(e) =>
                              setKeys((prev) => ({ ...prev, [config.service_name]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setShowKey((prev) => ({
                                ...prev,
                                [config.service_name]: !prev[config.service_name],
                              }))
                            }
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button
                          onClick={() => handleSaveKey(config.service_name)}
                          disabled={saving === config.service_name || !keys[config.service_name]?.trim()}
                          size="sm"
                        >
                          {saving === config.service_name ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span className="ml-1">Salvar</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Separator className="mt-6" />
          </div>
        );
      })}
    </div>
  );
}
