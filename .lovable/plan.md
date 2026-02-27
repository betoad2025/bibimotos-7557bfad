
# Exibir a Cidade do Usuario em Todos os Dashboards

## Problema
Atualmente, os dashboards do passageiro, motorista e lojista mostram apenas "Bibi Motos" + o tipo de usuario (ex: "Passageiro", "Motorista"). A cidade onde o usuario esta operando nao aparece em nenhum lugar, o que causa confusao -- especialmente para quem tem acesso a mais de uma franquia ou precisa confirmar sua localizacao.

## Solucao
Buscar o nome da cidade a partir da relacao `franchise_id -> franchises -> cities` e exibi-lo de forma clara e visivel no header de cada dashboard.

## O que muda visualmente

No header de cada dashboard, abaixo de "Bibi Motos", em vez de apenas "Passageiro" / "Motorista" / "Lojista", mostrara:

```text
Bibi Motos
Passageiro • Recife - PE
```

Com um icone de MapPin ao lado da cidade para reforcar visualmente.

## Implementacao Tecnica

### 1. PassengerDashboard.tsx

- Adicionar estado `cityInfo` (`{ name, state }`)
- No `fetchPassengerData`, apos obter o `franchise_id`, buscar a cidade:
  ```ts
  const { data: franchise } = await supabase
    .from('franchises')
    .select('cities(name, state)')
    .eq('id', data.franchise_id)
    .single();
  ```
- No header (linha 158), mudar de `<p>Passageiro</p>` para:
  ```
  <p><MapPin /> Recife - PE • Passageiro</p>
  ```
- Tambem exibir no card de perfil (linha 188) a cidade do passageiro

### 2. DriverDashboard.tsx

- Mesma logica: buscar cidade via `franchise_id` no `fetchDriverData`
- No header (linha 249), mudar de `<p>Motorista</p>` para incluir a cidade com MapPin

### 3. MerchantDashboard.tsx

- Mesma logica via `franchise_id` do lojista
- Atualizar header para exibir cidade

### Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/pages/dashboard/PassengerDashboard.tsx` | Buscar cidade via franchise, exibir no header e perfil |
| `src/pages/dashboard/DriverDashboard.tsx` | Buscar cidade via franchise, exibir no header |
| `src/pages/dashboard/MerchantDashboard.tsx` | Buscar cidade via franchise, exibir no header |

Nenhuma migracao de banco necessaria -- os dados ja existem nas tabelas `franchises` e `cities`.
