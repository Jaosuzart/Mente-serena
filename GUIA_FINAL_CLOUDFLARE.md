# Mente Serena — Cloudflare e API: configuração final (28/10/2026)

## Histórico das decisões recuperadas
- Domínio do projeto: `menteserena.life`.
- Worker de publicação: `mente-serena-web`; frontend: `src/frontend`.
- Backend separado: Node.js/Express; MySQL; Mercado Pago. Cloudflare **não executa esse servidor Node.js** automaticamente.
- Preços fixados: básico R$ 20/mês; intermediário R$ 30/mês; avançado R$ 40/mês. Validar também a política de teste grátis antes da venda.
- Equipe exibida: João Marcelo e duas posições de instrutores convidados, sem atribuir perfis profissionais não confirmados.
- Não exibir CNPJ inexistente nem depoimentos como reais sem comprovação/autorização.
- Ajustes anteriores incluem acessibilidade e fluxo de pagamento, mas nenhuma compra real foi confirmada.

## Ajustes nesta edição
1. `wrangler.jsonc` mantém `assets.directory=./src/frontend` e o Worker-proxy para as APIs: isso evita fazer upload de `node_modules` e do backend como assets estáticos.
2. Removida a URL **não verificada** `https://mente-serena.onrender.com` do arquivo de deploy. É necessário informar a URL real da API no painel da Cloudflare como variável `BACKEND_URL`, sem barra final e com HTTPS. Sem ela, o Worker devolve 503 intencionalmente (sem checkout falso).
3. `render.yaml`: URL do frontend e URL do webhook ajustadas para o domínio oficial `https://menteserena.life`.
4. Tratamento explícito de rotas não encontradas e URLs HTML no Wrangler.

## Como concluir na Cloudflare
1. Crie ou selecione o Worker **mente-serena-web** em **Workers & Pages**. Este pacote usa **Workers + Static Assets**, não um projeto Pages puro.
2. Publique o backend Node.js no provedor escolhido, configure MySQL/SSL e credenciais do Mercado Pago **somente como segredos do servidor**. Confirme a URL HTTPS final da API (não presuma o nome do domínio Render).
3. No Worker **mente-serena-web > Settings > Variables and Secrets**, defina `BACKEND_URL` igual à URL HTTPS real da API, por exemplo `https://SUA-API.onrender.com` (substitua por sua URL real). Nunca coloque Access Token nesse Worker ou em JS público.
4. Configure o serviço Node.js com `FRONTEND_URL=https://menteserena.life`; configure `MP_WEBHOOK_URL=https://menteserena.life/webhook` e o segredo do webhook conforme o gateway.
5. Na raiz do projeto, no PC com Node 24 atualizado, execute:
   ```bash
   npm ci
   npm test
   npx wrangler deploy --dry-run
   npx wrangler login
   npx wrangler deploy
   ```
6. No painel do Worker: **Settings > Domains & Routes > Add > Custom Domain**, associe `menteserena.life`; adicione `www` se desejar. Caso existam registros DNS conflitantes, revise-os antes. Aguarde ativação do certificado.
7. Verifique `https://menteserena.life`, os três preços, acessibilidade, imagens, `https://menteserena.life/api/...` e checkout em **ambiente de teste**. Não faça venda real até testar fluxo completo, confirmação de webhook, cancelamento e liberação de conteúdo.

## Atenção à segurança
Uma credencial de produção Mercado Pago foi compartilhada numa conversa anterior. **Revogue-a/rotacione-a no Mercado Pago** e substitua apenas nas variáveis privadas do backend. Nunca faça commit de `.env`, tokens ou credenciais de MySQL.

## Limites da entrega
O ZIP é uma preparação de deploy; **não foi publicado na conta Cloudflare**, pois não há sessão autenticada da sua conta. Nenhum teste real de pagamento ou conexão com banco foi confirmado nesta execução.
