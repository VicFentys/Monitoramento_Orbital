import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Compass,
  ShieldAlert,
  AlertTriangle,
  Flame,
  BookOpen,
  Activity,
  RotateCw,
  Wind,
  MousePointer,
  Crosshair
} from 'lucide-react';
import * as satellite from 'satellite.js';
import './App.css';
import { calcularParametrosOrbitais, gerarPontosOrbita } from './utils/orbitalPhysics';
import { obterFichaFactual, GLOSSARIO_ORBITAL, DADOS_SUSTENTABILIDADE } from './data/orbitalEncyclopedia';

// Configuração do host da API (aponta para o backend local ou de produção)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cores neon oficiais para as 4 categorias do sistema
const CORES_CATEGORIAS = {
  1: '#00ff66', // Satélite Ativo (Verde)
  2: '#f59e0b', // Satélite Inativo (Âmbar)
  3: '#ff0055', // Detrito Espacial (Vermelho)
  4: '#00f0ff'  // Estação Espacial (Ciano)
};

// Cor cinza prateada holográfica para a trilha orbital
const COR_TRILHA_ORBITAL = 'rgba(203, 213, 225, 0.75)';

// Títulos descritivos dos 4 slides da Welcome Screen
const TITULOS_SLIDES = [
  { id: 0, titulo: 'Visão Geral & Contexto' },
  { id: 1, titulo: 'Recursos Tecnológicos do Sistema' },
  { id: 2, titulo: 'Sustentabilidade Espacial & Impacto Terrestre' },
  { id: 3, titulo: 'Glossário Astrodinâmico Didático' }
];

function App() {
  const [viewer, setViewer] = useState(null);
  const containerRef = useRef(null);
  const entitiesRef = useRef(new Map());
  const entidadeFocadaRef = useRef(null);
  const orbitaEntidadeRef = useRef(null);
  const satHoverIdRef = useRef(null);
  const satSelecionadoRef = useRef(null);

  // Estados de Navegação e Seções
  const [telaAtiva, setTelaAtiva] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tela') || 'inicio';
  });
  const telaAtivaRef = useRef(telaAtiva);
  useEffect(() => {
    telaAtivaRef.current = telaAtiva;
  }, [telaAtiva]);
  const [cyberFade, setCyberFade] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('secao');
    return s !== null ? parseInt(s, 10) : 0;
  }); // 0: Visão Geral, 1: Diferenciais, 2: Sustentabilidade, 3: Glossário

  // Transições entre slides: abertura e fechamento pelo centro (Visão Geral <-> Diferenciais) e redimensionamento fluido
  const secaoAnteriorRef = useRef(secaoAtiva);
  const [aberturaCentro, setAberturaCentro] = useState(false);
  const aberturaTimerRef = useRef(null);
  const [fechandoVisor, setFechandoVisor] = useState(false);
  const fechandoTimerRef = useRef(null);
  const [saindoVisaoGeral, setSaindoVisaoGeral] = useState(false);
  const saindoHeroTimerRef = useRef(null);
  const [secaoVisorExibida, setSecaoVisorExibida] = useState(secaoAtiva > 0 ? secaoAtiva : 1);
  const visorInnerRef = useRef(null);
  const [visorHeight, setVisorHeight] = useState(null);
  const [emTransicao, setEmTransicao] = useState(false);
  const transicaoTimerRef = useRef(null);

  useEffect(() => {
    if (secaoAtiva > 0) {
      setSecaoVisorExibida(secaoAtiva);
    }
  }, [secaoAtiva]);

  // Alturas ideais base por seção para garantir acomodação inicial sem piscar
  const ALTURAS_BASE = {
    1: 460, // Sobre o Projeto: 3 cartões conceituais + barra de métricas chave
    2: 640, // Recursos Tecnológicos: 3 cartões enriquecidos + cartão full-width de arquitetura stack
    3: 750, // Sustentabilidade: 4 pilares unificados + tabela geopolítica completa
    4: 520  // Glossário: grade completa de categorias
  };

  const handleMudarSecao = (novaSecao) => {
    if (novaSecao === secaoAtiva) return;

    if (novaSecao > 0) {
      setSecaoVisorExibida(novaSecao);
    }

    // Se estiver saindo da Visão Geral (0) para o visor (1, 2 ou 3), dispara fade-out elegante do hero
    if (secaoAtiva === 0 && novaSecao > 0) {
      setSaindoVisaoGeral(true);
      setSecaoAtiva(novaSecao);
      if (saindoHeroTimerRef.current) clearTimeout(saindoHeroTimerRef.current);
      saindoHeroTimerRef.current = setTimeout(() => {
        setSaindoVisaoGeral(false);
      }, 450);
      return;
    }

    // Se estiver saindo do visor (1, 2 ou 3) de volta para a Visão Geral (0)
    if (secaoAtiva > 0 && novaSecao === 0) {
      setFechandoVisor(true);
      setSecaoAtiva(0);
      if (fechandoTimerRef.current) clearTimeout(fechandoTimerRef.current);
      fechandoTimerRef.current = setTimeout(() => {
        setFechandoVisor(false);
      }, 520);
      return;
    }

    // Se estava fechando ou saindo e o usuário navegou antes do fim dos timers
    if (fechandoVisor) {
      setFechandoVisor(false);
      if (fechandoTimerRef.current) clearTimeout(fechandoTimerRef.current);
    }
    if (saindoVisaoGeral) {
      setSaindoVisaoGeral(false);
      if (saindoHeroTimerRef.current) clearTimeout(saindoHeroTimerRef.current);
    }

    setSecaoAtiva(novaSecao);
  };

  useLayoutEffect(() => {
    if (secaoAtiva === 0) {
      secaoAnteriorRef.current = 0;
      if (aberturaTimerRef.current) clearTimeout(aberturaTimerRef.current);
      if (transicaoTimerRef.current) clearTimeout(transicaoTimerRef.current);
      setAberturaCentro(false);
      setEmTransicao(false);
      return;
    }

    // Suprime scrollbars temporários durante a interpolação de altura entre seções
    setEmTransicao(true);
    if (transicaoTimerRef.current) clearTimeout(transicaoTimerRef.current);
    transicaoTimerRef.current = setTimeout(() => {
      setEmTransicao(false);
    }, 520);

    // Se a transição veio da Visão Geral (seção 0), ativa a abertura a partir do centro como placa holográfica
    if (secaoAnteriorRef.current === 0) {
      setAberturaCentro(true);
      if (aberturaTimerRef.current) clearTimeout(aberturaTimerRef.current);
      aberturaTimerRef.current = setTimeout(() => {
        setAberturaCentro(false);
      }, 650);
    }

    secaoAnteriorRef.current = secaoAtiva;

    // Cálculo dinâmico da altura para transição fluida entre os slides
    const calcularAltura = () => {
      if (!visorInnerRef.current) return;
      const headerEl = visorInnerRef.current.querySelector('.tactical-visor-header');
      const contentEl = visorInnerRef.current.querySelector('.tactical-visor-body > div');

      // scrollHeight e offsetHeight garantem leitura fiel do layout, sem distorção por transforms CSS
      const headerH = headerEl ? Math.max(headerEl.offsetHeight, headerEl.scrollHeight) : 48;
      const contentH = contentEl ? Math.max(contentEl.offsetHeight, contentEl.scrollHeight) : 260;

      const isMobile = window.innerWidth <= 900;
      // padding interno (28+28=56) + padding body (4+8=12) + bordas do frame (2) + margem do header (16) = 86
      const bufferVertical = isMobile ? 48 : 86;

      const secaoAlvo = secaoAtiva > 0 ? secaoAtiva : secaoVisorExibida;
      const fallbackH = ALTURAS_BASE[secaoAlvo] || 320;

      // Se o conteúdo já possui altura mensurada, usa a altura necessária exata sem inflar espaço vazio
      const alturaCalculada = Math.ceil(headerH + contentH + bufferVertical);
      const naturalHeight = contentH > 80 ? alturaCalculada : fallbackH;
      const maxPermitido = Math.max(300, window.innerHeight - (isMobile ? 95 : 115));
      const finalH = Math.min(naturalHeight, maxPermitido);
      setVisorHeight(finalH);
    };

    calcularAltura();
    const rafId = requestAnimationFrame(calcularAltura);

    const contentEl = visorInnerRef.current ? visorInnerRef.current.querySelector('.tactical-visor-body > div') : null;
    let ro = null;
    if (contentEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        calcularAltura();
      });
      ro.observe(contentEl);
    }

    window.addEventListener('resize', calcularAltura);
    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', calcularAltura);
    };
  }, [secaoAtiva, secaoVisorExibida]);

  // Controladores de estado dos painéis laterais colapsáveis
  const [painelEsquerdoAberto, setPainelEsquerdoAberto] = useState(false);
  const [painelDireitoAberto, setPainelDireitoAberto] = useState(false);

  // Modais de Aprofundamento no Console com controle de animação suave
  const [modalSustentabilidadeAberto, setModalSustentabilidadeAberto] = useState(false);
  const [modalGlossarioAberto, setModalGlossarioAberto] = useState(false);
  const [modalTutorialAberto, setModalTutorialAberto] = useState(false);
  const [modalFechando, setModalFechando] = useState(false);

  const handleFecharModais = () => {
    setModalFechando(true);
    setTimeout(() => {
      setModalSustentabilidadeAberto(false);
      setModalGlossarioAberto(false);
      setModalTutorialAberto(false);
      setModalFechando(false);
    }, 220);
  };

  const handleAbrirSustentabilidade = () => {
    setModalFechando(false);
    setModalGlossarioAberto(false);
    setModalTutorialAberto(false);
    setModalSustentabilidadeAberto(true);
  };

  const handleAbrirGlossario = () => {
    setModalFechando(false);
    setModalSustentabilidadeAberto(false);
    setModalTutorialAberto(false);
    setModalGlossarioAberto(true);
  };

  const handleAbrirTutorial = () => {
    setModalFechando(false);
    setModalSustentabilidadeAberto(false);
    setModalGlossarioAberto(false);
    setModalTutorialAberto(true);
  };

  // Referência para controlar redimensionamento de painéis
  const eraCompactoRef = useRef(window.innerWidth < 950);

  // Estados de dados da API
  const [objetos, setObjetos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de Interação
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [satSelecionado, setSatSelecionado] = useState(null);
  const [parametrosOrbitaisSat, setParametrosOrbitaisSat] = useState(null);

  // Filtros de Categoria (Suporte integral às 4 categorias)
  const [categoriasAtivas, setCategoriasAtivas] = useState({
    1: true, // Satélite Ativo
    2: true, // Satélite Inativo
    3: true, // Detrito Espacial
    4: true  // Estação Espacial
  });

  // Referências para controle de rolagem e toque nos slides da Home
  const lastScrollTimeRef = useRef(0);
  const touchStartYRef = useRef(0);

  // Ajuste inicial e dinâmico de visibilidade dos painéis HUD
  useEffect(() => {
    if (telaAtiva !== 'simulador') return;

    const eCompactoInicial = window.innerWidth < 950;
    eraCompactoRef.current = eCompactoInicial;

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
      if (eCompacto !== eraCompactoRef.current) {
        eraCompactoRef.current = eCompacto;
        if (eCompacto) {
          setPainelDireitoAberto(false);
          setPainelEsquerdoAberto(true);
        } else {
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

  // Fechamento suave de modais com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFecharModais();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Manipulador de Scroll (Wheel) para transição de slides (0 a 4)
  const handleWheel = (e) => {
    if (telaAtiva !== 'inicio' || cyberFade) return;

    const agora = Date.now();
    if (agora - lastScrollTimeRef.current < 750) return;

    if (e.deltaY > 0) {
      if (secaoAtiva < 4) {
        setSecaoAtiva(prev => prev + 1);
        lastScrollTimeRef.current = agora;
      }
    } else if (e.deltaY < 0) {
      if (secaoAtiva > 0) {
        setSecaoAtiva(prev => prev - 1);
        lastScrollTimeRef.current = agora;
      }
    }
  };

  // Manipuladores de Gestos Táteis para Mobile
  const handleTouchStart = (e) => {
    if (telaAtiva !== 'inicio' || cyberFade) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (telaAtiva !== 'inicio' || cyberFade) return;

    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartYRef.current - touchEndY;
    const agora = Date.now();

    if (Math.abs(diffY) > 40 && agora - lastScrollTimeRef.current < 750) return;

    if (Math.abs(diffY) > 40) {
      if (diffY > 0) {
        if (secaoAtiva < 4) {
          setSecaoAtiva(prev => prev + 1);
          lastScrollTimeRef.current = agora;
        }
      } else {
        if (secaoAtiva > 0) {
          setSecaoAtiva(prev => prev - 1);
          lastScrollTimeRef.current = agora;
        }
      }
    }
  };

  // 1. CARREGAMENTO INICIAL DE ESTATÍSTICAS
  useEffect(() => {
    const carregarEstatisticas = async () => {
      try {
        const resStats = await fetch(`${API_URL}/api/estatisticas`);
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setEstatisticas(dataStats);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas orbitais:", err);
      }
    };
    carregarEstatisticas();
  }, []);

  // 2. CARREGAMENTO REATIVO DE OBJETOS COM BASE NAS 4 CATEGORIAS
  useEffect(() => {
    const carregarObjetosFiltrados = async () => {
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

        // Carga padrão calibrada para 1.000 objetos para demonstrar densidade realista
        let url = `${API_URL}/api/objetos?limit=1000`;

        if (ativas.length === 1) {
          url += `&categoria_id=${ativas[0]}`;
        }

        const resObjs = await fetch(url);
        if (resObjs.ok) {
          const dataObjs = await resObjs.json();
          setObjetos(dataObjs);
        }
      } catch (err) {
        console.error("Erro ao carregar objetos orbitais:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarObjetosFiltrados();
  }, [categoriasAtivas]);

  // 3. BUSCA DE SATÉLITES COM DEBOUNCE
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
        console.error("Erro na busca de satélites:", err);
      }
    };

    const delayDebounce = setTimeout(buscarObjetosAPI, 300);
    return () => clearTimeout(delayDebounce);
  }, [busca]);

  // FUNÇÕES AUXILIARES DE RENDERIZAÇÃO DA TRILHA ORBITAL EM CINZA
  const desenharTrilhaOrbital = (viewerInstance, tle) => {
    if (!viewerInstance || !tle || !tle.linha1 || !tle.linha2 || telaAtivaRef.current !== 'simulador') return;

    try {
      // Remover órbita anterior se existente
      if (orbitaEntidadeRef.current) {
        viewerInstance.entities.remove(orbitaEntidadeRef.current);
        orbitaEntidadeRef.current = null;
      }

      const pontos = gerarPontosOrbita(tle.linha1, tle.linha2, new Date(), 120);
      if (!pontos || pontos.length < 10) return;

      const entidadeOrbita = viewerInstance.entities.add({
        id: 'trilha-orbital-dinamica',
        polyline: {
          positions: pontos,
          width: 2.0,
          material: new window.Cesium.Color(0.82, 0.86, 0.92, 0.75), // Cinza prateado translúcido
          arcType: window.Cesium.ArcType.NONE,
          loop: true
        }
      });

      orbitaEntidadeRef.current = entidadeOrbita;
    } catch (e) {
      console.warn("Falha ao traçar polilinha da órbita:", e);
    }
  };

  const limparTrilhaOrbital = (viewerInstance) => {
    if (!viewerInstance) return;
    try {
      if (orbitaEntidadeRef.current) {
        viewerInstance.entities.remove(orbitaEntidadeRef.current);
        orbitaEntidadeRef.current = null;
      }
    } catch (e) { }
  };

  // 4. INICIALIZAÇÃO DO GLOBO CESIUM 3D E EVENTOS DE HOVER COM TRILHA
  useEffect(() => {
    if (!window.Cesium) return;

    const viewerInstance = new window.Cesium.Viewer('cesium-container', {
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
      baseLayer: false
    });

    viewerInstance.scene.globe.enableLighting = true;
    viewerInstance.scene.globe.showAtmosphere = true;
    viewerInstance.scene.globe.atmosphereLightIntensity = 1.3;
    viewerInstance.scene.globe.depthTestAgainstTerrain = false;

    // Provedor ArcGIS fotorrealista com fallback NaturalEarthII
    if (window.Cesium.ArcGisMapServerImageryProvider && window.Cesium.ArcGisMapServerImageryProvider.fromUrl) {
      window.Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      ).then(provider => {
        if (viewerInstance && !viewerInstance.isDestroyed()) {
          viewerInstance.imageryLayers.addImageryProvider(provider);
        }
      }).catch(() => {
        try {
          const provider = new window.Cesium.TileMapServiceImageryProvider({
            url: window.Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          });
          viewerInstance.imageryLayers.addImageryProvider(provider);
        } catch (e) { }
      });
    }

    setViewer(viewerInstance);

    // Manipulador de Clique no Globo (Seleção)
    const clickHandler = new window.Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas);
    clickHandler.setInputAction((click) => {
      if (telaAtivaRef.current !== 'simulador') return;
      const pickedObject = viewerInstance.scene.pick(click.position);
      if (window.Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const entity = pickedObject.id;
        const satData = entity.properties.getValue(window.Cesium.JulianDate.now());
        satSelecionadoRef.current = satData;
        handleSelecionarSat(satData);

        // Traçar e fixar a órbita no Cesium
        if (satData && satData.ultimo_tle) {
          desenharTrilhaOrbital(viewerInstance, satData.ultimo_tle);
        }

        // Focar a câmera
        const rangeDist = 3500000.0; // 3.500 km
        entidadeFocadaRef.current = null;
        viewerInstance.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
        viewerInstance.trackedEntity = undefined;

        viewerInstance.flyTo(entity, {
          duration: 1.5,
          offset: new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(0.0),
            window.Cesium.Math.toRadians(-72.0),
            rangeDist
          )
        }).then((completed) => {
          if (completed && viewerInstance && !viewerInstance.isDestroyed()) {
            const time = viewerInstance.clock.currentTime;
            const position = entity.position.getValue(time);
            if (position) {
              const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
              const initialOffset = new window.Cesium.HeadingPitchRange(
                window.Cesium.Math.toRadians(0.0),
                window.Cesium.Math.toRadians(-72.0),
                rangeDist
              );
              viewerInstance.camera.lookAtTransform(transform, initialOffset);
              entidadeFocadaRef.current = entity;
            }
          }
        });
      } else {
        // Clicar no espaço vazio deseleciona
        satSelecionadoRef.current = null;
        setSatSelecionado(null);
        setParametrosOrbitaisSat(null);
        limparTrilhaOrbital(viewerInstance);

        if (viewerInstance) {
          entidadeFocadaRef.current = null;
          viewerInstance.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
          viewerInstance.trackedEntity = undefined;
          viewerInstance.camera.flyTo({
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

    // Manipulador de Hover do Mouse (Gera trilha orbital dinamicamente sob o cursor)
    let lastHoveredEntity = null;
    const hoverHandler = new window.Cesium.ScreenSpaceEventHandler(viewerInstance.scene.canvas);
    const tooltipEl = document.getElementById('hud-tooltip');

    hoverHandler.setInputAction((movement) => {
      if (telaAtivaRef.current !== 'simulador') {
        viewerInstance.scene.canvas.style.cursor = 'default';
        if (tooltipEl) tooltipEl.style.display = 'none';
        return;
      }
      const pickedObject = viewerInstance.scene.pick(movement.endPosition);

      if (window.Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
        const entity = pickedObject.id;
        const satData = entity.properties.getValue(window.Cesium.JulianDate.now());
        viewerInstance.scene.canvas.style.cursor = 'pointer';

        if (lastHoveredEntity !== entity) {
          // Restaurar estilo anterior
          if (lastHoveredEntity) {
            try {
              const lastSat = lastHoveredEntity.properties.getValue(window.Cesium.JulianDate.now());
              const catId = Number(lastSat.categoria_id);
              lastHoveredEntity.point.pixelSize = catId === 4 ? 10 : 7;
              lastHoveredEntity.point.outlineColor = window.Cesium.Color.BLACK;
              lastHoveredEntity.point.outlineWidth = 1.5;
            } catch (e) { }
          }

          lastHoveredEntity = entity;
          satHoverIdRef.current = satData.norad_id;

          // Realçar ponto sob hover
          try {
            const currentSize = entity.point.pixelSize.getValue();
            entity.point.pixelSize = currentSize + 4;
            entity.point.outlineColor = window.Cesium.Color.WHITE;
            entity.point.outlineWidth = 2.5;
          } catch (e) { }

          // Traçar a órbita no Cesium sob hover caso o satélite não seja o já selecionado
          if (satData && satData.ultimo_tle) {
            desenharTrilhaOrbital(viewerInstance, satData.ultimo_tle);
          }
        }

        // Construir Tooltip Didático Completo no DOM sem innerHTML
        if (tooltipEl && satData) {
          const catId = Number(satData.categoria_id);
          const corCat = CORES_CATEGORIAS[catId] || '#00ff66';

          // Calcular parâmetros astrodinâmicos em tempo real para o tooltip
          let paramsHover = null;
          if (satData.ultimo_tle) {
            paramsHover = calcularParametrosOrbitais(satData.ultimo_tle.linha1, satData.ultimo_tle.linha2);
          }

          tooltipEl.textContent = '';

          // Cabeçalho
          const headerDiv = document.createElement('div');
          headerDiv.className = 'tooltip-header';
          headerDiv.style.borderLeft = `3px solid ${corCat}`;

          const dotSpan = document.createElement('span');
          dotSpan.className = 'tooltip-dot';
          dotSpan.style.backgroundColor = corCat;

          const nameSpan = document.createElement('span');
          nameSpan.className = 'tooltip-name';
          nameSpan.textContent = satData.nome;

          headerDiv.appendChild(dotSpan);
          headerDiv.appendChild(nameSpan);

          // Corpo com telemetria
          const bodyDiv = document.createElement('div');
          bodyDiv.className = 'tooltip-body';

          const criarLinha = (rotulo, valor, corDestaque = null) => {
            const linha = document.createElement('div');
            linha.className = 'tooltip-line';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'tooltip-label';
            labelSpan.textContent = rotulo;
            const valSpan = document.createElement('span');
            valSpan.className = 'tooltip-value';
            if (corDestaque) valSpan.style.color = corDestaque;
            valSpan.textContent = valor;
            linha.appendChild(labelSpan);
            linha.appendChild(valSpan);
            return linha;
          };

          bodyDiv.appendChild(criarLinha('NORAD ID: ', `#${satData.norad_id}`));
          bodyDiv.appendChild(criarLinha('PAÍS: ', satData.pais || 'Desconhecido'));
          bodyDiv.appendChild(criarLinha('CATEGORIA: ', satData.categoria?.nome || 'Satélite', corCat));

          if (paramsHover) {
            bodyDiv.appendChild(criarLinha('ALTITUDE: ', `${paramsHover.altitudeInstantaneaKm.toLocaleString('pt-BR')} km (${paramsHover.regimeCodigo})`, '#00f0ff'));
            bodyDiv.appendChild(criarLinha('VELOCIDADE: ', `${paramsHover.velocidadeKmH.toLocaleString('pt-BR')} km/h`));
            bodyDiv.appendChild(criarLinha('PERÍODO: ', `${paramsHover.periodoMinutos} min / volta`));
          }

          tooltipEl.appendChild(headerDiv);
          tooltipEl.appendChild(bodyDiv);

          tooltipEl.style.display = 'block';
          tooltipEl.style.left = `${movement.endPosition.x + 15}px`;
          tooltipEl.style.top = `${movement.endPosition.y + 15}px`;
        }

      } else {
        viewerInstance.scene.canvas.style.cursor = 'default';

        if (lastHoveredEntity) {
          try {
            const lastSat = lastHoveredEntity.properties.getValue(window.Cesium.JulianDate.now());
            const catId = Number(lastSat.categoria_id);
            lastHoveredEntity.point.pixelSize = catId === 4 ? 10 : 7;
            lastHoveredEntity.point.outlineColor = window.Cesium.Color.BLACK;
            lastHoveredEntity.point.outlineWidth = 1.5;
          } catch (e) { }
          lastHoveredEntity = null;
          satHoverIdRef.current = null;

          // Restaura a órbita do satélite selecionado se houver, senão remove a trilha
          const satAtivo = satSelecionadoRef.current;
          if (satAtivo && satAtivo.ultimo_tle) {
            desenharTrilhaOrbital(viewerInstance, satAtivo.ultimo_tle);
          } else {
            limparTrilhaOrbital(viewerInstance);
          }
        }

        if (tooltipEl) {
          tooltipEl.style.display = 'none';
        }
      }
    }, window.Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Acompanhamento do objeto focado no preRender
    const removerPreRender = viewerInstance.scene.preRender.addEventListener((scene, time) => {
      if (entidadeFocadaRef.current && viewerInstance && !viewerInstance.isDestroyed()) {
        try {
          const entity = entidadeFocadaRef.current;
          const position = entity.position.getValue(time);
          if (position) {
            const transform = window.Cesium.Transforms.eastNorthUpToFixedFrame(position);
            viewerInstance.camera.lookAtTransform(transform);
          }
        } catch (e) { }
      }
    });

    return () => {
      removerPreRender();
      clickHandler.destroy();
      hoverHandler.destroy();
      if (viewerInstance && !viewerInstance.isDestroyed()) {
        viewerInstance.destroy();
      }
      setViewer(null);
    };
  }, []);

  // Redimensionamento responsivo do Cesium
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const handleResize = () => {
      try {
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
        }
      } catch (e) { }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewer]);

  // 5. PROPAGAÇÃO EM TEMPO REAL SGP4 E PLOTAGEM DAS 4 CATEGORIAS NO CESIUM
  useEffect(() => {
    if (!viewer || objetos.length === 0) return;

    const limparEntidades = () => {
      try {
        if (viewer && !viewer.isDestroyed() && viewer.entities) {
          entitiesRef.current.forEach((entity) => {
            try {
              viewer.entities.remove(entity);
            } catch (e) { }
          });
        }
      } catch (e) { }
      entitiesRef.current.clear();
    };

    limparEntidades();

    const satelitesFiltrados = objetos.filter(sat => {
      const catId = Number(sat.categoria_id);
      const isAtiva = (catId in categoriasAtivas) && categoriasAtivas[catId];
      return isAtiva && sat.ultimo_tle;
    });

    satelitesFiltrados.forEach(sat => {
      try {
        const catId = Number(sat.categoria_id);
        const corHex = CORES_CATEGORIAS[catId] || '#00ff66';

        if (viewer.entities.getById(sat.norad_id)) return;

        const entity = viewer.entities.add({
          id: sat.norad_id,
          name: sat.nome,
          show: telaAtivaRef.current === 'simulador',
          position: new window.Cesium.CallbackProperty((time, result) => {
            try {
              const tle = sat.ultimo_tle;
              if (!tle) return undefined;

              const dataAtual = window.Cesium.JulianDate.toDate(time);
              const gmst = satellite.gstime(dataAtual);

              const satrec = satellite.twoline2satrec(tle.linha1, tle.linha2);
              const posAndVel = satellite.propagate(satrec, dataAtual);
              const posEci = posAndVel.position;

              if (posEci) {
                const posGd = satellite.eciToGeodetic(posEci, gmst);
                let longitude = satellite.degreesLong(posGd.longitude);
                let latitude = satellite.degreesLat(posGd.latitude);
                let altitude = posGd.height * 1000;

                // Jitter determinístico para evitar sobreposição perfeita
                const idNum = parseInt(sat.norad_id, 10) || 0;
                const desvioRaio = 0.06;
                const angulo = idNum * 1.7;
                longitude += Math.cos(angulo) * desvioRaio;
                latitude += Math.sin(angulo) * desvioRaio;
                altitude += (idNum % 7) * 3000;

                return window.Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude, undefined, result);
              }
            } catch (e) { }
            return undefined;
          }, false),
          point: {
            pixelSize: catId === 4 ? 10 : catId === 2 ? 6 : 7,
            color: window.Cesium.Color.fromCssColorString(corHex),
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: 1.5,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          properties: sat
        });

        entitiesRef.current.set(sat.norad_id, entity);
      } catch (err) {
        console.warn("Erro ao plotar satélite:", sat.nome, err);
      }
    });

    return () => limparEntidades();
  }, [objetos, categoriasAtivas, viewer]);

  // Sincroniza a visibilidade de todos os objetos orbitais com a tela ativa:
  // - Ocultos na tela principal (deixando apenas o globo terrestre puro no fundo)
  // - Visíveis apenas quando o simulador de monitoramento é acionado
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !viewer.entities) return;
    const mostrarObjetos = (telaAtiva === 'simulador');
    entitiesRef.current.forEach((entity) => {
      try {
        entity.show = mostrarObjetos;
      } catch (e) { }
    });
    if (!mostrarObjetos) {
      limparTrilhaOrbital(viewer);
      const tooltipEl = document.getElementById('hud-tooltip');
      if (tooltipEl) tooltipEl.style.display = 'none';
    }
  }, [telaAtiva, viewer]);

  // 6. SELEÇÃO E CÁLCULO FÍSICO DO SATÉLITE
  const handleSelecionarSat = (sat) => {
    satSelecionadoRef.current = sat;
    setSatSelecionado(sat);
    setPainelDireitoAberto(true);

    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(false);
    }

    if (sat && sat.ultimo_tle) {
      const params = calcularParametrosOrbitais(sat.ultimo_tle.linha1, sat.ultimo_tle.linha2);
      setParametrosOrbitaisSat(params);
      if (viewer) {
        desenharTrilhaOrbital(viewer, sat.ultimo_tle);
      }
    } else {
      setParametrosOrbitaisSat(null);
    }
  };

  const handleDesfocarCamera = () => {
    if (!viewer) return;

    entidadeFocadaRef.current = null;
    viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    viewer.trackedEntity = undefined;
    satSelecionadoRef.current = null;
    setSatSelecionado(null);
    setParametrosOrbitaisSat(null);
    limparTrilhaOrbital(viewer);

    setPainelDireitoAberto(false);
    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(true);
    }

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
    setCategoriasAtivas(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleIniciarMonitoramento = () => {
    setCyberFade(true);
    setTimeout(() => {
      setTelaAtiva('simulador');
      setCyberFade(false);
      setModalTutorialAberto(true);
    }, 600);
  };

  // Contadores dinâmicos de categorias para os dashboards
  const obterContadoresCategorias = () => {
    if (!estatisticas || !estatisticas.distribuicao_paises) {
      return { ativos: 5293, inativos: 257, detritos: 766, estacoes: 20, total: 6336 };
    }

    let ativos = 0;
    let inativos = 0;
    let detritos = 0;
    let estacoes = 0;

    estatisticas.distribuicao_paises.forEach(p => {
      ativos += (p.ativos || 0);
      inativos += (p.inativos || 0);
      detritos += (p.detritos || 0);
      estacoes += (p.estacoes || 0);
    });

    return {
      ativos,
      inativos,
      detritos,
      estacoes,
      total: ativos + inativos + detritos + estacoes
    };
  };

  const calcularObjetosNoRadar = () => {
    const contadores = obterContadoresCategorias();
    let soma = 0;
    if (categoriasAtivas[1]) soma += contadores.ativos;
    if (categoriasAtivas[2]) soma += contadores.inativos;
    if (categoriasAtivas[3]) soma += contadores.detritos;
    if (categoriasAtivas[4]) soma += contadores.estacoes;
    return soma;
  };

  // Ficha factual do satélite selecionado
  const fichaFactual = useMemo(() => {
    if (!satSelecionado) return null;
    return obterFichaFactual(satSelecionado, parametrosOrbitaisSat);
  }, [satSelecionado, parametrosOrbitaisSat]);

  return (
    <div className="app-container" ref={containerRef}>
      {/* 3D GLOBE BACKDROP (CESIUM) */}
      <div id="cesium-container" className="cesium-container"></div>

      {/* TELA INICIAL CINEMATOGRÁFICA (ESTÉTICA EDOLUS & MOONSWORTH) */}
      {(telaAtiva === 'inicio' || cyberFade) && (
        <div className={`welcome-screen ${cyberFade ? 'fade-out-cyber' : ''}`}>
          {/* BARRA SUPERIOR MINIMALISTA (ESTILO MOONSWORTH) */}
          <nav className="cinema-navbar">
            <div className="cinema-nav-left">
              <h1 className="cinema-brand">
                ORBITAL<span>ED</span>
              </h1>
            </div>

            <div className="cinema-nav-center">
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 0 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(0)}
              >
                INÍCIO
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 1 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(1)}
              >
                SOBRE
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 2 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(2)}
              >
                RECURSOS
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 3 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(3)}
              >
                SUSTENTABILIDADE
              </button>
              <button
                type="button"
                className={`cinema-nav-link ${secaoAtiva === 4 ? 'active' : ''}`}
                onClick={() => handleMudarSecao(4)}
              >
                GLOSSÁRIO
              </button>
            </div>

            <div className="cinema-nav-right">
              <button
                type="button"
                className="cinema-planet-btn"
                onClick={handleIniciarMonitoramento}
                aria-label="Acessar Monitoramento Orbital"
                title="Acessar Monitoramento Orbital"
              >
                <Globe size={20} className="cinema-planet-icon" />
                <span className="planet-btn-halo"></span>
              </button>
            </div>
          </nav>

          {/* SETAS LATERAIS MINIMALISTAS DIGITAIS */}
          <button
            type="button"
            className="cinema-side-nav prev"
            onClick={() => handleMudarSecao((secaoAtiva - 1 + 5) % 5)}
            aria-label="Anterior"
            title="Seção anterior"
          >
            <ChevronLeft size={46} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="cinema-side-nav next"
            onClick={() => handleMudarSecao((secaoAtiva + 1) % 5)}
            aria-label="Próximo"
            title="Próxima seção"
          >
            <ChevronRight size={46} strokeWidth={2.2} />
          </button>

          {/* CONTEÚDO PRINCIPAL DINÂMICO */}
          {(secaoAtiva === 0 || saindoVisaoGeral) && (
            /* SEÇÃO 0: HERO CINEMATOGRÁFICO ABERTO (FOTO 1 - EDOLUS) */
            <div className={`cinema-hero-view ${saindoVisaoGeral ? 'fade-out-hero' : ''}`}>
              <div className="cinema-cross c-tl">+</div>
              <div className="cinema-cross c-tr">+</div>
              <div className="cinema-cross c-bl">+</div>
              <div className="cinema-cross c-br">+</div>

              <div className="cinema-hero-center">
                <h1 className="cinema-hero-title">
                  MONITORAMENTO ORBITAL<br />
                  EM ESCALA PLANETÁRIA
                </h1>

                <p className="cinema-hero-subtitle">
                  SISTEMA COMPUTACIONAL DE RASTREIO ORBITAL, TELEMETRIA FÍSICA E SUSTENTABILIDADE ESPACIAL.
                </p>

                <div className="cinema-btn-container">
                  <button
                    type="button"
                    className="cinema-bracket-btn"
                    onClick={handleIniciarMonitoramento}
                  >
                    <span className="bracket-mark b-tl"></span>
                    <span className="bracket-mark b-tr"></span>
                    <span className="bracket-mark b-bl"></span>
                    <span className="bracket-mark b-br"></span>
                    <span className="bracket-btn-label">INICIAR MONITORAMENTO</span>
                  </button>
                </div>
              </div>

              <div className="cinema-hero-footer">
                <span className="cinema-footer-indicator">ASTRODINÂMICA COMPUTACIONAL SGP4 · CATÁLOGO NORAD SPACE-TRACK</span>
              </div>
            </div>
          )}

          {(secaoAtiva > 0 || fechandoVisor) && (
            /* SEÇÕES 1, 2 e 3: VISOR TÁTICO ESTILO GLASS PAD */
            <div className={`cinema-tactical-view ${fechandoVisor ? 'fechando' : ''}`}>
              <div
                className={`tactical-visor-frame ${aberturaCentro ? 'anim-abertura-centro' : ''} ${fechandoVisor ? 'anim-fechamento-centro' : ''}`}
                style={{ height: visorHeight ? `${visorHeight}px` : undefined }}
              >
                <div ref={visorInnerRef} className="tactical-visor-inner">
                  {/* Título Centralizado e Limpo */}
                  <div className="tactical-visor-header">
                    <h2 className="tactical-tag-title" key={secaoVisorExibida}>
                      {secaoVisorExibida === 1 && "SOBRE O PROJETO & DIRETRIZES DO SISTEMA"}
                      {secaoVisorExibida === 2 && "RECURSOS TECNOLÓGICOS DO SISTEMA"}
                      {secaoVisorExibida === 3 && "SUSTENTABILIDADE ESPACIAL & IMPACTO PLANETÁRIO"}
                      {secaoVisorExibida === 4 && "GLOSSÁRIO ASTRODINÂMICO DIDÁTICO"}
                    </h2>
                  </div>

                  {/* Corpo do Visor Aberto com Conteúdo Reativo */}
                  <div className={`tactical-visor-body ${emTransicao ? 'em-transicao' : ''}`} key={secaoVisorExibida}>
                    {secaoVisorExibida === 1 && (
                      <div className="tactical-about-container">
                        <div className="tactical-about-grid">
                          <div className="tactical-about-card">
                            <div className="about-card-header">
                              <div className="about-icon-box about-icon-cyan">
                                <Globe size={18} />
                              </div>
                              <h3 className="about-card-title">Missão & Propósito Pedagógico</h3>
                            </div>
                            <p className="about-card-lead">
                              O <strong>OrbitalED</strong> foi concebido para transformar dados aeroespaciais brutos em uma experiência viva de aprendizado visual, interativo e intuitivo.
                            </p>
                            <ul className="about-card-list">
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Democratização Científica:</strong> Elimina a abstração matemática através de visualização orbital 3D vetorial em tempo real.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Consciência Planetária:</strong> Evidencia a urgência na mitigação de detritos e na sustentabilidade do tráfego espacial na órbita terrestre baixa.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-about-card highlight-card">
                            <div className="about-card-header">
                              <div className="about-icon-box about-icon-amber">
                                <Database size={18} />
                              </div>
                              <h3 className="about-card-title">Censo Global vs. Telemetria Ativa</h3>
                            </div>
                            <p className="about-card-lead">
                              O sistema opera em uma estrutura de dados de 3 camadas com propósitos e calibragens complementares:
                            </p>
                            <ul className="about-card-list">
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Censo Geral (35.000+ Objetos):</strong> Todo objeto rastreado por radar militar (&gt;10 cm), incluindo mais de 15.000 fragmentos anônimos sem telemetria operacional.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Dossiê Local (~6.300 Objetos):</strong> O banco de dados indexa apenas satélites e detritos históricos com dados ricos, identificação, operadora e função educacional.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Simulação 3D (1.000 Objetos):</strong> Amostragem vetorial calculada instantaneamente a 60 FPS via SGP4 no navegador para máxima fluidez.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-about-card">
                            <div className="about-card-header">
                              <div className="about-icon-box about-icon-cyan">
                                <Layers size={18} />
                              </div>
                              <h3 className="about-card-title">Fontes de Dados & Credibilidade</h3>
                            </div>
                            <p className="about-card-lead">
                              O projeto é fundamentado em dados astronômicos oficiais e públicos da comunidade aeroespacial internacional:
                            </p>
                            <ul className="about-card-list">
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>CelesTrak / Dr. T.S. Kelso:</strong> Distribuição de TLEs (Two-Line Elements — formato internacional em duas linhas com as coordenadas para calcular a órbita exata de qualquer objeto).</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Space-Track / US Space Force:</strong> Catálogo SATCAT gerado pela rede de radares do 18th Space Defense Squadron.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>NASA ODPO & ESA:</strong> Modelos e métricas de impacto ambiental, Síndrome de Kessler e descarte controlado de cargas.</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Barra Inferior com Métricas Chave do Projeto */}
                        <div className="tactical-about-metrics-bar">
                          <div className="about-metric-item">
                            <span className="about-metric-val">35.000+</span>
                            <span className="about-metric-lbl">Censo Global em Órbita</span>
                            <span className="about-metric-sub">Rastreado por Radar Terrestre</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">~6.300</span>
                            <span className="about-metric-lbl">Objetos no Banco Local</span>
                            <span className="about-metric-sub">Com Dossiê e TLE Completo</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">1.000</span>
                            <span className="about-metric-lbl">Propagação SGP4 3D</span>
                            <span className="about-metric-sub">Amostragem em Tempo Real a 60 FPS</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">100%</span>
                            <span className="about-metric-lbl">Dados Reais e Factual</span>
                            <span className="about-metric-sub">Alinhado a Padrões NORAD</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 2 && (
                      <div className="tactical-features-container">
                        <div className="tactical-features-grid">
                          <div className="tactical-feature-card">
                            <div className="feature-card-header">
                              <div className="about-icon-box about-icon-cyan">
                                <Compass size={18} />
                              </div>
                              <h3 className="tactical-feature-title">Trajetória Orbital Interativa</h3>
                            </div>
                            <p>
                              Renderização tridimensional fluida em WebGL com projeção contínua de elipses de trajetória e câmera inteligente que viaja junto com o satélite.
                            </p>
                            <ul className="tactical-feature-specs">
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Traçado sob o Cursor:</strong> Passe o mouse sobre qualquer objeto para visualizar o desenho de sua órbita completa no espaço.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Câmera de Perseguição:</strong> Clique no satélite para travar a visão e acompanhar sua rotação em sincronia com a Terra.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Visão Panorâmica:</strong> Rotacione o planeta livremente para compreender a densidade de objetos e constelações.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-feature-card highlight-green">
                            <div className="feature-card-header">
                              <div className="about-icon-box about-icon-green">
                                <Activity size={18} />
                              </div>
                              <h3 className="tactical-feature-title">Telemetria Física em Tempo Real</h3>
                            </div>
                            <p>
                              Cálculo contínuo da posição exata de cada satélite via modelo astrodinâmico SGP4, projetando altitude, velocidade e coordenadas diretamente sobre o globo 3D da Terra.
                            </p>
                            <ul className="tactical-feature-specs">
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Dinâmica Orbital:</strong> Altitude em quilômetros, velocidade instantânea (km/h e km/s) e tempo para completar uma volta.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Regimes Orbitais:</strong> Classificação didática em LEO (órbita baixa), MEO (média) e GEO (geoestacionária).</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Pontos Críticos:</strong> Apogeu (ponto mais alto), perigeu (ponto mais baixo) e ângulo de inclinação do satélite.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-feature-card">
                            <div className="feature-card-header">
                              <div className="about-icon-box about-icon-cyan">
                                <BookOpen size={18} />
                              </div>
                              <h3 className="tactical-feature-title">Dossiês Fatuais & Busca Tática</h3>
                            </div>
                            <p>
                              Enciclopédia orbital integrada que conecta cada ponto luminoso à sua história real, com busca por nome ou código NORAD e filtros por categoria.
                            </p>
                            <ul className="tactical-feature-specs">
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Busca Instantânea:</strong> Localize qualquer objeto pelo nome (ex: Hubble, ISS, Starlink) ou pelo número oficial NORAD.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Dossiê Pedagógico:</strong> País de origem, ano de lançamento, objetivo da missão e relevância na exploração espacial.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Filtros por Categoria:</strong> Isole satélites ativos, desativados, detritos perigosos ou estações espaciais habitadas.</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* CARTÃO FULL-WIDTH: STACK TECNOLÓGICA COMPLETA DO SISTEMA */}
                        <div className="tactical-stack-card">
                          <div className="tactical-stack-header">
                            <div className="stack-header-left">
                              <Cpu size={18} className="stack-icon" />
                              <h3 className="tactical-stack-title">ARQUITETURA & STACK TECNOLÓGICA DO PROJETO</h3>
                            </div>
                            <span className="tactical-stack-badge">SISTEMA FULL-STACK INTEGRADO</span>
                          </div>

                          <div className="tactical-stack-grid">
                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">FRONTEND & MOTOR 3D</h4>
                              </div>
                              <div className="tech-tags-list">
                                <span className="tech-tag">React 19</span>
                                <span className="tech-tag">Vite 8</span>
                                <span className="tech-tag">CesiumJS (WebGL / WGS84)</span>
                                <span className="tech-tag">Satellite.js (SGP4/SDP4)</span>
                                <span className="tech-tag">Lucide Icons</span>
                              </div>
                              <p className="pod-desc">Interface reativa de alto desempenho, renderização geoespacial 3D e cálculo vetorial propagado no navegador.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-amber"></span>
                                <h4 className="pod-title">BACKEND & APIs</h4>
                              </div>
                              <div className="tech-tags-list">
                                <span className="tech-tag">Python 3.11</span>
                                <span className="tech-tag">FastAPI</span>
                                <span className="tech-tag">Uvicorn (ASGI)</span>
                                <span className="tech-tag">APScheduler</span>
                                <span className="tech-tag">HTTPX Async</span>
                              </div>
                              <p className="pod-desc">API REST assíncrona de baixa latência, responsável pela ingestão de catálogos e orquestração de tarefas em background.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-purple"></span>
                                <h4 className="pod-title">DADOS & ASTRODINÂMICA</h4>
                              </div>
                              <div className="tech-tags-list">
                                <span className="tech-tag">PostgreSQL 16</span>
                                <span className="tech-tag">SQLAlchemy 2.0</span>
                                <span className="tech-tag">Asyncpg</span>
                                <span className="tech-tag">CelesTrak / Space-Track</span>
                                <span className="tech-tag">Modelagem TLE</span>
                              </div>
                              <p className="pod-desc">Persistência relacional de efemérides com sincronização contínua de catálogos orbitais oficiais do USSPACECOM/NORAD.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-green"></span>
                                <h4 className="pod-title">DEVOPS & INFRAESTRUTURA</h4>
                              </div>
                              <div className="tech-tags-list">
                                <span className="tech-tag">Docker</span>
                                <span className="tech-tag">Docker Compose</span>
                                <span className="tech-tag">Nginx Reverse Proxy</span>
                                <span className="tech-tag">Healthchecks</span>
                                <span className="tech-tag">Volumes Persistentes</span>
                              </div>
                              <p className="pod-desc">Arquitetura modular conteinerizada com isolamento de serviços, rede interna dedicada e alta reprodutibilidade.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 3 && (
                      <div className="tactical-sustainability-section">
                        <div className="sustainability-pillars-grid">
                          <div className="sustainability-card card-kessler">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-kessler">
                                <ShieldAlert size={18} />
                              </div>
                              <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.kessler.titulo}</h4>
                            </div>
                            <p className="s-card-text">{DADOS_SUSTENTABILIDADE.kessler.fatoChave}</p>
                            <span className="s-stat-badge badge-kessler">{DADOS_SUSTENTABILIDADE.kessler.densidadeCriticaFaixa}</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-red"></span>
                              <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.kessler.historicoImpacto}</p>
                            </div>
                          </div>

                          <div className="sustainability-card card-reentry">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-reentry">
                                <Flame size={18} />
                              </div>
                              <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.reentrada.titulo}</h4>
                            </div>
                            <p className="s-card-text">{DADOS_SUSTENTABILIDADE.reentrada.fatoChave}</p>
                            <span className="s-stat-badge badge-reentry">Sobrevivência: {DADOS_SUSTENTABILIDADE.reentrada.sobrevivenciaPercentual}</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-orange"></span>
                              <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.reentrada.zonaDescarte}</p>
                            </div>
                          </div>

                          <div className="sustainability-card card-magneto">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-magneto">
                                <Zap size={18} />
                              </div>
                              <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.magnetosfera.titulo}</h4>
                            </div>
                            <p className="s-card-text">{DADOS_SUSTENTABILIDADE.magnetosfera.mecanismo}</p>
                            <span className="s-stat-badge badge-magneto">Ref: {DADOS_SUSTENTABILIDADE.magnetosfera.pesquisaReferencia}</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-cyan"></span>
                              <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.magnetosfera.riscoCientifico}</p>
                            </div>
                          </div>

                          <div className="sustainability-card card-climate">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-climate">
                                <Wind size={18} />
                              </div>
                              <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.climaEOzonio.titulo}</h4>
                            </div>
                            <p className="s-card-text">{DADOS_SUSTENTABILIDADE.climaEOzonio.fatoChave}</p>
                            <span className="s-stat-badge badge-climate">Catalisador: Al2O3 Estratosférico</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-purple"></span>
                              <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.climaEOzonio.impactoLancamento}</p>
                            </div>
                          </div>
                        </div>

                        <div className="tactical-table-box">
                          <div className="tactical-table-header">
                            <div className="tactical-table-title-group">
                              <AlertTriangle size={14} className="tactical-table-icon" />
                              <span>CENSO DE RESPONSABILIDADE GEOPOLÍTICA E DETRITOS CATALOGADOS</span>
                            </div>
                            <span className="tactical-table-source">CATÁLOGO NORAD SPACE-TRACK / NASA ODPO</span>
                          </div>
                          <table className="tactical-table">
                            <thead>
                              <tr>
                                <th className="th-nation">NAÇÃO / BLOCO</th>
                                <th className="th-debris">DETRITOS OFICIAIS</th>
                                <th className="th-inactive">INATIVOS</th>
                                <th className="th-active">ATIVOS</th>
                                <th className="th-risk">RISCO AMBIENTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="nation-cell"><span>Rússia</span></td>
                                <td className="cell-num-debris">4.961</td>
                                <td className="cell-num-inactive">1.328</td>
                                <td className="cell-num-active">386</td>
                                <td><span className="risk-badge risk-extreme"><span className="risk-dot"></span>RISCO EXTREMO (KESSLER)</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>Estados Unidos</span></td>
                                <td className="cell-num-debris">4.686</td>
                                <td className="cell-num-inactive">853</td>
                                <td className="cell-num-active cell-num-highlight">12.874</td>
                                <td><span className="risk-badge risk-critical"><span className="risk-dot"></span>RISCO CRÍTICO (DENSIDADE)</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>China</span></td>
                                <td className="cell-num-debris">4.525</td>
                                <td className="cell-num-inactive">77</td>
                                <td className="cell-num-active">1.500</td>
                                <td><span className="risk-badge risk-moderate"><span className="risk-dot"></span>RISCO ELEVADO</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>Reino Unido / Europa</span></td>
                                <td className="cell-num-debris">539</td>
                                <td className="cell-num-inactive">189</td>
                                <td className="cell-num-active">1.033</td>
                                <td><span className="risk-badge risk-controlled"><span className="risk-dot"></span>RISCO CONTROLADO</span></td>
                              </tr>
                              <tr>
                                <td className="nation-cell"><span>Brasil / Outros</span></td>
                                <td className="cell-num-debris cell-num-zero">0</td>
                                <td className="cell-num-inactive">9</td>
                                <td className="cell-num-active">14</td>
                                <td><span className="risk-badge risk-low"><span className="risk-dot"></span>SUSTENTÁVEL</span></td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="tactical-table-footer">
                            <Info size={14} className="tactical-table-footer-icon" />
                            <div className="tactical-table-footer-text">
                              <span className="tactical-table-footer-highlight">CENSO GLOBAL OFICIAL (35.000+ OBJETOS):</span> Dados consolidados via <strong>SATCAT Boxscore (CelesTrak / Space-Track / 18th Space Defense Squadron - US Space Force)</strong>. Representa a totalidade de objetos catalogados por radar em órbita terrestre.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 4 && (
                      <div className="tactical-glossary-section">
                        <div className="tactical-glossary-grid">
                          {GLOSSARIO_ORBITAL.map((categoria, idx) => (
                            <div key={idx} className="tactical-glossary-group">
                              <h3 className="tactical-group-title">{categoria.categoria}</h3>
                              <div className="tactical-terms-grid">
                                {categoria.itens.map((item, itemIdx) => (
                                  <div key={itemIdx} className="tactical-term-card">
                                    <div className="tactical-term-header">
                                      <span className="tactical-term-name">{item.termo}</span>
                                      <span className="tactical-term-sub">{item.titulo}</span>
                                    </div>
                                    <p className="tactical-term-desc">{item.definicao}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      )}

      {/* CONSOLE INTERATIVO DO SIMULADOR (HUD OVERLAY) */}
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
                STATUS: RASTREIO SGP4 EM TEMPO REAL
              </div>
            </div>

            {/* BOTÕES CENTRAIS DE FERRAMENTAS AMBIENTAIS NO HUD */}
            <div className="hud-tools-section">
              <button
                type="button"
                className={`hud-tool-btn ${modalTutorialAberto ? 'active' : ''}`}
                onClick={handleAbrirTutorial}
                title="Abrir Guia Rápido do Operador"
              >
                <Compass size={14} />
                <span>GUIA DO OPERADOR</span>
              </button>

              <button
                type="button"
                className={`hud-tool-btn ${modalSustentabilidadeAberto ? 'active' : ''}`}
                onClick={handleAbrirSustentabilidade}
              >
                <ShieldAlert size={14} />
                <span>SUSTENTABILIDADE & KESSLER</span>
              </button>

              <button
                type="button"
                className={`hud-tool-btn ${modalGlossarioAberto ? 'active' : ''}`}
                onClick={handleAbrirGlossario}
              >
                <BookOpen size={14} />
                <span>GLOSSÁRIO</span>
              </button>
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
                    style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                    onClick={() => { setBusca(''); setSugestoes([]); }}
                  />
                )}
              </div>

              {sugestoes.length > 0 && (
                <div className="search-suggestions">
                  {sugestoes.map((sat) => (
                    <div
                      key={sat.norad_id}
                      className="suggestion-item"
                      onClick={() => {
                        handleSelecionarSat(sat);
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

          {/* PAINÉIS LATERAIS FLUTUANTES (HUD) */}
          <div className="panels-container">

            {/* PAINEL ESQUERDO: MÉTRICAS E FILTROS */}
            <aside className={`hud-panel left-panel ${!painelEsquerdoAberto ? 'collapsed' : ''}`}>
              <div className="panel-header">
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
                {/* Total no Radar com distinção Catalogado vs Propagado 3D */}
                <div className="stat-card">
                  <div className="stat-label">Catálogo Orbital Monitorado</div>
                  <div className="stat-value">
                    {loading ? "---" : calcularObjetosNoRadar().toLocaleString('pt-BR')}
                    <span>OBJETOS</span>
                  </div>
                </div>

                {/* Filtros e Legenda das 4 Categorias */}
                <div className="legend-section">
                  <div className="legend-title">Filtros por Categoria</div>

                  {/* Satélites Ativos */}
                  <div
                    className={`legend-item ${categoriasAtivas[1] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(1)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[1] }}></span>
                      <span className="category-name">Satélites Ativos</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().ativos.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Satélites Inativos */}
                  <div
                    className={`legend-item ${categoriasAtivas[2] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(2)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[2] }}></span>
                      <span className="category-name">Satélites Inativos</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().inativos.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Detritos Espaciais */}
                  <div
                    className={`legend-item ${categoriasAtivas[3] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(3)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[3] }}></span>
                      <span className="category-name">Detritos Espaciais</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().detritos.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Estações Espaciais */}
                  <div
                    className={`legend-item ${categoriasAtivas[4] ? 'active' : ''}`}
                    onClick={() => handleAlternarCategoria(4)}
                  >
                    <div className="legend-info">
                      <span className="category-dot" style={{ backgroundColor: CORES_CATEGORIAS[4] }}></span>
                      <span className="category-name">Estações Espaciais</span>
                    </div>
                    <span className="category-count">
                      {loading ? "---" : obterContadoresCategorias().estacoes.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* DISTRIBUIÇÃO POR REGIME ORBITAL (LEO / MEO / GEO) */}
                <div className="legend-section regimes-section">
                  <div className="legend-title">Distribuição por Camada Orbital</div>

                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag leo-tag">LEO</span>
                      <span className="regime-name">Órbita Baixa (&lt; 2.000 km)</span>
                      <span className="regime-pct">88%</span>
                    </div>
                    <div className="regime-progress-track">
                      <div className="regime-progress-fill leo-fill" style={{ width: '88%' }}></div>
                    </div>
                  </div>

                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag meo-tag">MEO</span>
                      <span className="regime-name">Órbita Média (GPS/GNSS)</span>
                      <span className="regime-pct">5%</span>
                    </div>
                    <div className="regime-progress-track">
                      <div className="regime-progress-fill meo-fill" style={{ width: '5%' }}></div>
                    </div>
                  </div>

                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag geo-tag">GEO</span>
                      <span className="regime-name">Geoestacionária (~35.786 km)</span>
                      <span className="regime-pct">7%</span>
                    </div>
                    <div className="regime-progress-track">
                      <div className="regime-progress-fill geo-fill" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                </div>

                {/* TELEMETRIA MÉDIA DA FROTA GLOBAL */}
                <div className="legend-section fleet-telemetry-section">
                  <div className="legend-title">Telemetria Média da Frota</div>
                  <div className="fleet-metrics-row">
                    <div className="fleet-mini-metric">
                      <span className="fleet-metric-label">VEL. MÉDIA</span>
                      <span className="fleet-metric-val">27.400 km/h</span>
                    </div>
                    <div className="fleet-mini-metric">
                      <span className="fleet-metric-label">PROPAGADOR</span>
                      <span className="fleet-metric-val highlight">SGP4 / WGS84</span>
                    </div>
                  </div>
                </div>

                {/* Orientação Didática de Trajeto */}
                <div className="legend-section helper-section">
                  <div className="legend-title">Dica de Interação</div>
                  <p className="helper-text">
                    Passe o cursor sobre qualquer objeto para visualizar a órbita 3D em cinza translúcido. Clique para fixar a telemetria e o trajeto contínuo.
                  </p>
                </div>
              </div>
            </aside>

            {/* PAINEL DIREITO: FICHA FACTUAL E TELEMETRIA DIDÁTICA */}
            <aside className={`hud-panel right-panel ${!painelDireitoAberto ? 'collapsed' : ''} ${!satSelecionado ? 'empty-state' : ''}`}>
              <div className="panel-header">
                <button
                  type="button"
                  className="hud-toggle-btn-inline"
                  onClick={() => setPainelDireitoAberto(false)}
                  title="Recolher Painel"
                >
                  <ChevronRight size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="panel-title">Diagnóstico Orbital</h2>
                  <Compass size={16} className="panel-header-icon" />
                </div>
              </div>

              <div className="panel-content">
                {satSelecionado ? (
                  <div className="satellite-fiche">

                    {/* Cabeçalho da Ficha */}
                    <div className="fiche-header">
                      <h3 className="sat-title">{satSelecionado.nome}</h3>
                      <div className="sat-subtitle">NORAD CATALOG: #{satSelecionado.norad_id}</div>
                    </div>

                    {/* Badge da Categoria Oficial */}
                    <div className="mission-badge-container">
                      <span className="mission-label">CATEGORIA OFICIAL</span>
                      <div className="mission-badge" style={{
                        borderColor: CORES_CATEGORIAS[Number(satSelecionado.categoria_id)] || 'var(--neon-green)',
                        color: CORES_CATEGORIAS[Number(satSelecionado.categoria_id)] || 'var(--neon-green)',
                        backgroundColor: `${CORES_CATEGORIAS[Number(satSelecionado.categoria_id)] || '#00ff66'}15`
                      }}>
                        {satSelecionado.categoria?.nome || 'Satélite'}
                      </div>
                    </div>

                    {/* Grid de Metadados Básicos */}
                    <div className="fiche-grid">
                      <div className="grid-cell">
                        <span className="cell-label">País / Operador</span>
                        <span className="cell-value">{satSelecionado.pais}</span>
                      </div>
                      <div className="grid-cell">
                        <span className="cell-label">Ano de Lançamento</span>
                        <span className="cell-value">
                          {satSelecionado.data_lancamento
                            ? new Date(satSelecionado.data_lancamento).getFullYear()
                            : "Histórico"}
                        </span>
                      </div>
                      <div className="grid-cell" style={{ gridColumn: 'span 2' }}>
                        <span className="cell-label">Estado de Operação</span>
                        {(() => {
                          const statusLower = (satSelecionado.status || '').toLowerCase().trim();
                          const isInativo = statusLower === 'inativo' || statusLower.includes('inativ') || Number(satSelecionado.categoria_id) === 2;
                          const isAtivo = statusLower === 'ativo' || Number(satSelecionado.categoria_id) === 1 || Number(satSelecionado.categoria_id) === 4;
                          const corStatus = isInativo ? 'var(--neon-amber)' : isAtivo ? 'var(--neon-green)' : 'var(--neon-red)';
                          return (
                            <span className="cell-value" style={{ color: corStatus }}>
                              {satSelecionado.status.toUpperCase()}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* MÓDULO 100% DIDÁTICO: TELEMETRIA E PARÂMETROS FÍSICOS DE VOO */}
                    {parametrosOrbitaisSat && (
                      <div className="telemetry-dashboard-card">
                        <div className="telemetry-card-title">
                          <Activity size={14} className="telemetry-icon" />
                          <span>TELEMETRIA FÍSICA E PARÂMETROS DE VOO</span>
                        </div>

                        <div className="telemetry-metrics-grid">
                          {/* Altitude Instantânea */}
                          <div className="telemetry-metric-box highlight-metric">
                            <div className="metric-box-top-row">
                              <span className="metric-box-label">ALTITUDE INSTANTÂNEA</span>
                              <span className="metric-box-tag">{parametrosOrbitaisSat.regimeCodigo}</span>
                            </div>
                            <span className="metric-box-val">
                              {parametrosOrbitaisSat.altitudeInstantaneaKm.toLocaleString('pt-BR')} km
                            </span>
                          </div>

                          {/* Velocidade Orbital */}
                          <div className="telemetry-metric-box">
                            <span className="metric-box-label">VELOCIDADE ORBITAL</span>
                            <span className="metric-box-val">
                              {parametrosOrbitaisSat.velocidadeKmH.toLocaleString('pt-BR')} km/h
                            </span>
                            <span className="metric-box-sub">({parametrosOrbitaisSat.velocidadeKmS} km/s)</span>
                          </div>

                          {/* Apogeu / Perigeu */}
                          <div className="telemetry-metric-box">
                            <span className="metric-box-label">APOGEU / PERIGEU</span>
                            <span className="metric-box-val compact-val">
                              {parametrosOrbitaisSat.apogeuKm.toLocaleString('pt-BR')} / {parametrosOrbitaisSat.perigeuKm.toLocaleString('pt-BR')} km
                            </span>
                            <span className="metric-box-sub">
                              {parametrosOrbitaisSat.excentricidade < 0.01 ? "Órbita Circular" : "Órbita Elíptica"}
                            </span>
                          </div>

                          {/* Período Orbital */}
                          <div className="telemetry-metric-box">
                            <span className="metric-box-label">VOLTA COMPLETA</span>
                            <span className="metric-box-val">
                              {parametrosOrbitaisSat.periodoMinutos} min
                            </span>
                            <span className="metric-box-sub">{parametrosOrbitaisSat.voltasPorDia} voltas / dia</span>
                          </div>
                        </div>

                        {/* Inclinação Explicada */}
                        <div className="telemetry-detail-row">
                          <span className="detail-row-title">INCLINAÇÃO: {parametrosOrbitaisSat.classeInclinacao} ({parametrosOrbitaisSat.inclinacaoGraus.toFixed(1)}°)</span>
                          <p className="detail-row-desc">{parametrosOrbitaisSat.descricaoInclinacao}</p>
                        </div>

                        {/* Diagnóstico de Reentrada */}
                        <div className="telemetry-detail-row environmental-row">
                          <span className="detail-row-title">DIAGNÓSTICO AMBIENTAL & REENTRADA:</span>
                          <p className="detail-row-desc">
                            Permanência estimada: <strong>{parametrosOrbitaisSat.estimativaVida}</strong>. {parametrosOrbitaisSat.impactoAmbientalReentrada}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* HISTÓRICO E FATOS REAIS DA ENCICLOPÉDIA */}
                    {fichaFactual && (
                      <div className="pedagogic-explanation scrollable-explanation">
                        <div className="explanation-title">
                          <Zap size={14} style={{ color: 'var(--neon-cyan)' }} />
                          <span>Finalidade & Histórico Científico</span>
                        </div>
                        <p className="explanation-text">{fichaFactual.historia}</p>

                        <div className="fun-fact-section">
                          <div className="fun-fact-title">
                            <TrendingUp size={12} style={{ color: 'var(--neon-cyan)' }} />
                            <span>Relevância para a Exploração Espacial</span>
                          </div>
                          <p className="fun-fact-text">{fichaFactual.relevancia}</p>
                        </div>
                      </div>
                    )}

                    {/* Botão de Retorno */}
                    <button
                      type="button"
                      className="action-button"
                      onClick={handleDesfocarCamera}
                    >
                      <Globe size={14} />
                      Restaurar Visão Global da Terra
                    </button>

                  </div>
                ) : (
                  <div className="empty-details">
                    <Globe size={48} className="empty-details-icon" style={{ color: 'var(--neon-cyan)' }} />
                    <p>
                      Aguardando seleção de objeto orbital...
                      <span className="cursor-blink"></span>
                    </p>
                  </div>
                )}
              </div>
            </aside>

          </div>

          {/* GATILHOS FLUTUANTES PARA REABRIR PAINÉIS */}
          {!painelEsquerdoAberto && (
            <button
              type="button"
              className="hud-trigger-float-btn left-trigger"
              onClick={() => {
                setPainelEsquerdoAberto(true);
                if (window.innerWidth < 950) setPainelDireitoAberto(false);
              }}
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
              onClick={() => {
                setPainelDireitoAberto(true);
                if (window.innerWidth < 950) setPainelEsquerdoAberto(false);
              }}
              title="Abrir Diagnóstico do Satélite"
            >
              <Compass size={16} />
              <ChevronLeft size={14} className="trigger-arrow" />
            </button>
          )}

          {/* MODAL CONSOLE: GUIA TÁTICO DO OPERADOR (TUTORIAL DE ENTRADA) */}
          {modalTutorialAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card tutorial-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={20} style={{ color: 'var(--neon-cyan)' }} />
                    <h3>BRIEFING DO OPERADOR · PROTOCOLO DE CONTROLE DO CONSOLE</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleFecharModais}
                    title="Fechar Guia"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-scrollable tutorial-body">
                  <p className="tutorial-intro-lead">
                    Bem-vindo ao console de telemetria do <strong>OrbitalED</strong>. Abaixo estão os comandos essenciais para explorar e analisar o tráfego orbital da Terra em tempo real:
                  </p>

                  <div className="tutorial-steps-grid">
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <MousePointer size={22} className="step-icon cyan" />
                      </div>
                      <h4 className="step-title">Inspeção Visual (Hover)</h4>
                      <p className="step-desc">
                        Passe o cursor sobre qualquer ponto luminoso no espaço para revelar instantaneamente a elipse completa da sua órbita ao redor do planeta.
                      </p>
                    </div>

                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Crosshair size={22} className="step-icon green" />
                      </div>
                      <h4 className="step-title">Foco & Telemetria 3D</h4>
                      <p className="step-desc">
                        Clique em qualquer satélite para travar a câmera de perseguição. O painel lateral direito exibirá o dossiê com país, missão, altitude e velocidade.
                      </p>
                    </div>

                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Search size={22} className="step-icon amber" />
                      </div>
                      <h4 className="step-title">Busca Global & Filtros</h4>
                      <p className="step-desc">
                        Busque qualquer satélite pelo nome ou código NORAD na barra superior, ou utilize os filtros no painel esquerdo para isolar ativos, inativos e detritos.
                      </p>
                    </div>

                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <ShieldAlert size={22} className="step-icon red" />
                      </div>
                      <h4 className="step-title">Alertas & Sustentabilidade</h4>
                      <p className="step-desc">
                        Consulte o monitor de Sustentabilidade no topo para avaliar o risco de Síndrome de Kessler e acesse o Glossário para decodificar termos astrodinâmicos.
                      </p>
                    </div>
                  </div>

                  <div className="tutorial-footer-hint">
                    <span className="tutorial-hint-text">
                      * Você pode reabrir este briefing quando desejar clicando no botão <strong>GUIA DO OPERADOR</strong> no topo.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONSOLE: MONITOR DE SUSTENTABILIDADE ESPACIAL */}
          {modalSustentabilidadeAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card sustainability-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldAlert size={20} style={{ color: 'var(--neon-red)' }} />
                    <h3>MONITOR DE SUSTENTABILIDADE ORBITAL & RISCO PLANETÁRIO</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleFecharModais}
                    title="Fechar Monitor"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-scrollable sustainability-modal-body">
                  <p className="sustainability-intro-lead">
                    Avaliação científica de impacto ambiental orbital baseada em dados da <strong>NASA ODPO</strong> e <strong>ESA</strong>. Monitore os fatores críticos de perturbação antropogênica no espaço circunsterrestre:
                  </p>

                  <div className="sustainability-pillars-grid">
                    {/* CARD 1: KESSLER */}
                    <div className="sustainability-card card-kessler">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-kessler">
                          <ShieldAlert size={18} />
                        </div>
                        <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.kessler.titulo}</h4>
                      </div>
                      <p className="s-card-text">
                        {DADOS_SUSTENTABILIDADE.kessler.fatoChave}
                      </p>
                      <span className="s-stat-badge badge-kessler">{DADOS_SUSTENTABILIDADE.kessler.densidadeCriticaFaixa}</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-red"></span>
                        <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.kessler.historicoImpacto}</p>
                      </div>
                    </div>

                    {/* CARD 2: REENTRADA */}
                    <div className="sustainability-card card-reentry">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-reentry">
                          <Flame size={18} />
                        </div>
                        <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.reentrada.titulo}</h4>
                      </div>
                      <p className="s-card-text">
                        {DADOS_SUSTENTABILIDADE.reentrada.fatoChave}
                      </p>
                      <span className="s-stat-badge badge-reentry">Sobrevivência: {DADOS_SUSTENTABILIDADE.reentrada.sobrevivenciaPercentual}</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-orange"></span>
                        <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.reentrada.zonaDescarte}</p>
                      </div>
                    </div>

                    {/* CARD 3: MAGNETOSFERA */}
                    <div className="sustainability-card card-magneto">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-magneto">
                          <Zap size={18} />
                        </div>
                        <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.magnetosfera.titulo}</h4>
                      </div>
                      <p className="s-card-text">
                        {DADOS_SUSTENTABILIDADE.magnetosfera.mecanismo}
                      </p>
                      <span className="s-stat-badge badge-magneto">Ref: {DADOS_SUSTENTABILIDADE.magnetosfera.pesquisaReferencia}</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-cyan"></span>
                        <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.magnetosfera.riscoCientifico}</p>
                      </div>
                    </div>

                    {/* CARD 4: CLIMA E OZÔNIO */}
                    <div className="sustainability-card card-climate">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-climate">
                          <Wind size={18} />
                        </div>
                        <h4 className="s-card-title">{DADOS_SUSTENTABILIDADE.climaEOzonio.titulo}</h4>
                      </div>
                      <p className="s-card-text">
                        {DADOS_SUSTENTABILIDADE.climaEOzonio.fatoChave}
                      </p>
                      <span className="s-stat-badge badge-climate">Catalisador: Al2O3 Estratosférico</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-purple"></span>
                        <p className="s-card-subtext">{DADOS_SUSTENTABILIDADE.climaEOzonio.impactoLancamento}</p>
                      </div>
                    </div>
                  </div>

                  <div className="sustainability-footer-note">
                    <span className="sustainability-note-text">
                      * Dados compilados de modelos científicos da <strong>NASA Orbital Debris Program Office</strong>, <strong>ESA Space Debris Office</strong> e literatura peer-reviewed.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL CONSOLE: GLOSSÁRIO DIDÁTICO */}
          {modalGlossarioAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={20} style={{ color: 'var(--neon-cyan)' }} />
                    <h3>GLOSSÁRIO TÉCNICO DE ASTRODINÂMICA</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={handleFecharModais}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-scrollable">
                  {GLOSSARIO_ORBITAL.map((categoria, idx) => (
                    <div key={idx} className="modal-glossary-section">
                      <h4 className="modal-section-title">{categoria.categoria}</h4>
                      <div className="modal-glossary-grid">
                        {categoria.itens.map((item, itemIdx) => (
                          <div key={itemIdx} className="modal-glossary-item">
                            <span className="modal-glossary-term">{item.termo}</span>
                            <p className="modal-glossary-def">{item.definicao}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TOOLTIP HUD FLUTUANTE VIA DOM DIRETO (60 FPS) */}
      <div id="hud-tooltip" className="hud-tooltip" style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 9999 }}></div>
    </div>
  );
}

export default App;
