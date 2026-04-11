<?php
// api/pix/database.php
require_once __DIR__ . '/../config/database.php';

function salvarPagamentoPIX($paymentId, $convId, $valor, $qrCode, $qrCodeBase64, $clienteNome, $clienteEmail, $clienteTelefone = null) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO pagamentos_pix (
                payment_id, conv_id, valor, qr_code, qr_code_base64, 
                status, cliente_nome, cliente_email, cliente_telefone, 
                descricao, external_reference, data_criacao, data_expiracao
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR))
        ");
        
        $descricao = "Entrega N&G Express #" . substr($convId, -6);
        
        $stmt->execute([
            $paymentId,
            $convId,
            $valor,
            $qrCode,
            $qrCodeBase64,
            $clienteNome,
            $clienteEmail,
            $clienteTelefone,
            $descricao,
            $convId
        ]);
        
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        error_log("Erro ao salvar pagamento: " . $e->getMessage());
        return false;
    }
}

function atualizarStatusPagamento($paymentId, $status, $dataAprovacao = null) {
    global $pdo;
    
    try {
        $sql = "UPDATE pagamentos_pix SET status = ?, data_atualizacao = NOW()";
        $params = [$status, $paymentId];
        
        if ($status === 'approved' && $dataAprovacao) {
            $sql = "UPDATE pagamentos_pix SET status = ?, data_aprovacao = ?, data_atualizacao = NOW() WHERE payment_id = ?";
            $params = [$status, $dataAprovacao, $paymentId];
        } elseif ($status === 'approved') {
            $sql = "UPDATE pagamentos_pix SET status = ?, data_aprovacao = NOW(), data_atualizacao = NOW() WHERE payment_id = ?";
            $params = [$status, $paymentId];
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return true;
    } catch (PDOException $e) {
        error_log("Erro ao atualizar status: " . $e->getMessage());
        return false;
    }
}

function buscarPagamentoPorPaymentId($paymentId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM pagamentos_pix WHERE payment_id = ?");
        $stmt->execute([$paymentId]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Erro ao buscar pagamento: " . $e->getMessage());
        return null;
    }
}

function buscarPagamentoPorConvId($convId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM pagamentos_pix WHERE conv_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$convId]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Erro ao buscar pagamento: " . $e->getMessage());
        return null;
    }
}

function registrarWebhookLog($paymentId, $tipo, $payload, $status) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO webhook_logs (payment_id, tipo, payload, status, data_recebimento) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$paymentId, $tipo, json_encode($payload), $status]);
        return true;
    } catch (PDOException $e) {
        error_log("Erro ao registrar webhook: " . $e->getMessage());
        return false;
    }
}

function registrarTentativaPagamento($convId, $valor, $paymentId, $status, $erroMensagem = null, $tentativa = 1) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO tentativas_pagamento (conv_id, valor, payment_id, status, erro_mensagem, tentativa, data_tentativa) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$convId, $valor, $paymentId, $status, $erroMensagem, $tentativa]);
        return true;
    } catch (PDOException $e) {
        error_log("Erro ao registrar tentativa: " . $e->getMessage());
        return false;
    }
}

function atualizarPedidoComPagamento($numeroPedido, $paymentId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            UPDATE historico_orcamentos 
            SET payment_id = ?, status_pagamento = 'aprovado', data_pagamento = NOW() 
            WHERE numero_pedido = ?
        ");
        $stmt->execute([$paymentId, $numeroPedido]);
        return true;
    } catch (PDOException $e) {
        error_log("Erro ao atualizar pedido: " . $e->getMessage());
        return false;
    }
}

function listarPagamentosPorCliente($clienteEmail, $limit = 10) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM pagamentos_pix 
            WHERE cliente_email = ? 
            ORDER BY data_criacao DESC 
            LIMIT ?
        ");
        $stmt->execute([$clienteEmail, $limit]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erro ao listar pagamentos: " . $e->getMessage());
        return [];
    }
}

function estatisticasPagamentos() {
    global $pdo;
    
    try {
        $stats = [];
        
        // Total de pagamentos
        $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(valor) as total_valor FROM pagamentos_pix");
        $stats['total'] = $stmt->fetch();
        
        // Pagamentos por status
        $stmt = $pdo->query("
            SELECT status, COUNT(*) as quantidade, SUM(valor) as valor_total 
            FROM pagamentos_pix 
            GROUP BY status
        ");
        $stats['por_status'] = $stmt->fetchAll();
        
        // Pagamentos hoje
        $stmt = $pdo->query("
            SELECT COUNT(*) as hoje, SUM(valor) as valor_hoje 
            FROM pagamentos_pix 
            WHERE DATE(data_criacao) = CURDATE()
        ");
        $stats['hoje'] = $stmt->fetch();
        
        // Pagamentos aprovados este mês
        $stmt = $pdo->query("
            SELECT COUNT(*) as mes, SUM(valor) as valor_mes 
            FROM pagamentos_pix 
            WHERE status = 'approved' 
            AND MONTH(data_aprovacao) = MONTH(CURDATE())
            AND YEAR(data_aprovacao) = YEAR(CURDATE())
        ");
        $stats['mes'] = $stmt->fetch();
        
        return $stats;
    } catch (PDOException $e) {
        error_log("Erro ao buscar estatísticas: " . $e->getMessage());
        return [];
    }
}
?>