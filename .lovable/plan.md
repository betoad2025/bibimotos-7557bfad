

# Plano para Resolver Subdomínios das Cidades

## Diagnóstico Confirmado

Testes realizados durante a investigação:

1. **Banco de dados**: Todas as cidades (Salvador, Passos, etc.) existem com subdomínios corretos e franquias ativas vinculadas
2. **API direta (anon key)**: Consultas a `cities` e `franchises_public` retornam dados corretamente
3. **Preview (rota /cidade/salvador)**: Funciona 100% - landing page de Salvador carrega perfeitamente com dados corretos
4. **Produção (salvador.bibimotos.com.br)**: Mostra "Cidade não encontrada" - a detecção de subdomínio funciona (mostra "salvador"), mas as queries falham

## Causa Raiz

A versao publicada do frontend provavelmente esta desatualizada. As alteracoes recentes no hook `useFranchiseBySubdomain` (mudanca de `franchises` para `franchises_public`) precisam ser republicadas. Alem disso, o codigo atual nao tem tratamento robusto de erros, dificultando o diagnostico.

## Plano de Implementacao

### Passo 1: Melhorar Tratamento de Erros no Hook

Atualizar `src/hooks/useFranchiseBySubdomain.ts` para:
- Adicionar `console.error` detalhado em cada ponto de falha (qual query falhou, qual erro exato do Supabase)
- Diferenciar entre "cidade nao encontrada" e "franquia nao encontrada" 
- Isso permitira diagnosticar rapidamente se o problema persiste apos republish

### Passo 2: Adicionar Fallback Robusto no CityLanding

Atualizar `src/pages/CityLanding.tsx` para:
- Na tela de erro, mostrar um botao "Tentar Novamente" que recarrega a pagina
- Mostrar mensagem de erro mais detalhada em modo debug (via console)

### Passo 3: Republicar o App

Apos as alteracoes de codigo, o usuario precisara clicar em **Publish > Update** para que as mudancas entrem em vigor nos subdominios customizados. Mudancas frontend so ficam ativas nos dominios customizados apos republish.

## Detalhes Tecnicos

### Hook atualizado (useFranchiseBySubdomain.ts)

```typescript
// Adicionar logs de debug em cada ponto de falha:
const { data: cityData, error: cityError } = await supabase
  .from('cities')
  .select('id, name, state, subdomain')
  .eq('subdomain', subdomain)
  .eq('is_active', true)
  .single();

if (cityError) {
  console.error('[CityLanding] Erro ao buscar cidade:', cityError);
  // ...
}

const { data: franchiseData, error: franchiseError } = await supabase
  .from('franchises_public')
  .select('id, name, city_id, is_active, base_price, price_per_km')
  .eq('city_id', cityData.id)
  .eq('is_active', true)
  .single();

if (franchiseError) {
  console.error('[CityLanding] Erro ao buscar franquia:', franchiseError);
  // ...
}
```

### CityLanding.tsx - Botao de retry

Adicionar botao "Tentar Novamente" na tela de erro para que o usuario possa recarregar sem precisar digitar a URL novamente.

## Resultado Esperado

Apos implementar as mudancas e republicar:
- `salvador.bibimotos.com.br` -> Landing page de Salvador
- `passos.bibimotos.com.br` -> Landing page de Passos
- `bibimotos.com.br/cidade/salvador` -> Landing page de Salvador (fallback)
- Console do navegador mostrara logs detalhados para diagnostico caso ainda haja problemas

