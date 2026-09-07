/**
 * Enciclopédia Orbital Factual e Glossário Astrodinâmico Educacional
 * 
 * Fornece histórico documentado de missões espaciais reais,
 * definições conceituais acessíveis e dados científicos de sustentabilidade
 * para o Trabalho de Conclusão de Curso (TCC).
 * 
 * Regra: Ausência estrita de emojis em todos os textos.
 */

// 1. CATÁLOGO FACTUAL DE MISSÕES HISTÓRICAS E REAIS
export const CATALOGO_HISTORICO = {
  // MISSÕES BRASILEIRAS (INPE / AEB)
  "22823": {
    nomeOficial: "SCD-1 (Satélite de Coleta de Dados 1)",
    pais: "Brasil",
    operador: "INPE (Instituto Nacional de Pesquisas Espaciais)",
    anoLancamento: 1993,
    massaKg: 115,
    finalidade: "Coleta e retransmissão de dados ambientais de plataformas hidrológicas e meteorológicas distribuídas pelo território nacional, incluindo a Bacia Amazônica.",
    historico: "Lançado em 9 de fevereiro de 1993 pelo foguete americano Pegasus, o SCD-1 é o primeiro satélite desenvolvido integralmente no Brasil. Projetado originalmente para operar por apenas 1 ano, superou todas as expectativas da engenharia espacial brasileira e permanece em operação contínua e transmitindo dados há mais de 30 anos.",
    relevancia: "Marco pioneiro do Programa Espacial Brasileiro, validou a competência nacional em subsistemas térmicos, de bordo e controle de atitude por rotação."
  },
  "25400": {
    nomeOficial: "SCD-2 (Satélite de Coleta de Dados 2)",
    pais: "Brasil",
    operador: "INPE",
    anoLancamento: 1998,
    massaKg: 117,
    finalidade: "Monitoramento de recursos hídricos, previsão do tempo e qualidade do ar em conjunto com o SCD-1.",
    historico: "Lançado em outubro de 1998 a bordo de um lançador Pegasus XL, o SCD-2 sucedeu o SCD-1 trazendo melhorias nos sistemas de telemetria e baterias solares desenvolvidas no Laboratório de Integração e Testes (LIT/INPE).",
    relevancia: "Garante a redundância e a perenidade do Sistema Brasileiro de Coleta de Dados Ambientais."
  },
  "54380": {
    nomeOficial: "Amazonia-1",
    pais: "Brasil",
    operador: "INPE / AEB",
    anoLancamento: 2021,
    massaKg: 638,
    finalidade: "Imageamento óptico multiespectral para vigilância de desmatamento na Amazônia Legal e monitoramento da agricultura nacional.",
    historico: "Lançado em 28 de fevereiro de 2021 pelo lançador indiano PSLV-C51, o Amazonia-1 é o primeiro satélite de sensoriamento remoto de grande porte projetado, integrado, testado e operado 100% pelo Brasil, baseado na Plataforma Multimissão (PMM).",
    relevancia: "Consolidou o domínio tecnológico brasileiro na fabricação de satélites estabilizados em 3 eixos e câmeras multiespectrais de alta resolução temporal."
  },
  "44883": {
    nomeOficial: "CBERS-4A (China-Brazil Earth Resources Satellite)",
    pais: "Brasil / China",
    operador: "INPE / CAST",
    anoLancamento: 2019,
    massaKg: 1980,
    finalidade: "Sensoriamento remoto global com resolução espacial de até 2 metros para gestão ambiental, recursos hídricos e ordenamento territorial.",
    historico: "Sexto satélite do programa bilateral sino-brasileiro iniciado em 1988, o CBERS-4A foi lançado em dezembro de 2019 a partir do Centro de Lançamento de Taiyuan, transportando câmeras brasileiras MUX e WFI e chinesas WPM.",
    relevancia: "Exemplo internacional de cooperação Sul-Sul em alta tecnologia espacial e distribuição aberta de dados geoespaciais."
  },

  // ESTAÇÕES ESPACIAIS HABITADAS
  "25544": {
    nomeOficial: "ISS (Estação Espacial Internacional)",
    pais: "Multinacional (EUA / Rússia / ESA / Japão / Canadá)",
    operador: "NASA / Roscosmos / ESA / JAXA / CSA",
    anoLancamento: 1998,
    massaKg: 450000,
    finalidade: "Laboratório científico habitado contínuo em regime de microgravidade para pesquisas em biologia, física quântica, materiais e medicina espacial.",
    historico: "Iniciada em novembro de 1998 com o módulo russo Zarya, a ISS tem massa próxima a 450 toneladas e dimensões comparáveis a um campo de futebol. É habitada ininterruptamente por astronautas desde novembro de 2000 e viaja a 28.000 km/h, completando uma volta na Terra a cada 90 minutos.",
    relevancia: "A maior e mais complexa estrutura multinacional já construída pela humanidade fora do planeta Terra."
  },
  "48274": {
    nomeOficial: "Tiangong (Estação Espacial Chinesa - Tianhe)",
    pais: "China",
    operador: "CNSA (China National Space Administration)",
    anoLancamento: 2021,
    massaKg: 66000,
    finalidade: "Posto científico orbital permanente da China para missões espaciais de longa duração e física de fluidos.",
    historico: "O módulo central Tianhe foi lançado em abril de 2021, seguido pelos laboratórios científicos Wentian e Mengtian em 2022. A estação abriga equipes de três taikonautas e conta com braço robótico de alta precisão e portas de acoplamento de naves Shenzhou e Tianzhou.",
    relevancia: "Representa a autonomia tecnológica da China em habitação espacial de terceira geração em órbita baixa."
  },

  // TELESCÓPIOS E CIÊNCIA
  "20580": {
    nomeOficial: "Telescópio Espacial Hubble (HST)",
    pais: "Estados Unidos / Europa",
    operador: "NASA / ESA",
    anoLancamento: 1990,
    massaKg: 11110,
    finalidade: "Astronomia observacional profunda em luz visível, ultravioleta e infravermelho próximo.",
    historico: "Colocado em órbita pelo Ônibus Espacial Discovery em abril de 1990, o Hubble revolucionou a astrofísica moderna ao operar livre da distorção atmosférica, permitindo determinar a taxa de expansão do universo e observar as primeiras galáxias.",
    relevancia: "Considerado um dos instrumentos científicos mais produtivos da história da ciência com mais de 1,5 milhão de observações."
  },

  // CONSTELAÇÕES DE NAVEGAÇÃO
  "24876": {
    nomeOficial: "GPS BIIR-2 (NAVSTAR 43)",
    pais: "Estados Unidos",
    operador: "Força Espacial dos EUA",
    anoLancamento: 1997,
    massaKg: 2032,
    finalidade: "Transmissão de sinais de radionavegação e cronometria de altíssima precisão baseada em relógios atômicos de césio e rubídio.",
    historico: "Parte da constelação GPS em órbita média (MEO) a cerca de 20.200 km de altitude. Satélites desse bloco garantem posicionamento tridimensional contínuo em qualquer ponto do globo terrestre.",
    relevancia: "Infraestrutura essencial para aviação, navegação marítima, telecomunicações e sincronização de redes elétricas globais."
  },

  // DETRITOS HISTÓRICOS DE COLISÃO E IMPACTO
  "22675": {
    nomeOficial: "Cosmos 2251 (Remanescentes da Colisão de 2009)",
    pais: "Rússia",
    operador: "Ministério da Defesa Russo (Desativado)",
    anoLancamento: 1993,
    massaKg: 900,
    finalidade: "Satélite de comunicação militar da frota Strela-2M. Encerrou sua vida útil em 1995 e permaneceu como satélite inativo descontrolado.",
    historico: "Em 10 de fevereiro de 2009, o Cosmos 2251 colidiu catastroficamente a 789 km de altitude com o satélite comercial operacional Iridium 33 a uma velocidade relativa de 42.120 km/h (11,7 km/s). O choque destruiu ambos os satélites e gerou mais de 1.400 fragmentos grandes catalogados de lixo espacial.",
    relevancia: "Primeiro choque acidental hiperveloz entre dois satélites artificiais intactos na história espacial, marco prático do Efeito Kessler."
  },
  "24946": {
    nomeOficial: "Iridium 33 (Remanescentes da Colisão de 2009)",
    pais: "Estados Unidos",
    operador: "Iridium Communications",
    anoLancamento: 1997,
    massaKg: 560,
    finalidade: "Satélite de telefonia global por satélite. Estava plenamente operacional no momento do impacto.",
    historico: "Destruído instantaneamente no evento de colisão com o Cosmos 2251 sobre a península de Taimyr na Sibéria. Seus fragmentos permanecem dispersos em órbitas com inclinação de 86 graus, exigindo manobras evasivas regulares de outros satélites.",
    relevancia: "Evidenciou internacionalmente a vulnerabilidade de constelações comerciais diante de objetos fantasmas desativados em órbita."
  }
};

// 2. GERADOR FACTUAL DINÂMICO PARA SATÉLITES NÃO LISTADOS NOMINALMENTE
export function obterFichaFactual(sat, parametrosOrbitais) {
  if (!sat) return null;

  const noradId = String(sat.norad_id || '').trim();
  const nome = (sat.nome || '').toUpperCase();
  const categoriaId = Number(sat.categoria_id);

  // Se existir ficha nominal cadastrada no catálogo, utiliza a base documentada
  if (CATALOGO_HISTORICO[noradId]) {
    const item = CATALOGO_HISTORICO[noradId];
    return {
      titulo: item.nomeOficial,
      funcao: item.finalidade,
      historia: item.historico,
      relevancia: item.relevancia,
      operador: item.operador,
      fonte: "Catálogo Histórico Oficial de Engenharia Espacial"
    };
  }

  // Decodificação factual dinâmica baseada na categoria e nos cálculos físicos
  let funcao = "Satélite de Telecomunicações e Dados Científicos";
  let historia = "";
  let relevancia = "";
  let operador = sat.pais || "Internacional";

  // Identificação por padrões de nomenclatura oficiais
  if (nome.includes("STARLINK")) {
    funcao = "Comunicação de Banda Larga em Megaconstelação";
    operador = "SpaceX (EUA)";
    historia = `Satélite integrante da megaconstelação Starlink em órbita baixa (LEO). Projetado com propulsores de íons de criptônio/argônio para manutenção de posição e desorbitação ativa ao final de sua vida útil (3 a 5 anos).`;
    relevancia = `Representa a nova era de satélites serializados em massa, objeto de intensos debates sobre poluição luminosa astronômica e impacto de queima de alumina na ionosfera.`;
  } else if (nome.includes("ONEWEB")) {
    funcao = "Telecomunicações Globais em Órbita Baixa";
    operador = "Eutelsat OneWeb (Reino Unido)";
    historia = `Satélite de comunicações em constelação operando a cerca de 1.200 km de altitude, fornecendo conectividade corporativa e governamental.`;
    relevancia = `Por operar em altitude mais alta que a Starlink, seus remanescentes exigem descarte propulsionado rigoroso, pois o decaimento natural levaria séculos.`;
  } else if (nome.includes("NOAA") || nome.includes("GOES") || nome.includes("METOP")) {
    funcao = "Monitoramento Meteorológico, Oceânico e Climático";
    operador = "Agências Meteorológicas Globais (NOAA/EUMETSAT)";
    historia = `Plataforma de sensoriamento remoto dedicada ao rastreamento contínuo de sistemas meteorológicos, tempestades tropicais, cobertura de gelo e temperatura da superfície dos oceanos.`;
    relevancia = `Fornece dados abertos vitais para modelos climáticos numéricos globais e emissão de alertas precoces de desastres naturais.`;
  } else if (nome.includes("GALILEO") || nome.includes("GLONASS") || nome.includes("BEIDOU") || nome.includes("GPS") || nome.includes("NAVSTAR")) {
    funcao = "Radionavegação e Cronometria Global (GNSS)";
    operador = "Governo Soberano / Defesa";
    historia = `Satélite de navegação situado na órbita terrestre média (MEO). Emite sinais de radiofrequência codificados que permitem receptores na superfície calcular latitude, longitude, altitude e tempo com precisão de centímetros.`;
    relevancia = `Pilar fundamental da navegação civil e militar contemporânea e infraestrutura crítica para a economia global.`;
  } else if (categoriaId === 3 || nome.includes("DEB") || nome.includes("DEBRIS") || nome.includes("R/B") || nome.includes("STAGE")) {
    funcao = "Detrito Espacial Inerte (Lixo Orbital)";
    operador = sat.pais || "Nação Lançadora Original";
    if (nome.includes("R/B") || nome.includes("ROCKET")) {
      historia = `Corpo de foguete descartado (estágio superior) que atingiu a velocidade orbital para liberar sua carga útil e permaneceu à deriva no espaço. Estruturas cilíndricas gigantescas desprovidas de controle.`;
      relevancia = `Constitui uma das maiores fontes potenciais de novos detritos devido ao risco de colisão por sua grande área de seção transversal e risco de explosão de tanques residuais.`;
    } else {
      historia = `Fragmento metálico remanescente de colisão, explosão espontânea de bateria ou degradação térmica em órbita. Desloca-se a velocidades hipersônicas sem propulsão ou controle de atitude.`;
      relevancia = `Devido à altíssima velocidade orbital (superior a 27.000 km/h), mesmo pequenos estilhaços possuem energia cinética equivalente a artefatos bélicos explosivos.`;
    }
  } else if (categoriaId === 2) {
    funcao = "Satélite Desativado (Inativo em Órbita)";
    operador = sat.pais || "Operador Original";
    historia = `Satélite que encerrou suas operações funcionais por esgotamento de combustível, falha de bateria ou obsolescência de sistemas, permanecendo em rota passiva.`;
    relevancia = `Satélites zumbis inativos não respondem a comandos de manobra evasiva, atuando como alvos fixos na teia de riscos da Síndrome de Kessler.`;
  } else {
    // Fallback genérico puramente factual
    const regime = parametrosOrbitais ? parametrosOrbitais.regimeNome : "Órbita Terrestre";
    const vel = parametrosOrbitais ? `${parametrosOrbitais.velocidadeKmH.toLocaleString('pt-BR')} km/h` : "Velocidade Orbital";
    const alt = parametrosOrbitais ? `${parametrosOrbitais.altitudeInstantaneaKm} km` : "Altitude de Voo";
    
    funcao = `Objeto Operacional em ${regime}`;
    historia = `Objeto registrado no catálogo oficial NORAD sob identificador #${noradId}, operando em altitude aproximada de ${alt} a uma velocidade de ${vel}. Registrado oficialmente sob responsabilidade de: ${sat.pais || "Registro Internacional"}.`;
    relevancia = `Dados físicos de trajetória deduzidos diretamente do modelo de propagação matemática SGP4 a partir dos parâmetros orbitais keplerianos.`;
  }

  return {
    titulo: sat.nome,
    funcao,
    historia,
    relevancia,
    operador,
    fonte: "Catálogo Oficial NORAD / Propagação SGP4"
  };
}

// 3. GLOSSÁRIO DIDÁTICO ASTRODINÂMICO (PARA O 4º SLIDE E CONSULTA NO CONSOLE)
export const GLOSSARIO_ORBITAL = [
  {
    categoria: "Regimes de Órbita",
    itens: [
      {
        termo: "LEO (Low Earth Orbit)",
        titulo: "Órbita Terrestre Baixa",
        definicao: "Região do espaço com altitudes entre 160 km e 2.000 km acima da superfície terrestre. É onde operam a Estação Espacial Internacional, a maioria dos satélites de observação da Terra e as megaconstelações de internet. Apresenta a maior densidade de objetos e o maior risco de colisões."
      },
      {
        termo: "MEO (Medium Earth Orbit)",
        titulo: "Órbita Terrestre Média",
        definicao: "Faixa orbital situada entre 2.000 km e 35.786 km de altitude. É o domínio tradicional de sistemas globais de radionavegação por satélite, como a constelação americana GPS, a europeia Galileo, a russa Glonass e a chinesa BeiDou."
      },
      {
        termo: "GEO (Geostationary Earth Orbit)",
        titulo: "Órbita Geoestacionária",
        definicao: "Órbita circular no plano do equador a exatamente 35.786 km de altitude. O período de translação do satélite é idêntico ao período de rotação da Terra (23h 56min 4s), fazendo com que o objeto pareça absolutamente imóvel no céu para um observador na superfície."
      },
      {
        termo: "HEO (Highly Elliptical Orbit)",
        titulo: "Órbita Altamente Elíptica",
        definicao: "Trajetória não circular com grande excentricidade (como as órbitas russas Molniya). O satélite passa rapidamente perto da Terra no perigeu e passa a maior parte do tempo no apogeu distante, ideal para cobrir regiões de altas latitudes polares."
      }
    ]
  },
  {
    categoria: "Mecânica Celeste e Engenharia",
    itens: [
      {
        termo: "Perigeu",
        titulo: "Ponto de Maior Proximidade",
        definicao: "Ponto da órbita elíptica em que o satélite passa mais próximo da superfície da Terra. É onde o objeto atinge sua velocidade orbital máxima devido à maior atração gravitacional."
      },
      {
        termo: "Apogeu",
        titulo: "Ponto de Maior Distância",
        definicao: "Ponto da órbita elíptica em que o objeto está mais afastado do centro da Terra. É onde o satélite viaja com sua velocidade orbital mínima."
      },
      {
        termo: "Inclinação Orbital",
        titulo: "Ângulo do Plano Orbital",
        definicao: "Ângulo de inclinação medido em graus entre o plano da órbita do satélite e a linha do equador da Terra. Uma inclinação de 0° é equatorial pura, 90° cruza exatamente os polos (órbita polar) e valores acima de 90° indicam movimento retrógrado."
      },
      {
        termo: "TLE (Two-Line Element Set)",
        titulo: "Formato de Dados de Dois Elementos",
        definicao: "Padrão oficial de codificação em duas linhas de 69 caracteres criado pelo comando aeroespacial norte-americano (NORAD). Contém os coeficientes matemáticos keplerianos instantâneos necessários para calcular a posição e velocidade de qualquer satélite."
      },
      {
        termo: "SGP4 (Simplified General Perturbations 4)",
        titulo: "Modelo Matemático de Propagação",
        definicao: "Algoritmo analítico de mecânica orbital que computa os efeitos da gravidade não homogênea da Terra (achatamento polar J2 e J3), arrasto atmosférico e perturbações gravitacionais da Lua e do Sol sobre um satélite a partir de um TLE."
      },
      {
        termo: "Termo BSTAR",
        titulo: "Coeficiente de Arrasto Aerodinâmico",
        definicao: "Parâmetro do TLE que modela matematicamente como o satélite é freado pelo atrito com a atmosfera superior residual da Terra. Quanto maior o BSTAR, mais rápida é a perda de altitude do objeto ao longo do tempo."
      }
    ]
  },
  {
    categoria: "Sustentabilidade e Meio Ambiente Espacial",
    itens: [
      {
        termo: "Síndrome de Kessler",
        titulo: "Reação em Cadeia de Colisões",
        definicao: "Teoria científica proposta pelo astrofísico Donald J. Kessler em 1978. Descreve o cenário crítico em que a densidade de objetos em órbita baixa torna colisões inevitáveis; cada impacto gera milhares de novos estilhaços, desencadeando um efeito dominó exponencial que pode inutilizar faixas orbitais inteiras por séculos."
      },
      {
        termo: "Decaimento Orbital & Reentrada",
        titulo: "Queda Natural na Atmosfera",
        definicao: "Processo pelo qual o atrito com as moléculas de ar na alta atmosfera reduz progressivamente a energia mecânica do satélite. O objeto perde altitude continuamente até penetrar em camadas densas (50 km a 85 km) a velocidades hipersônicas, sofrendo compressão e atrito com plasma térmico."
      },
      {
        termo: "Poluição por Alumina (Al2O3)",
        titulo: "Injeção de Nanopartículas Condutoras",
        definicao: "Subproduto químico resultante da queima de ligas metálicas de alumínio de satélites descartados durante a reentrada atmosférica. Toneladas dessa poeira condutora se depositam na mesosfera e ionosfera, com potencial de degradar a camada de ozônio estratosférica e perturbar correntes elétricas do campo geomagnético da Terra."
      },
      {
        termo: "Ponto Nemo",
        titulo: "Cemitério de Naves Espaciais",
        definicao: "Polo Oceânico de Inacessibilidade no sul do Oceano Pacífico, o local mais distante de qualquer terra habitada em todo o planeta Terra. É a zona de descarte balístico pré-calculada para reentradas controladas de grandes naves e estações espaciais (onde a antiga estação Mir foi desorbitada)."
      }
    ]
  }
];

// 4. METADADOS CIENTÍFICOS PARA O MÓDULO DE SUSTENTABILIDADE E MEIO AMBIENTE
export const DADOS_SUSTENTABILIDADE = {
  kessler: {
    titulo: "Síndrome de Kessler & Colisões",
    subtitulo: "Risco de Reação em Cadeia",
    artigoBase: "Kessler & Cour-Palais (1978)",
    densidadeCriticaFaixa: "Faixa Crítica: 750 a 950 km",
    fatoChave: "A 27.000 km/h, um fragmento de apenas 1 cm tem a energia de uma granada, perfurando qualquer blindagem aeroespacial.",
    historicoImpacto: "A colisão Iridium-Cosmos (2009) gerou mais de 2.000 fragmentos que até hoje forçam a ISS a manobras evasivas."
  },
  reentrada: {
    titulo: "Reentrada Atmosférica & Queda",
    subtitulo: "Sobrevivência Térmica de Detritos",
    massaAnualReentradaTon: "100 a 200 ton/ano",
    sobrevivenciaPercentual: "10% a 40% de peças pesadas",
    fatoChave: "Embora carcaças vaporizem, tanques de titânio e blocos de aço resistem a 2.000°C e colidem com a superfície.",
    zonaDescarte: "Quedas controladas miram o Ponto Nemo (Pacífico Sul), mas satélites abandonados reentram de forma aleatória."
  },
  magnetosfera: {
    titulo: "Perturbação Eletromagnética",
    subtitulo: "Camada de Nanopartículas Condutoras",
    pesquisaReferencia: "Solter-Hunt (2024); Murphy et al. (PNAS)",
    mecanismo: "A queima em massa de megaconstelações injeta toneladas de óxido de alumínio (nanopartículas condutoras) na ionosfera.",
    riscoCientifico: "Essa concha metálica na alta atmosfera pode interferir nas correntes de Birkeland e no escudo magnético terrestre."
  },
  climaEOzonio: {
    titulo: "Clima & Camada de Ozônio",
    subtitulo: "Destruição Química de O3",
    reacaoQuimica: "Alumina (Al2O3) como catalisador de cloro",
    fatoChave: "A poeira de alumina catalisa reações de cloro na estratosfera, podendo atrasar a regeneração do ozônio por décadas.",
    impactoLancamento: "A fuligem fóssil de lançamentos de foguetes permanece anos na alta atmosfera, provocando aquecimento anômalo."
  }
};

