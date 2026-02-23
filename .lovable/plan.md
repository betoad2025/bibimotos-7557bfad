

# Plano para Ativar Todos os Subdominios

## Situacao Atual

**Banco de dados** - Tudo OK:
- 9 cidades cadastradas com subdominios
- 8 franquias ativas vinculadas (Guaxupe nao tem franquia)

**Codigo** - Tudo OK:
- Hook `useFranchiseBySubdomain` detecta subdominios corretamente
- Rota `/cidade/:subdomain` funciona como fallback
- View `franchises_public` acessivel sem autenticacao

**Problema real**: Os subdominios precisam ser adicionados manualmente nas configuracoes de dominio do projeto Lovable, e o app precisa ser **republicado** para que o codigo atualizado funcione nos dominios customizados.

---

## Passo 1: Adicionar Todos os Subdominios no Lovable

Nas configuracoes do projeto (Settings > Domains), adicionar cada um destes subdominios:

| Subdominio | Cidade |
|---|---|
| `passos.bibimotos.com.br` | Passos - MG |
| `salvador.bibimotos.com.br` | Salvador - BA |
| `jundiai.bibimotos.com.br` | Jundiai - SP |
| `franca.bibimotos.com.br` | Franca - SP |
| `aracaju.bibimotos.com.br` | Aracaju - SE |
| `carmo.bibimotos.com.br` | Carmo do Rio Claro - MG |
| `riopreto.bibimotos.com.br` | Sao Jose do Rio Preto - SP |
| `paraiso.bibimotos.com.br` | Sao Sebastiao do Paraiso - MG |

**IMPORTANTE**: Nenhum subdominio deve ser marcado como "Primary". Apenas `bibimotos.com.br` deve ser o Primary. Marcar um subdominio como Primary causa redirecionamento 301 automatico que quebra tudo.

## Passo 2: Configurar DNS no Cloudflare

Para cada subdominio acima, criar um registro A no Cloudflare:

- **Tipo**: A
- **Nome**: o subdominio (ex: `passos`, `salvador`, `jundiai`, etc.)
- **Valor**: `185.158.133.1`
- **Proxy**: **DNS only** (nuvem cinza - NAO usar proxy laranja)

Se voce ja tem um registro wildcard (`*`) apontando para `185.158.133.1`, os registros DNS ja estao cobertos. Mas cada subdominio ainda precisa ser adicionado individualmente no painel do Lovable (Passo 1).

## Passo 3: Republicar o App

Apos adicionar todos os subdominios:
1. Clique em **Publish > Update** no editor do Lovable
2. Aguarde a publicacao concluir
3. Teste cada subdominio no navegador

## Passo 4: Corrigir Guaxupe (opcional)

A cidade Guaxupe existe no banco mas **nao tem franquia vinculada**. Se precisar ativar, sera necessario criar uma franquia para ela no painel de Super Admin.

## Passo 5: Ajuste no Codigo

Uma pequena melhoria no codigo para garantir resiliencia: adicionar tratamento para o caso em que a tabela `cities` retorna erro por RLS (a tabela `cities` pode ter restricoes que a view `franchises_public` nao tem). Vou verificar e, se necessario, criar uma view publica para `cities` tambem, garantindo que consultas anonimas funcionem sem problemas.

---

## Resultado Esperado

Apos completar os passos:
- `passos.bibimotos.com.br` -> Landing page de Passos
- `salvador.bibimotos.com.br` -> Landing page de Salvador
- `jundiai.bibimotos.com.br` -> Landing page de Jundiai
- `franca.bibimotos.com.br` -> Landing page de Franca
- `aracaju.bibimotos.com.br` -> Landing page de Aracaju
- `carmo.bibimotos.com.br` -> Landing page de Carmo do Rio Claro
- `riopreto.bibimotos.com.br` -> Landing page de Rio Preto
- `paraiso.bibimotos.com.br` -> Landing page de Paraiso
- `bibimotos.com.br` -> Site principal (FranchiseLanding)

## Detalhes Tecnicos

### Verificacao de RLS na tabela cities

A query do hook consulta `cities` diretamente. Se a tabela `cities` tiver RLS habilitado sem politica para `anon`, a query falhara em producao. Vou verificar e criar uma politica SELECT publica para `cities` se necessario, ja que os dados de cidade (nome, estado, subdominio) sao informacoes publicas.

### Nenhuma alteracao de codigo principal necessaria

O codigo do hook e do CityLanding ja esta correto e funcional. O problema e exclusivamente de configuracao de infraestrutura (DNS + dominios no Lovable + republish).

