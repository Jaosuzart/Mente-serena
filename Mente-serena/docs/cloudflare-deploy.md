# Publicação do frontend na Cloudflare Workers

O comando `npx wrangler deploy`, executado na raiz, usa `wrangler.jsonc`
para publicar os arquivos de `src/frontend` e o Worker que encaminha a API. Não publique a raiz do repositório:
ela contém código de servidor e pode conter arquivos privados locais.

Configuração no painel:

- Diretório raiz: `/`.
- Comando de construção: nenhum (HTML, CSS e JavaScript já estão prontos).
- Comando de implantação: `npx wrangler deploy`.
- Nome do Worker: `mente-serena-web`. Se o projeto tiver outro nome, alinhe
  o campo `name` do arquivo ao nome mostrado no painel.

`html_handling: auto-trailing-slash` serve `index.html` na raiz e redireciona
os links `.html` para as URLs correspondentes sem extensão.
`not_found_handling: none` evita devolver a página inicial para rotas inexistentes,
inclusive chamadas de API.

## Verificação antes da publicação

```sh
npm run lint:home
npm test
npx wrangler deploy --dry-run
```

Os validadores de desenvolvimento precisam de Node.js 22.22+ ou 24.8+;
utilize Node.js 24 atualizado no ambiente de validação.

## Backend e pagamentos

Para manter este site na Cloudflare e publicar a API no Render, siga
[o guia de ativação dos pagamentos](ativar-pagamentos.md). A raiz contém um
`render.yaml` opcional com as configurações desse servidor.

O Worker encaminha as rotas de API para a origem HTTPS definida em `BACKEND_URL`.
Você pode gravar esse endereço no `wrangler.jsonc` com `npm run configure:payments`,
sem precisar localizar a seção de variáveis no painel.
No painel da Cloudflare, configure essa variável com a URL pública do servidor
Express (por exemplo, `https://api.seusite.com.br`, sem caminhos). Mantenha
`baseUrl` vazio em `src/frontend/js/api.js` para usar o proxy no mesmo domínio.
No Express, configure `FRONTEND_URL` como a origem do site workers.dev.
Publique com `npx wrangler deploy` depois de configurar a variável.

Sem `BACKEND_URL`, as rotas retornam HTTP 503 com uma mensagem JSON clara;
isso evita o erro de JSON, mas o pagamento depende do backend publicado.
O Worker não executa o Express nem substitui o banco MySQL.

Se o checkout retornar `404` em `/create_preference`, o domínio acessado não
está atendendo a rota da API. Publicar somente os arquivos estáticos não cria
essa rota.

Para usar um backend em outro domínio:

1. Publique este projeto em um servidor Node.js com `npm start`, configure as
   variáveis privadas do `.env.example` no servidor e confirme a conexão MySQL.
2. Em `src/frontend/js/api.js`, defina `baseUrl` como a URL HTTPS pública desse
   backend (sem o caminho `/create_preference`). Não coloque tokens nesse arquivo.
3. No backend, configure `FRONTEND_URL` com a origem exata do site, sem barra final,
   para permitir o acesso pelo navegador e gerar os links de retorno.
4. Publique novamente o frontend e valide o checkout em ambiente de teste.

Deixe `baseUrl` vazio quando o próprio Express servir o site ou houver um proxy
encaminhando as rotas de API no mesmo domínio.

Esta configuração publica os arquivos do site e o proxy. Ela não executa
`src/app.js`, não inicializa MySQL e não inicia a conexão persistente do WhatsApp.
O frontend chama `/create_preference`, `/validar_cupom`, `/claim_free_spot`
e `/api/whatsapp` no mesmo domínio. Para essas funções operarem, é necessário
manter o backend Node.js acessível e encaminhar essas rotas a ele, ou adaptar
explicitamente a integração para outra arquitetura.

Não configure uma resposta de página inicial para encobrir erros dessas APIs.
Valide o checkout em ambiente de teste antes de habilitar pagamentos no domínio.

Documentação: https://developers.cloudflare.com/workers/static-assets/binding/
