Plano infalível de correção agora

Diagnóstico confirmado

1. O banco atual do Lovable Cloud tem os dados principais:
   - Usuário `grupobibitecnologia@gmail.com` existe.
   - E-mail confirmado.
   - Papel `super_admin` existe.
   - Cidades `Salvador` e `Passos` existem e estão ativas.
   - Franquias de Salvador e Passos existem e estão ativas.

2. O erro `Invalid login credentials` não é falta de cadastro nem falta de permissão. É senha inválida no banco atual do Lovable Cloud. A senha usada no banco/ambiente antigo não migra automaticamente.

3. As imagens quebradas na tela de login não são problema do React em si. No endereço publicado pelo Lovable (`bibimotos.lovable.app`) as imagens carregam. No domínio `bibimotos.com.br`, os arquivos `/assets/...` estão retornando erro/404 ou SSL ruim, indicando deploy/domínio Hostinger desatualizado ou quebrado.

4. `salvador.bibimotos.com.br` não está apontando para lugar nenhum agora. O erro é DNS `NXDOMAIN`: esse subdomínio não existe/resolve na internet. Isso não se corrige só com código; precisa apontamento de DNS/domínio.

5. Há arquivos de GitHub Actions ainda forçando produção para infraestrutura antiga/externa:
   - `.github/workflows/deploy.yml` sobrescreve variáveis de produção para um projeto antigo e faz deploy na Hostinger.
   - `.github/workflows/deploy-functions.yml` também aponta funções/migrations para o projeto antigo.
   Isso pode desfazer ou confundir a migração de volta para Lovable Cloud.

Plano de execução

1. Destravar o acesso administrativo
   - Implementar uma recuperação de senha por e-mail real para o login administrativo.
   - Criar a rota `/reset-password`, hoje ausente, para permitir definir nova senha com segurança após o link de recuperação.
   - Ajustar `/forgot-password` para oferecer recuperação por e-mail além do SMS atual.
   - Após isso, você usará `grupobibitecnologia@gmail.com`, receberá o link e definirá uma nova senha válida no Lovable Cloud.
   - Depois do reset, validar que o login leva ao `/dashboard` com papel `super_admin`.

2. Corrigir a origem única do sistema: Lovable Cloud
   - Remover/neutralizar os pontos de deploy que ainda forçam o banco antigo/externo.
   - Atualizar os workflows para não sobrescrever `.env` com credenciais antigas.
   - Parar deploy automático para Hostinger enquanto a produção oficial estiver no Lovable Cloud.
   - Manter o app usando somente o cliente automático já configurado para o Lovable Cloud.

3. Resolver imagens quebradas
   - Confirmar que `logo-full.png` e `login-hero.jpg` continuam sendo importados pelo Vite corretamente.
   - Corrigir o problema de publicação/domínio para que o HTML e a pasta `/assets` venham do mesmo build.
   - Se o domínio continuar na Hostinger, ajustar o deploy da pasta `dist` e o roteamento SPA.
   - Se a migração for 100% Lovable Cloud, apontar o domínio para Lovable e parar de servir arquivos pela Hostinger.
   - Validar `/login` carregando logo e imagem hero sem ícone quebrado.

4. Restaurar acesso às cidades
   - Manter e validar o fallback que já funciona: `/cidade/salvador`.
   - Validar a página de Salvador no ambiente Lovable: a cidade e franquia já existem no banco atual.
   - Para `salvador.bibimotos.com.br`, corrigir DNS/domínio:
     - conectar `bibimotos.com.br` no projeto Lovable;
     - conectar também `www.bibimotos.com.br`;
     - adicionar cada subdomínio de cidade, começando por `salvador.bibimotos.com.br` e `passos.bibimotos.com.br`;
     - apontar os registros DNS conforme o painel do Lovable indicar.
   - Importante: enquanto `salvador.bibimotos.com.br` continuar como `NXDOMAIN`, nenhum ajuste de código fará esse endereço abrir.

5. Publicação e validação final
   - Publicar/atualizar o app após os ajustes de frontend.
   - Testar estes endereços:
     - `/login`
     - `/forgot-password`
     - `/reset-password`
     - `/dashboard`
     - `/cidade/salvador`
     - domínio principal após DNS
     - subdomínio Salvador após DNS
   - Conferir no painel administrativo:
     - login super admin;
     - listagem de cidades;
     - franquias ativas;
     - acesso sem misturar dados entre cidades/franquias.

Resultado esperado

- Você consegue redefinir a senha e entrar no painel administrativo.
- A página de login volta a exibir logo e imagem corretamente.
- As cidades funcionam pelo caminho `/cidade/salvador` imediatamente após publicação.
- Os subdomínios como `salvador.bibimotos.com.br` funcionam assim que DNS/domínio estiverem apontados para Lovable.
- O projeto deixa de alternar entre banco antigo, Hostinger e Lovable Cloud, evitando regressões.

Ao aprovar este plano, eu sigo para a implementação dos ajustes de código e configuração do projeto. A parte de DNS/domínio que depende do registrador/painel de domínio eu deixarei com os registros exatos e a ordem correta para aplicar.