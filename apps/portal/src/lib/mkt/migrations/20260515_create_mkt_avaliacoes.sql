-- Tabela para guardar as avaliações estratégicas antes de virarem projetos reais
CREATE TYPE mkt_avaliacao_status AS ENUM ('rascunho', 'em_avaliacao', 'aprovado', 'rejeitado');

CREATE TABLE IF NOT EXISTS mkt_avaliacoes_estrategicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    user_id UUID NOT NULL,
    titulo_proposta TEXT NOT NULL,
    
    -- Dados do Report (Markdown + JSON para IA)
    report_markdown TEXT,
    dados_estrategicos JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Fluxo de Aprovação
    status mkt_avaliacao_status DEFAULT 'rascunho',
    feedback_board TEXT,
    aprovado_por UUID,
    aprovado_em TIMESTAMPTZ,
    
    -- Vínculo pós-aprovação
    projeto_gerado_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_mkt_avaliacoes_empresa ON mkt_avaliacoes_estrategicas(empresa_id);
CREATE INDEX idx_mkt_avaliacoes_status ON mkt_avaliacoes_estrategicas(status);

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_mkt_avaliacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_mkt_avaliacoes_updated_at
    BEFORE UPDATE ON mkt_avaliacoes_estrategicas
    FOR EACH ROW
    EXECUTE FUNCTION update_mkt_avaliacoes_updated_at();
