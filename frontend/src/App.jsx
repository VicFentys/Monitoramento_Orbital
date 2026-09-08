import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {
  Globe,
  Search,
  Database,
  Info,
  X,
  Cpu,
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
  Crosshair,
  Target
} from 'lucide-react';
import * as satellite from 'satellite.js';
import './App.css';
import { calcularParametrosOrbitais, gerarPontosOrbita } from './utils/orbitalPhysics';
import { obterFichaFactual, GLOSSARIO_ORBITAL, DIAGNOSTICO_SETORES } from './data/orbitalEncyclopedia';

// Configuração do host da API (aponta para o backend local ou de produção)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cores neon oficiais para as 4 categorias do sistema
const CORES_CATEGORIAS = {
  1: '#00ff66', // Satélite Ativo (Verde)
  2: '#f59e0b', // Satélite Inativo (Âmbar)
  3: '#ff0055', // Detrito Espacial (Vermelho)
  4: '#00f0ff'  // Estação Espacial (Ciano)
};

function App() {
  const [viewer, setViewer] = useState(null);
  const viewerRef = useRef(null);
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
    1: 460, // Sobre o Projeto: 3 cartões conceituais + barra de métricas chave com fontes
    2: 590, // Recursos Tecnológicos: 3 cartões enriquecidos + stack condensada
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
  const [recarregandoAmostra, setRecarregandoAmostra] = useState(false);
  const [amostraSeed, setAmostraSeed] = useState(0);

  // Filtros de Categoria (Suporte integral às 4 categorias)
  const [categoriasAtivas, setCategoriasAtivas] = useState({
    1: true, // Satélite Ativo
    2: true, // Satélite Inativo
    3: true, // Detrito Espacial
    4: true  // Estação Espacial
  });
  const [ultimoFiltroSetor, setUltimoFiltroSetor] = useState(1);

  // Diagnóstico Macro dinâmico por setor para o painel esquerdo
  const diagnosticoSetorAtivo = useMemo(() => {
    const ativas = Object.keys(categoriasAtivas).filter(k => categoriasAtivas[k]);
    if (ativas.length === 4 || ativas.length === 0) {
      return DIAGNOSTICO_SETORES.todos;
    }
    if (ativas.length === 1) {
      const unicoId = Number(ativas[0]);
      return DIAGNOSTICO_SETORES[unicoId] || DIAGNOSTICO_SETORES.todos;
    }
    if (categoriasAtivas[ultimoFiltroSetor]) {
      return DIAGNOSTICO_SETORES[ultimoFiltroSetor] || DIAGNOSTICO_SETORES.todos;
    }
    return DIAGNOSTICO_SETORES[Number(ativas[0])] || DIAGNOSTICO_SETORES.todos;
  }, [categoriasAtivas, ultimoFiltroSetor]);


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
          .filter(([, ativa]) => ativa)
          .map(([k]) => Number(k));

        if (ativas.length === 0) {
          setObjetos([]);
          return;
        }

        // Carga padrão calibrada para 1.000 objetos com semente anti-cache de amostragem
        let url = `${API_URL}/api/objetos?limit=1000&seed=${amostraSeed || Date.now()}`;

        if (ativas.length === 1) {
          url += `&categoria_id=${ativas[0]}`;
        }

        const resObjs = await fetch(url);
        if (resObjs.ok) {
          const dataObjs = await resObjs.json();
          // Se houver um satélite selecionado atualmente, assegura sua permanência no cinturão
          if (satSelecionadoRef.current) {
            const jaExiste = dataObjs.some(o => o.norad_id === satSelecionadoRef.current.norad_id);
            if (!jaExiste) {
              dataObjs.push(satSelecionadoRef.current);
            }
          }
          setObjetos(dataObjs);
        }
      } catch (err) {
        console.error("Erro ao carregar objetos orbitais:", err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          setRecarregandoAmostra(false);
        }, 400);
      }
    };

    carregarObjetosFiltrados();
  }, [categoriasAtivas, amostraSeed]);

  const handleRecarregarAmostra = () => {
    if (recarregandoAmostra || loading) return;
    setRecarregandoAmostra(true);
    setAmostraSeed(Date.now());
  };

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
    } catch {
      // Ignorar exceções de remoção assíncrona
    }
  };

  // 4. SELEÇÃO E CÁLCULO FÍSICO DO SATÉLITE
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
      const v = viewerRef.current;
      if (v) {
        desenharTrilhaOrbital(v, sat.ultimo_tle);
      }
    } else {
      setParametrosOrbitaisSat(null);
    }
  };

  const handleDesfocarCamera = () => {
    const v = viewerRef.current;
    if (!v) return;

    entidadeFocadaRef.current = null;
    v.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    v.trackedEntity = undefined;
    satSelecionadoRef.current = null;
    setSatSelecionado(null);
    setParametrosOrbitaisSat(null);
    limparTrilhaOrbital(v);

    setPainelDireitoAberto(false);
    if (window.innerWidth < 950) {
      setPainelEsquerdoAberto(true);
    }

    v.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(-45.0, -15.0, 18000000.0),
      orientation: {
        heading: window.Cesium.Math.toRadians(0.0),
        pitch: window.Cesium.Math.toRadians(-90.0),
        roll: 0.0
      },
      duration: 1.5
    });
  };

  // 5. INICIALIZAÇÃO DO GLOBO CESIUM 3D E EVENTOS DE HOVER COM TRILHA
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
    viewerInstance.scene.globe.depthTestAgainstTerrain = true;

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
        } catch {
          // Fallback para mapa base silencioso
        }
      });
    }

    viewerRef.current = viewerInstance;
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
            } catch {
              // Objeto fora de visibilidade
            }
          }

          lastHoveredEntity = entity;
          satHoverIdRef.current = satData.norad_id;

          // Realçar ponto sob hover
          try {
            const currentSize = entity.point.pixelSize.getValue();
            entity.point.pixelSize = currentSize + 4;
            entity.point.outlineColor = window.Cesium.Color.WHITE;
            entity.point.outlineWidth = 2.5;
          } catch {
            // Frame ignorado
          }

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
          } catch {
            // Frame ignorado
          }
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
        } catch {
          // Render loop silencioso
        }
      }
    });

    return () => {
      removerPreRender();
      clickHandler.destroy();
      hoverHandler.destroy();
      if (viewerInstance && !viewerInstance.isDestroyed()) {
        viewerInstance.destroy();
      }
      viewerRef.current = null;
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
      } catch {
        // Redimensionamento silencioso
      }
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
            } catch {
              // Entidade desanexada
            }
          });
        }
      } catch {
        // Limpeza concluída
      }
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
            } catch {
              // Posição orbital indisponível para o frame
            }
            return undefined;
          }, false),
          point: {
            pixelSize: catId === 4 ? 10 : catId === 2 ? 6 : 7,
            color: window.Cesium.Color.fromCssColorString(corHex),
            outlineColor: window.Cesium.Color.BLACK,
            outlineWidth: 1.5
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
      } catch {
        // Atualização de visibilidade
      }
    });
    if (!mostrarObjetos) {
      limparTrilhaOrbital(viewer);
      const tooltipEl = document.getElementById('hud-tooltip');
      if (tooltipEl) tooltipEl.style.display = 'none';
    }
  }, [telaAtiva, viewer]);


  const handleAlternarCategoria = (catId) => {
    setCategoriasAtivas(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
    setUltimoFiltroSetor(catId);
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
                  PLATAFORMA COMPUTACIONAL DE ANÁLISE ORBITAL, VISUALIZAÇÃO 3D E SUSTENTABILIDADE ESPACIAL.
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
                    <span className="bracket-btn-label">INICIAR EXPLORAÇÃO</span>
                  </button>
                </div>
              </div>

              <div className="cinema-hero-footer">
                <span className="cinema-footer-indicator">ASTRODINÂMICA SGP4 · TLE · CATALOGAÇÃO ORBITAL · SPACE-TRACK</span>
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
                      {secaoVisorExibida === 1 && "SOBRE A PLATAFORMA"}
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
                              <h3 className="about-card-title">Missão</h3>
                            </div>
                            <p className="about-card-lead">
                              Tornar a mecânica celeste compreensível para todos, transformando dados orbitais abstratos em aprendizado visual e interativo.
                            </p>
                            <ul className="about-card-list">
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Clareza Visual:</strong> Substitui coordenadas numéricas complexas por representações espaciais tridimensionais fáceis de assimilar.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Foco Educacional:</strong> Plataforma pensada para estudantes, professores e entusiastas que querem entender como os objetos se comportam no espaço.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Sustentabilidade Espacial:</strong> Ajuda a compreender o crescimento do tráfego ao redor da Terra e a importância da preservação das órbitas.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-about-card">
                            <div className="about-card-header">
                              <h3 className="about-card-title">Engenharia</h3>
                            </div>
                            <p className="about-card-lead">
                              Arquitetura computacional concebida para rodar cálculos físicos avançados diretamente no navegador do usuário:
                            </p>
                            <ul className="about-card-list">
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Processamento no Cliente:</strong> Calcula a posição exata de cada objeto no próprio dispositivo, sem depender de respostas lentas de servidores.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Renderização WebGL:</strong> Globo e órbitas desenhados em três dimensões com alta fidelidade geográfica e sem exigência de plugins externos.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Acesso Direto:</strong> Funciona de forma instantânea pela web, sem necessidade de instalação, extensões ou cadastro.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-about-card">
                            <div className="about-card-header">
                              <h3 className="about-card-title">Fontes</h3>
                            </div>
                            <p className="about-card-lead">
                              Dados alimentados pelas redes de monitoramento e registros astronômicos mais respeitados do mundo:
                            </p>
                            <ul className="about-card-list">
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>CelesTrak:</strong> Distribuição diária dos parâmetros matemáticos usados para calcular as rotas dos objetos.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Space-Track:</strong> Catálogo oficial com milhares de itens rastreados continuamente por redes internacionais de sensores e radares.</span>
                              </li>
                              <li>
                                <span className="about-list-dot"></span>
                                <span><strong>Transparência Científica:</strong> Aplicação focada estritamente em dados de uso civil, público e educacional.</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Barra Inferior com Métricas Chave do Projeto */}
                        <div className="tactical-about-metrics-bar">
                          <div className="about-metric-item">
                            <span className="about-metric-val">35.000+</span>
                            <span className="about-metric-lbl">Censo Global em Órbita</span>
                            <span className="about-metric-sub">Fonte: NORAD / Space-Track</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">~6.300</span>
                            <span className="about-metric-lbl">Catálogo no Banco Local</span>
                            <span className="about-metric-sub">Sincronizado via CelesTrak</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">1.000</span>
                            <span className="about-metric-lbl">Amostragem Vetorial 3D</span>
                            <span className="about-metric-sub">Propagação SGP4 a 60 FPS</span>
                          </div>
                          <div className="about-metric-divider"></div>
                          <div className="about-metric-item">
                            <span className="about-metric-val">24h</span>
                            <span className="about-metric-lbl">Ciclo de Atualização</span>
                            <span className="about-metric-sub">Sincronização Diária de TLEs</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {secaoVisorExibida === 2 && (
                      <div className="tactical-features-container">
                        <div className="tactical-features-grid">
                          <div className="tactical-feature-card">
                            <div className="feature-card-header">
                              <h3 className="tactical-feature-title">Trajetórias</h3>
                            </div>
                            <p>
                              Navegação interativa para inspecionar as rotas completas de satélites e estações ao redor da Terra:
                            </p>
                            <ul className="tactical-feature-specs">
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Órbita com o Cursor:</strong> Aponte para qualquer objeto para revelar o desenho completo do seu circuito espacial.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Câmera Seguidora:</strong> Fixe a visualização em um satélite específico para viajar junto com ele em tempo real.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Perspectiva Global:</strong> Gire e amplie o globo livremente para analisar os diferentes planos e altitudes orbitais.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-feature-card">
                            <div className="feature-card-header">
                              <h3 className="tactical-feature-title">Física</h3>
                            </div>
                            <p>
                              Informações dinâmicas sobre o comportamento e os princípios do movimento orbital:
                            </p>
                            <ul className="tactical-feature-specs">
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Painel de Movimento:</strong> Leituras instantâneas de altitude atual, velocidade (km/h) e tempo para completar uma volta completa.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Equilíbrio Gravitacional:</strong> Demonstra na prática como a velocidade necessária varia de acordo com a distância do planeta.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Marcos da Trajetória:</strong> Aponta claramente os limites do circuito, indicando os pontos de maior e menor aproximação da Terra.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="tactical-feature-card">
                            <div className="feature-card-header">
                              <h3 className="tactical-feature-title">Exploração</h3>
                            </div>
                            <p>
                              Enciclopédia interativa para identificar a história, o propósito e o país de origem de cada elemento em tela:
                            </p>
                            <ul className="tactical-feature-specs">
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Busca Rápida:</strong> Localize satélites conhecidos ou componentes específicos pelo nome popular ou pelo identificador de catálogo.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Ficha Informativa:</strong> Consulte histórico, país de origem, ano de lançamento e objetivo principal de cada missão.</span>
                              </li>
                              <li>
                                <span className="spec-dot"></span>
                                <span><strong>Filtros por Categoria:</strong> Separe a exibição entre equipamentos em operação, satélites inativos e fragmentos orbitais.</span>
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
                              <div className="pod-tech-line">
                                <span>React 19</span> · <span>Vite 8</span> · <span>CesiumJS</span> · <span>Satellite.js</span>
                              </div>
                              <p className="pod-desc">Interface reativa de alto desempenho, renderização geoespacial 3D e cálculo vetorial propagado no navegador.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">BACKEND & APIs</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>Python 3.11</span> · <span>FastAPI</span> · <span>SQLAlchemy 2.0</span> · <span>APScheduler</span>
                              </div>
                              <p className="pod-desc">API REST assíncrona de baixa latência, responsável pela ingestão de catálogos e orquestração de tarefas em background.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">DADOS & EFEMÉRIDES</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>PostgreSQL 16</span> · <span>CelesTrak</span> · <span>Space-Track</span> · <span>TLE / SGP4</span>
                              </div>
                              <p className="pod-desc">Persistência relacional de efemérides com sincronização contínua de catálogos orbitais oficiais do USSPACECOM/NORAD.</p>
                            </div>

                            <div className="stack-category-pod">
                              <div className="pod-header">
                                <span className="pod-indicator pod-cyan"></span>
                                <h4 className="pod-title">DEVOPS & INFRAESTRUTURA</h4>
                              </div>
                              <div className="pod-tech-line">
                                <span>Docker</span> · <span>Docker Compose</span> · <span>Nginx Proxy</span> · <span>Healthchecks</span>
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
                              <h4 className="s-card-title">Risco de Colisão</h4>
                            </div>
                            <p className="s-card-text">
                              A 27.000 km/h, um fragmento de apenas 1 cm tem a energia de uma granada, perfurando qualquer blindagem aeroespacial moderna.
                            </p>
                            <span className="s-stat-badge badge-kessler">Faixa Crítica: 750 a 950 km de altitude</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-red"></span>
                              <p className="s-card-subtext">
                                A colisão histórica entre os satélites Iridium e Cosmos (2009) gerou mais de 2.000 fragmentos que até hoje forçam a Estação Espacial Internacional a desvios de rota.
                              </p>
                            </div>
                          </div>

                          <div className="sustainability-card card-reentry">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-reentry">
                                <Flame size={18} />
                              </div>
                              <h4 className="s-card-title">Queda na Atmosfera</h4>
                            </div>
                            <p className="s-card-text">
                              Embora fuselagens vaporizem, tanques de titânio e blocos maciços de aço resistem a 2.000 °C e atingem a superfície.
                            </p>
                            <span className="s-stat-badge badge-reentry">Sobrevivência: 10% a 40% de peças pesadas</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-orange"></span>
                              <p className="s-card-subtext">
                                Quedas controladas miram o Ponto Nemo no Pacífico Sul, mas satélites abandonados e desativados reentram de forma imprevisível sobre o planeta.
                              </p>
                            </div>
                          </div>

                          <div className="sustainability-card card-magneto">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-magneto">
                                <Zap size={18} />
                              </div>
                              <h4 className="s-card-title">Interferência Eletromagnética</h4>
                            </div>
                            <p className="s-card-text">
                              A queima contínua de frotas de satélites injeta toneladas de óxido de alumínio e nanopartículas condutoras na alta atmosfera.
                            </p>
                            <div className="s-badge-stack">
                              <span className="badge-peer-reviewed">Dado Confirmado: Evidência de metais na estratosfera (PNAS)</span>
                              <span className="badge-hypothesis">Hipótese em Estudo: Modelagem de blindagem condutora (arXiv)</span>
                            </div>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-cyan"></span>
                              <p className="s-card-subtext">
                                Cientistas investigam se essa camada artificial de poeira condutora pode interferir no funcionamento do escudo magnético natural da Terra.
                              </p>
                            </div>
                          </div>

                          <div className="sustainability-card card-climate">
                            <div className="s-card-title-group">
                              <div className="s-icon-box s-icon-climate">
                                <Wind size={18} />
                              </div>
                              <h4 className="s-card-title">Danos na Camada de Ozônio</h4>
                            </div>
                            <p className="s-card-text">
                              A poeira de alumínio liberada na queima de satélites catalisa reações de cloro, podendo atrasar a regeneração do ozônio por décadas.
                            </p>
                            <span className="s-stat-badge badge-climate">Impacto Químico: Poeira de alumínio e fuligem fóssil</span>
                            <div className="s-card-subtext-box">
                              <span className="s-subtext-dot dot-purple"></span>
                              <p className="s-card-subtext">
                                A fuligem liberada pelos motores de foguetes permanece acumulada por anos no topo da atmosfera, intensificando o aquecimento do planeta.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="tactical-table-box">
                          <div className="tactical-table-header">
                            <div className="tactical-table-title-group">
                              <AlertTriangle size={14} className="tactical-table-icon" />
                              <span>CENSO DE RESPONSABILIDADE GEOPOLÍTICA E DETRITOS CATALOGADOS</span>
                            </div>
                            <span className="tactical-table-source">CATÁLOGO SPACE-TRACK / NASA ODPO (SNAPSHOT: Q1/2026)</span>
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

            {/* PAINEL TÁTICO CENTRAL TRAPEZOIDAL DE FERRAMENTAS NO HUD */}
            <div className="hud-tools-panel">
              <svg
                className="hud-trapezoid-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Fundo do painel em vidro escuro idêntico aos painéis laterais */}
                <polygon
                  points="0,0 100,0 95.5,100 4.5,100"
                  className="hud-trapezoid-bg"
                />
                {/* Borda perimetral tática contínua idêntica aos painéis laterais */}
                <polygon
                  points="0.5,0.5 99.5,0.5 95.2,99.5 4.8,99.5"
                  className="hud-trapezoid-stroke"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Borda superior em azul mais claro idêntica aos painéis laterais */}
                <line
                  x1="0"
                  y1="1"
                  x2="100"
                  y2="1"
                  className="hud-trapezoid-top-accent"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div className="hud-tools-section">
                <button
                  type="button"
                  className={`hud-tool-btn ${modalSustentabilidadeAberto ? 'active' : ''}`}
                  onClick={handleAbrirSustentabilidade}
                  title="Monitor de Sustentabilidade Espacial"
                >
                  <ShieldAlert size={15} className="hud-tool-icon" />
                  <span>SUSTENTABILIDADE</span>
                </button>

                <button
                  type="button"
                  className={`hud-tool-btn ${modalTutorialAberto ? 'active' : ''}`}
                  onClick={handleAbrirTutorial}
                  title="Abrir Guia Rápido do Operador"
                >
                  <Compass size={15} className="hud-tool-icon" />
                  <span>GUIA DO OPERADOR</span>
                </button>

                <button
                  type="button"
                  className={`hud-tool-btn ${modalGlossarioAberto ? 'active' : ''}`}
                  onClick={handleAbrirGlossario}
                >
                  <BookOpen size={15} className="hud-tool-icon" />
                  <span>GLOSSÁRIO</span>
                </button>
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
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '105px', flexShrink: 0, padding: '14px 16px', boxSizing: 'border-box' }}>
                  <div className="stat-label">Catálogo Orbital Monitorado</div>
                  <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontSize: '30px', fontWeight: 700, color: '#ffffff', marginTop: '8px', lineHeight: 1 }}>
                    {loading ? "---" : (calcularObjetosNoRadar() || 6336).toLocaleString('pt-BR')}
                    <span style={{ color: 'var(--neon-cyan)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.8px' }}>OBJETOS</span>
                  </div>
                  <div className="stat-sublabel" style={{ display: 'block', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(0, 240, 255, 0.15)', fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    Amostragem ativa: <strong style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>{loading ? '...' : (objetos.length || 1000).toLocaleString('pt-BR')}</strong> no radar
                  </div>
                </div>

                {/* BOTÃO DE RECARREGAMENTO DE AMOSTRAGEM ORBITAL */}
                <div className="resample-section">
                  <button
                    type="button"
                    className={`resample-btn ${recarregandoAmostra ? 'loading' : ''}`}
                    onClick={handleRecarregarAmostra}
                    disabled={loading || recarregandoAmostra}
                    title="Sortear nova amostragem proporcional de 1.000 objetos"
                  >
                    <RotateCw size={13} className={`resample-icon ${recarregandoAmostra ? 'spin-anim' : ''}`} />
                    <span>{recarregandoAmostra ? 'SORTEANDO OBJETOS...' : 'RECARREGAR AMOSTRAGEM'}</span>
                  </button>
                </div>

                {/* Filtros e Legenda das 4 Categorias */}
                <div className="legend-section">
                  <div className="legend-title">Filtros por Categoria</div>

                  {/* Satélites Ativos */}
                  <div
                    className={`legend-item cat-ativos ${categoriasAtivas[1] ? 'active' : ''}`}
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
                    className={`legend-item cat-inativos ${categoriasAtivas[2] ? 'active' : ''}`}
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
                    className={`legend-item cat-detritos ${categoriasAtivas[3] ? 'active' : ''}`}
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
                    className={`legend-item cat-estacoes ${categoriasAtivas[4] ? 'active' : ''}`}
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
                      <span className="regime-pct">87%</span>
                    </div>
                    <div className="regime-progress-track">
                      <div className="regime-progress-fill leo-fill" style={{ width: '87%' }}></div>
                    </div>
                  </div>

                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag meo-tag">MEO</span>
                      <span className="regime-name">Órbita Média (2.000 - 35.786 km)</span>
                      <span className="regime-pct">4%</span>
                    </div>
                    <div className="regime-progress-track">
                      <div className="regime-progress-fill meo-fill" style={{ width: '4%' }}></div>
                    </div>
                  </div>

                  <div className="regime-bar-item">
                    <div className="regime-bar-info">
                      <span className="regime-tag geo-tag">GEO</span>
                      <span className="regime-name">Geoestacionária (~35.786 km)</span>
                      <span className="regime-pct">9%</span>
                    </div>
                    <div className="regime-progress-track">
                      <div className="regime-progress-fill geo-fill" style={{ width: '9%' }}></div>
                    </div>
                  </div>
                </div>

                {/* DIAGNÓSTICO DO SETOR (REATIVO AO FILTRO ATIVO) */}
                <div className="legend-section sector-diagnosis-section">
                  <div className="sector-diagnosis-header">
                    <Activity size={14} className="sector-diagnosis-icon" />
                    <span className="sector-diagnosis-title">
                      DIAGNÓSTICO DO SETOR: {diagnosticoSetorAtivo.titulo}
                    </span>
                  </div>
                  <ul className="sector-diagnosis-list">
                    {diagnosticoSetorAtivo.itens.map((item, idx) => (
                      <li key={idx} className="sector-diagnosis-item">
                        <span className="sector-item-bullet">•</span>
                        <div className="sector-item-text">
                          <strong className="sector-item-label">{item.rotulo}:</strong>{' '}
                          <span className="sector-item-desc">{item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
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

                    {/* Badge da Categoria */}
                    <div className="mission-badge-container">
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
                    </div>

                    {/* MÓDULO DIDÁTICO: DINÂMICA ORBITAL */}
                    {parametrosOrbitaisSat && (
                      <div className="telemetry-dashboard-card">
                        <div className="telemetry-card-title">
                          <Activity size={14} className="telemetry-icon" />
                          <span>DINÂMICA ORBITAL</span>
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

                        {/* Classificação da Rota */}
                        <div className="telemetry-detail-row">
                          <span className="detail-row-title">
                            CLASSIFICAÇÃO DA ROTA: {parametrosOrbitaisSat.classeInclinacao} — Inclinação: {parametrosOrbitaisSat.inclinacaoGraus.toFixed(1)}°
                          </span>
                          <p className="detail-row-desc">{parametrosOrbitaisSat.descricaoInclinacao}</p>
                        </div>

                        {/* Vida Útil & Sustentabilidade */}
                        <div className="telemetry-detail-row environmental-row">
                          <span className="detail-row-title">VIDA ÚTIL & SUSTENTABILIDADE</span>
                          <p className="detail-row-desc">
                            Permanência estimada: <strong>{parametrosOrbitaisSat.estimativaVida}</strong>. {parametrosOrbitaisSat.impactoAmbientalReentrada}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CONTEXTO DA MISSÃO */}
                    {fichaFactual && fichaFactual.contextoMissao && (
                      <div className="mission-context-card">
                        <div className="mission-context-header">
                          <Target size={14} className="mission-context-icon" />
                          <span className="mission-context-title">Contexto da Missão</span>
                        </div>
                        <blockquote className="mission-context-quote">
                          "{fichaFactual.contextoMissao}"
                        </blockquote>
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

          {/* MODAL CONSOLE: GUIA RÁPIDO DO OPERADOR (TUTORIAL DE ENTRADA) */}
          {modalTutorialAberto && (
            <div
              className={`hud-modal-backdrop ${modalFechando ? 'modal-closing' : 'modal-opening'}`}
              onClick={handleFecharModais}
            >
              <div className={`hud-modal-card tutorial-modal-card ${modalFechando ? 'card-closing' : 'card-opening'}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={20} style={{ color: 'var(--neon-cyan)' }} />
                    <h3>GUIA RÁPIDO DO OPERADOR</h3>
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
                    Bem-vindo ao <strong>OrbitalED</strong>. Conheça os comandos principais para explorar, rastrear e analisar os objetos ao redor da Terra em tempo real:
                  </p>

                  <div className="tutorial-steps-grid">
                    {/* 1. Navegação 3D */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Globe size={22} className="step-icon cyan" />
                      </div>
                      <h4 className="step-title">1. Navegação 3D</h4>
                      <div className="step-points-list compact-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd cyan">Clique + Arrastar</kbd>
                          <span className="step-point-text">Girar o globo</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd cyan">Scroll do Mouse</kbd>
                          <span className="step-point-text">Zoom in / out</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd cyan">Passar o Cursor</kbd>
                          <span className="step-point-text">Revelar traçado orbital</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Rastreamento */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Crosshair size={22} className="step-icon green" />
                      </div>
                      <h4 className="step-title">2. Rastreamento</h4>
                      <div className="step-points-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd green">Clique no Objeto</kbd>
                          <span className="step-point-text">Fixa câmera e abre telemetria</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd green">Painel Direito</kbd>
                          <span className="step-point-text">Dossiê com país, altitude, velocidade e missão</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Busca e Filtros */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <Search size={22} className="step-icon amber" />
                      </div>
                      <h4 className="step-title">3. Busca e Filtros</h4>
                      <div className="step-points-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd amber">Pesquisa Direta</kbd>
                          <span className="step-point-text">Localize satélites ou estações por nome ou NORAD</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd amber">Painel Esquerdo</kbd>
                          <span className="step-point-text">Filtragem por tipo de objeto</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Módulos Educativos */}
                    <div className="tutorial-step-card">
                      <div className="step-icon-box">
                        <BookOpen size={22} className="step-icon purple" />
                      </div>
                      <h4 className="step-title">4. Módulos Educativos</h4>
                      <div className="step-points-list">
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd purple">Sustentabilidade</kbd>
                          <span className="step-point-text">Riscos de colisão e impacto do lixo em órbita</span>
                        </div>
                        <div className="step-point-item">
                          <kbd className="tutorial-kbd purple">Glossário Didático</kbd>
                          <span className="step-point-text">Explicações simplificadas sobre a física espacial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="tutorial-footer-hint">
                    <span className="tutorial-hint-text">
                      * Você pode reabrir este guia quando quiser clicando em <strong>GUIA DO OPERADOR</strong> na barra superior.
                    </span>
                    <button
                      type="button"
                      className="tutorial-ack-btn"
                      onClick={handleFecharModais}
                    >
                      ENTENDIDO
                    </button>
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
                    {/* CARD 1: RISCO DE COLISÃO */}
                    <div className="sustainability-card card-kessler">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-kessler">
                          <ShieldAlert size={18} />
                        </div>
                        <h4 className="s-card-title">Risco de Colisão</h4>
                      </div>
                      <p className="s-card-text">
                        A 27.000 km/h, um fragmento de apenas 1 cm tem a energia de uma granada, perfurando qualquer blindagem aeroespacial moderna.
                      </p>
                      <span className="s-stat-badge badge-kessler">Faixa Crítica: 750 a 950 km de altitude</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-red"></span>
                        <p className="s-card-subtext">
                          A colisão histórica entre os satélites Iridium e Cosmos (2009) gerou mais de 2.000 fragmentos que até hoje forçam a Estação Espacial Internacional a desvios de rota.
                        </p>
                      </div>
                    </div>

                    {/* CARD 2: QUEDA NA ATMOSFERA */}
                    <div className="sustainability-card card-reentry">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-reentry">
                          <Flame size={18} />
                        </div>
                        <h4 className="s-card-title">Queda na Atmosfera</h4>
                      </div>
                      <p className="s-card-text">
                        Embora fuselagens vaporizem, tanques de titânio e blocos maciços de aço resistem a 2.000 °C e atingem a superfície.
                      </p>
                      <span className="s-stat-badge badge-reentry">Sobrevivência: 10% a 40% de peças pesadas</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-orange"></span>
                        <p className="s-card-subtext">
                          Quedas controladas miram o Ponto Nemo no Pacífico Sul, mas satélites abandonados e desativados reentram de forma imprevisível sobre o planeta.
                        </p>
                      </div>
                    </div>

                    {/* CARD 3: INTERFERÊNCIA ELETROMAGNÉTICA */}
                    <div className="sustainability-card card-magneto">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-magneto">
                          <Zap size={18} />
                        </div>
                        <h4 className="s-card-title">Interferência Eletromagnética</h4>
                      </div>
                      <p className="s-card-text">
                        A queima contínua de frotas de satélites injeta toneladas de óxido de alumínio e nanopartículas condutoras na alta atmosfera.
                      </p>
                      <div className="s-badge-stack">
                        <span className="badge-peer-reviewed">Dado Confirmado: Evidência de metais na estratosfera (PNAS)</span>
                        <span className="badge-hypothesis">Hipótese em Estudo: Modelagem de blindagem condutora (arXiv)</span>
                      </div>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-cyan"></span>
                        <p className="s-card-subtext">
                          Cientistas investigam se essa camada artificial de poeira condutora pode interferir no funcionamento do escudo magnético natural da Terra.
                        </p>
                      </div>
                    </div>

                    {/* CARD 4: DANOS NA CAMADA DE OZÔNIO */}
                    <div className="sustainability-card card-climate">
                      <div className="s-card-title-group">
                        <div className="s-icon-box s-icon-climate">
                          <Wind size={18} />
                        </div>
                        <h4 className="s-card-title">Danos na Camada de Ozônio</h4>
                      </div>
                      <p className="s-card-text">
                        A poeira de alumínio liberada na queima de satélites catalisa reações de cloro, podendo atrasar a regeneração do ozônio por décadas.
                      </p>
                      <span className="s-stat-badge badge-climate">Impacto Químico: Poeira de alumínio e fuligem fóssil</span>
                      <div className="s-card-subtext-box">
                        <span className="s-subtext-dot dot-purple"></span>
                        <p className="s-card-subtext">
                          A fuligem liberada pelos motores de foguetes permanece acumulada por anos no topo da atmosfera, intensificando o aquecimento do planeta.
                        </p>
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
                            <div className="modal-glossary-header">
                              <span className="modal-glossary-term">{item.termo}</span>
                              {item.titulo && <span className="modal-glossary-sub">{item.titulo}</span>}
                            </div>
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
