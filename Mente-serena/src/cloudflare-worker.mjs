const apiRoutes = ['/create_preference', '/validar_cupom', '/claim_free_spot', '/webhook', '/api'];

function unavailable(message, status) {
    return Response.json({ error: message }, {
        status,
        headers: { 'Cache-Control': 'no-store' },
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (!apiRoutes.some(route => url.pathname === route || url.pathname.startsWith(`${route}/`))) {
            return env.ASSETS.fetch(request);
        }

        let backend;
        try {
            backend = new URL(env.BACKEND_URL);
            if (backend.protocol !== 'https:' || backend.origin === url.origin ||
                backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) {
                throw new Error('Invalid backend');
            }
        } catch {
            return unavailable('O serviço de pagamento ainda não está configurado. Tente novamente mais tarde.', 503);
        }

        const target = new URL(url.pathname + url.search, backend);
        const forwarded = new Request(target, request);
        forwarded.headers.delete('host');
        forwarded.headers.delete('cookie');
        try {
            // Never retry payment POSTs: a retry could create a second subscription.
            return await fetch(forwarded, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
        } catch {
            return unavailable('Não foi possível conectar ao serviço de pagamento. Tente novamente mais tarde.', 502);
        }
    },
};
