

# Emails Premium em Portugues + Verificacao do Fluxo do Motoboy

---

## PARTE 1: Emails de Autenticacao Premium

### Problema Atual
Os emails de confirmacao de cadastro e recuperacao de senha estao sendo enviados pelo sistema padrao, em ingles, sem branding, sem cores -- completamente fora do padrao da plataforma.

### Solucao
Criar templates de email HTML premium com a identidade visual da Bibi Motos, 100% em portugues, sem imagens (para evitar bloqueio por provedores).

### Passo 1: Configurar dominio de email
O projeto ja tem dominio customizado (`www.bibimotos.com.br`), mas ainda nao tem dominio de email configurado. Sera necessario configurar o dominio de envio para que os emails venham de um endereco profissional (ex: `noreply@bibimotos.com.br`).

O usuario precisara confirmar a configuracao do dominio de email.

### Passo 2: Criar templates com a ferramenta de scaffolding
Usar a ferramenta automatica para gerar os 6 templates de email de autenticacao:
- **Confirmacao de cadastro** (signup)
- **Recuperacao de senha** (recovery)
- **Convite** (invite)
- **Magic link** (magic-link)
- **Mudanca de email** (email-change)
- **Reautenticacao** (reauthentication)

### Passo 3: Aplicar identidade visual da marca
Cada template sera customizado com:
- **Cores**: Roxo primario (`hsl(262, 83%, 58%)`) nos botoes e destaques
- **Accent dourado**: (`hsl(280, 90%, 66%)`) em detalhes
- **Foreground**: Texto escuro (`hsl(240, 10%, 8%)`)
- **Muted**: Texto secundario (`hsl(240, 4%, 46%)`)
- **Border radius**: 8px (--radius do projeto)
- **Font**: Inter, -apple-system, sans-serif
- **Fundo do email**: Branco (#ffffff) -- obrigatorio para compatibilidade
- **Zero imagens** -- tudo em HTML puro com emoji decorativo
- **100% em portugues** -- nenhuma palavra em ingles
- **Assuntos engajantes** -- ex: "Falta pouco para voce comecar!", "Sua nova senha esta aqui"
- **Estrutura**: Topo com nome da marca + emoji, headline, subtitulo, botao CTA, rodape com copyright

### Passo 4: Deploy da funcao
Implantar a edge function `auth-email-hook` que intercepta os eventos de autenticacao e envia os emails customizados.

---

## PARTE 2: Verificacao do Fluxo do Motoboy

### O que sera verificado
1. **Apos cadastro**: O motoboy consegue fazer login e acessar o dashboard?
2. **Tela de pendente**: Aparece a tela de "aguardando aprovacao" corretamente?
3. **Completar cadastro**: O formulario de KYC (6 etapas) esta acessivel?
4. **Compra de creditos**: A loja de creditos esta visivel mesmo antes da aprovacao?
5. **Fluxo completo**: Cadastro -> Login -> Completar dados -> Aguardar aprovacao -> Comprar creditos

### Analise Atual (ja verificada no codigo)
- `useAuth.tsx` ja faz auto-provisioning: ao logar, cria automaticamente o registro em `drivers` com `is_approved: false`
- `DriverDashboard.tsx` ja mostra tela de pendente quando `is_approved = false`
- `CompleteRegistration.tsx` tem 6 etapas completas (tipo, foto, dados, documentos, selfie, revisao)
- `CreditsShop.tsx` existe e e acessivel no dashboard do motorista

Se algum problema for encontrado durante a implementacao, sera corrigido imediatamente.

---

## Arquivos que serao criados/modificados

| Arquivo | Acao |
|---|---|
| `supabase/functions/_shared/email-templates/signup.tsx` | Criar (template de confirmacao) |
| `supabase/functions/_shared/email-templates/recovery.tsx` | Criar (template de recuperacao) |
| `supabase/functions/_shared/email-templates/invite.tsx` | Criar (template de convite) |
| `supabase/functions/_shared/email-templates/magic-link.tsx` | Criar (template de magic link) |
| `supabase/functions/_shared/email-templates/email-change.tsx` | Criar (template de mudanca email) |
| `supabase/functions/_shared/email-templates/reauthentication.tsx` | Criar (template de reautenticacao) |
| `supabase/functions/auth-email-hook/index.ts` | Criar (funcao de roteamento) |
| `supabase/functions/auth-email-hook/deno.json` | Criar (config) |

