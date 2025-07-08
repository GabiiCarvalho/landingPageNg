async function submitQuoteRequest(dados) {
    try {
        const response = await fetch('http://localhost:5500/api/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const resultado = await response.json();
        showToast(resultado.message);
    } catch (erro) {
        showToast('Erro ao enviar solicitação', 'error');
    }
}