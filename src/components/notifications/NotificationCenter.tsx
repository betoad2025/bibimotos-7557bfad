import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Sparkles, RefreshCw, Users, Bike, Store, Filter,
  Mail, MessageSquare, Ban, Eye, CheckCircle2, XCircle,
  Loader2, History, Search
} from "lucide-react";

interface NotificationCenterProps {
  franchiseId: string;
  franchiseName: string;
}

interface RecipientFilter {
  is_approved?: boolean;
  is_online?: boolean;
  registration_complete?: boolean;
  is_active?: boolean;
}

type RecipientType = 'drivers' | 'passengers' | 'merchants' | 'all';

export function NotificationCenter({ franchiseId, franchiseName }: NotificationCenterProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [modifyPrompt, setModifyPrompt] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  
  // Recipients
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [filters, setFilters] = useState<RecipientFilter>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Options
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  
  // History
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchBlockedUsers();
    fetchBroadcasts();
  }, [franchiseId, recipientType, filters]);

  const fetchUsers = async () => {
    let allUsers: any[] = [];

    if (recipientType === "drivers" || recipientType === "all") {
      let query = supabase
        .from("drivers")
        .select("id, user_id, is_approved, is_online, registration_complete")
        .eq("franchise_id", franchiseId);

      if (filters.is_approved !== undefined) query = query.eq("is_approved", filters.is_approved);
      if (filters.is_online !== undefined) query = query.eq("is_online", filters.is_online);
      if (filters.registration_complete !== undefined) query = query.eq("registration_complete", filters.registration_complete);

      const { data } = await query;
      if (data) {
        for (const d of data) {
          const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("user_id", d.user_id).single();
          allUsers.push({ ...d, type: "driver", name: profile?.full_name, email: profile?.email, phone: profile?.phone });
        }
      }
    }

    if (recipientType === "passengers" || recipientType === "all") {
      const { data } = await supabase.from("passengers").select("id, user_id").eq("franchise_id", franchiseId);
      if (data) {
        for (const p of data) {
          const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("user_id", p.user_id).single();
          allUsers.push({ ...p, type: "passenger", name: profile?.full_name, email: profile?.email, phone: profile?.phone });
        }
      }
    }

    if (recipientType === "merchants" || recipientType === "all") {
      const { data } = await supabase.from("merchants").select("id, user_id, is_approved").eq("franchise_id", franchiseId);
      if (data) {
        for (const m of data) {
          const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("user_id", m.user_id).single();
          allUsers.push({ ...m, type: "merchant", name: profile?.full_name, email: profile?.email, phone: profile?.phone });
        }
      }
    }

    if (searchTerm) {
      allUsers = allUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
      );
    }

    setUsers(allUsers);
  };

  const fetchBlockedUsers = async () => {
    const { data } = await supabase
      .from("notification_blocked_users")
      .select("*, profiles:user_id(full_name, email)")
      .eq("franchise_id", franchiseId);

    setBlockedUsers(data || []);
  };

  const fetchBroadcasts = async () => {
    const { data } = await supabase
      .from("notification_broadcasts")
      .select("*")
      .eq("franchise_id", franchiseId)
      .order("created_at", { ascending: false })
      .limit(20);

    setBroadcasts(data || []);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Digite as informações para gerar", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-notification", {
        body: { action: "generate", prompt },
      });

      if (error) throw error;

      setTitle(data.title);
      setContent(data.content);
      toast({ title: "Conteúdo gerado!", description: "Revise e aprove ou solicite modificações." });
    } catch (error: any) {
      toast({ title: "Erro ao gerar", description: error.message, variant: "destructive" });
    }
    setIsGenerating(false);
  };

  const handleModify = async () => {
    if (!modifyPrompt.trim()) {
      toast({ title: "Digite o que deseja modificar", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-notification", {
        body: { 
          action: "modify", 
          prompt: modifyPrompt,
          content: { title, content },
        },
      });

      if (error) throw error;

      setTitle(data.title);
      setContent(data.content);
      setModifyPrompt("");
      toast({ title: "Conteúdo modificado!" });
    } catch (error: any) {
      toast({ title: "Erro ao modificar", description: error.message, variant: "destructive" });
    }
    setIsGenerating(false);
  };

  const handlePreview = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-notification", {
        body: { 
          action: "preview_html",
          content: { title, content },
          franchise_name: franchiseName,
        },
      });

      if (error) throw error;

      setHtmlPreview(data.html);
      setShowPreview(true);
    } catch (error: any) {
      toast({ title: "Erro ao gerar preview", description: error.message, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }

    const recipientCount = selectedUsers.length > 0 
      ? selectedUsers.length 
      : users.filter(u => !blockedUsers.some(b => b.user_id === u.user_id)).length;

    if (recipientCount === 0) {
      toast({ title: "Nenhum destinatário selecionado", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      // Create broadcast record
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: broadcast, error: insertError } = await supabase
        .from("notification_broadcasts")
        .insert({
          franchise_id: franchiseId,
          title,
          content,
          recipient_type: recipientType,
          recipient_filter: filters as any,
          created_by: userId!,
          status: "sending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send broadcast
      const { data, error } = await supabase.functions.invoke("send-broadcast", {
        body: {
          broadcast_id: broadcast.id,
          franchise_id: franchiseId,
          title,
          content,
          recipient_type: recipientType,
          recipient_filter: filters,
          selected_user_ids: selectedUsers.length > 0 ? selectedUsers : null,
          send_email: sendEmail,
          send_sms: sendSms,
        },
      });

      if (error) throw error;

      toast({ 
        title: "Notificação enviada!", 
        description: `Enviado para ${data.sent_count} destinatários.` 
      });

      // Reset form
      setTitle("");
      setContent("");
      setPrompt("");
      setSelectedUsers([]);
      fetchBroadcasts();
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
    setIsSending(false);
  };

  const toggleBlockUser = async (userId: string, isBlocked: boolean) => {
    if (isBlocked) {
      await supabase
        .from("notification_blocked_users")
        .delete()
        .eq("user_id", userId)
        .eq("franchise_id", franchiseId);
    } else {
      await supabase
        .from("notification_blocked_users")
        .insert({
          user_id: userId,
          franchise_id: franchiseId,
          blocked_by: (await supabase.auth.getUser()).data.user?.id,
        });
    }
    fetchBlockedUsers();
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const validUsers = users.filter(u => !blockedUsers.some(b => b.user_id === u.user_id));
    setSelectedUsers(validUsers.map(u => u.user_id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "driver": return <Bike className="h-4 w-4" />;
      case "passenger": return <Users className="h-4 w-4" />;
      case "merchant": return <Store className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "driver": return "bg-green-100 text-green-700";
      case "passenger": return "bg-blue-100 text-blue-700";
      case "merchant": return "bg-orange-100 text-orange-700";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compor</TabsTrigger>
          <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Gerar com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Descreva o que deseja comunicar</Label>
                <Textarea
                  placeholder="Ex: Informar sobre nova promoção de 20% de desconto nas corridas de segunda-feira..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Gerar Conteúdo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título (Hook)</Label>
                <Input
                  placeholder="Título chamativo que aumenta taxa de abertura..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="Conteúdo da mensagem..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                />
              </div>

              {title && content && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Peça modificações: ex. 'deixe mais formal', 'adicione emojis'..."
                      value={modifyPrompt}
                      onChange={(e) => setModifyPrompt(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleModify} disabled={isGenerating}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      Modificar
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Email
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opções de Envio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(!!c)} />
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={sendSms} onCheckedChange={(c) => setSendSms(!!c)} />
                  <MessageSquare className="h-4 w-4" />
                  <span>SMS</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedUsers.length > 0 
                    ? `${selectedUsers.length} destinatários selecionados`
                    : `${users.filter(u => !blockedUsers.some(b => b.user_id === u.user_id)).length} destinatários (todos)`
                  }
                </div>
                <Button onClick={handleSend} disabled={isSending || (!title || !content)}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Notificação
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={recipientType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("all")}
                >
                  Todos
                </Button>
                <Button
                  variant={recipientType === "drivers" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("drivers")}
                >
                  <Bike className="h-4 w-4 mr-1" />
                  Motoristas
                </Button>
                <Button
                  variant={recipientType === "passengers" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("passengers")}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Passageiros
                </Button>
                <Button
                  variant={recipientType === "merchants" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecipientType("merchants")}
                >
                  <Store className="h-4 w-4 mr-1" />
                  Lojistas
                </Button>
              </div>

              {(recipientType === "drivers" || recipientType === "all") && (
                <div className="flex flex-wrap gap-4 pt-2 border-t">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.is_approved === true}
                      onCheckedChange={(c) => setFilters(prev => ({ ...prev, is_approved: c ? true : undefined }))}
                    />
                    Aprovados
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.is_approved === false}
                      onCheckedChange={(c) => setFilters(prev => ({ ...prev, is_approved: c ? false : undefined }))}
                    />
                    Pendentes
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.is_online === true}
                      onCheckedChange={(c) => setFilters(prev => ({ ...prev, is_online: c ? true : undefined }))}
                    />
                    Online
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={filters.registration_complete === false}
                      onCheckedChange={(c) => setFilters(prev => ({ ...prev, registration_complete: c ? false : undefined }))}
                    />
                    Cadastro Incompleto
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={selectAllUsers}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" onClick={() => setSelectedUsers([])}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Destinatários ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {users.map((user) => {
                    const isBlocked = blockedUsers.some(b => b.user_id === user.user_id);
                    const isSelected = selectedUsers.includes(user.user_id);

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isBlocked ? 'bg-red-50 opacity-60' : isSelected ? 'bg-purple-50 border-purple-300' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            disabled={isBlocked}
                            onCheckedChange={() => toggleSelectUser(user.user_id)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name || 'Sem nome'}</span>
                              <Badge variant="secondary" className={getTypeBadgeColor(user.type)}>
                                {getTypeIcon(user.type)}
                                <span className="ml-1 capitalize">{user.type}</span>
                              </Badge>
                              {user.is_approved === false && (
                                <Badge variant="outline" className="text-yellow-600">Pendente</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBlockUser(user.user_id, isBlocked)}
                        >
                          {isBlocked ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Ban className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" />
                Usuários Bloqueados ({blockedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blockedUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum usuário bloqueado
                </p>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-red-50"
                    >
                      <div>
                        <p className="font-medium">{blocked.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{blocked.profiles?.email}</p>
                        {blocked.reason && (
                          <p className="text-sm text-red-600">Motivo: {blocked.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBlockUser(blocked.user_id, true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Desbloquear
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Envios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {broadcasts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum envio realizado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{broadcast.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {broadcast.content}
                          </p>
                        </div>
                        <Badge variant={broadcast.status === "sent" ? "default" : "secondary"}>
                          {broadcast.status === "sent" ? "Enviado" : broadcast.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(broadcast.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>{broadcast.sent_count} enviados</span>
                        <Badge variant="outline">{broadcast.recipient_type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* HTML Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold">Preview do Email</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-auto max-h-[70vh]">
              <iframe
                srcDoc={htmlPreview}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
