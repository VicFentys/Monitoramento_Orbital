# 🛰️ OrbitalED — Monitoramento Orbital & Sustentabilidade Espacial

O **OrbitalED** é uma plataforma interativa voltada à visualização em tempo real de objetos na órbita terrestre, focada em **divulgação científica, educação astrodinâmica e conscientização sobre a sustentabilidade orbital**. 

A aplicação traduz dados orbitais e séries complexas de engenharia espacial em conhecimento intuitivo, ilustrando visualmente os riscos da poluição espacial e o cenário crítico do **Efeito Kessler** (reação em cadeia de colisões na órbita terrestre).

---

## 🌎 1. Visão Geral do Projeto

O **OrbitalED** nasceu com o propósito de democratizar o acesso à mecânica celeste e fomentar a consciência de estudantes e entusiastas. Hoje, milhares de objetos artificiais cruzam o espaço ao redor da Terra em alta velocidade. A teia invisível de tecnologias que mantém o nosso planeta conectado convive com uma densidade alarmante de remanescentes inativos e detritos de colisões passadas.

A plataforma resolve o distanciamento didático através de uma experiência imersiva de cockpit tático neo-futurista de alto impacto visual. Dados orbitais científicos oficiais e públicos do catálogo **NORAD** são propagados diretamente no navegador do usuário, permitindo o aprendizado ativo de altitude, período orbital, país de origem e a história geopolítica de cada objeto, fornecendo um censo real de **mais de 16.300 objetos rastreados no radar**.

---

## 🛠️ 2. Stack Tecnológica

O sistema utiliza arquitetura multi-container para deploy e desenvolvimento ágil, estruturado com tecnologias modernas:

*   **Backend (FastAPI & Python):** API de alta performance que processa, roteia e gerencia de forma assíncrona a importação dos dados orbitais.
*   **Banco de Dados (PostgreSQL):** Persistência relacional de satélites, dados TLE históricos e métricas geopolíticas, otimizada com índices para garantir buscas e cargas iniciais em menos de 5 segundos.
*   **Frontend (React & Vite):** Interface web rica e dinâmica construída em componentes reutilizáveis, garantindo carregamento rápido e HMR instantâneo.
*   **Motor 3D (CesiumJS & WebGL):** Renderização fotorrealista tridimensional do globo terrestre, atmosfera realística e iluminação solar nativa por aceleração de GPU.
*   **satellite.js:** Biblioteca no cliente que calcula a posição exata de cada satélite a partir das coordenadas matemáticas TLE a cada frame, poupando processamento do servidor.
*   **Docker & Docker Compose:** Containerização e unificação de toda a stack em uma rede em ponte integrada, permitindo subir o ecossistema completo em um único comando.

---

## 📐 3. Fluxo de Integração de Dados

O ecossistema do **OrbitalED** opera em um fluxo contínuo e automatizado:

1.  **Ingestão de Dados:** O servidor busca e atualiza as strings de dados TLE brutas das APIs públicas oficiais a cada 24 horas.
2.  **Salvamento em Lote:** O backend trata as leituras e executa a atualização automática no banco relacional PostgreSQL, mantendo registros novos e históricos consistentes em poucos segundos.
3.  **Exposição de Endpoints:** A API expõe rotas JSON rápidas e documentadas para listagem de satélites e geração de estatísticas geopolíticas de lixo espacial.
4.  **Propagação e Renderização no Navegador:** O React consome esses dados e os envia ao propagador matemático do cliente. O CesiumJS plota e atualiza a posição do objeto dinamicamente sobre o globo 3D.

---

## 🎨 4. Principais Recursos e Interface

O **OrbitalED** foi construído sob uma identidade estética de ficção científica (cockpit de monitoramento espacial), projetada para garantir uma navegação fluida, intuitiva e de alto desempenho:

### 1. Tela de Boas-Vindas Didática (Welcome Screen)
*   **Apresentação por Slides:** Uma tela inicial centralizada e dividida em 3 slides de fácil navegação (Apresentação, Objetivos Científicos e Dashboard de Alerta de Lixo Espacial), que introduz o usuário aos conceitos de poluição orbital.
*   **Transição Fade Holográfica:** Mudança suave de seções acionada por rolagem do mouse ou toques na tela, simulando uma projeção holográfica ativa sem rolagem física de página.
*   **Navegação Rápida por Dots:** Indicadores circulares na lateral direita mostram o slide ativo e permitem saltar de página com um único clique. O nome do slide selecionado fica sempre visível ao lado do respectivo indicador para facilitar a navegação.

### 2. Cockpit Interativo e Responsivo
*   **Interface em Vidro:** Painéis laterais translúcidos com visual premium de ficção científica e contornos brilhantes em neon.
*   **Painéis Colapsáveis:** O usuário conta com um painel de métricas à esquerda e o painel didático à direita. Ambos podem ser recolhidos e reabertos a qualquer momento por meio de botões práticos ou gatilhos flutuantes nas bordas.
*   **Responsividade Perfeita:** Em celulares e telas menores, os painéis flutuam de forma autônoma e se ajustam perfeitamente ao tamanho útil da tela, sem causar cortes laterais e com total legibilidade dos textos.

### 3. Dados Científicos Reais e Integridade de Contagens
*   **Fidelidade com a Realidade:** O simulador exibe dados reais oficiais fornecidos pelas redes de rastreamento. A base opera estritamente com dados de satélites, detritos e estações espaciais reais.
*   **Sincronismo do Cockpit:** O número de "Objetos no Radar" exibido na barra superior se atualiza dinamicamente e de forma precisa de acordo com os filtros de categorias ativados nas legendas.

### 4. Rastreamento Preciso de Satélites e Evitação de Sobreposições
*   **Evitação de Sobreposição Visual:** Satélites que compartilham órbitas paralelas ou fragmentos do mesmo impacto são sutilmente dispersados em nuvens estáveis. Isso impede que os pontos fiquem sobrepostos na tela, permitindo que você passe o mouse e clique individualmente em cada objeto com precisão.
*   **Foco Automático de Câmera:** Ao selecionar qualquer objeto na busca ou no mapa, a câmera voa suavemente e enquadra o satélite com aproximação calibrada, mantendo o foco dinâmico enquanto você gira e explora a Terra ao fundo.

---

## 🚀 5. Como Executar o Projeto Localmente

Com toda a infraestrutura dockerizada, subir o ecossistema completo do **OrbitalED** localmente requer apenas 1 comando, sem a necessidade de instalar manualmente banco de dados PostgreSQL, pacotes Python FastAPI ou pacotes Node.js de frontend.

### Pré-requisitos
*   **Docker** instalado na máquina.
*   **Docker Compose** instalado.

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/seu-usuario/OrbitalED.git
   cd OrbitalED
   ```

2. **Subir os Contêineres Docker:**
   Execute o seguinte comando no terminal da raiz do projeto para compilar as imagens e iniciar o ecossistema:
   ```bash
   docker-compose up --build
   ```

3. **Verificação de Inicialização:**
   O Docker Compose irá criar a rede em ponte, inicializar a base de dados PostgreSQL (`orbital_db`), criar as tabelas e índices relacionais no boot, disparar o backend FastAPI (`orbital_backend`) e compilar a aplicação React em hot-reload (`orbital_frontend`).

4. **Acessar os Endereços Locais:**

   *   👉 **Frontend (Simulador Principal via Docker):** [http://localhost:3000](http://localhost:3000)
   *   👉 **Frontend (Desenvolvimento local sem Docker):** [http://localhost:5173](http://localhost:5173)
   *   👉 **Backend API (Documentação Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   *   👉 **Banco de Dados Relacional:** `localhost` na porta `5433` (Credenciais: User `orbital_user`, Pass `orbital_password`, DB `orbital_db`).

---

## 📊 6. Dados e Credenciais do Sistema

As tabelas relacionais no Postgres são populadas automaticamente na inicialização com os scripts SQL localizados na pasta `docker/postgres/init.sql`.

*   **Categorias de Objetos:**
    1.  `Satélite Ativo` (Cor neon verde: `#00ff66`)
    2.  `Satélite Inativo` (Cor neon cinza: `#888888`)
    3.  `Detrito Espacial` (Cor neon vermelha: `#ff0055`)
    4.  `Estação Espacial` (Cor neon ciano: `#00f0ff`)
