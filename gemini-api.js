
class GeminiAPI {
    constructor() {
        this.apiKey = (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) ? CONFIG.API_KEY : '';
        this.apiUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : '';
    }

    async generateResponse(prompt) {
        try {
            // If an API key exists in client-side config, call Gemini directly (for quick demos)
            if (this.apiKey) {
                const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                if (!response.ok) throw new Error('API request failed');
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

            // Otherwise, call the backend proxy at /api/generate
            const proxyRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!proxyRes.ok) {
                const txt = await proxyRes.text();
                throw new Error('Proxy request failed: ' + txt);
            }
            const proxyData = await proxyRes.json();
            return proxyData.text || '';
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw new Error('Maaf, terjadi kesalahan saat berkomunikasi dengan AI. Silakan coba lagi.');
        }
    }
}