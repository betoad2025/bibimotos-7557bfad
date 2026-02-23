

# Auditoria 360 -- Checkup Completo Para Producao

## Resultado da Analise por Stakeholder

### PASSAGEIRO
| Funcionalidade | Status | Problema |
|---|---|---|
| Registro com role automatica | OK | Funciona via URL `?role=passenger` |
| Solicitar corrida (formulario) | OK | Autocomplete + calculo de preco |
| Acompanhar corrida em tempo real | PARCIAL | **RideMapTracker existe mas NAO esta integrado** - passageiro ve status textual mas NAO ve mapa |
| Compartilhar viagem com familiar | AUSENTE | **ShareRideButton existe mas NAO esta integrado** em nenhum dashboard |
| Botao SOS / Emergencia | AUSENTE | **SOSButton existe mas NAO esta integrado** - botao "Emergencia/Suporte" no RideTrackingCard nao faz nada (sem onClick) |
| Cancelar corrida | OK | CancelRideModal funciona via useRideService |
| Avaliar motorista | OK | EnhancedRatingModal com estrelas |
| Historico de corridas | OK | RideHistory integrado |
| Carteira digital | OK | UserWalletCard integrado |
| Locais favoritos | OK | FavoriteAddresses integrado |
| Programa de fidelidade | OK | LoyaltyProgressCard integrado |

### MOTORISTA (MOTOBOY)
| Funcionalidade | Status | Problema |
|---|---|---|
| Ficar online/offline | OK | Toggle com validacao de creditos |
| Receber corridas em tempo real | OK | usePendingRides com Realtime |
| Aceitar corrida | OK | accept_ride RPC atomico |
| Tracking GPS durante corrida | AUSENTE | **useLocationTracking existe mas NAO esta integrado** - driver nao envia GPS durante corrida |
| Mapa com rota | AUSENTE | **RideMapTracker NAO integrado** |
| SOS durante corrida | AUSENTE | **SOSButton NAO integrado** |
| Compartilhar corrida | AUSENTE | **ShareRideButton NAO integrado** |
| Aviso de creditos baixos | AUSENTE | **Nenhum alerta quando creditos estao acabando** - motorista so descobre quando tenta ficar online com 0 creditos |
| Bonus por demanda (horario pico) | AUSENTE | **DemandBonusCard existe mas NAO integrado** |
| Gorjeta | AUSENTE | **TipModal existe mas NAO integrado** |
| Comprar creditos (CreditsShop) | OK | PIX real (Asaas/Woovi) + fallback mock |
| Relatorio financeiro | OK | FinancialReportCard + PDF |
| Historico de corridas | OK | RideHistory integrado |

### LOJISTA (MERCHANT)
| Funcionalidade | Status | Problema |
|---|---|---|
| Solicitar entrega | OK | Formulario com calculo dinamico |
| Acompanhar entrega | PARCIAL | Ve status na lista mas **sem mapa e sem tracking GPS** |
| Historico de entregas | OK | Lista com filtro |
| SOS | AUSENTE | Nenhum botao SOS |
| Pagamento in-app | AUSENTE | **InAppPayment existe mas NAO integrado** |

### DONO DE FRANQUIA
| Funcionalidade | Status | Problema |
|---|---|---|
| Dashboard multi-cidade | OK | Seletor de franquias |
| Graficos reais (semana/hora/tipo) | OK | Dados do banco |
| Aprovar motoristas | OK | Botao de aprovacao |
| Aba Corridas em tempo real | OK | Com filtro por status + Realtime |
| Historico transacoes credito | OK | Tabela na aba Creditos |
| Notificacoes em tempo real | OK | RealtimeNotificationPanel |
| Marketing | OK | MarketingPanel |
| Configurar chave Asaas/Woovi | OK | SettingsPanel com sync via RPC |
| Monitorar corrida no mapa | AUSENTE | **Franqueado nao tem mapa** - ve tabela textual mas nao ve posicao dos motoristas |

### SUPER ADMIN (DONO DA PLATAFORMA)
| Funcionalidade | Status | Problema |
|---|---|---|
| Visao geral com stats | OK | StatsCards + OverviewCharts |
| Monitoramento de corridas | OK | RideMonitoring com detalhes |
| Alertas de emergencia | OK | EmergencyAlerts |
| Gestao de cidades | OK | CRUD completo |
| Gestao de franquias | OK | CRUD completo |
| Gestao de usuarios | OK | Listagem com roles |
| Billing franquias | OK | FranchiseBillingManagement |
| Precificacao | OK | FranchisePricingConfig |
| Transferencias | OK | FranchiseTransferManagement |
| Leads | OK | LeadsManagement |
| Marketing global | OK | GlobalMarketingPanel |

### SEGURANCA
| Item | Status | Detalhe |
|---|---|---|
| RLS em todas as tabelas | OK | 100% das tabelas com RLS |
| Isolamento por franchise_id | OK | Verificado via `verify_franchise_isolation` |
| Protecao PII (CPF/RG) | OK | RLS restritivo em profiles/drivers |
| Chaves API criptografadas | OK | Armazenadas via franchise_api_keys |
| Rate limiting | OK | check_rate_limit function |
| Audit log | OK | security_audit_log |
| Mascaramento LGPD (90 dias) | OK | mask_old_ride_data trigger |
| SECURITY DEFINER view | AVISO | `franchises_public` view -- intencional para landing pages anonimas |
| Leaked password protection | AVISO | Desabilitado -- deve ser ativado |
| Confirmacao mock sem gateway | OK | Botao "Ja paguei" desabilitado em modo demo |
| Fraude de creditos | OK | Credits so adicionados apos validacao do gateway |

---

## Problemas Criticos a Resolver (11 itens)

### 1. Componentes existentes NAO integrados (mais grave)
Existem 6 componentes prontos que nunca foram colocados nos dashboards:
- `SOSButton` -- botao de emergencia para passageiro/motorista/lojista
- `ShareRideButton` -- compartilhar corrida com familiar
- `RideMapTracker` -- mapa com tracking em tempo real
- `useLocationTracking` -- GPS do motorista durante corrida
- `DemandBonusCard` -- bonus por horario de pico
- `TipModal` -- gorjeta para motorista
- `InAppPayment` -- pagamento in-app
- `CancelRideModal` -- modal de cancelamento com motivo

### 2. Botao "Emergencia/Suporte" no RideTrackingCard nao faz nada
Linha 273-278 de RideTrackingCard.tsx: o botao existe mas nao tem `onClick` funcional.

### 3. Motorista NAO envia GPS durante corrida
`useLocationTracking` existe mas nao e chamado no DriverDashboard. O passageiro nao recebe posicao do motorista em tempo real.

### 4. Passageiro/Motorista NAO veem mapa durante corrida
`RideMapTracker` existe com OpenStreetMap embed e calculo de ETA, mas nao e renderizado em nenhum dashboard.

### 5. Sem aviso de creditos baixos
Quando creditos do motorista estao acabando (ex: < 3), nao ha alerta visual. Ele so descobre quando tenta ficar online com 0.

### 6. Leaked password protection desabilitado
Supabase linter reporta que protecao contra senhas vazadas esta desativada.

### 7. Botao cancelar corrida nao pede motivo
`CancelRideModal` existe com campo de motivo mas nao e usado. O cancelamento atual e direto sem justificativa.

### 8. Gorjeta indisponivel
`TipModal` existe mas nunca e mostrado apos corrida finalizada.

### 9. DemandBonusCard nao aparece para motorista
Bonus por demanda/horario de pico existe mas nao e visivel.

### 10. Franqueado sem mapa de monitoramento
Dashboard do franqueado mostra corridas em tabela mas sem visualizacao no mapa.

### 11. InAppPayment nao integrado
Passageiro nao tem opcao de pagar via app (carteira/PIX).

---

## Plano de Implementacao

### Fase 1: Integrar componentes de seguranca nas corridas

**PassengerDashboard.tsx**:
- Importar e renderizar `SOSButton` (variant="floating") quando ha corrida ativa
- Importar e renderizar `ShareRideButton` dentro do `RideTrackingCard` (quando status !== 'pending')
- Importar e renderizar `RideMapTracker` acima do RideTrackingCard quando corrida ativa

**DriverDashboard.tsx**:
- Importar e chamar `useLocationTracking` quando ha corrida ativa (`isActive = hasActiveRide`)
- Importar e renderizar `SOSButton` (variant="floating") quando ha corrida ativa
- Importar e renderizar `RideMapTracker` acima do RideTrackingCard quando corrida ativa

**RideTrackingCard.tsx**:
- Substituir botao "Emergencia/Suporte" morto pelo `SOSButton` real
- Adicionar `ShareRideButton` ao lado do botao de cancelar (so para passageiro)

### Fase 2: Alerta de creditos baixos para motorista

**DriverDashboard.tsx**:
- Quando `driverData.credits < 3` e `driverData.credits > 0`, exibir card de aviso amarelo: "Seus creditos estao acabando! Recarregue para continuar recebendo corridas."
- Quando `driverData.credits <= 0`, exibir card de aviso vermelho: "Sem creditos! Voce nao pode ficar online."
- Ambos com botao "Recarregar" que scrolls para aba de creditos

### Fase 3: Integrar bonus por demanda e gorjeta

**DriverDashboard.tsx**:
- Adicionar `DemandBonusCard` na area principal (acima do grid de stats) quando motorista esta online
- Mostra multiplicador de bonus baseado na hora atual e demanda

**PassengerDashboard.tsx** e **DriverDashboard.tsx**:
- Apos `EnhancedRatingModal`, mostrar `TipModal` (so para passageiro avaliando motorista)
- TipModal permite enviar gorjeta opcional via carteira

### Fase 4: Modal de cancelamento com motivo

**RideTrackingCard.tsx**:
- Substituir chamada direta `cancelRide(ride.id)` por abertura do `CancelRideModal`
- CancelRideModal coleta motivo obrigatorio e passa para `cancelRide(ride.id, reason)`

### Fase 5: Pagamento in-app para passageiro

**PassengerDashboard.tsx**:
- Apos corrida finalizada (antes da avaliacao), mostrar opcao de pagamento via `InAppPayment`
- Suportar pagamento via carteira, PIX, ou dinheiro

### Fase 6: Seguranca - Ativar protecao de senhas vazadas

- Habilitar `leaked password protection` via configuracao de auth (se disponivel)

### Fase 7: Mapa de monitoramento para Franqueado (opcional)

**FranchiseAdminDashboard.tsx** (aba Corridas):
- Adicionar mini-mapa OpenStreetMap mostrando posicoes dos motoristas online
- Usar dados de `drivers.current_lat/current_lng` ja existentes

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/pages/dashboard/PassengerDashboard.tsx` | +SOSButton, +ShareRideButton, +RideMapTracker, +TipModal, +InAppPayment |
| `src/pages/dashboard/DriverDashboard.tsx` | +useLocationTracking, +SOSButton, +RideMapTracker, +DemandBonusCard, +alerta creditos baixos |
| `src/components/ride/RideTrackingCard.tsx` | Substituir botao morto por SOSButton real, +ShareRideButton, +CancelRideModal |
| `src/pages/dashboard/MerchantDashboard.tsx` | +SOSButton para entregas ativas |
| `src/pages/dashboard/FranchiseAdminDashboard.tsx` | Mini-mapa de motoristas (opcional) |

## Sequencia de Execucao
1. RideTrackingCard -- SOSButton real + CancelRideModal + ShareRideButton
2. PassengerDashboard -- RideMapTracker + SOSButton floating
3. DriverDashboard -- useLocationTracking + RideMapTracker + SOSButton floating + alerta creditos baixos
4. DriverDashboard -- DemandBonusCard
5. PassengerDashboard -- TipModal apos avaliacao
6. MerchantDashboard -- SOSButton
7. Seguranca -- leaked password protection

