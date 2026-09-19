require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const checkoutRoutes = require('./routes/checkout.routes');
const webhookRoutes = require('./routes/webhook.routes');
const cupomRoutes = require('./routes/cupom.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const freeSpotsRoutes = require('./routes/free_spots.routes');
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
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
const { initWhatsApp } = require('./services/whatsapp');


const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
    console.log(`⏳ Inicializando o WhatsApp Baileys...`);
    initWhatsApp().catch(err => console.error("Falha ao iniciar WhatsApp:", err));
});
