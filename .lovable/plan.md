
# Auditoria Completa + Plano de Producao 100%

## Diagnostico: O Que Esta Funcionando vs Quebrado

### FUNCIONANDO (com ressalvas)
| Funcionalidade | Status | Observacao |
|---|---|---|
| Login/Logout | OK | Autenticacao Supabase funcionando |
| Landing Franquia (`FranchiseLanding.tsx`) | OK | Formulario de leads salva em `franchise_leads` |
| Landing Cidade (`CityLanding.tsx`) | OK | Carrega franquia por subdomain, injeta pixels |
| Dashboard Super Admin - Sidebar | OK | Navegacao vertical correta |
| Dashboard Super Admin - Stats | OK | Contadores funcionando |
| Dashboard Super Admin - Cidades | OK | CRUD com abas (Dados/Operacional/Marketing) |
| Dashboard Super Admin - Franquias | OK | Listagem e gerenciamento |
| Dashboard Super Admin - Usuarios | OK | Listagem com roles |
| Dashboard Super Admin - Leads | OK | Gerenciamento de leads |
| Dashboard Super Admin - Billing | OK | Faturamento de franquias |
| Dashboard Super Admin - Monitoramento | OK | Tabela de corridas ativas em tempo real |
| Dashboard Super Admin - Emergencias | OK | Alertas SOS |
| Dashboard Franqueado - Stats | OK | Metricas da franquia |
| Dashboard Franqueado - Motoristas | OK | Aprovacao/listagem |
| Dashboard Motorista - Perfil | OK | Dados do motorista |
| Dashboard Motorista - Online/Offline | OK | Toggle com validacao de creditos |
| Dashboard Motorista - Creditos | OK | Loja de creditos com PIX mock |
| Dashboard Lojista | OK | CRUD de entregas |
| Completar Cadastro | OK | Upload de documentos KYC |

### PROBLEMAS CRITICOS (Precisam corrigir)

| # | Problema | Impacto | Onde |
|---|---|---|---|
| 1 | **Registro nao salva role do usuario** | Usuario cadastra como "Motoboy" mas o `userType` nao e salvo. Resultado: cai na tela de "Cadastro em analise" sem nunca ser vinculado a uma franquia | `Register.tsx` linha 62 |
| 2 | **Registro nao vincula usuario a cidade/franquia** | Passageiros e motoristas nao sao criados nas tabelas `passengers`/`drivers` automaticamente. Ficam "orfaos" | `Register.tsx` |
| 3 | **Botao "Solicitar Corrida" no Hero nao faz nada** | CTA principal da landing sem acao (sem `onClick` ou `Link`) | `Hero.tsx` linha 44 |
| 4 | **Botao "Seja um Motoboy" no Hero nao faz nada** | Segundo CTA sem link | `Hero.tsx` linha 48 |
| 5 | **Botao "Quero ser franqueado" na secao Franchise nao faz nada** | Sem `onClick` ou link para formulario de contato | `Franchise.tsx` linha 59 |
| 6 | **Parametro `?role=` da URL ignorado no Register** | Links da CityLanding apontam para `/register` mas o formulario nao le o parametro | `Register.tsx` |
| 7 | **Dashboard Passageiro sem dados quando usuario novo** | Se `passengers` nao tem registro, mostra "Carregando..." infinito | `PassengerDashboard.tsx` linha 198-204 |
| 8 | **CreditsShop usa PIX mock** | `handleCheckPayment` simula pagamento e confirma imediatamente sem gateway real | `CreditsShop.tsx` linha 152 |
| 9 | **Graficos do Franqueado usam dados estaticos** | `chartData`, `hourlyData`, `serviceTypeData` sao hardcoded, nao vem do banco | `FranchiseAdminDashboard.tsx` linhas 130-156 |
| 10 | **Google Maps depende de chave configurada** | `useGoogleMaps` chama edge function `geocode`. Chave `GOOGLE_MAPS_API_KEY` esta configurada, mas autocomplete pode falhar se a API nao estiver habilitada | `useGoogleMaps.ts` |
| 11 | **Franqueado nao tem filtro por cidade** | Dashboard do franqueado busca `franchises.owner_id = user.id` mas retorna so 1 franquia (`.maybeSingle()`) -- franqueados multi-cidade perdem dados | `FranchiseAdminDashboard.tsx` linha 67 |
| 12 | **Delivery price hardcoded** | Preco de entrega do lojista e fixo R$15 sem calculo real | `MerchantDashboard.tsx` linha 198 |
| 13 | **Nenhuma validacao de dados no CompleteRegistration** | Campos obrigatorios (CPF, telefone) nao sao validados antes do submit | `CompleteRegistration.tsx` |
| 14 | **Storage bucket 'documents' pode nao existir** | Upload de documentos KYC falha se bucket nao foi criado | `CompleteRegistration.tsx` linha 68 |

---

## Plano de Implementacao

### Fase 1: Fluxo de Registro Completo (Critico)

**Objetivo**: Quando um usuario se cadastra, ele deve:
1. Escolher seu papel (Passageiro/Motoboy/Lojista)
2. Ser vinculado automaticamente a uma franquia/cidade
3. Receber a role correta na tabela `user_roles`
4. Ter o registro criado na tabela apropriada (`passengers`/`drivers`/`merchants`)

**Arquivos modificados**:
- `src/pages/Register.tsx` - Salvar `userType` nos metadados do signup, ler `?role=` da URL, redirecionar para `/complete-registration` apos sucesso
- **Novo trigger SQL** (`handle_new_user`) - Ao criar perfil, ler `raw_user_meta_data.user_type` e:
  - Inserir role em `user_roles`
  - Criar registro em `passengers`/`drivers`/`merchants` vinculado a franquia da cidade de origem (se informada via `raw_user_meta_data.city_id`)
- `src/pages/CompleteRegistration.tsx` - Adicionar validacao de campos obrigatorios

**Novo: Trigger `on_auth_user_created`**:
```text
1. Le user_metadata (user_type, city_id)
2. Cria profile em profiles
3. Insere role em user_roles
4. Se passenger: insere em passengers (com franchise_id da cidade)
5. Se driver: insere em drivers (com franchise_id, is_approved=false)
6. Se merchant: insere em merchants (com franchise_id, is_approved=false)
```

### Fase 2: CTAs e Links Funcionais

**Arquivos modificados**:
- `src/components/landing/Hero.tsx` - "Solicitar Corrida" linka para `/register?role=passenger`, "Seja um Motoboy" linka para `/register?role=driver`
- `src/components/landing/Franchise.tsx` - "Quero ser franqueado" faz scroll para secao de contato ou abre formulario de lead
- `src/pages/CityLanding.tsx` - Garantir que todos os CTAs preservem o `city_id` como parametro na URL de registro

### Fase 3: Dashboard do Franqueado - Multi-Cidade + Dados Reais

**Problema**: Franqueado com multiplas cidades ve so uma. Graficos sao mockados.

**Arquivos modificados**:
- `src/pages/dashboard/FranchiseAdminDashboard.tsx`:
  - Buscar TODAS as franquias do owner (`.select().eq('owner_id', user.id)`)
  - Adicionar seletor de cidade no topo
  - Substituir `chartData` hardcoded por query real agrupada por dia da semana
  - Substituir `hourlyData` por query real agrupada por hora
  - Substituir `serviceTypeData` por query real contando `service_type` das rides

### Fase 4: Dashboard Passageiro - Estado Vazio

**Arquivos modificados**:
- `src/pages/dashboard/PassengerDashboard.tsx`:
  - Se `passengerData` e null apos o fetch, mostrar tela de boas-vindas com CTA para completar cadastro (em vez de "Carregando..." infinito)
  - Mesma logica para DriverDashboard e MerchantDashboard

### Fase 5: Integracao de Pagamento Real (CreditsShop)

**Situacao atual**: O PIX gerado e falso. O botao "Ja paguei" confirma imediatamente.

**Solucao**:
- Manter fluxo mock funcional como fallback (quando gateway nao configurado)
- Quando `franchise.payment_api_key` existe, chamar edge function que integra com Asaas/Woovi para gerar PIX real
- Verificar pagamento via webhook ou polling

**Arquivos modificados**:
- `src/components/driver/CreditsShop.tsx` - Verificar se franquia tem gateway configurado; se sim, chamar edge function; se nao, manter mock com aviso
- Criar/atualizar edge function `generate-pix` para integracao real

### Fase 6: Calculo de Preco de Entrega

**Arquivos modificados**:
- `src/pages/dashboard/MerchantDashboard.tsx` - Usar `useRideService.calculatePrice()` em vez do preco fixo de R$15

### Fase 7: Validacoes e Storage

- Criar storage bucket `documents` se nao existir (migracao SQL)
- `src/pages/CompleteRegistration.tsx` - Validar CPF/CNPJ/telefone antes de permitir avancar nos steps
- Adicionar mascara de input para CPF, CNPJ, telefone, CEP

### Fase 8: Isolamento de Dados por Cidade

**Garantir que**:
- Creditos comprados por motoristas sao contabilizados por franquia (ja existe `franchise_id` em `credit_transactions`)
- Dashboard do franqueado filtra tudo por `franchise_id` (ja funciona parcialmente)
- Super Admin ve dados agregados de todas as franquias (ja funciona)
- Um lojista de uma cidade nao veja dados de outra cidade (RLS ja garante via `franchise_id`)

**Verificacao**: Auditar todas as queries em dashboards para confirmar que filtram por `franchise_id` corretamente -- atualmente parece correto.

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| Migracao SQL | Trigger `on_auth_user_created`, storage bucket `documents` |
| `src/pages/Register.tsx` | Ler `?role=`, salvar `userType` e `city_id` nos metadados |
| `src/components/landing/Hero.tsx` | Links funcionais nos CTAs |
| `src/components/landing/Franchise.tsx` | Link funcional no CTA |
| `src/pages/CityLanding.tsx` | Passar `city_id` nos links de registro |
| `src/pages/dashboard/FranchiseAdminDashboard.tsx` | Multi-cidade + graficos reais |
| `src/pages/dashboard/PassengerDashboard.tsx` | Estado vazio amigavel |
| `src/pages/dashboard/DriverDashboard.tsx` | Estado vazio amigavel |
| `src/pages/dashboard/MerchantDashboard.tsx` | Calculo de preco real + estado vazio |
| `src/components/driver/CreditsShop.tsx` | Detectar gateway real vs mock |
| `src/pages/CompleteRegistration.tsx` | Validacoes + mascaras |

## Sequencia de Execucao
1. Migracao SQL (trigger + storage)
2. Register.tsx (fluxo de registro completo)
3. CTAs das landings (Hero, Franchise, CityLanding)
4. Dashboards (Passageiro, Motorista, Lojista - estados vazios)
5. FranchiseAdminDashboard (multi-cidade + graficos reais)
6. CreditsShop (deteccao de gateway)
7. MerchantDashboard (calculo de preco)
8. CompleteRegistration (validacoes)
