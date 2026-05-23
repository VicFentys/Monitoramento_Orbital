import { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Search, 
  Database, 
  TrendingUp, 
  Info, 
  X, 
  Cpu, 
  Layers, 
  Zap, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Compass
} from 'lucide-react';
import * as satellite from 'satellite.js';
import './App.css';

// Configuração do host da API (aponta para o backend local mapeado)
const API_URL = 'http://localhost:8000';

// Helper de segurança para prevenir vulnerabilidades de Cross-Site Scripting (XSS)
const escaparHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// 6. PROCESSADOR DE DADOS EDUCACIONAIS DINÂMICOS E HISTÓRICOS
const obterDadosEducativos = (sat) => {
  if (!sat) return null;

  const nome = sat.nome.toUpperCase();
  const noradId = sat.norad_id.trim();
  const categoriaId = sat.categoria_id;

  let funcao = "Satélite de Comunicações / Científico";
  let historia = "";
  let curiosidade = "";

  // 1. ESTAÇÕES ESPACIAIS (Categoria 4)
  if (categoriaId === 4) {
    if (nome.includes("ISS") || noradId === "25544") {
      funcao = "Laboratório Espacial Habitado Internacional";
      historia = "A Estação Espacial Internacional (ISS) é o maior objeto construído pelo ser humano no espaço! Ela é um laboratório de pesquisa habitado continuamente por astronautas de diversos países desde o ano 2000. Ela orbita a cerca de 400 km de altitude, realizando pesquisas científicas revolucionárias em medicina, física e biologia sob condições únicas de microgravidade.";
      curiosidade = "Ela viaja a incríveis 28.000 km/h, completando uma órbita inteira na Terra a cada 90 minutos. Isso significa que os astronautas a bordo assistem a 16 pores do sol todos os dias!";
    } else if (nome.includes("TIANGONG") || nome.includes("TIANHE") || nome.includes("CSS")) {
      funcao = "Estação Espacial Habitada da China";
      historia = "A Tiangong (que significa 'Palácio Celestial') é a estação espacial própria da China, operada pela agência espacial CNSA. Ela foi construída em órbita a partir do lançamento do módulo Tianhe em 2021. Ela serve como um centro de pesquisas avançadas no espaço e simboliza a maturidade tecnológica do programa espacial tripulado chinês.";
      curiosidade = "Ela é composta por três módulos principais em forma de T e abriga equipes de até três taikonautas (astronautas chineses) para missões de longa duração.";
    } else {
      funcao = "Estação Espacial Habitada";
      historia = "Uma estação espacial é um satélite artificial habitável que atua como base de pesquisa de longo prazo no espaço sideral. Sem propulsão ou trens de pouso principais, ela depende de naves de suprimento para reabastecer sua tripulação constante e apoiar experimentos científicos em órbita terrestre baixa.";
      curiosidade = "Serve como o passo fundamental da humanidade para desenvolver tecnologias de suporte à vida para futuras viagens a Marte e à Lua.";
    }
  }
  // 2. DETRITOS ESPACIAIS (Categoria 3)
  else if (categoriaId === 3) {
    if (nome.includes("IRIDIUM 33") || nome.includes("IRIDIUM-33")) {
      funcao = "Lixo Espacial (Estilhaço da Colisão Iridium 33)";
      historia = "Este fragmento pertence ao satélite comercial americano Iridium 33, que foi destruído instantaneamente em 2009 ao colidir com o satélite militar russo inativo Cosmos 2251. O choque ocorreu a 789 km acima da Sibéria com uma velocidade relativa de 11,7 km/s (42.120 km/h). O impacto catastrófico gerou mais de 600 fragmentos grandes de lixo espacial rastreáveis.";
      curiosidade = "A colisão Iridium-Cosmos de 2009 foi o primeiro choque hiperveloz acidental registrado entre dois satélites artificiais intactos na história da exploração espacial!";
    } else if (nome.includes("COSMOS 2251") || nome.includes("COSMOS-2251")) {
      funcao = "Lixo Espacial (Estilhaço da Colisão Cosmos 2251)";
      historia = "Este fragmento provém do satélite de comunicação militar russo Cosmos 2251, que pesava 900 kg e estava totalmente inativo desde 1995. Em 10 de fevereiro de 2009, ele colidiu violentamente com o satélite americano operacional Iridium 33. Por ser muito pesado, o Cosmos 2251 gerou uma imensa nuvem com mais de 1.400 detritos catalogados no espaço.";
      curiosidade = "Como estava inativo, o controle de terra não pôde realizar manobras evasivas de desvio para evitar a colisão, reforçando o risco de satélites fantasmas em órbita.";
    } else if (nome.includes("DEBRIS") || nome.includes("1999-025")) {
      funcao = "Lixo Espacial (Estilhaço de Colisão Histórica)";
      historia = "Este detrito é um fragmento gerado a partir da famosa Colisão de Satélites de 2009! O choque entre o satélite americano Iridium 33 e o russo Cosmos 2251 liberou uma quantidade imensa de energia e espalhou milhares de pedaços de lixo espacial que continuam orbitando a Terra descontroladamente.";
      curiosidade = "Viajando a mais de 7 km por segundo, até mesmo um pequeno fragmento de metal desse choque tem energia suficiente para perfurar a blindagem de naves tripuladas!";
    } else if (nome.includes("ROCKET BODY") || nome.includes("STAGE") || nome.includes("R/B")) {
      funcao = "Lixo Espacial (Corpo de Foguete Desativado)";
      historia = "Este objeto é um 'Corpo de Foguete', o estágio superior descartado após impulsionar um satélite ao espaço. Embora tenham cumprido suas missões de lançamento, esses cilindros metálicos gigantescos flutuam descontroladamente na órbita terrestre. Eles representam um dos maiores riscos de colisões em larga escala na órbita da Terra devido ao seu enorme tamanho.";
      curiosidade = "Muitos desses corpos de foguete ainda contêm restos de combustível altamente volátil, que podem sofrer explosões espontâneas no espaço com o calor solar, fragmentando-se em milhares de novos detritos.";
    } else {
      // Biblioteca de Detritos Gerais rotacionados deterministicamente por noradId % 6 para máxima variedade
      const idNum = parseInt(noradId) || 0;
      const index = idNum % 6;
      if (index === 0) {
        funcao = "Detrito Espacial Rastreável (Fragmento de Satélite)";
        historia = "Este objeto é um estilhaço remanescente da fragmentação de um satélite desativado que sofreu degradação térmica ou explosão de bateria em órbita baixa. Pequenos estilhaços de metal, isolamento térmico e blindagens perdidas orbitam a velocidades altíssimas, gerando riscos contínuos de impacto a outras naves operacionais.";
        curiosidade = "Um fragmento de apenas 1 cm de tamanho viajando a 28.000 km/h carrega a mesma energia cinética de uma bola de boliche arremessada a 100 km/h, capaz de danificar permanentemente painéis solares!";
      } else if (index === 1) {
        funcao = "Lixo Espacial (Tampa / Parafuso de Separação)";
        historia = "Este detrito é um pedaço menor de hardware e peças mecânicas descartadas — como tampas de lentes de câmeras espaciais, braçadeiras de metal ou parafusos explosivos — liberados de forma operacional durante a separação de estágios ou ativação de satélites no século passado.";
        curiosidade = "No início da era espacial, peças soltas e coberturas ópticas eram rotineiramente ejetadas no espaço. Hoje em dia, agências projetam sistemas com amarras de retenção para evitar a geração desse lixo espacial.";
      } else if (index === 2) {
        funcao = "Lixo Espacial (Adaptador Estrutural Descartado)";
        historia = "Este objeto é um anel adaptador de carga útil ou um acoplador descartável que permaneceu em órbita após a liberação bem-sucedida do satélite de seu veículo lançador. Desprovido de qualquer sistema de controle de atitude ou rádio, ele orbita passivamente até que a resistência da atmosfera o traga de volta à Terra.";
        curiosidade = "Esses adaptadores metálicos gigantescos funcionam como alvos flutuantes no espaço, sofrendo impactos microscópicos de micrometeoritos que criam milhares de pequenas lascas de alumínio brilhantes ao redor de sua órbita.";
      } else if (index === 3) {
        funcao = "Lixo Espacial (Detrito de Teste Antissatélite ASAT)";
        historia = "Este fragmento orbital provém de um teste militar destrutivo de míssil antissatélite (ASAT). Em testes históricos, nações explodiram intencionalmente seus próprios satélites inativos para testar sistemas de defesa de mísseis, liberando instantaneamente milhares de fragmentos rastreáveis e duradouros na órbita baixa da Terra.";
        curiosidade = "O teste de míssil chinês de 2007 (que destruiu o satélite meteorológico Fengyun-1C) gerou a maior nuvem de detritos de um único evento na história, com mais de 3.000 fragmentos que continuarão em órbita por décadas!";
      } else if (index === 4) {
        funcao = "Fragmento de Célula Solar e Placas Elétricas";
        historia = "Este pequeno detrito consiste em restos de painéis solares fotovoltaicos estilhaçados ou pedaços de fiação e eletrônicos de satélites desativados. Esses detritos finos são altamente suscetíveis à pressão de radiação solar, fazendo com que suas órbitas decaiam e flutuem de forma mais errática no espaço.";
        curiosidade = "Mesmo sendo finas como papel, as lascas de células solares de silício se tornam verdadeiros projéteis hipervelozes cortantes a 7,8 km por segundo.";
      } else {
        funcao = "Detrito Histórico da Era Espacial Antiga";
        historia = "Este detrito orbital é uma peça histórica de um lançamento das primeiras décadas da corrida espacial (décadas de 1960 a 1980). Devido à sua órbita de maior altitude, onde a tênue atmosfera superior da Terra é extremamente rarefeita, a resistência do ar é quase inexistente, o que fará com que este objeto permaneça flutuando no espaço por séculos.";
        curiosidade = "Alguns desses detritos antigos estão em órbitas estáveis que podem durar mais de 1.000 anos antes de finalmente reentrerem na atmosfera da Terra e queimarem por fricção.";
      }
    }
  }
  // 3. SATÉLITES ATIVOS (Categoria 1)
  else {
    if (nome.includes("STARLINK")) {
      funcao = "Satélite de Internet de Banda Larga da SpaceX";
      historia = "Este satélite faz parte da megaconstelação Starlink, desenvolvida pela SpaceX de Elon Musk. Lançada a partir de 2019, seu objetivo é fornecer acesso à internet de alta velocidade e baixa latência para todo o planeta, especialmente em áreas rurais e isoladas. Eles orbitam na Órbita Baixa da Terra (LEO) a cerca de 550 km de altitude.";
      curiosidade = "Diferente de satélites antigos que orbitam a 35.000 km de altitude, os Starlinks ficam muito próximos da Terra, o que reduz radicalmente o atraso (ping) da internet.";
    } else if (nome.includes("HUBBLE") || nome.includes("HST")) {
      funcao = "Telescópio Espacial Científico";
      historia = "O Telescópio Espacial Hubble é um dos instrumentos científicos mais lendários da história! Lançado pela NASA e ESA em 1990, ele orbita acima da atmosfera distorcida da Terra, o que permite capturar imagens extremamente nítidas e profundas do espaço profundo. Ele ajudou os astrônomos a calcular a idade do universo (13,8 bilhões de anos) e a descobrir a energia escura.";
      curiosidade = "O Hubble tem o tamanho de um ônibus escolar e já realizou mais de 1,5 milhão de observações de galáxias, nebulosas e planetas distantes!";
    } else if (nome.includes("GPS") || nome.includes("NAVSTAR")) {
      funcao = "Satélite de Posicionamento Global (GPS)";
      historia = "Este satélite faz parte da rede NAVSTAR GPS do governo dos Estados Unidos. Lançado para órbita média a cerca de 20.000 km de altitude, ele transmite sinais de tempo extremamente precisos. Smartphones e navegadores ao redor do mundo cruzam os sinais de pelo menos 4 desses satélites para calcular sua localização exata com precisão de poucos metros.";
      curiosidade = "Os relógios atômicos a bordo desses satélites precisam ser corrigidos diariamente devido aos efeitos da Relatividade de Einstein, pois o tempo passa ligeiramente mais rápido no espaço!";
    } else if (nome.includes("NOAA") || nome.includes("METOP") || nome.includes("GOES") || nome.includes("WEATHER")) {
      funcao = "Satélite de Monitoramento Meteorológico e Climático";
      historia = "Este satélite monitora constantemente a atmosfera e os oceanos do nosso planeta. Operado por agências ambientais, ele desempenha um papel vital no rastreamento de furacões, tempestades severas, correntes oceânicas e incêndios florestais. Suas leituras diárias salvam milhares de vidas ao prever desastres meteorológicos com antecedência.";
      curiosidade = "Eles capturam fotos globais em alta resolução do clima, permitindo criar as famosas imagens de nuvens que você assiste na previsão do tempo dos telejornais.";
    } else {
      // Biblioteca de Satélites Ativos Gerais rotacionados deterministicamente por noradId % 5 para máxima variedade
      const idNum = parseInt(noradId) || 0;
      const index = idNum % 5;
      if (index === 0) {
        funcao = "Satélite Científico e Observação da Terra";
        historia = "Este satélite de pesquisa monitora os recursos naturais terrestres de órbita baixa. Ele utiliza sensores ópticos de alta resolução para analisar a cobertura florestal, a expansão urbana, e a saúde das bacias hidrográficas, gerando dados cruciais para o monitoramento de mudanças climáticas e conservação ambiental.";
        curiosidade = "Os sensores ópticos avançados a bordo conseguem registrar variações na refletância da vegetação que indicam se uma floresta está saudável ou sofrendo por seca antes mesmo de ficar visível a olho nu!";
      } else if (index === 1) {
        funcao = "Satélite de Telecomunicações Globais";
        historia = "Posicionado para fornecer links de comunicação contínuos, este satélite serve como ponte de rádio digital de alta fidelidade entre continentes. Ele retransmite sinais de televisão, chamadas telefônicas de emergência e tráfego de dados de internet, conectando as regiões mais remotas do nosso planeta à rede global.";
        curiosidade = "Satélites de telecomunicações operam captando frequências fracas vindas da Terra, amplificando o sinal em milhões de vezes antes de devolvê-lo em outra frequência para evitar interferência.";
      } else if (index === 2) {
        funcao = "Satélite de Pesquisa Científica e Astrofísica";
        historia = "Dedicado a desvendar os mistérios do cosmos, este satélite transporta instrumentos científicos e telescópios que observam estrelas, galáxias distantes e radiação cósmica de fundo. Ao operar acima da atmosfera terrestre, ele capta comprimentos de onda de luz ultravioleta e raios-X que são completamente bloqueados pela nossa atmosfera.";
        curiosidade = "Muitos satélites de astrofísica utilizam sistemas de refrigeração criogênica extrema, operando próximos do zero absoluto (-273°C) para garantir que o próprio calor do instrumento não interfira nas medições de radiação cósmica profunda!";
      } else if (index === 3) {
        funcao = "Satélite de Sensoriamento Remoto e Mapeamento";
        historia = "Este satélite atua gerando dados geográficos e cartográficos tridimensionais extremamente precisos. Utilizando altímetros a laser ou radares de abertura sintética (SAR), ele mapeia a topografia do terreno e a elevação dos oceanos, auxiliando governos na gestão de riscos e planejamento de infraestrutura.";
        curiosidade = "Radares de abertura sintética conseguem 'enxergar' através de nuvens densas e no escuro total da noite, permitindo mapear florestas tropicais mesmo em épocas de chuvas constantes!";
      } else {
        funcao = "Micro-Satélite Acadêmico (CubeSat)";
        historia = "Este objeto é um satélite miniaturizado de padrão CubeSat, construído de forma modular por pesquisadores universitários ou agências espaciais emergentes. Apesar de seu tamanho compacto (muitas vezes menor que uma caixa de sapatos), ele realiza experimentos científicos valiosos em órbita terrestre, validando novos chips e sensores em ambiente espacial.";
        curiosidade = "Os CubeSats revolucionaram o acesso ao espaço pois são montados com peças eletrônicas comerciais comuns e pegam carona nos lançadores de foguetes grandes, reduzindo o custo de lançamento em mais de 99%!";
      }
    }
  }

  return { funcao, historia, curiosidade };
};

function App() {
  const [viewer, setViewer] = useState(null);
  const containerRef = useRef(null);
  const entitiesRef = useRef(new Map());
  const entidadeFocadaRef = useRef(null);

  // Estados de Navegação e Transição Cibernética
  const [telaAtiva, setTelaAtiva] = useState('inicio');
  const [cyberFade, setCyberFade] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState(0);

  // Controladores de estado dos painéis HUD colapsáveis (RNF06 - Fase 3)
  const [painelEsquerdoAberto, setPainelEsquerdoAberto] = useState(false);
  const [painelDireitoAberto, setPainelDireitoAberto] = useState(false);

  // Referência para controlar se a tela era compacta no frame anterior e evitar o efeito bounce
  const eraCompactoRef = useRef(window.innerWidth < 950);

  // Ajuste inicial e dinâmico de visibilidade de painéis em telas menores no cockpit (RNF06 - Fase 3)
  useEffect(() => {
    if (telaAtiva !== 'simulador') return;

    // Sincronização inicial de boot ao abrir o simulador
    const eCompactoInicial = window.innerWidth < 950;
    eraCompactoRef.current = eCompactoInicial;

    // Dispara a transição inicial de slide-in suave após 100ms
    const timer = setTimeout(() => {
      if (eCompactoInicial) {
        setPainelDireitoAberto(false);
        setPainelEsquerdoAberto(true);
      } else {
        setPainelEsquerdoAberto(true);
        setPainelDireitoAberto(true);
      }
    }, 100);

    const handleResizePaineis = () => {
      const eCompacto = window.innerWidth < 950;
      
      // Só executa a transição se cruzar o breakpoint de 950px
      if (eCompacto !== eraCompactoRef.current) {
        eraCompactoRef.current = eCompacto;
        
        if (eCompacto) {
          // Transicionou para tela compacta: mantém apenas o esquerdo
          setPainelDireitoAberto(false);
          setPainelEsquerdoAberto(true);
        } else {
          // Transicionou para tela grande: reabre ambos
          setPainelEsquerdoAberto(true);
          setPainelDireitoAberto(true);
        }
      }
    };

    window.addEventListener('resize', handleResizePaineis);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResizePaineis);
    };
  }, [telaAtiva]);

  // Referências para controle de rolagem suave e toque (Throttling)
  const lastScrollTimeRef = useRef(0);
  const touchStartYRef = useRef(0);

  // Estados de dados da API
  const [objetos, setObjetos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Interação
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [satSelecionado, setSatSelecionado] = useState(null);
  const [detalhesEducacionais, setDetalhesEducacionais] = useState(null);
  const [tleAberto, setTleAberto] = useState(false);

  // Filtros de Categoria (Pedagógico)
  const [categoriasAtivas, setCategoriasAtivas] = useState({
    1: true, // Satélite Ativo
    3: true, // Detrito Espacial
    4: true  // Estação Espacial
  });

  // Manipulador de Scroll (Wheel) com Throttling para troca de seções estáticas
  const handleWheel = (e) => {
    if (telaAtiva !== 'inicio' || cyberFade) return;

    const agora = Date.now();
    // Bloqueia eventos contínuos por 850ms para aguardar o fade out/fade in do CSS terminar
    if (agora - lastScrollTimeRef.current < 850) return;

    if (e.deltaY > 0) {
      // Scroll para baixo: avança slide
      if (secaoAtiva < 2) {
        setSecaoAtiva(prev => prev + 1);
        lastScrollTimeRef.current = agora;
      }
    } else if (e.deltaY < 0) {
      // Scroll para cima: retrocede slide
      if (secaoAtiva > 0) {
        setSecaoAtiva(prev => prev - 1);
        lastScrollTimeRef.current = agora;
      }
    }
  };

  // Manipuladores de gestos táteis (Swipe Touch) para mobile
  const handleTouchStart = (e) => {
    if (telaAtiva !== 'inicio' || cyberFade) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (telaAtiva !== 'inicio' || cyberFade) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartYRef.current - touchEndY;
    const agora = Date.now();
    
    if (Math.abs(diffY) > 40 && agora - lastScrollTimeRef.current < 850) {
      return; // Bloqueia throttling
    }
    
    if (Math.abs(diffY) > 40) {
      if (diffY > 0) {
        // Deslizou para cima: avança
        if (secaoAtiva < 2) {
          setSecaoAtiva(prev => prev + 1);
          lastScrollTimeRef.current = agora;
        }
      } else {
        // Deslizou para baixo: retrocede
        if (secaoAtiva > 0) {
          setSecaoAtiva(prev => prev - 1);
          lastScrollTimeRef.current = agora;
        }
      }
    }
  };

  // 1. CARREGAMENTO INICIAL DE ESTATÍSTICAS NO BOOT
  useEffect(() => {
    const carregarEstatisticas = async () => {
      try {
        const resStats = await fetch(`${API_URL}/api/estatisticas`);
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setEstatisticas(dataStats);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas: ", err);
      }
    };
    carregarEstatisticas();
  }, []);

  // 2. CARREGAMENTO REATIVO DE OBJETOS COM BASE NOS FILTROS DE CATEGORIA
  useEffect(() => {
    const carregarObjetosFiltrados = async () => {
      // Ativa o estado de carregamento apenas no boot inicial para evitar a piscada ao filtrar
      if (objetos.length === 0) {
        setLoading(true);
      }
      try {
        const ativas = Object.entries(categoriasAtivas)
          .filter(([_, ativa]) => ativa)
          .map(([k]) => Number(k));
        
        if (ativas.length === 0) {
          setObjetos([]);
          return;
        }
        
        // Se todas as categorias ou múltiplos filtros estiverem ativos, consultamos sem categoria específica
        // e deixamos o backend misturar as estações com satélites e detritos
        let url = `${API_URL}/api/objetos?limit=500`;
        
        if (ativas.length === 1) {
          // Se há apenas uma categoria selecionada, trazemos uma amostragem cheia de 500 objetos daquela categoria!
          url += `&categoria_id=${ativas[0]}`;
        }
        
        const resObjs = await fetch(url);
        if (resObjs.ok) {
          const dataObjs = await resObjs.json();
          setObjetos(dataObjs);
        }
      } catch (err) {
        console.error("Erro ao carregar objetos orbitais de forma reativa: ", err);
      } finally {
        setLoading(false);
      }
    };

    carregarObjetosFiltrados();
  }, [categoriasAtivas]);

  // 2. BUSCA DE SATÉLITES COM DEBOUNCE DA API
  useEffect(() => {
    if (busca.trim().length < 2) {
      setSugestoes([]);
      return;
    }

    const buscarObjetosAPI = async () => {
      try {
        const res = await fetch(`${API_URL}/api/objetos?busca=${encodeURIComponent(busca)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSugestoes(data);
        }
      } catch (err) {
        console.error("Erro na busca de satélites: ", err);
      }
    };

    const delayDebounce = setTimeout(buscarObjetosAPI, 300);
    return () => clearTimeout(delayDebounce);
  }, [busca]);

  // 3. INICIALIZAÇÃO E GERENCIAMENTO DO GLOBO CESIUM 3D
  useEffect(() => {
    if (!window.Cesium) return;

    // Criar o viewer do Cesium com visual fotorealista (Satélite ArcGIS)
    const viewer = new window.Cesium.Viewer('cesium-container', {
      animation: false,
      timeline: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      vrButton: false,
      baseLayer: false // Evita tentativa do Ion padrão de carregar sem token e quebrar a renderização
    });

    // Ativar iluminação solar real, atmosfera azul brilhante e profundidade de relevo
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showAtmosphere = true;
    viewer.scene.globe.atmosphereLightIntensity = 1.3;
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // Carregar assincronamente a textura fotorrealista do ArcGIS com fallback para a offline NaturalEarthII
    if (window.Cesium.ArcGisMapServerImageryProvider && window.Cesium.ArcGisMapServerImageryProvider.fromUrl) {
      window.Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      ).then(provider => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.imageryLayers.addImageryProvider(provider);
        }
      }).catch(err => {
        console.warn("Falha ao carregar ArcGIS satélite. Usando NaturalEarthII como fallback...", err);
        if (window.Cesium.TileMapServiceImageryProvider && window.Cesium.TileMapServiceImageryProvider.fromUrl) {
          window.Cesium.TileMapServiceImageryProvider.fromUrl(
            window.Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          ).then(fallbackProvider => {
            if (viewer && !viewer.isDestroyed()) {
              viewer.imageryLayers.addImageryProvider(fallbackProvider);
            }
          }).catch(e => console.error("Erro no fallback do Cesium:", e));
        }
      });
    } else {
      // Fallback direto caso as APIs assíncronas não estejam disponíveis ou sejam antigas
      try {
        const provider = new window.Cesium.TileMapServiceImageryProvider({
          url: window.Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        });
        viewer.imageryLayers.addImageryProvider(provider);
      } catch (e) {
        console.error("Erro ao instanciar provedor de fallback síncrono:", e);
      }
    }
    setViewer(viewer);

    // Capturar cliques em entidades do Cesium para selecionar satélites
    const handler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (window.Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;
        // Recuperar metadados do satélite injetados nas propriedades
        const satData = entity.properties.getValue(window.Cesium.JulianDate.now());
        handleSelecionarSat(satData);
        
        // Focar a câmera de forma gradual e aplicar o travamento no satélite ao fim do voo
        const rangeDist = 3500000.0; // 3.500 km (zoom calibrado para ser ligeiramente menor/mais afastado)
        
        // Garantir que a câmera está desvinculada de qualquer transformação antes do voo gradual
        entidadeFocadaRef.current = null;
        viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
        viewer.trackedEntity = undefined;
        
        viewer.flyTo(entity, {
          duration: 1.5,
          offset: new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(0.0),
            window.Cesium.Math.toRadians(-72.0), // Pitch levemente inclinado para manter a Terra majestosa ao fundo
            rangeDist
          )
        }).then((completed) => {
          if (completed && viewer && !viewer.isDestroyed()) {
            // Travar o foco no satélite usando lookAtTransform ao fim do voo gradual
            const time = viewer.clock.currentTime;
            const position = entity.position.getValue(time);
            if (position) {
              const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
              const initialOffset = new window.Cesium.HeadingPitchRange(
                window.Cesium.Math.toRadians(0.0),
                window.Cesium.Math.toRadians(-72.0),
                rangeDist
              );
              viewer.camera.lookAtTransform(transform, initialOffset);
              entidadeFocadaRef.current = entity; // Ativar o acompanhamento contínuo no preRender
            }
          }
        });
      } else {
        // Clicar fora deseleciona o satélite, destrava câmera e voa suavemente de volta
        setSatSelecionado(null);
        if (viewer) {
          entidadeFocadaRef.current = null;
          viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
          viewer.trackedEntity = undefined;
          viewer.camera.flyTo({
            destination: window.Cesium.Cartesian3.fromDegrees(-45.0, -15.0, 18000000.0),
            orientation: {
              heading: window.Cesium.Math.toRadians(0.0),
              pitch: window.Cesium.Math.toRadians(-90.0),
              roll: 0.0
            },
            duration: 1.5
          });
        }
      }
    }, window.Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Capturar movimentos do mouse (Hover) nos satélites de forma super fluida sem travar o React
    let lastHoveredEntity = null;
    const hoverHandler = new window.Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const tooltipEl = document.getElementById('hud-tooltip');

    hoverHandler.setInputAction((movement) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);
      
      if (window.Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;
        const satData = entity.properties.getValue(window.Cesium.JulianDate.now());
        
        viewer.scene.canvas.style.cursor = 'pointer';

        if (lastHoveredEntity !== entity) {
          // Restaurar visual da entidade anterior se houver
          if (lastHoveredEntity) {
            try {
              const lastSat = lastHoveredEntity.properties.getValue(window.Cesium.JulianDate.now());
              lastHoveredEntity.point.pixelSize = lastSat.categoria_id === 4 ? 10 : 7;
              lastHoveredEntity.point.outlineColor = window.Cesium.Color.BLACK;
              lastHoveredEntity.point.outlineWidth = 1.5;
            } catch (err) {}
          }

          lastHoveredEntity = entity;

          // Destacar a nova entidade em hover (bolinha maior e contorno brilhante branco)
          try {
            const currentSize = entity.point.pixelSize.getValue();
            entity.point.pixelSize = currentSize + 4;
            entity.point.outlineColor = window.Cesium.Color.WHITE;
            entity.point.outlineWidth = 2.5;
          } catch (err) {}
        }

        // Atualizar e exibir a tooltip HUD com dados táticos rápidos no DOM
        if (tooltipEl && satData) {
          const corCat = satData.categoria?.cor_visualizacao || '#00ff66';

          // Limpa o conteúdo existente do tooltip de forma segura sem innerHTML
          tooltipEl.textContent = '';

          // 1. Criar o cabeçalho (tooltip-header)
          const headerDiv = document.createElement('div');
          headerDiv.className = 'tooltip-header';
          headerDiv.style.borderLeft = `3px solid ${corCat}`;

          // Criar a bolinha de status (tooltip-dot)
          const dotSpan = document.createElement('span');
          dotSpan.className = 'tooltip-dot';
          dotSpan.style.backgroundColor = corCat;
          dotSpan.style.color = corCat;

          // Criar o nome (tooltip-name)
          const nameSpan = document.createElement('span');
          nameSpan.className = 'tooltip-name';
          nameSpan.textContent = satData.nome;

          headerDiv.appendChild(dotSpan);
          headerDiv.appendChild(nameSpan);

          // 2. Criar o corpo (tooltip-body)
          const bodyDiv = document.createElement('div');
          bodyDiv.className = 'tooltip-body';

          // Criar linha NORAD ID
          const noradLine = document.createElement('div');
          const noradLabel = document.createElement('span');
          noradLabel.className = 'tooltip-label';
          noradLabel.textContent = 'NORAD ID: ';
          const noradValue = document.createElement('span');
          noradValue.className = 'tooltip-value';
          noradValue.textContent = `#${satData.norad_id}`;
          noradLine.appendChild(noradLabel);
          noradLine.appendChild(noradValue);

          // Criar linha PAÍS
          const paisLine = document.createElement('div');
          const paisLabel = document.createElement('span');
          paisLabel.className = 'tooltip-label';
          paisLabel.textContent = 'PAÍS: ';
          const paisValue = document.createElement('span');
          paisValue.className = 'tooltip-value';
          paisValue.textContent = satData.pais;
          paisLine.appendChild(paisLabel);
          paisLine.appendChild(paisValue);

          // Criar linha CATEGORIA
          const catLine = document.createElement('div');
          const catLabel = document.createElement('span');
          catLabel.className = 'tooltip-label';
          catLabel.textContent = 'CATEGORIA: ';
          const catValue = document.createElement('span');
          catValue.className = 'tooltip-value';
          catValue.style.color = corCat;
          catValue.textContent = satData.categoria?.nome || '';
          catLine.appendChild(catLabel);
          catLine.appendChild(catValue);

          // Adicionar tudo ao corpo
          bodyDiv.appendChild(noradLine);
          bodyDiv.appendChild(paisLine);
          bodyDiv.appendChild(catLine);

          // Adicionar cabeçalho e corpo ao tooltipEl principal
          tooltipEl.appendChild(headerDiv);
          tooltipEl.appendChild(bodyDiv);

          tooltipEl.style.display = 'block';
          tooltipEl.style.left = `${movement.endPosition.x + 15}px`;
          tooltipEl.style.top = `${movement.endPosition.y + 15}px`;
        }

      } else {
        viewer.scene.canvas.style.cursor = 'default';

        if (lastHoveredEntity) {
          try {
            const lastSat = lastHoveredEntity.properties.getValue(window.Cesium.JulianDate.now());
            lastHoveredEntity.point.pixelSize = lastSat.categoria_id === 4 ? 10 : 7;
            lastHoveredEntity.point.outlineColor = window.Cesium.Color.BLACK;
            lastHoveredEntity.point.outlineWidth = 1.5;
          } catch (err) {}
          lastHoveredEntity = null;
        }

        if (tooltipEl) {
          tooltipEl.style.display = 'none';
        }
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Registrar event listener no preRender para acompanhar o satélite focado dinamicamente a cada frame
    const removerPreRender = viewer.scene.preRender.addEventListener((scene, time) => {
      if (entidadeFocadaRef.current && viewer && !viewer.isDestroyed()) {
        try {
          const entity = entidadeFocadaRef.current;
          const position = entity.position.getValue(time);
          if (position) {
            const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
            viewer.camera.lookAtTransform(transform);
          }
        } catch (err) {
          console.error("Erro no preRender de acompanhamento orbital:", err);
        }
      }
    });

    return () => {
      removerPreRender();
      handler.destroy();
      hoverHandler.destroy();
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      setViewer(null);
    };
  }, []);

  // Listener de redimensionamento para garantir a resiliência do globo Cesium 3D (RNF06)
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const handleResize = () => {
      try {
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
        }
      } catch (err) {
        console.warn("Erro ao redimensionar Cesium:", err);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewer]);

  // 4. ROTINA DE PROPAGAÇÃO EM TEMPO REAL SGP4 (SATELLITE.JS + CESIUM CALLBACKPROPERTY)
  useEffect(() => {
    if (!viewer || objetos.length === 0) return;

    // Função interna para limpar entidades anteriores de forma 100% segura contra concorrência
    const limparEntidades = () => {
      try {
        if (viewer && !viewer.isDestroyed() && viewer.entities) {
          entitiesRef.current.forEach((entity) => {
            try {
              viewer.entities.remove(entity);
            } catch (e) {}
          });
        }
      } catch (err) {}
      entitiesRef.current.clear();
    };

    limparEntidades();

    // Criar as entidades iniciais no Cesium com base nas categorias ativas
    const satelitesParaRenderizar = objetos.filter(sat => {
      const catId = Number(sat.categoria_id);
      const isAtiva = (catId === 1 || catId === 3 || catId === 4) && categoriasAtivas[catId];
      return isAtiva && sat.ultimo_tle;
    });

    satelitesParaRenderizar.forEach(sat => {
      try {
        const cor = sat.categoria?.cor_visualizacao || '#00ff66';
        
        // Evitar adicionar a mesma ID caso já exista no viewer por garantia contra colisões de estado
        if (viewer.entities.getById(sat.norad_id)) {
          return;
        }

        const entity = viewer.entities.add({
          id: sat.norad_id,
          name: sat.nome,
          // Posição dinâmica nativa do Cesium gerada de acordo com o tempo do relógio da simulação
          position: new window.Cesium.CallbackProperty((time, result) => {
            try {
              const tle = sat.ultimo_tle;
              if (!tle) return undefined;

              const dataAtual = window.Cesium.JulianDate.toDate(time);
              const gmst = satellite.gstime(dataAtual);

              // Propagador SGP4 matemático do satellite.js
              const satrec = satellite.twoline2satrec(tle.linha1, tle.linha2);
              const positionAndVelocity = satellite.propagate(satrec, dataAtual);
              const positionEci = positionAndVelocity.position;

              if (positionEci) {
                // Converter de ECI (Coordenadas Celestes) para Geodésico
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);
                let longitude = satellite.degreesLong(positionGd.longitude);
                let latitude = satellite.degreesLat(positionGd.latitude);
                let altitude = positionGd.height * 1000; // Convertendo km para metros

                // Jitter determinístico baseado no norad_id para evitar sobreposição perfeita visual e Z-fighting
                const idNum = parseInt(sat.norad_id) || 0;
                
                // Desvio de ~8-10 km em forma de círculo sutil
                const desvioRaio = 0.08; 
                const angulo = idNum * 1.7; // Ângulo estável
                
                longitude += Math.cos(angulo) * desvioRaio;
                latitude += Math.sin(angulo) * desvioRaio;
                
                // Camada de altitude variável determinística (4km a 24km) para permitir picking individual do mouse no Cesium
                altitude += (idNum % 7) * 4000;

                // Obter vetor 3D cartesiano no Cesium
                return window.Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude, undefined, result);
              }
            } catch (e) {}
            return undefined;
          }, false),
          // Direção de visão rigidamente travada a 2.500 km do satélite com pitch de -72 e a Terra majestosamente ao fundo
          viewFrom: new window.Cesium.ConstantProperty(new window.Cesium.Cartesian3(0.0, -772500.0, 2377500.0)),
          point: {
            pixelSize: sat.categoria_id === 4 ? 10 : 7, // ISS e estações são maiores no globo
            color: window.Cesium.Color.fromCssColorString(cor),
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY // Visível mesmo atrás da Terra
          },
          properties: sat // Injetar metadados no objeto para o ScreenSpaceEventHandler
        });

        entitiesRef.current.set(sat.norad_id, entity);
      } catch (err) {
        console.error("Erro ao adicionar entidade do satélite no Cesium:", sat.nome, err);
      }
    });

    return () => {
      limparEntidades();
    };
  }, [objetos, categoriasAtivas, viewer]);

  // Funções táticas de controle de alternância exclusiva de painéis laterais (RNF06 - Fase 3)
  const handleAbrirPainelEsquerdo = () => {
    setPainelEsquerdoAberto(true);
    if (window.innerWidth < 950) {
      setPainelDireitoAberto(false);
    }
  };

  const handleAbrirPainelDireito = () => {
    setPainelDireitoAberto(true);
    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(false);
    }
  };

  // 5. INTERAÇÕES DE SELEÇÃO E FOCO DE CÂMERA
  const handleSelecionarSat = async (sat) => {
    setSatSelecionado(sat);
    setDetalhesEducacionais(null);
    setTleAberto(false); // Fecha o painel de engenharia avançada TLE ao trocar de objeto

    // Abre o painel direito e fecha o esquerdo se for tela estreita (exclusividade)
    setPainelDireitoAberto(true);
    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(false);
    }

    // Buscar histórico/detalhes na API
    try {
      const res = await fetch(`${API_URL}/api/objetos/${sat.norad_id}`);
      if (res.ok) {
        const fullData = await res.json();
        setDetalhesEducacionais(fullData);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes educativos:", err);
    }
  };

  const handleFocarCamera = (sat) => {
    if (!viewer) return;

    const aplicarFocoSuave = (entity) => {
      const rangeDist = 3500000.0; // 3.500 km (zoom calibrado para ser ligeiramente menor/mais afastado)

      // Garantir que a câmera está desvinculada de qualquer transformação antes do voo gradual
      entidadeFocadaRef.current = null;
      viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
      viewer.trackedEntity = undefined;

      viewer.flyTo(entity, {
        duration: 1.5,
        offset: new window.Cesium.HeadingPitchRange(
          window.Cesium.Math.toRadians(0.0),
          window.Cesium.Math.toRadians(-72.0), // Pitch levemente inclinado para manter a Terra majestosa ao fundo
          rangeDist
        )
      }).then((completed) => {
        if (completed && viewer && !viewer.isDestroyed()) {
          // Travar o foco no satélite usando lookAtTransform ao fim do voo gradual
          const time = viewer.clock.currentTime;
          const position = entity.position.getValue(time);
          if (position) {
            const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
            const initialOffset = new window.Cesium.HeadingPitchRange(
              window.Cesium.Math.toRadians(0.0),
              window.Cesium.Math.toRadians(-72.0),
              rangeDist
            );
            viewer.camera.lookAtTransform(transform, initialOffset);
            entidadeFocadaRef.current = entity; // Ativar o acompanhamento contínuo no preRender
          }
        }
      });
    };

    // Adiciona o satélite temporariamente nos objetos ativos se ele veio da busca e não está renderizado
    if (!entitiesRef.current.has(sat.norad_id)) {
      // Ativar categoria correspondente para renderizar
      setCategoriasAtivas(prev => ({
        ...prev,
        [sat.categoria_id]: true
      }));
      
      // Pequeno timeout para dar tempo da entidade ser adicionada no loop
      setTimeout(() => {
        const entity = viewer.entities.getById(sat.norad_id);
        if (entity) {
          aplicarFocoSuave(entity);
        }
      }, 150);
    } else {
      const entity = viewer.entities.getById(sat.norad_id);
      if (entity) {
        aplicarFocoSuave(entity);
      }
    }
  };

  const handleDesfocarCamera = () => {
    if (!viewer) return;
    
    // Parar o acompanhamento orbital e restaurar a matriz identidade
    entidadeFocadaRef.current = null;
    viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    viewer.trackedEntity = undefined;
    setSatSelecionado(null);

    // Fechar painel de aprendizado e, em telas compactas, reabrir o de métricas
    setPainelDireitoAberto(false);
    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(true);
    }
    
    // Suavizar câmera voando de volta para a visão global da Terra centrada na América do Sul
    viewer.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(-45.0, -15.0, 18000000.0),
      orientation: {
        heading: window.Cesium.Math.toRadians(0.0),
        pitch: window.Cesium.Math.toRadians(-90.0),
        roll: 0.0
      },
      duration: 1.5
    });
  };

  const handleAlternarCategoria = (catId) => {
    const id = Number(catId);
    if (id === 1) {
      setCategoriasAtivas(prev => ({ ...prev, 1: !prev[1] }));
    } else if (id === 3) {
      setCategoriasAtivas(prev => ({ ...prev, 3: !prev[3] }));
    } else if (id === 4) {
      setCategoriasAtivas(prev => ({ ...prev, 4: !prev[4] }));
    }
  };

  const handleIniciarMonitoramento = () => {
    setCyberFade(true);
    setTimeout(() => {
      setTelaAtiva('simulador');
      setCyberFade(false);
    }, 600); // 600ms de animação cibernética e scanline
  };

  // Calcular dinamicamente os contadores totais por categoria para sincronismo do HUD
  const obterContadoresCategorias = () => {
    if (!estatisticas) return { ativos: 0, detritos: 0, estacoes: 0 };
    const totalEstacoes = estatisticas.distribuicao_paises?.reduce((acc, p) => acc + (p.estacoes || 0), 0) || 0;
    const totalDetritos = Math.round((estatisticas.percentual_detritos / 100) * estatisticas.total_objetos);
    const totalAtivosBanco = estatisticas.total_objetos - totalDetritos - totalEstacoes;
    const totalAtivosReais = totalAtivosBanco + 10329;
    
    return {
      ativos: totalAtivosReais,
      detritos: totalDetritos,
      estacoes: totalEstacoes
    };
  };

  // Calcular dinamicamente a contagem de objetos com base nas categorias selecionadas
  const calcularObjetosNoRadar = () => {
    if (!estatisticas) return 0;
    const contadores = obterContadoresCategorias();
    
    let soma = 0;
    if (categoriasAtivas[1]) soma += contadores.ativos;
    if (categoriasAtivas[3]) soma += contadores.detritos;
    if (categoriasAtivas[4]) soma += contadores.estacoes;
    
    return soma;
  };

  // Obter lista de países de forma estável, fixa e 100% reativa aos filtros
  const obterPaisesExibidos = () => {
    if (!estatisticas?.distribuicao_paises) return [];
    
    const listaOriginal = estatisticas.distribuicao_paises;
    
    // Lista fixa na ordem estática ideal baseada no volume histórico (Cockpit Estável Premium)
    const nacoesPrincipais = [
      "Não Identificado",
      "Rússia",
      "Reino Unido",
      "China",
      "Estados Unidos",
      "Índia",
      "Brasil",
      "Japão",
      "União Europeia"
    ];
    
    const listaMapeada = nacoesPrincipais.map(nome => {
      // Encontrar o país correspondente na lista do banco de dados (usando comparação case-insensitive resiliente)
      const itemBanco = listaOriginal.find(p => {
        const paisNormalizado = (p.pais || "").toLowerCase().trim();
        const nomeNormalizado = nome.toLowerCase().trim();
        return paisNormalizado === nomeNormalizado || 
               (nomeNormalizado === "não identificado" && (paisNormalizado === "" || paisNormalizado === "não identificado" || paisNormalizado === "unknown" || paisNormalizado === "desconhecido"));
      });
      
      let totalReativo = 0;
      if (itemBanco) {
        // Agora nós calculamos a soma reativa exata baseada nas contagens por categoria enviadas pelo backend!
        if (categoriasAtivas[1]) totalReativo += itemBanco.ativos || 0;
        if (categoriasAtivas[3]) totalReativo += itemBanco.detritos || 0;
        if (categoriasAtivas[4]) totalReativo += itemBanco.estacoes || 0;
      }
      
      return {
        pais: nome,
        total: totalReativo,
        especial: false
      };
    });
    
    // Adicionar o item especial do Starlink (USA) no final
    const totalStarlinkReativo = categoriasAtivas[1] ? 6280 : 0;
    listaMapeada.push({
      pais: "Starlink (USA)",
      total: totalStarlinkReativo,
      especial: true
    });
    
    return listaMapeada;
  };

  return (
    <div className="app-container" ref={containerRef}>
      {/* 3D GLOBE BACKDROP */}
      <div id="cesium-container" className="cesium-container"></div>

      {/* TELA DE BOOT INICIAL FUTURISTA (WELCOME SCREEN) */}
      {(telaAtiva === 'inicio' || cyberFade) && (
        <div 
          className={`welcome-screen ${cyberFade ? 'fade-out-cyber' : ''}`}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* BARRA DE NAVEGAÇÃO SUPERIOR FIXA (ABA DE NAVEGAÇÃO UNIFICADA) */}
          <nav className="welcome-navbar">
            <h1 className="welcome-brand">
              <span>Orbital</span>ED
            </h1>
            
            <button 
              type="button" 
              className="welcome-action-btn"
              onClick={handleIniciarMonitoramento}
            >
              INICIAR MONITORAMENTO
            </button>
          </nav>

          {/* CONTÊINER DE APRESENTAÇÃO PARADA NA TELA (SLIDESHOW HOLOGRÁFICO) */}
          <div className="welcome-slide-container">
            
            {/* SEÇÃO 1: APRESENTAÇÃO E CONTEXTO DIDÁTICO */}
            <div className={`welcome-slide ${secaoAtiva === 0 ? 'active' : secaoAtiva < 0 ? 'inactive-prev' : 'inactive-next'}`}>
              <article className="welcome-article">
                {/* Showcase visual com globo flutuante e scanner neon ciano */}
                <div className="welcome-planet-showcase">
                  <div className="planet-icon-glow">
                    <Globe size={72} className="planet-float-icon" />
                  </div>
                  <div className="planet-scanner-line"></div>
                </div>

                <h2>Explorando o Espaço ao Nosso Redor</h2>
                <p className="welcome-intro-text">
                  Bem-vindo à nossa plataforma interativa de monitoramento orbital, um ambiente projetado para transformar dados espaciais complexos em conhecimento visual e acessível para todos.
                </p>
                <p className="welcome-intro-text">
                  Hoje, milhares de objetos artificiais orbitam a Terra a cada segundo — desde satélites ativos que mantêm nosso mundo conectado até remanescentes inativos e detritos espaciais que cruzam o cosmos em alta velocidade. Compreender esse cenário em constante evolução é o primeiro passo para entender o futuro da exploração espacial e a urgência da sustentabilidade orbital.
                </p>
                
                <blockquote className="welcome-quote" style={{ marginTop: '20px' }}>
                  Abaixo da órbita tática, prepare-se para visualizar em tempo real a teia invisível de tecnologias que cercam o nosso planeta. Role para baixo ou use os indicadores ao lado para explorar.
                </blockquote>
              </article>
            </div>

            {/* SEÇÃO 2: OBJETIVO DA PLATAFORMA E CARDS DE RECURSOS */}
            <div className={`welcome-slide ${secaoAtiva === 1 ? 'active' : secaoAtiva < 1 ? 'inactive-prev' : 'inactive-next'}`}>
              <article className="welcome-article">
                <h3>Nosso Objetivo</h3>
                <p className="welcome-objective-text">
                  Esta plataforma nasceu com o propósito puramente <strong>educacional e de divulgação científica</strong>. Nosso objetivo é democratizar o acesso à mecânica orbital, permitindo que estudantes, professores e entusiastas explorem o ecossistema espacial sem a necessidade de conhecimento técnico prévio.
                </p>

                <div className="welcome-divider-line"></div>

                <h3>O que você encontrará aqui</h3>
                
                {/* Grid de Cards Didáticos Premium */}
                <div className="welcome-features-grid">
                  <div className="feature-card">
                    <div className="feature-icon-wrapper">
                      <Globe size={22} />
                    </div>
                    <h4>Visualização em Tempo Real</h4>
                    <p>
                      Um globo tridimensional interativo que mapeia a posição atualizada de satélites, estações espaciais e detritos na Órbita Terrestre Baixa (LEO), Média (MEO) e Geoestacionária (GEO).
                    </p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon-wrapper">
                      <Info size={22} />
                    </div>
                    <h4>Linguagem Didática</h4>
                    <p>
                      Ao selecionar qualquer objeto no mapa, os parâmetros matemáticos e strings brutas de dados são traduzidos em explicações simples, ilustrando a altitude, país de origem e data de lançamento.
                    </p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon-wrapper">
                      <TrendingUp size={22} />
                    </div>
                    <h4>Consciência Situacional</h4>
                    <p>
                      Um painel estatístico dinâmico que quantifica o cenário real do lixo espacial, ajudando a compreender os riscos globais de colisões em cascata e o impacto direto no nosso planeta.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            {/* SEÇÃO 3: DASHBOARD DE LIXO ESPACIAL (RF04) E POLUIÇÃO GEOPOLÍTICA */}
            <div className={`welcome-slide ${secaoAtiva === 2 ? 'active' : secaoAtiva < 2 ? 'inactive-prev' : 'inactive-next'}`}>
              <section className="welcome-dashboard">
                <div className="dashboard-title-bar">
                  <TrendingUp size={18} />
                  <h2>ALERTA DE SUSTENTABILIDADE: CENÁRIO CRÍTICO DO LIXO ESPACIAL</h2>
                </div>
                
                <div className="dashboard-summary">
                  <p>
                    Atualmente, as órbitas terrestres sofrem com uma densidade crescente de poluição espacial. Fragmentos de estágios de foguetes descartados e colisões passadas vagam de forma descontrolada a mais de 28.000 km/h, criando um risco crítico para novas missões científicas.
                  </p>
                  
                  <div className="dashboard-meta">
                    <div className="meta-item">
                      <span className="meta-label">DETRITOS RASTREADOS NO RADAR:</span>
                      <span className="meta-value">{loading ? "---" : obterContadoresCategorias().detritos.toLocaleString('pt-BR')} OBJETOS</span>
                    </div>
                    <div className="meta-divider"></div>
                    <div className="meta-item">
                      <span className="meta-label">PERCENTUAL CRÍTICO DE POLUIÇÃO:</span>
                      <span className="meta-value">{loading ? "---" : (estatisticas ? estatisticas.percentual_detritos : "12.53")}%</span>
                    </div>
                  </div>
                </div>

                {/* Tabela de Lixo Espacial por Nações Centralizada */}
                <div className="dashboard-table-container">
                  <table className="welcome-table">
                    <thead>
                      <tr>
                        <th>NAÇÃO CAUSADORA</th>
                        <th>QUANTIDADE DE DETRITOS</th>
                        <th>REPRESENTAÇÃO (%)</th>
                        <th>NÍVEL DE GRAVIDADE / RISCO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="nation-cell">Rússia</td>
                        <td className="count-cell">{loading ? "---" : (estatisticas?.distribuicao_paises?.find(p => p.pais?.toLowerCase() === 'rússia')?.detritos || 587).toLocaleString('pt-BR')} detritos</td>
                        <td className="percent-cell">{loading ? "---" : (estatisticas && obterContadoresCategorias().detritos > 0 ? ((estatisticas.distribuicao_paises.find(p => p.pais?.toLowerCase() === 'rússia')?.detritos || 587) / obterContadoresCategorias().detritos * 100).toFixed(1) : "78.8")}%</td>
                        <td className="risk-cell"><span className="risk-badge risk-extreme">RISCO EXTREMO</span></td>
                      </tr>
                      <tr>
                        <td className="nation-cell">Estados Unidos</td>
                        <td className="count-cell">{loading ? "---" : (estatisticas?.distribuicao_paises?.find(p => p.pais?.toLowerCase() === 'estados unidos')?.detritos || 109).toLocaleString('pt-BR')} detritos</td>
                        <td className="percent-cell">{loading ? "---" : (estatisticas && obterContadoresCategorias().detritos > 0 ? ((estatisticas.distribuicao_paises.find(p => p.pais?.toLowerCase() === 'estados unidos')?.detritos || 109) / obterContadoresCategorias().detritos * 100).toFixed(1) : "14.6")}%</td>
                        <td className="risk-cell"><span className="risk-badge risk-critical">RISCO CRÍTICO</span></td>
                      </tr>
                      <tr>
                        <td className="nation-cell">China</td>
                        <td className="count-cell">{loading ? "---" : (estatisticas?.distribuicao_paises?.find(p => p.pais?.toLowerCase() === 'china')?.detritos || 49).toLocaleString('pt-BR')} detritos</td>
                        <td className="percent-cell">{loading ? "---" : (estatisticas && obterContadoresCategorias().detritos > 0 ? ((estatisticas.distribuicao_paises.find(p => p.pais?.toLowerCase() === 'china')?.detritos || 49) / obterContadoresCategorias().detritos * 100).toFixed(1) : "6.6")}%</td>
                        <td className="risk-cell"><span className="risk-badge risk-moderate">RISCO MODERADO</span></td>
                      </tr>
                      <tr>
                        <td className="nation-cell">Brasil / Japão / UE / Outros</td>
                        <td className="count-cell">0 detritos</td>
                        <td className="percent-cell">0.0%</td>
                        <td className="risk-cell"><span className="risk-badge risk-low">RISCO MÍNIMO (SUSTENTÁVEL)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <blockquote className="welcome-quote" style={{ margin: '15px auto 0 auto' }}>
                  "Navegue pelo mapa, filtre por categorias e descubra a história por trás dos objetos que cercam o nosso planeta. O espaço nunca esteve tão próximo."
                </blockquote>
              </section>
            </div>

          </div>

          {/* DOTS DE PAGINAÇÃO LATERAL DIREITA CIBERNÉTICOS */}
          <div className="welcome-dots-indicator">
            <button 
              type="button" 
              className={`dot-btn ${secaoAtiva === 0 ? 'active' : ''}`}
              onClick={() => setSecaoAtiva(0)}
              title="Introdução"
            >
              <span className="dot-label">INTRO</span>
            </button>
            <button 
              type="button" 
              className={`dot-btn ${secaoAtiva === 1 ? 'active' : ''}`}
              onClick={() => setSecaoAtiva(1)}
              title="Objetivos"
            >
              <span className="dot-label">OBJETIVO</span>
            </button>
            <button 
              type="button" 
              className={`dot-btn ${secaoAtiva === 2 ? 'active' : ''}`}
              onClick={() => setSecaoAtiva(2)}
              title="Lixo Espacial"
            >
              <span className="dot-label">ALERTA</span>
            </button>
          </div>

        </div>
      )}

      {/* INTERACTIVE HUD LAYOUT */}
      {telaAtiva === 'simulador' && (
        <div className="hud-overlay">
          
          {/* BARRA SUPERIOR (HEADER) */}
          <header className="hud-header">
            <div className="brand-section">
              <h1 className="brand-title">
                <span>Orbital</span>ED
              </h1>
              <div className="system-status">
                <span className="status-dot"></span>
                STATUS: RASTREIO TÁTICO ATIVO (SGP4)
              </div>
            </div>

            {/* BUSCADOR DE SATÉLITES TÁTICO */}
            <div className="search-section">
              <div className="search-bar-container">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="BUSCAR SATÉLITE OU NORAD ID..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {busca && (
                  <X 
                    size={16} 
                    style={{cursor: 'pointer', color: 'var(--text-muted)'}}
                    onClick={() => { setBusca(''); setSugestoes([]); }}
                  />
                )}
              </div>

              {/* Sugestões do Debounce da API */}
              {sugestoes.length > 0 && (
                <div className="search-suggestions">
                  {sugestoes.map((sat) => (
                    <div 
                      key={sat.norad_id}
                      className="suggestion-item"
                      onClick={() => {
                        handleSelecionarSat(sat);
                        handleFocarCamera(sat);
                        setBusca('');
                        setSugestoes([]);
                      }}
                    >
                      <span>{sat.nome}</span>
                      <span className="suggestion-norad">#{sat.norad_id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* PAINÉIS LATERAIS FLUTUANTES (HUD PANELS) */}
          <div className="panels-container">
            
            {/* PAINEL ESQUERDO: ESTATÍSTICAS E PAINEL TÁTICO */}
            <aside className={`hud-panel left-panel ${!painelEsquerdoAberto ? 'collapsed' : ''}`}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} className="panel-header-icon" />
                  <h2 className="panel-title">Métricas de Órbita</h2>
                </div>
                <button 
                  type="button" 
                  className="hud-toggle-btn-inline"
                  onClick={() => setPainelEsquerdoAberto(false)}
                  title="Recolher Painel"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              <div className="panel-content">
                {/* Total de Objetos */}
                <div className="stat-card">
                  <div className="stat-label">Objetos no Radar</div>
                  <div className="stat-value">
                    {loading ? "---" : calcularObjetosNoRadar().toLocaleString('pt-BR')}
                    <span>OBJETOS</span>
                  </div>
                </div>

                {/* Filtros e Legenda Pedagógica */}
                <div className="legend-section">
                  <div className="legend-title">Filtro de Visualização</div>
                  
                  {/* Satélites Ativos */}
                  <div 
                    className={`legend-item ${categoriasAtivas[1] ? 'active' : ''}`}
                    style={{
                      '--border-active-color': 'rgba(0, 255, 102, 0.4)',
                      '--glow-active-color': 'rgba(0, 255, 102, 0.15)'
                    }}
                    onClick={() => handleAlternarCategoria(1)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{backgroundColor: 'var(--neon-green)'}}></span>
                      <span className="category-name">Satélites Ativos</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().ativos.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Estações Espaciais */}
                  <div 
                    className={`legend-item ${categoriasAtivas[4] ? 'active' : ''}`}
                    style={{
                      '--border-active-color': 'rgba(0, 240, 255, 0.4)',
                      '--glow-active-color': 'rgba(0, 240, 255, 0.15)'
                    }}
                    onClick={() => handleAlternarCategoria(4)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{backgroundColor: 'var(--neon-cyan)'}}></span>
                      <span className="category-name">Estações Espaciais</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().estacoes.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Detritos Espaciais */}
                  <div 
                    className={`legend-item ${categoriasAtivas[3] ? 'active' : ''}`}
                    style={{
                      '--border-active-color': 'rgba(255, 0, 85, 0.4)',
                      '--glow-active-color': 'rgba(255, 0, 85, 0.15)'
                    }}
                    onClick={() => handleAlternarCategoria(3)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{backgroundColor: 'var(--neon-red)'}}></span>
                      <span className="category-name">Detritos Espaciais</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().detritos.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Distribuição por País (Mini Gráfico HUD) */}
                <div className="legend-section">
                  <div className="legend-title">Distribuição por País</div>
                  <div className="countries-list">
                    {loading ? (
                      <div style={{fontFamily: 'var(--mono-font)', fontSize: '11px', color: 'var(--text-muted)'}}>Carregando dados...</div>
                    ) : (() => {
                      const paisesExibidos = obterPaisesExibidos();
                      const maxTotal = Math.max(...paisesExibidos.map(c => c.total)) || 1;
                      return paisesExibidos.map((c, index) => {
                        const widthPercent = (c.total / maxTotal) * 100;
                        return (
                          <div key={index} className={`country-item ${c.especial ? 'special-starlink' : ''}`}>
                            <div className="country-header">
                              <span className="country-name" style={{ color: c.especial ? 'var(--neon-cyan)' : '' }}>
                                {c.pais}
                              </span>
                              <span className="country-count" style={{ color: c.especial ? 'var(--neon-cyan)' : '' }}>
                                {c.total.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="country-bar-bg">
                              <div 
                                className="country-bar-fill" 
                                style={{
                                  width: `${widthPercent}%`,
                                  background: c.especial ? 'linear-gradient(90deg, rgba(0, 240, 255, 0.4), var(--neon-cyan))' : '',
                                  boxShadow: c.especial ? 'var(--glow-cyan)' : ''
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </aside>

            {/* PAINEL DIREITO: DETALHES EDUCACIONAIS DO SATÉLITE */}
            <aside className={`hud-panel right-panel ${!painelDireitoAberto ? 'collapsed' : ''} ${!satSelecionado ? 'empty-state' : ''}`}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <button 
                  type="button" 
                  className="hud-toggle-btn-inline"
                  onClick={() => setPainelDireitoAberto(false)}
                  title="Recolher Painel"
                >
                  <ChevronRight size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="panel-title">Painel de Aprendizado</h2>
                  <Compass size={16} className="panel-header-icon" />
                </div>
              </div>

              <div className="panel-content">
                {satSelecionado ? (
                  <div className="satellite-fiche">
                    
                    {/* Ficha e Título */}
                    <div className="fiche-header">
                      <h3 className="sat-title">{satSelecionado.nome}</h3>
                      <div className="sat-subtitle">NORAD CATALOG: #{satSelecionado.norad_id}</div>
                    </div>

                    {/* Badges de Categoria e Função de Missão */}
                    <div className="mission-badge-container">
                      <span className="mission-label">TIPO DE MISSÃO / FUNÇÃO</span>
                      <div className="mission-badge" style={{ 
                        borderColor: satSelecionado.categoria?.cor_visualizacao || 'var(--neon-green)',
                        color: satSelecionado.categoria?.cor_visualizacao || 'var(--neon-green)',
                        backgroundColor: `${satSelecionado.categoria?.cor_visualizacao || '#00ff66'}12`
                      }}>
                        {obterDadosEducativos(satSelecionado)?.funcao}
                      </div>
                    </div>

                    {/* Grid de Dados Rápidos Legíveis */}
                    <div className="fiche-grid">
                      <div className="grid-cell">
                        <span className="cell-label">País Responsável</span>
                        <span className="cell-value">{satSelecionado.pais}</span>
                      </div>
                      <div className="grid-cell">
                        <span className="cell-label">Data de Lançamento</span>
                        <span className="cell-value">
                          {satSelecionado.data_lancamento 
                            ? new Date(satSelecionado.data_lancamento).toLocaleDateString('pt-BR') 
                            : "Desconhecida"}
                        </span>
                      </div>
                      <div className="grid-cell" style={{ gridColumn: 'span 2' }}>
                        <span className="cell-label">Estado Operacional</span>
                        <span className="cell-value" style={{ 
                          color: satSelecionado.status.toLowerCase().includes('ativo') ? 'var(--neon-green)' : 'var(--neon-red)' 
                        }}>
                          {satSelecionado.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* História e Curiosidades Pedagógicas Envolventes */}
                    <div className="pedagogic-explanation scrollable-explanation">
                      <div className="explanation-title">
                        <Zap size={14} style={{color: satSelecionado.categoria?.cor_visualizacao || 'var(--neon-cyan)'}} />
                        <span>História & Propósito</span>
                      </div>
                      <p className="explanation-text">
                        {obterDadosEducativos(satSelecionado)?.historia}
                      </p>
                      
                      <div className="fun-fact-section">
                        <div className="fun-fact-title">
                          <TrendingUp size={12} style={{color: 'var(--neon-cyan)'}} />
                          <span>Fato Curioso</span>
                        </div>
                        <p className="fun-fact-text">
                          {obterDadosEducativos(satSelecionado)?.curiosidade}
                        </p>
                      </div>
                    </div>

                    {/* Dados Avançados TLE (Colapsável) */}
                    {satSelecionado.ultimo_tle && (
                      <div className={`tle-accordion ${tleAberto ? 'open' : ''}`}>
                        <button 
                          type="button" 
                          className="tle-accordion-header"
                          onClick={() => setTleAberto(!tleAberto)}
                        >
                          <div className="accordion-title">
                            <Cpu size={12} />
                            <span>Console Avançado (Dados TLE)</span>
                          </div>
                          <ChevronRight size={14} className="arrow-icon" />
                        </button>
                        
                        {tleAberto && (
                          <div className="tle-terminal">
                            <div className="terminal-header">
                              <span>DADOS TLE BRUTOS DE ENGENHARIA</span>
                            </div>
                            <div className="terminal-body">
                              {satSelecionado.ultimo_tle.linha1}
                              {"\n"}
                              {satSelecionado.ultimo_tle.linha2}
                            </div>
                            <div className="terminal-footer">
                              * Esses coeficientes matemáticos determinam a órbita no simulador SGP4.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botões Táticos de Ação */}
                    <button 
                      type="button" 
                      className="action-button"
                      onClick={handleDesfocarCamera}
                    >
                      <Globe size={14} />
                      Voltar para a Visão Global
                    </button>

                  </div>
                ) : (
                  <div className="empty-details">
                    <Globe size={48} className="empty-details-icon" style={{color: 'var(--neon-cyan)'}} />
                    <p>
                      Aguardando seleção de satélite...
                      <span className="cursor-blink"></span>
                    </p>
                  </div>
                )}
              </div>
            </aside>

          </div>

          {/* GATILHOS FLUTUANTES LATERAIS PARA REABRIR PAINÉIS (RNF06 - Fase 3) */}
          {!painelEsquerdoAberto && (
            <button 
              type="button" 
              className="hud-trigger-float-btn left-trigger"
              onClick={handleAbrirPainelEsquerdo}
              title="Abrir Métricas de Órbita"
            >
              <Database size={16} />
              <ChevronRight size={14} className="trigger-arrow" />
            </button>
          )}

          {!painelDireitoAberto && (
            <button 
              type="button" 
              className="hud-trigger-float-btn right-trigger"
              onClick={handleAbrirPainelDireito}
              title="Abrir Painel de Aprendizado"
            >
              <Compass size={16} />
              <ChevronLeft size={14} className="trigger-arrow" />
            </button>
          )}

        </div>
      )}

      {/* Tooltip HUD Flutuante via DOM direto para 60 FPS */}
      <div id="hud-tooltip" className="hud-tooltip" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 9999 }}></div>
    </div>
  );
}

export default App;
