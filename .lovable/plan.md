# Plano de correções: responsividade, UX de papéis e auditoria de isolamento

## 1. Eliminar rolagem horizontal em todo o projeto

**Causa raiz observada:** o dashboard Super Admin (e franqueado) usa `StatsCards` com `lg:grid-cols-8` — 8 cards numa linha — o que excede 811px e força scroll lateral no container `overflow-auto`. As tabelas (`UsersManagement`, `LeadsManagement`, `FranchisesManagement`, etc.) também não têm wrapper responsivo.

**Correções:**
- `src/components/superadmin/StatsCards.tsx`: trocar grid para `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8`, reduzir tamanho de números (`text-2xl` em mobile), `min-w-0` nos cards.
- `src/pages/dashboard/SuperAdminDashboard.tsx`: container principal `overflow-x-hidden` + `max-w-full min-w-0`. Header do super admin idem.
- Todas as tabelas em `src/components/superadmin/*` e `src/components/dashboard/*`: envolver `<Table>` em `<div className="w-full overflow-x-auto rounded-md border">` (scroll **interno** da tabela, não da página) e remover larguras fixas (`w-64`, `w-44`) em `Input`/`Select` substituindo por `w-full sm:w-64`.
- `FranchiseAdminDashboard`, `DriverDashboard`, `MerchantDashboard`, `PassengerDashboard`: adicionar `overflow-x-hidden` no root + revisar grids com >4 colunas no breakpoint `lg`.
- `index.css`: adicionar `html, body { overflow-x: hidden; }` como rede de segurança.

## 2. UX: atribuir franquia/cidade ao adicionar papel

Hoje `UsersManagement` tem dois fluxos separados: "Add papel" (só insere role) e botão Crown (converte em dono). Vamos unificar.

**Mudanças em `src/components/superadmin/UsersManagement.tsx`:**
- Substituir o `Select` "Add papel" por um botão "Adicionar papel" que abre um **Dialog** com:
  1. Select de papel (super_admin, franchise_admin, driver, passenger, merchant)
  2. Se papel ≠ super_admin: Select obrigatório de **Franquia** (com busca, agrupada por estado)
  3. Se papel = franchise_admin: aviso "Este usuário se tornará dono da franquia selecionada" (substitui owner se existir, com confirmação)
  4. Se papel = driver/passenger/merchant: cria registro em `drivers`/`passengers`/`merchants` vinculado ao `franchise_id` escolhido (com `is_approved=false` quando aplicável)
- Atualizar `profiles.city` com a cidade da franquia escolhida para reforçar binding.
- Remover botão Crown isolado (funcionalidade absorvida).
- Coluna "Cidade(s)" passa a refletir as franquias reais (já faz, manter).

## 3. Auditoria de isolamento cidade/franquia

**Achados na exploração:**
- `useAuth.autoCreateEntityRecord` já bloqueia fallback cross-city (bom). Porém só roda para `passenger/driver/merchant` via metadata — usuários criados por convite ou pelo Super Admin podem ficar sem entity record.
- `accept-franchise-invite`: marca `profile_complete=false` mas **não preenche `profiles.city`** com a cidade da franquia. Vamos preencher via JOIN com `franchises→cities`.
- `send-franchise-invite` "direct_transfer": substitui owner sem registrar histórico nem notificar dono anterior. Adicionar registro em `franchise_transfer_history` e bloquear se franquia tem operações ativas (rides em andamento).
- `FranchisesManagement` permite criar franquia sem `city_id` validado como único — duas franquias na mesma cidade quebram `useAuth` (que faz `.limit(1)`). Adicionar UNIQUE constraint via migração: `UNIQUE(city_id) WHERE is_active=true` (índice parcial).
- `DriverRegistrationForm` e auto-cadastros: validar via RPC `validate_franchise_belongs_to_city(franchise_id, city_id)` antes de inserir.
- RLS: revisar `drivers`, `passengers`, `merchants`, `rides` para garantir filtro por `franchise_id` do usuário (`has_role(franchise_admin) AND franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid())`). Rodar `supabase--linter` e corrigir achados.
- Dashboards: `FranchiseAdminDashboard` já filtra por `selectedFranchiseId`, mas `useRealtimeNotifications` escuta apenas a selecionada — alterar para escutar **todas** as franquias do owner (lista de IDs).

## 4. Varredura de bugs/gaps adicionais

- `FranchiseLanding` aceita rotas `/cidade/:slug` e subdomínio — confirmar redirect 301 de path para subdomínio (memória já registra preferência).
- Verificar `auth-email-hook` ainda referencia "Lovable" em algum template (memória white-label).
- `LeadsManagement`: já tem DUP badges; adicionar bloqueio para converter lead duplicado sem confirmação.
- `validate-api-key`/`get-franchise-api-key`: confirmar fallback global do Super Admin (memória).

## Arquivos a alterar

**UI/responsividade:**
- `src/index.css`
- `src/components/superadmin/StatsCards.tsx`
- `src/pages/dashboard/SuperAdminDashboard.tsx`
- `src/pages/dashboard/FranchiseAdminDashboard.tsx`
- `src/pages/dashboard/{Driver,Passenger,Merchant}Dashboard.tsx`
- `src/components/superadmin/{UsersManagement,LeadsManagement,FranchisesManagement,FranchiseBillingManagement,FranchiseTransferManagement,FranchisePricingConfig,DriverTransferRequests}.tsx`

**UX papel+franquia:**
- `src/components/superadmin/UsersManagement.tsx` (refactor para Dialog unificado)

**Backend/segurança:**
- Migração: índice único parcial em `franchises(city_id)` para `is_active`; RPC `validate_franchise_belongs_to_city`; revisão RLS em `drivers/passengers/merchants/rides`.
- `supabase/functions/accept-franchise-invite/index.ts`: preencher `profiles.city` e `profiles.city_id` da franquia.
- `supabase/functions/send-franchise-invite/index.ts`: registrar `franchise_transfer_history` no direct_transfer, bloquear se houver corrida ativa.
- `src/hooks/useRealtimeNotifications.ts`: aceitar array de `franchise_ids`.

## Saída esperada
- Zero rolagem horizontal em qualquer viewport ≥320px.
- Adicionar papel ao usuário em **uma única ação** já vincula franquia/cidade corretas.
- Garantia de que nenhum cadastro fica órfão de franquia/cidade e que dados de franquias diferentes não se misturam.
