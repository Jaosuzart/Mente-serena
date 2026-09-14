<h1 align="center">
  🌱 Mente Serena - Plataforma de Cursos
</h1>

<p align="center">
  Uma plataforma moderna e segura para venda e entrega do curso "Mente Serena - Acesso Completo". <br/>
  Construída com foco em performance, experiência do usuário (UI/UX Premium) e conversão.
</p>

## 🚀 Sobre o Projeto

O **Mente Serena** é uma landing page e plataforma de checkout altamente otimizada, criada com Node.js e Vanilla JS. A plataforma integra diretamente com o **Mercado Pago** para pagamentos transparentes e possui um robô de **WhatsApp** embutido (via Baileys) para suporte e automação. 

O projeto conta com uma UI refinada (Modo Noturno / Glassmorphism), políticas de rate-limiting contra ataques DDoS, sanitização de inputs e verificação criptográfica de Webhooks para garantir total segurança financeira.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5 & CSS3** (com tipografia do Google Fonts e animações suaves)
- **Bootstrap 5.3.3** (Layout responsivo e utilitários)
- **Vanilla JavaScript** (Sem frameworks pesados para garantir velocidade máxima de carregamento)
- **Integração Frontend Mercado Pago** (Wallet Bricks)

### Backend
- **Node.js & Express** (API e Servidor Web)
- **MySQL2** (Banco de dados hospedado na Aiven, via Pools de conexão)
- **Mercado Pago SDK** (Integração Oficial v2)
- **Baileys (@whiskeysockets/baileys)** (Conexão e disparo de mensagens via WhatsApp)

### Segurança & Infraestrutura
- **Express Rate Limit** (Prevenção de ataques Brute-force e DDoS)
- **Helmet** (Proteção de cabeçalhos HTTP)
- **Autenticação de Webhooks** (HMAC-SHA256)
- **JWT (JSON Web Tokens)** (Autenticação interna simulada e segura)
- **Crypto** (Geração de UUIDs e Hashes seguros)

---

## ⚙️ Funcionalidades

- ✅ **Checkout Transparente**: Integração fluída com Mercado Pago.
- ✅ **Webhooks Seguros**: Escuta de pagamentos aprovados e atualização do status no Banco de Dados em tempo real, verificando a assinatura digital do Mercado Pago.
- ✅ **Sistema de Cupons**: Lógica de descontos e rastreamento de quem utilizou.
- ✅ **WhatsApp Integrado**: O próprio servidor inicia uma instância do WhatsApp Web via terminal, permitindo que a plataforma envie confirmações automáticas para os clientes!
- ✅ **Banco de Dados MySQL**: Registro de `pedidos` e `filtros_usuarios` salvos na Aiven com conexão SSL.
- ✅ **Design Premium Noturno**: UI focada em elegância (Cores HSL harmoniosas e micro-animações).

---

## 📦 Como rodar o projeto localmente

### 1. Pré-requisitos
- Node.js (v18 ou superior recomendado)
- Uma conta de Desenvolvedor no Mercado Pago (Credenciais de Teste e Produção)
- MySQL / Banco de Dados (ex: Aiven)
- WhatsApp no celular para escanear o QR Code de autenticação do bot.

### 2. Instalação

```bash
# Clone o repositório ou acesse a pasta do projeto
cd mente-serena

# Instale as dependências do Node.js
npm install
```

### 3. Configuração do Banco de Dados
Certifique-se de que o seu banco MySQL está rodando. Em seguida, crie a estrutura das tabelas usando o nosso utilitário:

```bash
# Executa o script que lê o init.sql e cria as tabelas "pedidos" e "filtros_usuarios"
node test-db.js
```

### 4. Configuração das Variáveis de Ambiente (.env)
Crie um arquivo `.env` na raiz do projeto (se não existir) com base no `.env.example` e preencha as variáveis cruciais:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados (MySQL)
DB_HOST=seu_host.aivencloud.com
DB_PORT=13329
DB_USER=avnadmin
DB_PASSWORD=sua_senha
DB_NAME=defaultdb

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-sua-chave-secreta-de-producao-ou-teste
MP_PUBLIC_KEY=APP_USR-sua-chave-publica
MP_WEBHOOK_SECRET=seu_webhook_secret_do_mercadopago

# WhatsApp Bot
WHATSAPP_NUMBER=5511999999999
```
*Obs: Lembre-se de alterar também a Chave Pública no arquivo `src/frontend/js/script.js` se for trocar de Teste para Produção.*

### 5. Iniciando o Servidor

Para rodar o projeto em modo de desenvolvimento (o WhatsApp irá gerar um QR Code no console):

```bash
npm start
```
Acesse `http://localhost:3000` ou `http://localhost:3001` no seu navegador!

---

## 🔒 Segurança Aplicada

Como exigido em projetos financeiros, a plataforma Mente Serena contém:
1. **Validação e Sanitização:** Todo input via POST e GET (nome, email, etc) é purificado removendo tags HTML e caracteres ilegais antes de entrar no MySQL.
2. **Timing Safe Equal:** Comparações de Hash no webhook evitam *timing attacks*.
3. **Prepared Statements:** O banco de dados utiliza `?` em todas as queries para erradicar a possibilidade de injeção de SQL (SQL Injection).

---

Feito com dedicação para maximizar a tranquilidade e a conversão do **Mente Serena**! 🧘‍♂️✨
# Mente-serena
