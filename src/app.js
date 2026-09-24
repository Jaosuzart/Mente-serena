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
const app = express();
app.use(helmet({
    contentSecurityPolicy: false,
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
});
app.use(limiter);

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));


app.use('/create_preference', checkoutRoutes);
app.use('/webhook', webhookRoutes);
app.use('/validar_cupom', cupomRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/claim_free_spot', freeSpotsRoutes);

module.exports = app;

if (require.main === module) {
    require('./server').start().catch(error => {
        console.error('Falha ao iniciar servidor:', error.message);
        process.exitCode = 1;
    });
}
