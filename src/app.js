require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const checkoutRoutes = require('./routes/checkout.routes');
const webhookRoutes = require('./routes/webhook.routes');
const cupomRoutes = require('./routes/cupom.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const freeSpotsRoutes = require('./routes/free_spots.routes');
const courseAdminRoutes = require('./routes/course-admin.routes');
const instructorRoutes = require('./routes/instructor.routes');
const coursePublicRoutes = require('./routes/course-public.routes');
const app = express();
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            mediaSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://api.mercadopago.com"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 ano
        includeSubDomains: true,
        preload: true
    }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Muitas requisições geradas por este IP. Por favor, tente novamente em 15 minutos.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/webhook',
});
app.use(limiter);
const allowedFrontend = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://menteserena.life' : 'http://localhost:3000');
app.use(cors({
    origin: allowedFrontend,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));


app.use('/create_preference', checkoutRoutes);
app.use('/webhook', webhookRoutes);
app.use('/validar_cupom', cupomRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/claim_free_spot', freeSpotsRoutes);

// Rotas do Sistema de Cursos (LMS) com Governança Administrativa (RBAC)
app.use('/api/v1/admin/courses', courseAdminRoutes);
app.use('/api/v1/instructor/courses', instructorRoutes);
app.use('/api/v1/courses', coursePublicRoutes);

// ─── 404 handler: rota não encontrada ─────────────────────────────────────────
// Deve vir APÓS todas as rotas registradas.
app.use((req, res) => {
    // Retorna JSON para requisições de API, HTML para o restante (browser)
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
        // Serve a página inicial para rotas desconhecidas (SPA fallback seguro)
        return res.status(404).sendFile(
            require('path').join(__dirname, 'frontend', 'index.html')
        );
    }
    return res.status(404).json({ error: 'Rota não encontrada.' });
});
app.use((err, req, res, _next) => {
    console.error('[ERROR]', err.message || err);
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor.'
        : (err.message || 'Erro interno do servidor.');
    return res.status(status).json({ error: message });
});

module.exports = app;

if (require.main === module) {
    require('./server').start().catch(error => {
        console.error('Falha ao iniciar servidor:', error.message);
        process.exitCode = 1;
    });
}
