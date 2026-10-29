# Mente Serena — revisão de arquitetura e implantação (28/10/2026)

## Entregável e escopo
Este pacote inclui o código integral disponibilizado na versão Cloudflare anterior: frontend, Worker, API Express, modelos e serviços, testes, documentação e configuração Render. É uma **revisão local de código**, não uma publicação na conta Cloudflare.

## Arquitetura
Navegador → Cloudflare Worker `mente-serena-web` (assets estáticos e proxy para rotas de API) → API Node/Express hospedada separadamente (Render) → MySQL e Mercado Pago. O Worker exige `BACKEND_URL` HTTPS apontando para o backend real. `BACKEND_URL` NÃO é o domínio do próprio site para evitar loop.

## Alterações nesta revisão
- CORS deixa de usar curinga `*` quando `FRONTEND_URL` não está definido; origem de produção é `https://menteserena.life`. Defina explicitamente `FRONTEND_URL` no deploy.
- MySQL passa a validar o certificado TLS por padrão (`DB_SSL_REJECT_UNAUTHORIZED=true`); configure CA do provedor se necessário. Somente em ambiente de desenvolvimento isolado considere desativar a verificação; não desative em produção.
- Preservados preços na fonte de verdade do backend: Básico R$20/mês, Intermediário R$30/mês, Avançado R$40/mês; trial 15 dias com cobrança posterior de R$20/mês, sujeito ao fluxo real do Mercado Pago.
- Preservada a identificação de dois futuros instrutores como participações em planejamento, sem inventar nomes e credenciais.

## Problemas e riscos pendentes (bloqueiam produção plena)
1. **Integração financeira não validada**: criar assinatura de teste, conferir sandbox/contas de teste, retorno de status do webhook e liberação de acesso, sem cobrança real. Teste é essencial antes da publicação.
2. **Banco de dados**: configurar credenciais via variáveis secretas do Render; testar TLS com CA apropriada e rotinas de migração/backup.
3. **Credenciais**: revogar/rotacionar o token Mercado Pago que foi anteriormente compartilhado; nunca publicar `.env`, access token ou credenciais no frontend/Cloudflare.
4. **Dependências**: `npm test` nesta revisão executou 14 arquivos de teste: 12 passaram e 2 falharam por dependências Node não instaladas neste ambiente; executar `npm ci` e `npm test` antes do deploy.
5. **Webhook**: confirmar a assinatura e os tipos de notificação de assinaturas com documentação do Mercado Pago; implementar testes contra duplicações e mensagens fora de ordem.
6. **Operação**: assegurar política de privacidade, LGPD, reembolso, acesso, cancelamento e comunicação clara da recorrência; conferir as ofertas reais de cada plano.
7. **Sem promessas médicas**: o curso é educativo, não substitui acompanhamento clínico ou psicológico.
8. **Proxy**: `BACKEND_URL` deve apontar para URL real da API; utilizar HTTPS. Na Cloudflare, defina o segredo/variável `BACKEND_URL` e publique o Worker pelo Wrangler.

## Checklist de publicação
1. Acesse o Render e configure serviços e credenciais de produção (`FRONTEND_URL`, `DB_*`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_WEBHOOK_URL`).
2. Garanta que o backend responda com sucesso no URL real; NÃO use o domínio frontend em `BACKEND_URL`.
3. No Cloudflare Workers & Pages, configure variável `BACKEND_URL=https://SUA-API-REAL.onrender.com` (exemplo ilustrativo, não substitui URL verificada).
4. No diretório deste pacote execute `npm ci`, `npm test`, `npx wrangler login`, `npx wrangler deploy`.
5. Configure o domínio `menteserena.life` somente no Worker `mente-serena-web` e confirme DNS/SSL.
6. Faça testes de compra em ambiente de teste e confirme webhooks, acesso, cancelamento, cupons, email, mobile e acessibilidade.
7. Só habilite compras reais após validar tudo e revisar aspectos jurídicos e comerciais.

## Histórico recuperado
Consulte `HISTORICO_E_ALTERACOES.md` e `GUIA_FINAL_CLOUDFLARE.md`. São sínteses das conversas relevantes; não constituem exportação integral do ChatGPT.
