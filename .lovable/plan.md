
# Auditoria Completa + Plano de Producao 100%

## Status de Execução

### ✅ CONCLUÍDO
| # | Item | Status |
|---|---|---|
| 1 | Storage bucket 'documents' criado com RLS | ✅ |
| 2 | Register.tsx lê ?role= e ?city_id= da URL | ✅ |
| 3 | Register.tsx salva userType e city_id nos metadados do signup | ✅ |
| 4 | useAuth auto-cria profile, role e entity record no primeiro login | ✅ |
| 5 | Hero.tsx CTAs funcionais (links para /register?role=) | ✅ |
| 6 | Franchise.tsx CTA funcional (link para /franquia) | ✅ |
| 7 | CityLanding.tsx CTAs passam city_id nos links de registro | ✅ |
| 8 | PassengerDashboard estado vazio amigável | ✅ |
| 9 | DriverDashboard estado vazio amigável | ✅ |
| 10 | MerchantDashboard já tinha estado vazio amigável | ✅ |
| 11 | FranchiseAdminDashboard multi-cidade (seletor) | ✅ |
| 12 | FranchiseAdminDashboard gráficos com dados reais | ✅ |
| 13 | Rotas /inicio e /franquia adicionadas | ✅ |

### 🔲 PENDENTE
| # | Item | Detalhes |
|---|---|---|
| 14 | CreditsShop detecção de gateway real vs mock | Verificar franchise.payment_api_key |
| 15 | MerchantDashboard cálculo de preço real | Usar useRideService.calculatePrice() |
| 16 | CompleteRegistration validações + máscaras | CPF, CNPJ, telefone, CEP |
