async function enviarParaBackend(formData, endpoint) {
    try {
        const response = await fetch(`http://localhost:5500/api/${endpoint}`, {
            method: 'POST',
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