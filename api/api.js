async function enviarParaBackend(formData, endpoint) {
    try {
        const response = await fetch("https://backend-l8vtzwkyw-gabiicarvalhos-projects.vercel.app/api/contacts", {
            method: "POST",
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