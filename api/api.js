async function enviarParaBackend(formData, endpoint, method = 'POST') {
    try {
        const response = await fetch(`https://backend-l8vtzwkyw-gabiicarvalhos-projects.vercel.app/api/${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao enviar dados');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}