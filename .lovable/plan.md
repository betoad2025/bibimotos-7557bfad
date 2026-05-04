## Problema identificado

No print, o logo + texto "BibiMotos / FRANQUIAS" no canto superior esquerdo está praticamente invisível sobre o fundo roxo do hero:

- A palavra **"Motos"** usa `text-primary` (roxo) sobre fundo roxo → some
- O subtítulo **"FRANQUIAS"** usa `text-primary/80` (roxo translúcido) sobre roxo → ilegível
- O ícone do logo tem um blur roxo atrás (`bg-primary/20 blur-xl`) que apaga ainda mais o símbolo
- Falta um "selo" branco/dourado por trás do logo para destacá-lo do hero

Isso acontece em `src/pages/FranchiseLanding.tsx` (navbar do hero) e o mesmo padrão está em `src/components/landing/Navbar.tsx` e `Footer.tsx`.

## Correções

### 1. Navbar do FranchiseLanding (`src/pages/FranchiseLanding.tsx`)

Quando a navbar **não** está com scroll (em cima do hero roxo):

- Trocar a cor de "Motos" e "FRANQUIAS" para **dourado** (`text-amber-300` / `text-amber-400`) — combina com a paleta da marca (roxo + dourado) e cria contraste forte
- Adicionar um **fundo circular branco** atrás do logo (`bg-white rounded-full p-1.5 ring-2 ring-amber-300/60 shadow-xl`) para destacá-lo
- Remover o blur roxo (`bg-primary/20 blur-xl`) que está apagando o símbolo, substituir por um glow dourado sutil
- Aumentar o peso/tracking do "FRANQUIAS" e dar `drop-shadow` no título para legibilidade

Quando **com scroll** (fundo branco/escuro):

- Manter "Motos" em `text-primary` (roxo fica ok no branco)
- "FRANQUIAS" em `text-amber-600` para manter identidade dourada
- Logo continua com selo branco circular

### 2. Navbar global (`src/components/landing/Navbar.tsx`)

Aplicar o mesmo selo branco circular ao redor do logo e ajustar "Motos" para `text-accent` (dourado) — hoje usa `text-accent` mas o componente sempre fica sobre fundo claro, então só precisa do selo para parecer profissional.

### 3. Footer (`src/components/landing/Footer.tsx`)

Trocar o quadrado roxo + ícone Bike pelo logo real (`@/assets/logo-simbolo.png`) com o mesmo selo branco circular, garantindo identidade consistente em todo o site.

## Resultado esperado

- Logo nítido, com aro dourado e fundo branco, destacando o símbolo da moto
- "Bibi" branco + "Motos" dourado + "FRANQUIAS" dourado claro com tracking — leitura imediata sobre o roxo
- Visual premium, alinhado à identidade roxo/dourado da Bibi Motos
- Mesma assinatura visual em navbar do hero, navbar global e footer
