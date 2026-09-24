ALTER TABLE historico_orcamentos
    ADD COLUMN cidade_destino   VARCHAR(100)   DEFAULT ''   AFTER endereco_entrega,
    ADD COLUMN distancia_km     DECIMAL(10,2)  DEFAULT 0    AFTER valor_total,
    ADD COLUMN coords_coleta    VARCHAR(80)    DEFAULT ''   AFTER distancia_km,
    ADD COLUMN coords_entrega   VARCHAR(80)    DEFAULT ''   AFTER coords_coleta,
    ADD COLUMN maps_link        VARCHAR(500)   DEFAULT ''   AFTER coords_entrega;

CREATE INDEX IF NOT EXISTS idx_numero_pedido ON historico_orcamentos(numero_pedido);

CREATE INDEX IF NOT EXISTS idx_usuario_id ON historico_orcamentos(usuario_id);