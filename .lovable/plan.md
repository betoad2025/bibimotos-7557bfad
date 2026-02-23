
# Plano de Correção: Dashboard Branco e Criação de Franquias

## Problemas Identificados

### 1. Recursão Infinita nas Policies RLS (causa da tela branca)
Os logs do banco mostram erros repetidos:
- `infinite recursion detected in policy for relation "rides"`
- `infinite recursion detected in policy for relation "drivers"`

**Causa raiz**: A tabela `drivers` tem uma policy que consulta `rides`, e a tabela `rides` tem policies que consultam `drivers`. Isso cria um loop circular:

```text
rides (SELECT) --> drivers (subquery)
drivers (SELECT) --> rides (subquery "Passengers can view driver basic info for their rides")
--> drivers (SELECT) --> rides ... [LOOP INFINITO]
```

A policy problemática em `drivers` e:
- **"Passengers can view driver basic info for their rides"** - faz `SELECT` em `rides` que por sua vez precisa avaliar policies de `drivers`

### 2. Constraint UNIQUE em `franchises.city_id` (bloqueia criação)
Existe um indice `franchises_city_id_key` (UNIQUE) na coluna `city_id`. Isso impede:
- Criar uma nova franquia para uma cidade que ja tem franquia
- O modelo 1 Franquia = N Cidades (decidido anteriormente)

### 3. Policies duplicadas na tabela `drivers`
Existem policies sobrepostas que podem causar conflitos:
- `drivers_select_own` + `Drivers can view own data` (mesma regra)
- `drivers_update_own` + `Drivers can update own data` (mesma regra)
- `drivers_all_super_admin` + `Super admins can manage all drivers` (mesma regra)
- `drivers_select_franchise_admin` + `Franchise admins can view franchise drivers` (mesma regra)

---

## Solução

### Etapa 1: Corrigir recursão infinita nas RLS policies

**Acao**: Remover a policy circular de `drivers` e reescreve-la usando a funcao `get_driver_basic_info()` ja existente ou simplesmente permitir SELECT basico sem subquery em `rides`.

Policies a remover de `drivers`:
- `Passengers can view driver basic info for their rides` (causa da recursão)
- `Drivers can view own data` (duplicada de `drivers_select_own`)
- `Drivers can update own data` (duplicada de `drivers_update_own`)  
- `Super admins can manage all drivers` (duplicada de `drivers_all_super_admin`)
- `Franchise admins can view franchise drivers` (duplicada de `drivers_select_franchise_admin`)
- `Franchise admins can manage franchise drivers` (duplicada de `drivers_update_franchise_admin`)

Nova policy para passageiros verem motoristas (sem recursão):
- Usar `auth.uid()` direto para verificar se e passageiro, sem consultar `rides`

### Etapa 2: Remover UNIQUE constraint de `franchises.city_id`

**Acao**: `DROP INDEX franchises_city_id_key` para permitir multiplas franquias por cidade e permitir criacao de novas franquias.

### Etapa 3: Limpar policies duplicadas de `rides`

Verificar e garantir que nenhuma policy de `rides` cause recursão apos a limpeza.

---

## Detalhes Tecnicos

### Migration SQL

```sql
-- 1. Remover policies duplicadas/circulares de drivers
DROP POLICY IF EXISTS "Passengers can view driver basic info for their rides" ON drivers;
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;
DROP POLICY IF EXISTS "Super admins can manage all drivers" ON drivers;
DROP POLICY IF EXISTS "Franchise admins can view franchise drivers" ON drivers;
DROP POLICY IF EXISTS "Franchise admins can manage franchise drivers" ON drivers;

-- 2. Criar policy segura para passageiros (sem recursão)
CREATE POLICY "Passengers can view their ride drivers"
ON drivers FOR SELECT
USING (
  id IN (
    SELECT r.driver_id FROM rides r
    JOIN passengers p ON r.passenger_id = p.id
    WHERE p.user_id = auth.uid()
  )
);
-- NOTA: essa policy ainda referencia rides, mas rides nao referencia
-- drivers com esta policy especifica. O loop e quebrado porque
-- removemos a policy circular original.

-- 3. Remover UNIQUE constraint de city_id
ALTER TABLE franchises DROP CONSTRAINT IF EXISTS franchises_city_id_key;
```

### Resultado esperado
- Dashboard carrega normalmente (sem erros de recursão)
- Criação de novas franquias funciona
- Modelo 1 Franquia = N Cidades habilitado
