# Mente Serena — histórico recuperado e alterações (27/10/2026)

## Histórico anterior disponível
- Projeto Mente Serena, domínio menteserena.life, publicação Cloudflare Pages/Workers e repositório GitHub.
- Backend Node.js/Express, banco MySQL Aiven com SSL, checkout Mercado Pago.
- Integração com cupons BEMVINDO10 e MENTE10; vagas gratuitas e teste de 15 dias.
- Ajustes históricos: evitar deploy da pasta `node_modules`, usar apenas diretório de frontend, corrigir `assets.directory`, apontar webhook do Mercado Pago para o backend, e verificar idempotência no checkout.
- Solicitação de substituir relatos por depoimentos reais, sem fabricar nomes nem testemunhos.
- Pedido para remover CNPJ e apresentar como projeto educacional pessoal, sem inventar empresa.
- Acessibilidade, responsividade, desempenho, aviso de conteúdo educacional sem substituir atendimento clínico.

## Alterações nesta entrega
- Preço mensal: Básico R$ 20; Intermediário R$ 30; Avançado R$ 40. Arquivos: plans.js (backend), checkout.js, checkout.html e index.html. Teste de 15 dias passa depois para R$ 20/mês conforme checkout existente.
- Seção pública com três posições de ensino: João Marcelo e dois instrutores convidados planejados, sem atribuir identidade ou qualificação não confirmada.
- Texto institucional revisado e antigo CNPJ removido de páginas HTML.
- Preço de teste/regressão atualizado e banner substituído por mensagem atemporal.

## Verificações obrigatórias antes da publicação
- Confirmar se existem de fato os dois outros instrutores e atualizar nomes/perfis; até lá, participações claramente identificadas como planejadas.
- Validar direitos e autorização de todos os depoimentos existentes.
- Testar em sandbox Mercado Pago e webhook, pagamentos, assinaturas, cancelamentos, reembolsos e preços de renovação; sem isso NÃO se pode garantir transações sem erro.
- Verificar modelo jurídico/fiscal apropriado à cobrança como pessoa física e obrigações de identificação do fornecedor, privacidade e direitos do consumidor.
- Revalidar benefícios anunciados: encontros online, suporte e cursos avançados somente se realmente disponíveis; ajustar planos se não estiverem.
- Não publicar arquivos `.env`, configurações secretas, dependências locais ou histórico `.git`.
- Alterações realizadas somente na cópia fornecida, não no domínio publicado.
