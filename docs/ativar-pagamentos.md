# Ativar os pagamentos mantendo o site na Cloudflare

O site usa o Worker em `src/cloudflare-worker.mjs` para encaminhar as chamadas
ao servidor Express. A configuração atual precisa de uma API Node.js publicada
e de um banco MySQL acessível. O endereço workers.dev do site não é a URL do backend.

## 1. Publicar a API

Envie os arquivos atualizados para o repositório que você utiliza na publicação.
No [Render](https://dashboard.render.com), escolha **New > Blueprint**, conecte
esse repositório e use o arquivo `render.yaml` da raiz. Ele prepara um Web Service
Node.js chamado `mente-serena-api`.

Se preferir configurar manualmente, escolha **New > Web Service**, conecte o
mesmo repositório e configure:

| Campo | Valor |
| --- | --- |
| Language | Node |
| Root Directory | deixe vazio (raiz do repositório) |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/` |
| NODE_VERSION | `24` |
| NODE_ENV | `production` |
| FRONTEND_URL | `https://mente-serena-web.suzartlimacastrojoaomarcelo.workers.dev` |
| WHATSAPP_ENABLED | `false` |
| FREE_SPOTS_LIMIT | `20` |
| DB_SSL | `true` |
| MP_WEBHOOK_URL | `https://mente-serena-web.suzartlimacastrojoaomarcelo.workers.dev/webhook` |

Informe no painel do Render os valores de `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`, `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`. Use as mesmas
configurações do seu MySQL e da sua aplicação Mercado Pago. As credenciais
ficam nas variáveis do servidor; `api.js` continua com `baseUrl: ''`.

O servidor só inicia depois de conseguir acessar o MySQL. Se a publicação falhar,
consulte os logs do Render e a permissão de acesso externo do banco. As tabelas
`pedidos` (incluindo `payment_id`), `filtros_usuarios` e `uso_cupons` precisam existir;
a inicialização atual cria apenas as tabelas de controle das vagas grátis.

Ao terminar a publicação, copie a URL HTTPS que o Render forneceu. Abra essa URL
e confirme que o site carregou. Use a URL real, e não o exemplo abaixo.

O plano Free do arquivo é para validação. Ele suspende o servidor após 15 minutos
sem tráfego e pode levar cerca de um minuto para reativar, excedendo o prazo do
proxy. Para compras em produção, use uma instância que permaneça ativa. O bot
WhatsApp está desativado nessa configuração porque sua sessão precisa de
armazenamento persistente.

## 2. Conectar a Cloudflare à API

Se você não encontrou **Variables and Secrets**, pode configurar pelo projeto.
Na raiz, execute no terminal:

```sh
npm run configure:payments
```

O comando pede a URL real da API e grava apenas `BACKEND_URL` em `vars` no
`wrangler.jsonc`. Não copie as credenciais do `.env` para esse arquivo. Depois
publique com `npm run deploy:cloudflare`, ou envie o `wrangler.jsonc` atualizado
para o branch conectado à Cloudflare. Esse método dispensa cadastrar a variável
no painel; ainda é necessário ter uma API publicada.

Se preferir configurar pelo painel, siga os passos abaixo.

No painel da Cloudflare, abra **Workers & Pages > mente-serena-web > Settings >
Variables and Secrets** e adicione uma variável de texto:

| Nome | Valor |
| --- | --- |
| BACKEND_URL | a URL HTTPS real da API, por exemplo `https://mente-serena-api.onrender.com` |

O valor deve conter apenas a origem da API, sem `/create_preference`. Não use
o próprio endereço workers.dev: isso criaria um ciclo de encaminhamento.

Faça uma nova publicação com o `wrangler.jsonc` atualizado. Se a Cloudflare está
conectada ao Git, publique os arquivos no branch conectado e use o comando de
deploy `npx wrangler deploy`. Para publicar pelo terminal, execute esse comando
na raiz do projeto em um ambiente com Node/npm e autenticação na Cloudflare.

O `wrangler.jsonc` usa `keep_vars: true` para preservar a variável cadastrada
no painel nas próximas publicações pelo Wrangler.

## 3. Conferir a rota sem criar um pagamento

No PowerShell, execute um pedido com plano inválido:

```powershell
Invoke-RestMethod -Method Post -Uri 'https://mente-serena-web.suzartlimacastrojoaomarcelo.workers.dev/create_preference' -ContentType 'application/json' -Body '{"nome":"Teste","email":"teste@example.invalid","plan":"inexistente"}'
```

O esperado é HTTP **422** com erro de plano inválido. O PowerShell pode apresentar
esse retorno como erro; nesse teste isso confirma que a validação da API foi
alcançada. Esse pedido não cria uma preferência nem uma assinatura.

| Retorno | O que conferir |
| --- | --- |
| 404 | confira se os novos arquivos e `main` do Wrangler foram publicados |
| 503 com mensagem de configuração | configure `BACKEND_URL` na versão publicada |
| 502 | confirme que a URL da API abre e que o serviço está ativo |
| 422 com plano inválido | encaminhamento e validação da API funcionando |

Depois valide uma compra com contas de teste do Mercado Pago. No painel do
Mercado Pago, configure também o webhook do projeto para o endereço
`https://mente-serena-web.suzartlimacastrojoaomarcelo.workers.dev/webhook`, incluindo
os eventos de assinatura utilizados pelo checkout.

Referências: [Express no Render](https://render.com/docs/deploy-node-express-app),
[Blueprints](https://render.com/docs/blueprint-spec),
[limites do plano gratuito](https://render.com/docs/free),
[arquivos estáticos e Worker](https://developers.cloudflare.com/workers/static-assets/binding/).
