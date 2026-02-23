
# Checkup Geral da Plataforma + Pagamento Asaas

## Situacao Atual - O Que JA Funciona

| Area | Status | Detalhes |
|---|---|---|
| Registro com role e city_id | OK | `Register.tsx` le URL params, `useAuth.tsx` auto-cria profile/role/entity |
| CTAs das landings | OK | Hero, Franchise, CityLanding linkam corretamente para `/register?role=` |
| Dashboard Franqueado multi-cidade | OK | Seletor de cidades, graficos com dados reais |
| Dashboard Passageiro estado vazio | OK | Tela de boas-vindas quando nao ha registro |
| Dashboard Motorista estado vazio | OK | Tela de boas-vindas quando nao ha registro |
| CreditsShop detecta gateway | OK | Le `payment_gateway` + `payment_api_key` da franquia |
| Edge Function `generate-pix` | OK | Suporta Asaas + Woovi/OpenPix para gerar PIX e checar status |
| MerchantDashboard preco dinamico | OK | Usa `base_price` + `price_per_km` da franquia |
| CompleteRegistration validacoes | OK | Mascaras CPF/CNPJ/telefone/CEP + validacao de digitos |
| Storage bucket `documents` | OK | Criado com RLS para KYC |
| SettingsPanel (Integracoes) | OK | Franqueado salva chaves de API (Asaas, Woovi, etc.) na tabela `franchise_api_keys` |
| Super Admin - Cidades (Operacional) | OK | Configura gateway, chave API, precos na tabela `franchises` |

## Problemas Encontrados

### 1. CRITICO: Duas tabelas diferentes para chaves de pagamento
O `SettingsPanel.tsx` (aba Integracoes do Franqueado) salva chaves na tabela `franchise_api_keys`.
Porem, a `CreditsShop.tsx` e a edge function `generate-pix` leem de `franchises.payment_api_key`.
Resultado: o franqueado configura a chave pelo painel, mas o sistema nao a encontra na hora de gerar PIX.

**Solucao**: Ao salvar uma chave Asaas/Woovi no `SettingsPanel`, tambem atualizar `franchises.payment_gateway` e `franchises.payment_api_key` usando a funcao RPC `set_franchise_payment_settings` que ja existe.

### 2. CRITICO: Asaas exige `customer` obrigatorio na API
A API do Asaas requer um campo `customer` (ID do cliente Asaas) em toda cobranca. A edge function `generate-pix` envia o pagamento sem `customer`, o que faz a API retornar erro.

**Solucao**: Criar/buscar o customer no Asaas automaticamente (usando CPF do motorista) antes de gerar a cobranca.

### 3. QR Code nao renderiza imagem
O modal de pagamento mostra apenas um icone generico de QR Code. Quando o gateway real retorna `qr_code_image` (base64), ele nao e exibido.

**Solucao**: Renderizar a imagem base64 retornada pelo gateway no lugar do icone placeholder.

### 4. Confirmacao mock quando gateway falha
Se o gateway real falhar, o sistema gera PIX mock mas o botao "Ja paguei" confirma imediatamente (sem checagem real). Isso permite creditos fraudulentos.

**Solucao**: Quando usar PIX mock (sem gateway), bloquear o botao "Ja paguei" e exibir aviso claro de que e modo demonstracao. Somente confirmar automaticamente em ambiente de teste.

### 5. Falta aba de Corridas Ativas no dashboard do Franqueado
O franqueado nao tem onde acompanhar corridas em andamento em tempo real (inspiracao Uber/99). So o Super Admin tem `RideMonitoring`.

**Solucao**: Adicionar aba "Corridas" no `FranchiseAdminDashboard` com listagem de corridas ativas, aceitas, em andamento, filtradas por `franchise_id`.

### 6. Falta historico de transacoes de credito para o Franqueado
O franqueado nao ve as compras de credito dos seus motoristas.

**Solucao**: Adicionar sub-aba na aba "Creditos" mostrando `credit_transactions` filtrado por `franchise_id`.

---

## Plano de Implementacao

### Fase 1: Sincronizar chaves de pagamento (SettingsPanel -> franchises)

**Arquivo**: `src/components/dashboard/SettingsPanel.tsx`
- Na funcao `handleSaveKey`, quando `serviceName === 'asaas'` ou `serviceName === 'woovi'`, apos salvar na `franchise_api_keys`, tambem chamar `supabase.rpc('set_franchise_payment_settings')` para atualizar `franchises.payment_gateway` e `franchises.payment_api_key`.
- Isso garante que a `CreditsShop` e a edge function encontrem a chave no lugar certo.

### Fase 2: Corrigir edge function `generate-pix` para Asaas

**Arquivo**: `supabase/functions/generate-pix/index.ts`
- Antes de criar a cobranca Asaas, buscar ou criar um `customer` usando o CPF/nome do motorista.
- Fluxo: buscar `credit_transactions.driver_id` -> buscar `drivers.user_id` -> buscar `profiles.cpf` e `profiles.full_name` -> `POST /customers` no Asaas (ou buscar existente por `cpfCnpj`).
- Incluir `customer` no payload de criacao do pagamento.
- Corrigir CORS headers para incluir headers adicionais necessarios.

### Fase 3: Renderizar QR Code real no modal de pagamento

**Arquivo**: `src/components/driver/CreditsShop.tsx`
- Armazenar `qrCodeImage` retornado pelo gateway em novo estado.
- No modal, se `qrCodeImage` existir, renderizar `<img src="data:image/png;base64,{qrCodeImage}" />` em vez do icone placeholder.
- Manter o icone como fallback para modo mock.

### Fase 4: Bloquear confirmacao manual em modo mock

**Arquivo**: `src/components/driver/CreditsShop.tsx`
- Quando `hasGateway === false`, desabilitar o botao "Ja paguei" e mostrar badge de "Modo Demonstracao".
- Quando `hasGateway === true`, manter o fluxo normal de verificacao via gateway.

### Fase 5: Aba de Corridas Ativas para Franqueado

**Arquivo**: `src/pages/dashboard/FranchiseAdminDashboard.tsx`
- Adicionar nova aba "Corridas" ao `TabsList`.
- Criar componente inline ou separado que lista corridas da franquia com status (pending, accepted, in_progress, completed, cancelled).
- Incluir filtros por status e busca por motorista/passageiro.
- Usar realtime subscription para atualizar corridas ao vivo.

### Fase 6: Historico de transacoes de credito para Franqueado

**Arquivo**: `src/pages/dashboard/FranchiseAdminDashboard.tsx` (dentro da aba Creditos)
- Buscar `credit_transactions` filtrado por `franchise_id`.
- Exibir tabela com: motorista, valor, tipo (compra/debito), status do pagamento, data.
- Calcular totais de creditos vendidos e receita.

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/components/dashboard/SettingsPanel.tsx` | Sincronizar chave Asaas/Woovi com `franchises` via RPC |
| `supabase/functions/generate-pix/index.ts` | Criar customer Asaas antes de gerar cobranca, corrigir CORS |
| `src/components/driver/CreditsShop.tsx` | Renderizar QR code real, bloquear confirmacao em modo mock, guardar qrCodeImage |
| `src/pages/dashboard/FranchiseAdminDashboard.tsx` | Nova aba Corridas + historico de transacoes na aba Creditos |

## Sequencia de Execucao
1. SettingsPanel - sincronizacao de chaves
2. Edge function generate-pix - fix Asaas customer + CORS
3. CreditsShop - QR code real + bloqueio mock
4. FranchiseAdminDashboard - aba Corridas + historico creditos
