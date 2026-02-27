
# PWA + Notificacoes Push + Banner de Instalacao

## Situacao Atual
- **Nenhuma configuracao PWA** existe no projeto (sem manifest.json, sem service worker, sem vite-plugin-pwa)
- **Nenhuma notificacao push** esta implementada (apenas notificacoes in-app via Supabase Realtime e toasts)
- **SMS ja funciona** via Comtele (edge function `send-sms` + `src/lib/sms.ts` com funcoes de envio)
- Nao existe banner de instalacao nem logica de deteccao de dispositivo

---

## O que sera implementado

### 1. Configurar PWA Completa (Installable Web App)

**Instalar dependencia**: `vite-plugin-pwa`

**Configurar `vite.config.ts`**:
- Adicionar plugin VitePWA com manifest em portugues
- Nome: "Bibi Motos", short_name: "Bibi Motos"
- Cores da marca (roxo primario `#7c3aed`, fundo branco)
- Icones PWA gerados a partir do `favicon.png` existente (192x192 e 512x512)
- `display: "standalone"` para experiencia de app nativo
- `navigateFallbackDenylist: [/^\/~oauth/]` para nao cachear rotas de OAuth
- Service worker com estrategia de cache para assets estaticos

**Atualizar `index.html`**:
- Adicionar meta tags para mobile (theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style)
- Link para manifest.webmanifest

**Criar icones PWA**:
- `public/pwa-192x192.png` e `public/pwa-512x512.png` (reaproveitando o favicon.png existente)

### 2. Banner de Instalacao Premium (so para usuarios logados)

**Novo componente: `src/components/pwa/InstallAppBanner.tsx`**

- Tarja fixa no topo da tela, visivel e bonita, com gradiente da marca (roxo)
- Texto: "Instale o Bibi Motos no seu celular" + botao "Instalar"
- **Logica inteligente**:
  - So aparece para usuarios **logados** (verifica `useAuth`)
  - Detecta se ja esta instalado como PWA (`window.matchMedia('(display-mode: standalone)')`)
  - Se ja instalou, nao mostra
  - Armazena no `localStorage` se o usuario dispensou o banner
  - Escuta o evento `beforeinstallprompt` (Android/Chrome) para disparo direto
  - No iOS (Safari): mostra instrucoes "Toque em Compartilhar > Adicionar a Tela de Inicio" com icones visuais, driblando a limitacao do iOS que nao suporta `beforeinstallprompt`
- Botao de fechar (X) para dispensar temporariamente

**Integrar nos dashboards**: Renderizar o `InstallAppBanner` dentro do `Dashboard.tsx` (apos login, antes do conteudo), garantindo que apareca para motoristas, passageiros e lojistas.

### 3. Notificacoes Push Web (com badge no icone)

**Novo hook: `src/hooks/usePushNotifications.ts`**

- Solicita permissao de notificacao ao usuario (`Notification.requestPermission()`)
- Registra o service worker para receber push events
- Armazena o subscription endpoint no banco (nova coluna `push_subscription` na tabela `profiles`)
- Funcoes: `requestPermission()`, `isSupported()`, `isSubscribed()`

**Atualizar Service Worker (via vite-plugin-pwa)**:
- Adicionar handler de evento `push` para exibir notificacoes nativas do SO
- Adicionar handler de evento `notificationclick` para abrir o app na rota correta
- Configurar `badge` (numero no icone do app) usando `navigator.setAppBadge(count)` quando houver notificacoes nao lidas

**Novo componente: `src/components/pwa/PushNotificationPrompt.tsx`**

- Modal/card amigavel pedindo autorizacao para notificacoes
- Aparece apos o usuario logar pela primeira vez (ou apos instalar)
- Texto explicativo: "Ative as notificacoes para nao perder nenhuma corrida"
- Botoes: "Ativar notificacoes" e "Agora nao"
- Vibrar o dispositivo em notificacoes criticas (corrida aceita, SOS): `navigator.vibrate([200, 100, 200])`

**Integracao com notificacoes existentes**:
- Conectar o hook `useRealtimeNotifications` existente com o `usePushNotifications`
- Quando uma notificacao Realtime chegar E o app estiver em background, dispara push nativa
- Atualizar o badge count no icone do app: `navigator.setAppBadge(unreadCount)`
- Limpar badge quando o usuario abrir o app: `navigator.clearAppBadge()`

### 4. Migracao de Banco

**Nova coluna na tabela `profiles`**:
```sql
ALTER TABLE profiles ADD COLUMN push_subscription jsonb DEFAULT NULL;
```

Armazena o objeto de subscription do Push API para envio server-side futuro.

---

## Arquivos que serao criados/modificados

| Arquivo | Acao |
|---|---|
| `vite.config.ts` | Modificar - adicionar vite-plugin-pwa |
| `index.html` | Modificar - meta tags mobile |
| `public/pwa-192x192.png` | Criar - icone PWA |
| `public/pwa-512x512.png` | Criar - icone PWA |
| `src/components/pwa/InstallAppBanner.tsx` | Criar - banner de instalacao |
| `src/components/pwa/PushNotificationPrompt.tsx` | Criar - prompt de push |
| `src/hooks/usePushNotifications.ts` | Criar - hook de push notifications |
| `src/pages/Dashboard.tsx` | Modificar - integrar banner e prompt |
| `src/hooks/useRealtimeNotifications.ts` | Modificar - integrar com push nativo + badge |

## Compatibilidade iOS
- O `beforeinstallprompt` nao funciona no Safari/iOS
- O banner detecta iOS e mostra instrucoes visuais com icones de "Compartilhar > Adicionar a Tela de Inicio"
- Push notifications no iOS Safari so funcionam a partir do iOS 16.4+ com PWA instalada -- o sistema detecta essa limitacao e informa o usuario
- `navigator.setAppBadge` funciona no iOS 16.4+ quando o app esta instalado como PWA

## SMS
O sistema de SMS ja esta **100% funcional** via Comtele (`send-sms` edge function + `src/lib/sms.ts`). Nenhuma alteracao necessaria.
