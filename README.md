# OrbitalED — Monitoramento Orbital & Sustentabilidade Espacial

O **OrbitalED** é uma plataforma interativa para visualização em tempo real de satélites e detritos na órbita terrestre, focada em divulgação científica, astrodinâmica e conscientização sobre a sustentabilidade espacial e o Efeito Kessler.

A aplicação traduz séries complexas de mecânica celeste em uma experiência visual intuitiva, permitindo navegar pela órbita terrestre em 3D, analisar telemetria física calculada analiticamente e compreender o impacto do lixo espacial.

---

## Stack Tecnológica

O sistema opera sob arquitetura multi-container com serviços orquestrados via Docker Compose:

- **Backend (FastAPI & Python 3.11):** API assíncrona de alta performance para ingestão, tratamento e disponibilização dos dados orbitais e agregações estatísticas.
- **Banco de Dados (PostgreSQL 15):** Persistência relacional otimizada com índices em `norad_id` e `nome` para garantir consultas rápidas sobre o catálogo de satélites, categorias e históricos de TLE.
- **Frontend (React 19 & Vite):** Interface web moderna e reativa, estruturada sob a estética de console tático espacial (HUD em vidro translúcido).
- **Motor 3D (CesiumJS & WebGL):** Renderização fotorrealista da Terra com iluminação solar dinâmica, atmosfera e aceleração de hardware.
- **satellite.js:** Biblioteca no cliente que executa o propagador matemático SGP4 frame a frame a partir de elementos Two-Line Element (TLE), eliminando sobrecarga no servidor.
- **Docker & Docker Compose:** Containerização de ponta a ponta em rede em ponte unificada para execução rápida com um único comando.

---

## Fluxo de Integração de Dados

1. **Ingestão:** O servidor processa strings brutas de dados TLE de fontes públicas oficiais (CelesTrak).
2. **Persistência e Indexação:** O banco relacional armazena os parâmetros físicos, categorias e dados geopolíticos de cada objeto.
3. **Endpoints REST:** A API FastAPI expõe rotas JSON rápidas e documentadas para consulta, filtros e métricas.
4. **Propagação e Plotagem no Cliente:** O frontend recebe os dados, aplica amostragem estratificada e propaga matematicamente as coordenadas geodésicas em tempo real sobre o globo 3D.

---

## Principais Recursos

- **Globo Terrestre 3D Interativo:** Exploração orbital contínua com rotação livre, aproximação calibrada e acompanhamento automático de câmera sobre o objeto selecionado.
- **Amostragem Estratificada Inteligente:** Censo com 6.336 objetos rastreados, operando com radar ativo calibrado em 1.000 objetos distribuídos proporcionalmente para manter taxa constante de 60 FPS no navegador.
- **Recarregar Amostragem:** Botão no painel tático para sortear instantaneamente uma nova amostra a partir do catálogo completo.
- **Filtros por Categorias:**
  - Satélites Ativos (`#00ff66` - Verde neon)
  - Satélites Inativos (`#f59e0b` - Âmbar neon)
  - Detritos Espaciais (`#ff0055` - Vermelho neon)
  - Estações Espaciais (`#00f0ff` - Ciano neon)
- **Filtros por Regimes de Altitude:** Separação por baixa órbita (LEO), órbita média (MEO) e órbita geoestacionária (GEO).
- **Telemetria e Trilha Orbital:** Cálculo kepleriano analítico exibindo apogeu, perigeu, inclinação, velocidade instantânea, período orbital e projeção da elipse orbital sobre o globo.
- **Dossiê Histórico e Factual:** Ficha com finalidade operacional, nação responsável, contexto histórico e relevância de cada objeto.
- **Busca Instantânea:** Pesquisa com autocompletação em tempo real por nome do satélite ou identificador NORAD ID.
- **Modais Educativos:** Módulos didáticos integrados dedicados à Sustentabilidade Espacial (Efeito Kessler) e Glossário Astrodinâmico.

---

## Como Executar Localmente

### Pré-requisitos
- **Docker** e **Docker Compose** instalados na máquina.

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/VicFentys/Monitoramento_Orbital.git
cd Monitoramento_Orbital

# 2. Subir os contêineres Docker
docker-compose up --build
```

O Docker Compose inicializa o banco de dados PostgreSQL (`orbital_db`), popula as tabelas na primeira execução, sobe a API FastAPI (`orbital_backend`) e compila a aplicação React (`orbital_frontend`).

### Endereços e Portas

| Serviço | Endereço Local | Descrição |
| :--- | :--- | :--- |
| **Frontend (Docker)** | [http://localhost:3000](http://localhost:3000) | Simulador principal e console tático 3D |
| **Frontend (Dev Local)** | [http://localhost:5173](http://localhost:5173) | Vite dev server em modo hot-reload |
| **Backend API** | [http://localhost:8000/docs](http://localhost:8000/docs) | Documentação Swagger interativa da API |
| **PostgreSQL** | `localhost:5433` | Banco relacional (`orbital_db` / `orbital_user`) |

---

## Estrutura do Repositório

```text
Monitoramento_Orbital/
├── backend/                  # API FastAPI (Python 3.11)
│   ├── app/
│   │   ├── main.py           # Endpoints, regras de negócio e rotinas
│   │   └── models.py         # Mapeamento ORM das entidades
│   ├── requirements.txt      # Dependências Python
│   └── Dockerfile
├── frontend/                 # Aplicação React 19 + Vite + CesiumJS
│   ├── src/                  # Console tático, física orbital e enciclopédia
│   ├── public/               # Assets estáticos
│   ├── Dockerfile
│   └── README.md             # Guia específico do frontend
├── docker/
│   └── postgres/
│       └── init.sql          # Esquema relacional e dados iniciais
├── docker-compose.yml        # Orquestração dos contêineres
└── README.md                 # Visão geral da plataforma
```
