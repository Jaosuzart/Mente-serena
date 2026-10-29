globalThis.MenteSerenaApi = {
    baseUrl: '',

    async post(path, payload) {
        const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (response.status === 404) {
            throw new Error('O serviço de pagamento está indisponível (404). Tente novamente mais tarde.');
        }
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}). Tente novamente mais tarde.`);
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('O servidor retornou uma resposta inválida. Tente novamente mais tarde.');
        }
        return { response, data };
    },
};
