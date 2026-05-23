# Diretrizes e Contexto do Projeto: Monitoramento Orbital Educacional

## Nome do Projeto
OrbitalED

## 1. Visão Geral do Sistema
Este projeto consiste no desenvolvimento de uma plataforma web interativa voltada à visualização e monitoramento de objetos na órbita terrestre. O grande diferencial competitivo e acadêmico deste sistema é o seu foco estrito na **educação e acessibilidade**, traduzindo dados espaciais brutos e complexos em informações didáticas compreensíveis para usuários leigos ou estudantes.

## 2. Restrições de Stack Tecnológica
Qualquer código gerado para este ecossistema deve seguir obrigatoriamente a arquitetura multi-container gerenciada via Docker Compose e utilizar os seguintes frameworks:
* **Backend:** Python 3.11 com FastAPI (assíncrono, documentado via Swagger).
* **Banco de Dados:** PostgreSQL para persistência de dados relacionais.
* **Frontend:** React para construção da interface SPA baseada em componentes.
* **Visualização Espacial:** CesiumJS para renderização do globo terrestre 3D.
* **Cálculo de Órbita:** Biblioteca `satellite.js` no cliente para processamento algorítmico do modelo de propagação matemática SGP4.

## 3. Modelo de Dados e Banco de Dados (PostgreSQL)
A modelagem do banco de dados deve respeitar as entidades clássicas e o comportamento de composição mapeado para o domínio do problema. A estrutura estrita das tabelas é:

### 3.1 `categoria_objeto`
* `id`: Integer (Chave Primária)
* `nome`: String (Ex: Satélite Ativo, Satélite Inativo, Detrito Espacial, Estação Espacial)
* `descricao`: String
* `cor_visualizacao`: String (Hexadecimal herdado pelo frontend para plotagem dos pontos)

### 3.2 `objeto_orbital`
* `id`: Integer (Chave Primária)
* `nome`: String
* `norad_id`: String (Código de identificação oficial do catálogo NORAD)
* `pais`: String
* `status`: String
* `data_lancamento`: Date
* `categoria_id`: Integer (Chave Estrangeira obrigatória ligada à tabela `categoria_objeto`)

### 3.3 `tle_historico`
* `id`: Integer (Chave Primária)
* `objeto_id`: Integer (Chave Estrangeira ligada à tabela `objeto_orbital` em modo Composição)
* `epoch`: DateTime (Instante de referência temporal para os elementos orbitais)
* `linha1`: String (Exatamente 69 caracteres alfanuméricos da Linha 1 do padrão NORAD)
* `linha2`: String (Exatamente 69 caracteres alfanuméricos da Linha 2 do padrão NORAD)
* `data_captura`: DateTime

## 4. Requisitos Obrigatórios do Sistema

### 4.1 Requisitos de Negócio (RN)
* **RN01:** Plataforma de acesso 100% gratuito, via navegador web, sem necessidade de instalação de plugins ou realização de cadastro/login.
* **RN02:** Foco no engajamento didático de estudantes de ensino médio e superior com temas de astronomia e sustentabilidade espacial.
* **RN03:** Posicionar a interface como um hub nacional de divulgação científica.
* **RN04:** Utilização exclusiva de APIs e fontes de dados públicas (CelesTrak como primária e Space-Track como complementar).

### 4.2 Requisitos Funcionais (RF)
* **RF01:** Exibir um globo terrestre tridimensional interativo atualizado em tempo quase real usando CesiumJS.
* **RF02:** Fornecer filtros dinâmicos na interface por categorias (Ativos, Inativos, Detritos e Estações).
* **RF03:** Ao selecionar um objeto, abrir um painel lateral contendo a tradução didática dos parâmetros (Nome, categoria, país, altitude aproximada e período orbital).
* **RF04:** Disponibilizar um dashboard estatístico contendo dados agregados sobre a densidade e o cenário crítico do lixo espacial por nações.
* **RF05:** Automatizar a rotina de sincronização de dados consumindo dados TLE das APIs externas sem intervenção humana.
* **RF06:** Oferecer um campo de busca por nome textual ou identificador NORAD ID.

### 4.3 Requisitos Não Funcionais (RNF)
* **RNF01:** Tempo de carregamento inicial da página inferior a 5 segundos em conexões padrão.
* **RNF02:** Compatibilidade garantida com as versões modernas de Chrome, Firefox e Edge.
* **RNF03:** Disponibilidade operacional mínima do sistema de 99%.
* **RNF04:** Atualização automática da base local de TLEs agendada estritamente a cada 24 horas.
* **RNF05:** Código limpo, componentizado, versionado via Git e documentado para facilitar a manutenção técnica.
* **RNF06:** Interface responsiva adaptada para resoluções de monitores desktop.

## 5. Regras de Otimização e Arquitetura de Código
1. **Sem venv dentro do container:** Como o ambiente já está isolado dentro de containers Linux Docker, os pacotes e dependências Python (FastAPI, SQLAlchemy) devem ser instalados globalmente *dentro* do container do backend. Não utilize ou crie ambientes `venv` internos na imagem Docker.
2. **Índices de Performance:** Aplique `INDEX` explicitamente nos campos `norad_id` e `nome` na camada de persistência para suportar as buscas e garantir a conformidade com o RNF01 (carga < 5s).
3. **Imutabilidade de Escopo:** Não crie funcionalidades adicionais que fujam da finalidade didática sem antes validar a aderência aos requisitos de engenharia documentados.