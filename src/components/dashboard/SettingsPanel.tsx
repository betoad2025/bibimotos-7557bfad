import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Key, CreditCard, MessageSquare, Mail, Brain, 
  Shield, CheckCircle2, XCircle, Clock, Eye, EyeOff,
  Save, RefreshCw, History, AlertTriangle
} from "lucide-react";

interface ApiKeyConfig {
  id?: string;
  service_name: string;
  api_key_encrypted: string;
  api_secret_encrypted?: string;
  is_active: boolean;
  is_validated: boolean;
  environment: string;
  metadata: Record<string, any>;
}

interface AuditLog {
  id: string;
  service_name: string;
  action: string;
  created_at: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
}

const SERVICE_CONFIGS = [
  {
    name: 'asaas',
    label: 'Asaas (PIX)',
    icon: CreditCard,
    description: 'Gateway de pagamentos PIX para recargas de créditos',
    color: 'text-green-600',
    fields: ['api_key'],
    docs: 'https://docs.asaas.com'
  },
  {
    name: 'woovi',
    label: 'Woovi (PIX)',
    icon: CreditCard,
    description: 'Gateway alternativo de pagamentos PIX',
    color: 'text-purple-600',
    fields: ['api_key'],
    docs: 'https://developers.woovi.com'
  },
  {
    name: 'openai',
    label: 'OpenAI (GPT)',
    icon: Brain,
    description: 'IA para chatbot, atendimento e análises',
    color: 'text-emerald-600',
    fields: ['api_key'],
    docs: 'https://platform.openai.com'
  },
  {
    name: 'anthropic',
    label: 'Anthropic (Claude)',
    icon: Brain,
    description: 'IA alternativa para processamento inteligente',
    color: 'text-orange-600',
    fields: ['api_key'],
    docs: 'https://console.anthropic.com'
  },
  {
    name: 'comtele',
    label: 'Comtele (SMS)',
    icon: MessageSquare,
    description: 'Envio de SMS para motoristas e passageiros',
    color: 'text-blue-600',
    fields: ['api_key'],
    docs: 'https://api.comtele.com.br'
  },
  {
    name: 'resend',
    label: 'Resend (Email)',
    icon: Mail,
    description: 'Envio de emails transacionais',
    color: 'text-pink-600',
    fields: ['api_key'],
    docs: 'https://resend.com/docs'
  }
];

interface SettingsPanelProps {
  franchiseId: string;
}

export function SettingsPanel({ franchiseId }: SettingsPanelProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editedKeys, setEditedKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchApiKeys();
    fetchAuditLogs();
  }, [franchiseId]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('franchise_api_keys')
        .select('*')
        .eq('franchise_id', franchiseId);

      if (error) throw error;

      const keysMap: Record<string, ApiKeyConfig> = {};
      data?.forEach(key => {
        keysMap[key.service_name] = key as ApiKeyConfig;
      });
      setApiKeys(keysMap);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_key_audit_log')
        .select('*')
        .eq('franchise_id', franchiseId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAuditLogs((data as AuditLog[]) || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleSaveKey = async (serviceName: string) => {
    const keyValue = editedKeys[serviceName];
    if (!keyValue) {
      toast.error('Digite uma chave de API válida');
      return;
    }

    setSaving(serviceName);

    try {
      const existingKey = apiKeys[serviceName];

      if (existingKey?.id) {
        // Update existing key
        const { error } = await supabase
          .from('franchise_api_keys')
          .update({
            api_key_encrypted: keyValue,
            is_validated: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingKey.id);

        if (error) throw error;
      } else {
        // Insert new key
        const { error } = await supabase
          .from('franchise_api_keys')
          .insert({
            franchise_id: franchiseId,
            service_name: serviceName,
            api_key_encrypted: keyValue,
            is_active: true,
            is_validated: false,
            environment: 'production'
          });

        if (error) throw error;
      }

      toast.success('Chave salva com sucesso!');
      setEditedKeys(prev => ({ ...prev, [serviceName]: '' }));
      fetchApiKeys();
      fetchAuditLogs();
    } catch (error: any) {
      toast.error('Erro ao salvar chave: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (serviceName: string, isActive: boolean) => {
    const existingKey = apiKeys[serviceName];
    if (!existingKey?.id) return;

    try {
      const { error } = await supabase
        .from('franchise_api_keys')
        .update({ is_active: isActive })
        .eq('id', existingKey.id);

      if (error) throw error;
      toast.success(isActive ? 'Chave ativada' : 'Chave desativada');
      fetchApiKeys();
    } catch (error: any) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleValidateKey = async (serviceName: string) => {
    const existingKey = apiKeys[serviceName];
    if (!existingKey?.id) return;

    setSaving(serviceName);
    
    try {
      // Call edge function to validate the key
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: { 
          franchise_id: franchiseId,
          service_name: serviceName 
        }
      });

      if (error) throw error;

      if (data?.valid) {
        await supabase
          .from('franchise_api_keys')
          .update({ 
            is_validated: true, 
            validated_at: new Date().toISOString() 
          })
          .eq('id', existingKey.id);

        toast.success('Chave validada com sucesso!');
        fetchApiKeys();
      } else {
        toast.error('Chave inválida: ' + (data?.error || 'Verifique a chave'));
      }
    } catch (error: any) {
      toast.error('Erro na validação: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteKey = async (serviceName: string) => {
    const existingKey = apiKeys[serviceName];
    if (!existingKey?.id) return;

    if (!confirm('Tem certeza que deseja excluir esta chave?')) return;

    try {
      const { error } = await supabase
        .from('franchise_api_keys')
        .delete()
        .eq('id', existingKey.id);

      if (error) throw error;
      toast.success('Chave excluída');
      fetchApiKeys();
      fetchAuditLogs();
    } catch (error: any) {
      toast.error('Erro ao excluir chave');
    }
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'created': 'Criada',
      'updated': 'Atualizada',
      'deleted': 'Excluída',
      'validated': 'Validada',
      'invalidated': 'Invalidada'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Key className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Configurações de API</h2>
              <p className="text-purple-200">
                Configure suas próprias chaves para pagamentos, SMS, email e IA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert about inheritance */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Herança de Configurações</p>
              <p className="text-sm text-blue-700">
                Serviços sem chave configurada usarão automaticamente as configurações padrão do Super Admin.
                Configure suas próprias chaves para ter controle total sobre custos e limites.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Payment Services */}
        <TabsContent value="payment" className="space-y-4">
          {SERVICE_CONFIGS.filter(s => ['asaas', 'woovi'].includes(s.name)).map(service => (
            <ServiceCard
              key={service.name}
              service={service}
              config={apiKeys[service.name]}
              editedKey={editedKeys[service.name] || ''}
              showKey={showKeys[service.name]}
              saving={saving === service.name}
              onEditKey={(value) => setEditedKeys(prev => ({ ...prev, [service.name]: value }))}
              onToggleShow={() => setShowKeys(prev => ({ ...prev, [service.name]: !prev[service.name] }))}
              onSave={() => handleSaveKey(service.name)}
              onValidate={() => handleValidateKey(service.name)}
              onToggleActive={(active) => handleToggleActive(service.name, active)}
              onDelete={() => handleDeleteKey(service.name)}
              maskKey={maskKey}
            />
          ))}
        </TabsContent>

        {/* AI Services */}
        <TabsContent value="ai" className="space-y-4">
          {SERVICE_CONFIGS.filter(s => ['openai', 'anthropic'].includes(s.name)).map(service => (
            <ServiceCard
              key={service.name}
              service={service}
              config={apiKeys[service.name]}
              editedKey={editedKeys[service.name] || ''}
              showKey={showKeys[service.name]}
              saving={saving === service.name}
              onEditKey={(value) => setEditedKeys(prev => ({ ...prev, [service.name]: value }))}
              onToggleShow={() => setShowKeys(prev => ({ ...prev, [service.name]: !prev[service.name] }))}
              onSave={() => handleSaveKey(service.name)}
              onValidate={() => handleValidateKey(service.name)}
              onToggleActive={(active) => handleToggleActive(service.name, active)}
              onDelete={() => handleDeleteKey(service.name)}
              maskKey={maskKey}
            />
          ))}
        </TabsContent>

        {/* Messaging Services */}
        <TabsContent value="messaging" className="space-y-4">
          {SERVICE_CONFIGS.filter(s => ['comtele', 'resend'].includes(s.name)).map(service => (
            <ServiceCard
              key={service.name}
              service={service}
              config={apiKeys[service.name]}
              editedKey={editedKeys[service.name] || ''}
              showKey={showKeys[service.name]}
              saving={saving === service.name}
              onEditKey={(value) => setEditedKeys(prev => ({ ...prev, [service.name]: value }))}
              onToggleShow={() => setShowKeys(prev => ({ ...prev, [service.name]: !prev[service.name] }))}
              onSave={() => handleSaveKey(service.name)}
              onValidate={() => handleValidateKey(service.name)}
              onToggleActive={(active) => handleToggleActive(service.name, active)}
              onDelete={() => handleDeleteKey(service.name)}
              maskKey={maskKey}
            />
          ))}
        </TabsContent>

        {/* Audit History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription>
                Últimas 20 alterações nas configurações de API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma alteração registrada ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          log.action === 'created' ? 'bg-green-100' :
                          log.action === 'deleted' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {log.action === 'created' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : log.action === 'deleted' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {SERVICE_CONFIGS.find(s => s.name === log.service_name)?.label || log.service_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getActionLabel(log.action)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ServiceCardProps {
  service: typeof SERVICE_CONFIGS[0];
  config?: ApiKeyConfig;
  editedKey: string;
  showKey?: boolean;
  saving: boolean;
  onEditKey: (value: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onValidate: () => void;
  onToggleActive: (active: boolean) => void;
  onDelete: () => void;
  maskKey: (key: string) => string;
}

function ServiceCard({
  service,
  config,
  editedKey,
  showKey,
  saving,
  onEditKey,
  onToggleShow,
  onSave,
  onValidate,
  onToggleActive,
  onDelete,
  maskKey
}: ServiceCardProps) {
  const Icon = service.icon;
  const hasKey = !!config?.api_key_encrypted;

  return (
    <Card className={`transition-all ${hasKey ? 'border-green-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${service.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{service.label}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasKey ? (
              <>
                {config.is_validated ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Validada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    <Clock className="h-3 w-3 mr-1" />
                    Não validada
                  </Badge>
                )}
                <Switch
                  checked={config.is_active}
                  onCheckedChange={onToggleActive}
                />
              </>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Usando padrão
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasKey && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm flex-1">
              {showKey ? config.api_key_encrypted : maskKey(config.api_key_encrypted)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleShow}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="sr-only">Nova chave de API</Label>
            <Input
              type="password"
              placeholder={hasKey ? "Nova chave (deixe vazio para manter)" : "Cole sua chave de API aqui"}
              value={editedKey}
              onChange={(e) => onEditKey(e.target.value)}
            />
          </div>
          <Button
            onClick={onSave}
            disabled={!editedKey || saving}
            className="gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>

        {hasKey && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onValidate}
              disabled={saving}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Validar Chave
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Excluir
            </Button>
            <a
              href={service.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-muted-foreground hover:text-foreground"
            >
              Ver documentação →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
