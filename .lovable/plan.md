

## Plano: Bloqueio Total de Dependências Lovable Cloud / AI Gateway

### Contexto

Existem **3 arquivos** com dependências diretas de serviços proprietários Lovable que precisam ser reescritos:

1. **`supabase/functions/auth-email-hook/index.ts`** — Usa `@lovable.dev/email-js`, `@lovable.dev/webhooks-js` e `LOVABLE_API_KEY` para enviar emails de autenticação
2. **`supabase/functions/generate-notification/index.ts`** — Usa `ai.gateway.lovable.dev` + `LOVABLE_API_KEY` para gerar notificações com IA
3. **`supabase/functions/notify-driver-registration/index.ts`** — Usa `ai.gateway.lovable.dev` + `LOVABLE_API_KEY` para extrair dados de documentos com IA

Além disso, referências a `lovable.app` em `src/App.tsx` e `src/hooks/useFranchiseBySubdomain.ts` precisam ser limpas.

---

### O que será feito

#### 1. Reescrever `auth-email-hook` — Email via Resend

- Remover imports de `@lovable.dev/email-js` e `@lovable.dev/webhooks-js`
- Substituir `sendLovableEmail` por envio direto via **Resend API** (`https://api.resend.com/emails`)
- Usar a secret `RESEND_API_KEY` (será solicitada ao usuário)
- Manter os templates React Email existentes (signup, recovery, etc.) — eles não dependem do Lovable
- Reescrever a verificação de webhook para usar validação JWT padrão do Supabase em vez de `verifyWebhookRequest` do Lovable
- O email será enviado como `noreply@bibimotos.com.br` via Resend

#### 2. Reescrever `generate-notification` — IA via Google Gemini direto

- Substituir `ai.gateway.lovable.dev` por `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Usar a secret `GOOGLE_AI_API_KEY` (será solicitada ao usuário)
- Remover toda referência a `LOVABLE_API_KEY`
- Manter a mesma lógica de geração e modificação de conteúdo

#### 3. Reescrever `notify-driver-registration` — IA via Google Gemini direto

- Mesma substituição: `ai.gateway.lovable.dev` → API direta do Google Gemini
- Usar `GOOGLE_AI_API_KEY`
- Remover `LOVABLE_API_KEY`
- Manter a funcionalidade de extração de dados de documentos com visão

#### 4. Limpar referências a `lovable.app` no frontend

- Em `src/App.tsx`: remover `bibimotos.lovable.app` da lista de domínios principais e ajustar a lógica de detecção de subdomínio
- Em `src/hooks/useFranchiseBySubdomain.ts`: substituir check `lovable.app` por check de `localhost` apenas

---

### Secrets necessárias

Antes de implementar, serão solicitadas **2 secrets**:

| Secret | Para quê |
|--------|----------|
| `RESEND_API_KEY` | Envio de emails de autenticação (signup, recovery, etc.) |
| `GOOGLE_AI_API_KEY` | Chamadas de IA para geração de notificações e extração de documentos |

---

### Resultado final

Após a implementação:
- **Zero** chamadas a `ai.gateway.lovable.dev`
- **Zero** imports de `@lovable.dev/*`
- **Zero** uso de `LOVABLE_API_KEY`
- **Zero** referências funcionais a `lovable.app`
- Todo IA passa pela API do Google Gemini com sua chave
- Todo email passa pelo Resend com sua chave
- O sistema é 100% independente do ecossistema Lovable

