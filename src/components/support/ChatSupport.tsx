import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "user" | "support" | "bot";
  timestamp: Date;
}

const FAQ_RESPONSES: Record<string, string> = {
  "como funciona": "O Bibi Motos conecta você a motoristas de mototáxi. Basta informar seu destino, confirmar o valor e aguardar seu motorista chegar!",
  "preço": "O preço é calculado com base na distância + taxa base. Você sempre vê o valor antes de confirmar.",
  "pagamento": "Aceitamos pagamento em dinheiro, PIX ou cartão (dependendo da cidade).",
  "cancelar": "Você pode cancelar a corrida antes do motorista iniciar a viagem. Cancelamentos frequentes podem afetar sua reputação.",
  "gorjeta": "Após a corrida, você pode dar uma gorjeta ao motorista. É opcional mas muito apreciado!",
  "avaliação": "Avalie seu motorista após cada corrida. Isso ajuda a manter a qualidade do serviço.",
  "segurança": "Todos os motoristas passam por verificação. Você pode compartilhar sua viagem em tempo real com familiares.",
  "creditos": "Motoristas usam créditos para aceitar corridas. Os créditos podem ser comprados via PIX.",
  "ajuda": "Descreva seu problema que tentarei ajudar! Se precisar falar com um atendente, envie 'falar com humano'.",
  "humano": "Sua solicitação foi encaminhada para nossa equipe. Entraremos em contato em breve via WhatsApp!",
};

export function ChatSupport() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setMessages([
        {
          id: "welcome",
          content: `Olá${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋 Como posso ajudar?\n\nDicas: pergunte sobre "preço", "pagamento", "cancelar" ou descreva seu problema.`,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const findBotResponse = (userMessage: string): string | null => {
    const lowerMessage = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Try bot response first
    const botResponse = findBotResponse(userMessage.content);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (botResponse) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: botResponse,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Entendi sua dúvida! 🤔 Nossa equipe de suporte entrará em contato via WhatsApp em breve. Enquanto isso, você pode tentar perguntar sobre: preço, pagamento, cancelar, gorjeta, segurança.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }

    setSending(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <span className="font-semibold">Suporte Bibi</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {format(msg.timestamp, "HH:mm")}
                </p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
