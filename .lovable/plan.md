
# Correcao Critica: Isolamento de Cidade + UX de Solicitacao de Corrida

## Problema 1: CRITICO - Usuario cadastrado em Guaxupe aparecendo em Jundiai

**Causa raiz encontrada** no arquivo `src/hooks/useAuth.tsx`, linhas 112-119:

```text
// Codigo atual (BUGADO):
if (!franchiseId) {
  // Se nao encontrou franquia para a cidade, pega QUALQUER franquia ativa
  const { data: franchise } = await supabase
    .from('franchises')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  franchiseId = franchise?.id || null;  // <-- AQUI: pode retornar Jundiai!
}
```

Quando o `city_id` nao encontra uma franquia correspondente (por timing, RLS, ou qualquer falha), o sistema **pega a primeira franquia ativa que encontrar** -- que no caso e Jundiai. Isso e gravissimo.

**Correcao:**
- Remover completamente o fallback para "qualquer franquia"
- Se nao encontrar franquia para o `city_id`, bloquear o cadastro e informar erro
- NUNCA vincular usuario a uma cidade que nao seja a dele

## Problema 2: Build PWA falhando

O arquivo `logo-full.png` (2.28 MB) esta causando erro no Workbox. Embora o limite esteja em 3MB, o Workbox esta usando o default internamente.

**Correcao:** Adicionar `globIgnores` para excluir imagens grandes do pre-cache.

## Problema 3: Autocomplete sem restricao geografica

O autocomplete do Google Places (edge function `geocode`) nao restringe resultados a cidade do usuario. Precisa enviar `location` e `radius` como parametros para filtrar sugestoes.

**Correcao:**
- Passar `cityLat`, `cityLng` e `cityName` para o `AddressAutocomplete`
- Enviar esses dados na requisicao para a edge function `geocode`
- Na edge function, adicionar `location` e `radius` (ex: 30km) ao autocomplete do Google

## Problema 4: Sem validacao de limites da cidade

O sistema permite solicitar corrida de/para qualquer lugar do Brasil, sem verificar se os enderecos estao dentro da area de operacao da cidade.

**Correcao:**
- Adicionar coordenadas (`lat`, `lng`) na tabela `cities` (ja existem mas estao NULL)
- Preencher coordenadas de todas as cidades ativas
- No `RideRequestForm`, validar que origem e destino estao dentro do raio da cidade (ex: 30km do centro)
- Se estiver fora, mostrar mensagem "Endereco fora da area de cobertura de [Cidade]"

## Problema 5: Auto-deteccao de localizacao pouco visivel

O botao de "usar minha localizacao" e um icone minusculo no campo de origem. Deveria ser mais proeminente e idealmente detectar automaticamente.

**Correcao:**
- Ao abrir o formulario, tentar detectar localizacao automaticamente para o campo de origem
- Adicionar botao visivel "Usar minha localizacao atual" abaixo do campo
- Validar que a localizacao detectada esta dentro da cidade do usuario

---

## Plano de Implementacao

### Tarefa 1: Corrigir fallback de franquia no useAuth (CRITICO)
**Arquivo:** `src/hooks/useAuth.tsx`
- Remover linhas 112-119 (fallback para qualquer franquia)
- Se `city_id` nao encontrar franquia, logar erro e nao criar entidade
- Adicionar log de alerta para investigacao

### Tarefa 2: Corrigir build PWA
**Arquivo:** `vite.config.ts`
- Adicionar `globIgnores: ["**/logo-full-*.png"]` no workbox config
- Aumentar `maximumFileSizeToCacheInBytes` para `5 * 1024 * 1024`

### Tarefa 3: Preencher coordenadas das cidades
**Migracao SQL:**
- Atualizar coluna `lat` e `lng` de todas as cidades ativas com coordenadas reais
- Guaxupe: -21.3054, -46.7121
- Jundiai: -23.1857, -46.8978
- E todas as outras cidades

### Tarefa 4: Restringir autocomplete a cidade do usuario
**Arquivos:** 
- `src/components/ride/RideRequestForm.tsx` - Passar cityInfo para AddressAutocomplete
- `src/components/ride/AddressAutocomplete.tsx` - Receber e enviar coordenadas da cidade
- `src/hooks/useGoogleMaps.ts` - Passar `location` e `radius` para autocomplete
- `supabase/functions/geocode/index.ts` - Adicionar parametros de localizacao na API do Google

### Tarefa 5: Validar limites da cidade ao solicitar corrida
**Arquivo:** `src/components/ride/RideRequestForm.tsx`
- Buscar coordenadas da cidade via franchise -> city
- Ao selecionar origem/destino, calcular distancia do centro da cidade
- Se > 30km, bloquear e mostrar alerta "Fora da area de cobertura"

### Tarefa 6: Auto-detectar localizacao ao abrir formulario
**Arquivo:** `src/components/ride/RideRequestForm.tsx`
- No mount, chamar `getCurrentLocation()` automaticamente
- Preencher campo de origem com endereco detectado
- Validar se esta dentro da cidade antes de preencher

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useAuth.tsx` | Remover fallback perigoso de franquia |
| `vite.config.ts` | Corrigir cache PWA |
| `src/components/ride/RideRequestForm.tsx` | Auto-localizacao + validacao de limites |
| `src/components/ride/AddressAutocomplete.tsx` | Receber coordenadas da cidade para bias |
| `src/hooks/useGoogleMaps.ts` | Enviar location bias no autocomplete |
| `supabase/functions/geocode/index.ts` | Adicionar location + radius na API |
| Migracao SQL | Preencher lat/lng das cidades |

## Correcao imediata do usuario afetado

Apos implementar, corrigir manualmente o registro do usuario `betocartoes@gmail.com`:
- Mover de `franchise_id` Jundiai para Guaxupe via SQL
