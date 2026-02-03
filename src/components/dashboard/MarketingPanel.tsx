import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface MarketingSettings {
  google_ads_id: string | null;
  google_ads_conversion_id: string | null;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
  facebook_access_token: string | null;
  tiktok_pixel_id: string | null;
  instagram_business_id: string | null;
}

interface MarketingPanelProps {
  franchiseId: string;
}

export function MarketingPanel({ franchiseId }: MarketingPanelProps) {
  const [settings, setSettings] = useState<MarketingSettings>({
    google_ads_id: null,
    google_ads_conversion_id: null,
    google_analytics_id: null,
    facebook_pixel_id: null,
    facebook_access_token: null,
    tiktok_pixel_id: null,
    instagram_business_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [franchiseId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('franchise_marketing')
        .select('*')
        .eq('franchise_id', franchiseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          google_ads_id: data.google_ads_id,
          google_ads_conversion_id: data.google_ads_conversion_id,
          google_analytics_id: data.google_analytics_id,
          facebook_pixel_id: data.facebook_pixel_id,
          facebook_access_token: data.facebook_access_token,
          tiktok_pixel_id: data.tiktok_pixel_id,
          instagram_business_id: data.instagram_business_id,
        });
      }
    } catch (error) {
      console.error('Error fetching marketing settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('franchise_marketing')
        .upsert({
          franchise_id: franchiseId,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({ title: "Configurações salvas com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const platforms = [
    {
      id: 'google',
      name: 'Google Ads',
      icon: '🎯',
      color: 'from-blue-500 to-blue-600',
      fields: [
        { key: 'google_ads_id', label: 'ID do Google Ads', placeholder: 'AW-XXXXXXXXX' },
        { key: 'google_ads_conversion_id', label: 'ID de Conversão', placeholder: 'AW-XXXXXXXX/XXXXXXXX' },
        { key: 'google_analytics_id', label: 'ID do Analytics (GA4)', placeholder: 'G-XXXXXXXXXX' },
      ],
      docs: 'https://support.google.com/google-ads/answer/1722054'
    },
    {
      id: 'facebook',
      name: 'Facebook/Meta',
      icon: '📘',
      color: 'from-blue-600 to-indigo-600',
      fields: [
        { key: 'facebook_pixel_id', label: 'ID do Pixel', placeholder: 'XXXXXXXXXXXXXXXX' },
        { key: 'facebook_access_token', label: 'Token de Acesso (opcional)', placeholder: 'EAAG...' },
      ],
      docs: 'https://www.facebook.com/business/help/952192354843755'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'from-pink-500 to-rose-600',
      fields: [
        { key: 'tiktok_pixel_id', label: 'ID do Pixel', placeholder: 'XXXXXXXXXXXXXXXX' },
      ],
      docs: 'https://ads.tiktok.com/help/article/standard-events'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: 'from-purple-500 to-pink-500',
      fields: [
        { key: 'instagram_business_id', label: 'ID da Conta Business', placeholder: 'XXXXXXXXXXXXXXXX' },
      ],
      docs: 'https://www.facebook.com/business/help/898752960195806'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Painel de Marketing
          </h2>
          <p className="text-muted-foreground">
            Configure seus pixels e integrações de marketing
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platforms.map((platform) => {
          const hasConfig = platform.fields.some(
            f => settings[f.key as keyof MarketingSettings]
          );
          
          return (
            <Card key={platform.id} className={hasConfig ? 'border-green-500/50' : ''}>
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{platform.name}</p>
                  {hasConfig ? (
                    <Badge variant="default" className="text-xs bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configurado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="google" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          {platforms.map((platform) => (
            <TabsTrigger key={platform.id} value={platform.id} className="text-xs sm:text-sm">
              <span className="mr-1 sm:mr-2">{platform.icon}</span>
              <span className="hidden sm:inline">{platform.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {platforms.map((platform) => (
          <TabsContent key={platform.id} value={platform.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{platform.icon}</span>
                      {platform.name}
                    </CardTitle>
                    <CardDescription>
                      Configure sua integração com {platform.name}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={platform.docs} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {platform.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      placeholder={field.placeholder}
                      value={settings[field.key as keyof MarketingSettings] || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        [field.key]: e.target.value || null
                      })}
                    />
                  </div>
                ))}

                {/* Tips */}
                <div className="p-4 bg-muted/50 rounded-lg mt-4">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Dicas
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Os pixels serão injetados automaticamente no site da sua franquia</li>
                    <li>• Eventos de conversão são enviados automaticamente nas ações importantes</li>
                    <li>• Você pode gerenciar as campanhas diretamente na plataforma do {platform.name}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}