# Publicação do frontend na Cloudflare Workers

O comando `npx wrangler deploy`, executado na raiz, usa `wrangler.jsonc`
para publicar exclusivamente `src/frontend`. Não publique a raiz do repositório:
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

Esta configuração publica apenas os arquivos do site. Ela não executa
`src/app.js`, não inicializa MySQL e não inicia a conexão persistente do WhatsApp.
O frontend chama `/create_preference`, `/validar_cupom`, `/claim_free_spot`
e `/api/whatsapp` no mesmo domínio. Para essas funções operarem, é necessário
manter o backend Node.js acessível e encaminhar essas rotas a ele, ou adaptar
explicitamente a integração para outra arquitetura.

Não configure uma resposta de página inicial para encobrir erros dessas APIs.
Valide o checkout em ambiente de teste antes de habilitar pagamentos no domínio.

Documentação: https://developers.cloudflare.com/workers/static-assets/binding/
