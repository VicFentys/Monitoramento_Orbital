-- Script de inicialização do Banco de Dados para o Monitoramento Orbital Educacional

-- Criar a tabela categoria_objeto
CREATE TABLE IF NOT EXISTS categoria_objeto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor_visualizacao VARCHAR(7) NOT NULL -- Hexadecimal, ex: #FF0000
);

-- Criar a tabela objeto_orbital
CREATE TABLE IF NOT EXISTS objeto_orbital (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    norad_id VARCHAR(50) NOT NULL UNIQUE,
    pais VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    data_lancamento DATE,
    categoria_id INTEGER NOT NULL,
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_objeto(id) ON DELETE RESTRICT
);

-- Criar a tabela tle_historico
CREATE TABLE IF NOT EXISTS tle_historico (
    id SERIAL PRIMARY KEY,
    objeto_id INTEGER NOT NULL,
    epoch TIMESTAMP WITH TIME ZONE NOT NULL,
    linha1 CHAR(69) NOT NULL,
    linha2 CHAR(69) NOT NULL,
    data_captura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_objeto FOREIGN KEY (objeto_id) REFERENCES objeto_orbital(id) ON DELETE CASCADE
);

-- Regra de Performance: INDEX explícito nos campos 'norad_id' e 'nome'
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_norad_id ON objeto_orbital(norad_id);
CREATE INDEX IF NOT EXISTS idx_objeto_orbital_nome ON objeto_orbital(nome);

-- Inserir dados iniciais para categorias (conforme RF02 e cores didáticas harmoniosas)
INSERT INTO categoria_objeto (nome, descricao, cor_visualizacao) VALUES
('Satélite Ativo', 'Satélites operacionais ativos em órbita executando serviços de comunicação, observação, etc.', '#10B981'), -- Verde esmeralda (Harmonioso)
('Satélite Inativo', 'Satélites que encerraram suas operações e permanecem em órbita desativados.', '#F59E0B'), -- Âmbar/Laranja
('Detrito Espacial', 'Partes de foguetes, fragmentos de colisões ou ferramentas perdidas em órbita.', '#EF4444'), -- Vermelho
('Estação Espacial', 'Grandes estruturas habitáveis em órbita que abrigam astronautas e experimentos.', '#3B82F6')  -- Azul
ON CONFLICT (nome) DO NOTHING;
