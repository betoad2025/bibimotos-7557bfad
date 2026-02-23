

# Overhaul Completo: Marketing por Cidade + Visual Cinematografico Premium

## Parte 1: Marketing Pixels por Cidade no Super Admin

### Problema
O formulario de cidades no painel Super Admin so tem campos basicos (nome, estado, subdomain, lat/lng). Faltam:
- Pixels de marketing (Facebook/Meta, Google Ads, Google Analytics, TikTok, Taboola)
- Chave de API do gateway de pagamento
- Valor minimo de recarga do motorista
- Eventos de conversao automaticos (motorista primeira recarga, passageiro cadastro, primeira corrida)

### Solucao

#### 1. Migracao de Banco de Dados
Atualmente, o marketing fica na tabela `franchise_marketing` (por franquia). Como o modelo e multi-tenant onde uma franquia pode ter multiplas cidades, os pixels precisam ser por **cidade** (cada cidade pode ter campanhas diferentes).

Criar tabela `city_marketing`:

```text
city_marketing
  id             uuid (PK)
  city_id        uuid (FK -> cities.id)
  facebook_pixel_id       text
  facebook_access_token   text
  google_ads_id           text
  google_ads_conversion_id text
  google_analytics_id     text
  tiktok_pixel_id         text
  taboola_pixel_id        text  (NOVO - nao existia antes)
  resend_api_key          text  (NOVO)
  created_at     timestamptz
  updated_at     timestamptz
```

Adicionar `min_credit_purchase` na tabela `franchises` (valor minimo de recarga do motoboy).

RLS: Super admins podem tudo. Franchise owners podem ver/editar marketing das cidades de suas franquias.

#### 2. Refatorar `CitiesManagement.tsx`
Expandir o dialog de editar cidade com abas:
- **Aba "Dados"**: Nome, estado, subdomain, populacao, lat/lng (atual)
- **Aba "Operacional"**: Gateway de pagamento, chave API (com toggle mostrar/ocultar), webhook URL, preco base, preco por km, debito por corrida, recarga minima
- **Aba "Marketing"**: Campos de pixel para cada plataforma (Facebook, Google Ads, GA4, TikTok, Taboola, Resend) com status "Configurado/Pendente" visual

Ao salvar, atualiza 3 tabelas: `cities`, `franchises` (vinculada), e `city_marketing`.

#### 3. Injetar Pixels na Pagina da Cidade (`CityLanding.tsx`)
Buscar os pixels da `city_marketing` e injetar dinamicamente no `<head>`:
- Facebook Pixel via `fbq()`
- Google Ads/GA4 via `gtag()`
- TikTok Pixel via `ttq`
- Taboola via snippet nativo

#### 4. Eventos de Conversao Automaticos
Criar um hook `useConversionTracking` que dispara eventos nos momentos-chave:

| Momento | Evento Facebook | Evento Google | Quem |
|---------|----------------|---------------|------|
| Cadastro completo | `CompleteRegistration` | `sign_up` | Todos |
| Primeira recarga do motoboy | `Purchase` | `purchase` | Motorista |
| Primeira corrida do passageiro | `Purchase` | `purchase` | Passageiro |
| Cadastro do lojista | `Lead` | `generate_lead` | Lojista |
| Inicio de cadastro | `InitiateCheckout` | `begin_checkout` | Todos |

#### 5. Atualizar `CreditsShop.tsx`
Respeitar `min_credit_purchase` da franquia e bloquear recargas abaixo do minimo.

---

## Parte 2: Overhaul Visual Cinematografico

### Problema
As paginas (landing principal e pagina da cidade) estao "pobrezinhas" sem imagens e sem o impacto visual de plataformas como Uber e 99. As imagens geradas anteriormente parecem nao estar aparecendo ou o visual nao esta no nivel desejado.

### Ciencia da Comunicacao (Uber/99)
A estrategia visual dessas plataformas se baseia em:
1. **Pessoas reais em acao** - rostos, sorrisos, interacao humana
2. **Cenarios urbanos reconheciveis** - ruas movimentadas, cidade viva
3. **Hierarquia visual clara** - headline grande, imagem dominante, CTA contrastante
4. **Secoes alternadas** - imagem/texto lado a lado, alternando esquerda/direita
5. **Prova social** - numeros, depoimentos, badges de confianca
6. **Movimento implicito** - fotos com blur de velocidade, angulos dinamicos

### Plano Visual

#### Landing Principal (`Index.tsx` e componentes)

**Hero** - Regenerar imagem hero com foco em: motociclista Bibi Motos com passageiro sorridente em avenida movimentada brasileira, paleta roxo/dourado, golden hour.

**Services** - 3 cards com imagens distintas:
- Corridas: passageira sorridente na garupa
- Entregas: entregador com caixa de delivery
- Farmacia: entregador com sacola de farmacia

**How It Works** - Imagem lateral mostrando mao segurando celular com app aberto, cidade ao fundo desfocada.

**Franchise** - Empresario sorridente com tablet, graficos de crescimento ao fundo, ambiente de escritorio moderno.

**Seções novas sugeridas**:
- **Depoimentos** - Cards com foto de avatar + citacao (estilo Uber)
- **Download App** - Mockup de celular com QR code

#### Pagina da Cidade (`CityLanding.tsx`)
Aplicar o mesmo padrao visual da landing principal mas contextualizado para a cidade. Adicionar secao de "Numeros da cidade" com contadores animados.

#### Geracoes de Imagens
Gerar 6-8 novas imagens cinematograficas de alta qualidade usando o modelo de imagem, todas com:
- Iluminacao dramatica (golden hour ou neon noturno)
- Paleta roxo/dourado consistente
- Pessoas brasileiras em cenarios urbanos
- Foco em emocao e conexao humana

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|----------|
| Migracao SQL | Criar `city_marketing`, adicionar `min_credit_purchase` em `franchises` |
| `src/components/superadmin/CitiesManagement.tsx` | Adicionar abas com campos operacionais e marketing |
| `src/pages/CityLanding.tsx` | Injetar pixels dinamicamente, melhorar visual |
| `src/hooks/useConversionTracking.ts` | NOVO - hook para disparar eventos de conversao |
| `src/components/landing/Hero.tsx` | Regenerar hero cinematografico |
| `src/components/landing/Services.tsx` | Melhorar cards com imagens mais impactantes |
| `src/components/landing/HowItWorks.tsx` | Layout mais dinamico |
| `src/components/landing/Franchise.tsx` | Secao mais impactante com prova social |
| `src/components/landing/Navbar.tsx` | Usar logo oficial, ajustes visuais |
| `src/components/driver/CreditsShop.tsx` | Validar recarga minima |
| 6-8 novas imagens em `src/assets/` | Geradas via AI com padrao cinematografico |

## Sequencia de Implementacao
1. Migracao do banco (tabela `city_marketing` + coluna `min_credit_purchase`)
2. Gerar todas as imagens cinematograficas em paralelo
3. Refatorar `CitiesManagement.tsx` com abas completas
4. Criar hook `useConversionTracking`
5. Injetar pixels em `CityLanding.tsx`
6. Overhaul visual de todos os componentes da landing
7. Atualizar `CreditsShop.tsx` com validacao de minimo

