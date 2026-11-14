const https = require('https');
const crypto = require('crypto');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function main() {
    const prodToken = 'APP_USR-538462796188265-111010-c9d72a781da1d3b6b6dde6b603e05665-3833257728';
    const publicKey = 'APP_USR-08ab9a0d-95b8-4851-914f-412975bc672f';
        const cardRes = await makeRequest({
        hostname: 'api.mercadopago.com',
        path: `/v1/card_tokens?public_key=${publicKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        card_number: '4235647728025682',
        expiration_month: 11,
        expiration_year: 2030,
        security_code: '123',
        cardholder: {
            name: 'APRO',
            identification: { type: 'CPF', number: '12345678909' }
        }
    });
    
    const tokenId = cardRes.body.id;
    console.log('Card token:', tokenId);
    
    const orderId = crypto.randomUUID();
        const payRes = await makeRequest({
        hostname: 'api.mercadopago.com',
        path: '/v1/payments',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${prodToken}`,
            'X-Idempotency-Key': crypto.randomUUID()
        }
    }, {
        transaction_amount: 5.00,
        token: tokenId,
        description: 'Mente Serena Teste',
        installments: 1,
        payment_method_id: 'visa',
        statement_descriptor: 'MENTESERENA',
        payer: {
            email: 'joaomarcelosuzartcastro@gmail.com',
            first_name: 'Joao',
            last_name: 'Silva',
            identification: { type: 'CPF', number: '12345678909' },
            address: {
                zip_code: '40110040',
                street_name: 'Rua Teste',
                street_number: 100,
                neighborhood: 'Centro',
                city: 'Salvador',
                federal_unit: 'BA'
            }
        },
        external_reference: orderId,
        additional_info: {
            items: [{
                id: 'test-item',
                title: 'Mente Serena - Teste',
                quantity: 1,
                unit_price: 5.00
            }],
            payer: {
                first_name: 'Joao',
                last_name: 'Silva',
                registration_date: '2026-01-01T00:00:00.000-03:00'
            }
        }
    });
    
    console.log('\nPayment Status:', payRes.status);
    console.log('Payment ID:', payRes.body.id);
    console.log('Status:', payRes.body.status);
    console.log('Status Detail:', payRes.body.status_detail);
    console.log('External Reference:', payRes.body.external_reference);
    console.log('Order ID (MP):', payRes.body.order?.id);
    console.log('Date:', payRes.body.date_created);
    
    if (payRes.body.status === 'approved') {
        console.log('\n✅ PAGAMENTO APROVADO!');
        console.log('Order ID para usar:', payRes.body.order?.id || payRes.body.id);
    } else {
        console.log('\nFull response:', JSON.stringify(payRes.body, null, 2));
    }
}

main().catch(console.error);
