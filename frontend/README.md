# OrbitalED — Frontend

Interface web interativa para visualização 3D em tempo real de satélites e detritos na órbita terrestre, focada em divulgação científica, astrodinâmica e conscientização sobre sustentabilidade espacial.

---

## Tecnologias

- **React 19** + **Vite**: renderização ágil com compilação ultrarrápida.
- **CesiumJS**: motor 3D acelerado por hardware (WebGL) para renderização do globo terrestre, atmosfera e trajetórias orbitais.
- **satellite.js**: propagador analítico SGP4 executado diretamente no cliente a partir de dados TLE (Two-Line Element).
- **Lucide React**: iconografia vetorial do console tático.
- **CSS3 Vanilla**: identidade visual neo-futurista em vidro translúcido (HUD espacial) com total responsividade.

---

## Funcionalidades Principais

- **Globo Terrestre 3D**: navegação orbital fluida com iluminação solar, rotação livre, aproximação calibrada e acompanhamento de câmera sobre qualquer satélite selecionado.
- **Amostragem Estratificada Dinâmica**: radar ativo calibrado para 1.000 objetos distribuídos proporcionalmente do censo total de 6.336 objetos, garantindo 60 FPS contínuos no navegador.
- **Recarregar Amostragem**: botão dedicado no painel tático para sortear uma nova amostra instantânea a partir da base completa.
- **Filtros por Categorias**:
  - Satélites Ativos (#00ff66)
  - Satélites Inativos (#f59e0b)
  - Detritos Espaciais (#ff0055)
  - Estações Espaciais (#00f0ff)
- **Filtros por Regimes de Altitude**: LEO (órbita baixa), MEO (órbita média) e GEO (órbita geoestacionária).
- **Telemetria e Trilha Orbital**: ao passar o mouse ou selecionar um objeto, sua órbita elíptica é projetada no globo e o painel exibe apogeu, perigeu, inclinação, velocidade, período orbital e dossiê factual de missão.
- **Busca Global**: pesquisa rápida com autocompletação por nome do artefato ou número de catálogo NORAD.
- **Modais Educativos**: painéis dedicados à Sustentabilidade Orbital (Efeito Kessler) e Glossário Astrodinâmico.

---

## Estrutura do Projeto

```text
frontend/
├── public/
│   └── favicon.svg               # Favicon da aplicação
├── src/
│   ├── data/
│   │   └── orbitalEncyclopedia.js # Base didática e histórico de satélites
│   ├── utils/
│   │   └── orbitalPhysics.js      # Cálculos keplerianos e gerador de órbitas
│   ├── App.jsx                    # Console tático principal e orquestrador
│   ├── App.css                    # Estilos táticos HUD, filtros e animações
│   ├── index.css                  # Variáveis globais de tema e reset
│   └── main.jsx                   # Ponto de entrada React
├── index.html                     # Template HTML e importação de fontes e CesiumJS
├── vite.config.js                 # Configuração do Vite
└── package.json                   # Dependências e scripts
```

---

## Como Executar

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- Backend da API em execução (porta 8000 por padrão)

### Instalação e Execução Local

```bash
# Entrar na pasta do frontend
cd frontend

# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Build de Produção

```bash
npm run build
```

Os arquivos estáticos otimizados serão gerados na pasta `dist/`.

### Execução via Docker

Se preferir rodar com toda a stack do projeto containerizada, execute na raiz do repositório:

```bash
docker-compose up -d orbital_frontend
```

Acesse via porta mapeada: `http://localhost:3000`.

---

## Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `frontend/` se precisar apontar para um backend customizado:

```env
VITE_API_URL=http://localhost:8000
```
