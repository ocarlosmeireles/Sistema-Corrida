
import React, { useState, useEffect, useRef, memo } from 'react';
import { Activity, RoutePoint, Notification, Member, WorkoutMode, SoundType } from '../types';
import { Play, Pause, Square, Flag, CheckCircle, Zap, Wind, Mountain, Footprints, Cloud, Tornado, Lock, Unlock, Crosshair, Mic, Target, Award, Share2, Volume2, VolumeX, X, Image as ImageIcon, Download, Loader2, Music, ChevronUp, ChevronDown, Flame, Activity as ActivityIcon, Gauge, Feather, Signal } from 'lucide-react';
import * as L from 'leaflet';
import { SocialShareModal } from './SocialShareModal';

interface LiveRunProps {
  onSaveActivity: (activity: Omit<Activity, 'id'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  currentUser?: Member;
  playSound?: (type: SoundType) => void;
}

// --- COMPONENTE SPOTIFY ISOLADO (MEMOIZED) ---
const SpotifyPlayer = memo(({ embedId, isExpanded, onToggle }: { embedId: string, isExpanded: boolean, onToggle: () => void }) => {
    return (
        <div 
            className={`absolute bottom-36 left-4 right-4 z-30 transition-all duration-500 ease-in-out ${isExpanded ? 'h-[350px]' : 'h-[80px]'}`}
        >
            <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
                {/* Header do Player */}
                <div 
                    className="bg-gray-900/90 backdrop-blur-md p-2 flex justify-between items-center cursor-pointer border-b border-gray-800"
                    onClick={onToggle}
                >
                    <div className="flex items-center gap-2">
                        <Music size={14} className="text-green-500" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Spotify Station</span>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>

                {/* Iframe do Spotify */}
                <div className="flex-1 bg-black relative">
                    {/* Overlay invisível quando minimizado para evitar cliques acidentais no iframe (exceto controles) */}
                    {!isExpanded && (
                        <div 
                            className="absolute inset-0 z-10 bg-transparent cursor-pointer"
                            onClick={onToggle}
                        ></div>
                    )}
                    <iframe 
                        src={`https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0`} 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="eager"
                        title="Spotify Player"
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
        </div>
    );
}, (prev, next) => prev.embedId === next.embedId && prev.isExpanded === next.isExpanded);

// --- ESTAMPAS DO VENTO (WIND PRINTS CONFIG) ---
const WIND_PATTERNS: Record<WorkoutMode, { 
    title: string; 
    subtitle: string;
    icon: any; 
    theme: string; 
    pattern: string;
    description: string;
    hexColor: string;
    spotifyEmbedId: string;
}> = {
    walk: { 
        title: "Brisa Leve", 
        subtitle: "Recuperação & Foco",
        icon: Footprints, 
        theme: "text-cyan-400 border-cyan-500/30", 
        pattern: "bg-gradient-to-br from-cyan-900/40 to-blue-900/20",
        description: "Movimento suave. Ideal para regenerativos e contemplação.",
        hexColor: "#22d3ee",
        spotifyEmbedId: "37i9dQZF1DX3qCx5yEZkcJ" // Lo-Fi Beats
    },
    jog: { 
        title: "Vento Alísio", 
        subtitle: "Ritmo Constante",
        icon: Wind, 
        theme: "text-emerald-400 border-emerald-500/30", 
        pattern: "bg-gradient-to-br from-emerald-900/40 to-teal-900/20",
        description: "Fluxo contínuo e eficiente. Construção de base aeróbica.",
        hexColor: "#34d399",
        spotifyEmbedId: "37i9dQZF1DXadOVCgGhS7j" // Pop Run
    },
    run: { 
        title: "Rajada Forte", 
        subtitle: "Alta Intensidade",
        icon: Zap, 
        theme: "text-amber-500 border-amber-500/30", 
        pattern: "bg-gradient-to-br from-amber-900/40 to-orange-900/20",
        description: "Corte o ar. Treino principal de ganho de performance.",
        hexColor: "#f59e0b",
        spotifyEmbedId: "37i9dQZF1DX7Z7kYpbkT4D" // Rock Run
    },
    sprint: { 
        title: "Tempestade", 
        subtitle: "Explosão Máxima",
        icon: Tornado, 
        theme: "text-red-500 border-red-500/30", 
        pattern: "bg-gradient-to-br from-red-900/40 to-purple-900/20",
        description: "Tiros curtos e violentos. Elevando o VO2 Max ao limite.",
        hexColor: "#ef4444",
        spotifyEmbedId: "37i9dQZF1DX6GwdWRQMQpq" // Phonk
    },
    long_run: { 
        title: "Corrente de Jato", 
        subtitle: "Resistência Pura",
        icon: Mountain, 
        theme: "text-indigo-400 border-indigo-500/30", 
        pattern: "bg-gradient-to-br from-indigo-900/40 to-violet-900/20",
        description: "Altitude de cruzeiro por longas distâncias. Mentalidade de aço.",
        hexColor: "#818cf8",
        spotifyEmbedId: "37i9dQZF1DX9XIFQuFvzM4" // Trance
    },
    recovery: {
        title: "Brisa Curativa",
        subtitle: "Recuperação Ativa",
        icon: Feather,
        theme: "text-blue-300 border-blue-300/30",
        pattern: "bg-gradient-to-br from-blue-900/40 to-teal-900/20",
        description: "Movimento regenerativo. Foco em soltar a musculatura e limpar o ácido lático.",
        hexColor: "#93c5fd", // Light Blue
        spotifyEmbedId: "37i9dQZF1DWV7EzJMK2FUI" // Peaceful/Chill playlist
    }
};

// --- ENGINE DE METAS INTELIGENTES ---
const generateSmartGoal = (member?: Member): string => {
    if (!member) return "Correr livremente e sentir o vento.";

    const totalKm = member.totalDistance;
    // Iniciante
    if (totalKm < 50) {
        const options = [
            "Completar 3km em ritmo confortável.",
            "Alternar 5min correndo e 2min andando por 30min.",
            "Focar na respiração e completar 20 minutos.",
            "Apenas sair do sofá e conquistar 2km hoje."
        ];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    // Intermediário
    if (totalKm < 300) {
        const options = [
            "Manter um pace constante por 5km.",
            "Fazer 40 minutos de rodagem leve.",
            "Tentar bater seu recorde nos 5km.",
            "Correr 6km sentindo a brisa do mar."
        ];
        return options[Math.floor(Math.random() * options.length)];
    }

    // Avançado (Elite)
    const options = [
        "Longão de 12km em ritmo de prova.",
        "Tiros de 1km com descanso ativo (Repetir 5x).",
        "Rodagem progressiva: começar lento, terminar forte.",
        "Desafio de resistência: 1 hora sem parar."
    ];
    return options[Math.floor(Math.random() * options.length)];
};

// --- COACH CARIOCA DINÂMICO (SCRIPT ENGINE) ---
const getVoiceScript = (
    category: 'start' | 'pause' | 'resume' | 'finish' | 'motivation' | 'split', 
    gender: 'male' | 'female', 
    rank: string,
    mode: WorkoutMode,
    data?: { km?: number, pace?: string }
) => {
    const isMale = gender === 'male';
    const isRecovery = mode === 'recovery';
    
    const SCRIPTS = {
        start: isRecovery ? [
            `Fala ${isMale ? 'parceiro' : 'parceira'}. Hoje é dia de regenerar. Trote leve, respiração calma. Nada de loucura, hein?`,
            `Bora soltar essa musculatura. Ritmo de brisa leve. Aproveita pra curtir a paisagem do Rio.`,
            `Treino de recuperação iniciado. Esquece o relógio e foca no bem-estar.`
        ] : [
            `Fala tu, ${isMale ? 'meu parceiro' : 'minha parceira'}! Honra a camisa dos Filhos do Vento. Hoje é dia de voar baixo!`,
            `Atenção ${isMale ? 'guerreiro' : 'guerreira'}. Coluna ereta, respira fundo e acelera! O Rio de Janeiro é teu cenário.`,
            `Coé! O asfalto tá te chamando. Mostra que tu tem sangue de ${rank}. Valendo!`,
            `É agora! Conecta com o vento e deixa fluir. Tamo junto nessa missão, ${isMale ? 'mermão' : 'minha irmã'}!`
        ],
        pause: isRecovery ? [
            `Parou pra alongar? Boa. Sem pressa hoje.`,
            `Pausou? Tranquilo. Mantém a hidratação.`,
        ] : [
            `Segurou o ritmo? Tranquilo ${isMale ? 'irmão' : 'irmã'}, recupera o fôlego.`,
            `Pausou pra água de coco? Justo. Mas não esfria o corpo não, hein!`,
            `Calma, respira. O cronômetro parou, mas o foco continua.`,
        ],
        resume: isRecovery ? [
            `Voltando devagar. Deixa o sangue circular.`,
            `Isso, maciota. Sente o corpo soltar.`,
        ] : [
            `De volta pro jogo! Faca na caveira, bora!`,
            `Isso aí, retomando a missão! Mantém a postura de ${rank}.`,
            `Simbora! O vento voltou a soprar a favor.`,
        ],
        finish: isRecovery ? [
            `Aí sim. Corpo renovado, mente tranquila. Missão de recuperação cumprida!`,
            `Boa! É isso que teu corpo precisava. Amanhã tu volta mais forte.`,
        ] : [
            `Aí sim! Representou demais. Treino finalizado com sucesso!`,
            `Acabou, ${isMale ? 'campeão' : 'campeã'}! Missão cumprida. Agora tu merece aquele mate gelado.`,
            `Boa! Engoliu os quilômetros. Orgulho da equipe Filhos do Vento!`,
            `Que treino foi esse? Tu é ${isMale ? 'sinistro' : 'sinistra'} mesmo, hein?`
        ],
        motivation: isRecovery ? [
            `Relaxa os ombros. Deixa o ar entrar e sair.`,
            `Sem forçar hoje. O ganho vem no descanso.`,
            `Sente o vento acariciar o rosto. É terapia, não é guerra hoje.`,
            `Mantém o trote leve. Se tiver difícil, caminha um pouco.`,
            `Escuta teu corpo. Ele tá te agradecendo por esse cuidado.`
        ] : [
            `Não deixa cair! Você é um Filho do Vento, caraca!`,
            `Bora ${isMale ? 'meu consagrado' : 'minha consagrada'}! A dor passa, o orgulho fica!`,
            `Sente a brisa no rosto e acelera essa perna! Tu é nível ${rank}!`,
            `Tá pensando em parar? Nem vem! Foco na meta!`,
            `Ritmo de cruzeiro! Ninguém te pega hoje!`,
            `Vamo que vamo! Suor é a gordura chorando!`,
            `Engole esse choro e corre! Tu é ${isMale ? 'brabo' : 'braba'} demais!`,
            `Lembra do teu objetivo. A cada passo tu chega mais perto.`
        ],
        split: [
            `Quilômetro ${data?.km} já foi. Pace de ${data?.pace}. ${isRecovery ? 'Mantém leve.' : 'Segue o plano!'}`,
            `Passou o KM ${data?.km}. Ritmo ${data?.pace}. ${isRecovery ? 'Boa, sem acelerar.' : 'Tais voando baixo!'}`,
            `Mais um pra conta! KM ${data?.km} concluído.`
        ]
    };

    const options = SCRIPTS[category];
    return options[Math.floor(Math.random() * options.length)];
};

// --- VISUAL COMPONENTS ---

const VoiceVisualizer = ({ isActive }: { isActive: boolean }) => {
    if (!isActive) return null;
    return (
        <div className="flex items-center gap-1 h-4 animate-fade-in ml-2">
            <div className="w-1 bg-amber-400 rounded-full animate-[bounce_0.5s_infinite] h-full"></div>
            <div className="w-1 bg-amber-400 rounded-full animate-[bounce_0.7s_infinite] h-2/3"></div>
            <div className="w-1 bg-amber-400 rounded-full animate-[bounce_0.4s_infinite] h-full"></div>
            <div className="w-1 bg-amber-400 rounded-full animate-[bounce_0.6s_infinite] h-3/4"></div>
            <div className="w-1 bg-amber-400 rounded-full animate-[bounce_0.5s_infinite] h-full"></div>
        </div>
    );
};

const GpsStatus = ({ accuracy }: { accuracy: number | null }) => {
    // Accuracy is in meters. Lower is better.
    // < 10m: Excellent (3 bars, Green)
    // < 30m: Good (2 bars, Yellow)
    // > 30m: Weak (1 bar, Red)
    // null: Searching (Pulsing Gray)

    let color = "text-gray-500";
    let bars = 0;
    let label = "BUSCANDO";

    if (accuracy !== null) {
        if (accuracy <= 12) {
            color = "text-green-500";
            bars = 3;
            label = "GPS FORTE";
        } else if (accuracy <= 30) {
            color = "text-yellow-500";
            bars = 2;
            label = "GPS OK";
        } else {
            color = "text-red-500";
            bars = 1;
            label = "SINAL FRACO";
        }
    }

    return (
        <div className={`bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors`}>
            <div className="flex items-end gap-0.5 h-3">
                <div className={`w-1 rounded-sm ${bars >= 1 ? color : 'bg-gray-700'} h-1/3`}></div>
                <div className={`w-1 rounded-sm ${bars >= 2 ? color : 'bg-gray-700'} h-2/3`}></div>
                <div className={`w-1 rounded-sm ${bars >= 3 ? color : 'bg-gray-700'} h-full`}></div>
            </div>
            <span className={`text-[10px] font-bold ${accuracy === null ? 'animate-pulse text-gray-400' : color}`}>
                {label}
            </span>
        </div>
    );
};

const LongPressButton = ({ onComplete, children, className, fillClass = "bg-white/30" }: { onComplete: () => void, children?: React.ReactNode, className?: string, fillClass?: string }) => {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const isPressed = useRef(false);

    const startPress = () => {
        isPressed.current = true;
        setProgress(0);
        intervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(intervalRef.current!);
                    onComplete();
                    return 100;
                }
                // Slower fill: +1.5 per 20ms = ~1.3 seconds to fill
                return prev + 1.5; 
            });
        }, 20);
    };

    const endPress = () => {
        isPressed.current = false;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(0);
    };

    return (
        <button 
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            className={`relative overflow-hidden select-none active:scale-95 transition-transform ${className || ''}`}
        >
            <div 
                className={`absolute left-0 top-0 bottom-0 transition-all duration-75 ease-linear ${fillClass}`}
                style={{ width: `${progress}%` }}
            ></div>
            <div className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
                {children}
            </div>
        </button>
    );
};

const PaceGraph = ({ isActive, paceValue }: { isActive: boolean, paceValue: number }) => {
    const [bars, setBars] = useState<number[]>(Array(20).fill(10));

    useEffect(() => {
        if(!isActive) return;
        const interval = setInterval(() => {
            setBars(prev => {
                const newBar = Math.max(10, Math.min(100, Math.random() * 50 + (paceValue > 0 ? 30 : 0)));
                return [...prev.slice(1), newBar];
            });
        }, 200);
        return () => clearInterval(interval);
    }, [isActive, paceValue]);

    return (
        <div className="flex items-end justify-between gap-1 h-12 w-full opacity-50">
            {bars.map((h, i) => (
                <div 
                    key={i} 
                    className="w-2 bg-amber-500 rounded-t-sm transition-all duration-200 ease-out"
                    style={{ height: `${h}%` }}
                ></div>
            ))}
        </div>
    );
};

// --- MAP COMPONENT ---
interface LiveMapProps { 
    route: RoutePoint[]; 
    isPaused: boolean; 
    polylineColor?: string; 
    initialCenter?: [number, number];
    onRef?: (map: L.Map) => void 
}

export const LiveMap: React.FC<LiveMapProps> = ({ route, isPaused, polylineColor = '#f59e0b', initialCenter, onRef }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userInteractingRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Rio de Janeiro
    const center: [number, number] = initialCenter || [-22.9068, -43.1729];

    // Increased zoom level to 17 for better street details
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
    }).setView(center, 17); 

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      opacity: 0.8
    }).addTo(map);

    map.on('dragstart', () => { userInteractingRef.current = true; });
    mapInstanceRef.current = map;
    if (onRef) onRef(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle initialCenter changes if passed
  useEffect(() => {
      if (mapInstanceRef.current && initialCenter) {
          mapInstanceRef.current.flyTo(initialCenter, 17);
      }
  }, [initialCenter]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latlngs = route.map(p => [p.lat, p.lng] as [number, number]);

    if (latlngs.length > 0) {
      if (!polylineRef.current) {
        polylineRef.current = L.polyline(latlngs, {
          color: polylineColor,
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        } as any).addTo(map);
      } else {
        polylineRef.current.setLatLngs(latlngs);
        polylineRef.current.setStyle({ color: polylineColor });
      }

      const lastPoint = latlngs[latlngs.length - 1];
      
      if (!markerRef.current) {
        const radarIcon = L.divIcon({
            className: '',
            html: `
              <div class="relative w-6 h-6">
                <div class="absolute inset-0 bg-[${polylineColor}] rounded-full opacity-75 animate-ping"></div>
                <div class="relative bg-[${polylineColor}] w-full h-full rounded-full border-2 border-white shadow-lg"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        markerRef.current = L.marker(lastPoint, { icon: radarIcon }).addTo(map);
      } else {
        // Update existing marker position
        markerRef.current.setLatLng(lastPoint);
        
        // Update color if needed (re-creating icon to update color string)
        const newIcon = L.divIcon({
            className: '',
            html: `
              <div class="relative w-6 h-6">
                <div class="absolute inset-0 bg-[${polylineColor}] rounded-full opacity-75 animate-ping"></div>
                <div class="relative bg-[${polylineColor}] w-full h-full rounded-full border-2 border-white shadow-lg"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        markerRef.current.setIcon(newIcon);
      }

      if (!isPaused && !userInteractingRef.current) {
        map.panTo(lastPoint, { animate: true, duration: 1.0, easeLinearity: 0.25 });
      } else if (isPaused && latlngs.length > 1) {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
      }
    }
  }, [route, isPaused, polylineColor]);

  return <div ref={mapContainerRef} className="w-full h-full bg-[#050505] z-0" />;
};

export const LiveRun: React.FC<LiveRunProps> = ({ onSaveActivity, addNotification, currentUser, playSound }) => {
  const [screen, setScreen] = useState<'select' | 'active' | 'finish'>('select');
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>('run');
  const [dailyGoal, setDailyGoal] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isLocked, setIsLocked] = useState(false); 
  const [isSpeaking, setIsSpeaking] = useState(false); 
  
  // Music State
  const [showSpotify, setShowSpotify] = useState(false);
  const [isSpotifyExpanded, setIsSpotifyExpanded] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Telemetry State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [currentPaceInstant, setCurrentPaceInstant] = useState("--'--");
  const [elevationGain, setElevationGain] = useState(0);
  const [calories, setCalories] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  
  const [lastSplitTime, setLastSplitTime] = useState(0);
  const [currentSplitPace, setCurrentSplitPace] = useState("--'--");

  const [feeling, setFeeling] = useState<Activity['feeling']>('good');
  const [notes, setNotes] = useState('');

  // Refs
  const mapRef = useRef<L.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const lastPauseStartRef = useRef<number>(0);
  const lastSpokenKmRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);
  const lastAltitudeRef = useRef<number | null>(null);
  
  const xpEarned = Math.floor(distance * 10);

  // Generate goal on mount
  useEffect(() => {
      setDailyGoal(generateSmartGoal(currentUser));
  }, [currentUser]);

  // --- NATIVE TTS ENGINE ---
  const speak = (text: string, priority: boolean = false) => {
      if (!isVoiceEnabled) return;
      if (isSpeaking && !priority) return; 
      
      if (priority) window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      // Adjust rate/pitch for recovery mode to be calmer
      if (selectedMode === 'recovery') {
          utterance.rate = 0.95;
          utterance.pitch = 0.9;
      } else {
          utterance.rate = 1.15; 
          utterance.pitch = 1.0; 
      }
      utterance.volume = 1.0; 

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
          (v.name.includes("Google") && v.lang.includes("pt-BR")) || 
          v.lang === "pt-BR"
      );
      
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
  };

  const playMotivation = () => {
      if (!currentUser) return;
      const phrase = getVoiceScript('motivation', currentUser.gender, currentUser.rank, selectedMode);
      speak(phrase, true);
  };

  const formatPace = (secPerKm: number) => {
      if (secPerKm === 0 || secPerKm > 3600 || !isFinite(secPerKm)) return "--'--";
      const min = Math.floor(secPerKm / 60);
      const sec = Math.round(secPerKm % 60);
      return `${min}'${sec.toString().padStart(2, '0')}"`;
  };

  const formatTime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isActive || isPaused || screen !== 'active' || !currentUser) return;
    const currentKm = Math.floor(distance);
    
    // Update Calories (approx 1kcal/kg/km)
    // Default weight 70kg if not tracked elsewhere (could be added to profile)
    const weight = 70; 
    setCalories(Math.round(distance * weight));

    // Calculate Live Pace for Current KM (Split Pace)
    if (distance > 0 && elapsedSeconds > 0) {
        // This is average pace, for instant pace we use GPS speed
        const avgPaceVal = elapsedSeconds / distance;
        setCurrentSplitPace(formatPace(avgPaceVal));
    }

    if (currentKm > lastSpokenKmRef.current) {
        const kmTime = elapsedSeconds - lastSplitTime;
        const kmPace = formatPace(kmTime);
        
        setLastSplitTime(elapsedSeconds);
        lastSpokenKmRef.current = currentKm;
        
        const paceSec = elapsedSeconds / distance;
        const paceTxt = formatPace(paceSec).replace("'", " minutos e ").replace('"', " segundos");
        
        const phrase = getVoiceScript('split', currentUser.gender, currentUser.rank, selectedMode, { km: currentKm, pace: paceTxt });
        speak(phrase, true);
        
        if(playSound) playSound('success');
    }
  }, [distance, elapsedSeconds, isActive, isPaused, screen]);

  const startRun = async () => {
      if(playSound) playSound('start');
      if(!currentUser) return;
      
      setScreen('active');
      setIsActive(true);
      setIsPaused(false);
      setIsLocked(false);
      
      setShowSpotify(true);
      setIsSpotifyExpanded(false);

      if ('wakeLock' in navigator) (navigator as any).wakeLock.request('screen').then((l: any) => wakeLockRef.current = l).catch(() => {});
      
      const startPhrase = getVoiceScript('start', currentUser.gender, currentUser.rank, selectedMode);
      speak(startPhrase, true);
      
      startTimeRef.current = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000));
      }, 1000);

      watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
              setGpsAccuracy(pos.coords.accuracy); // Update accuracy even if filtered
              
              if (pos.coords.accuracy > 30) return;
              
              // --- TELEMETRY ---
              const speedMps = pos.coords.speed || 0;
              const speedKmh = speedMps * 3.6;
              if (speedKmh > maxSpeed) setMaxSpeed(speedKmh);

              // Instant Pace (from GPS speed)
              if (speedMps > 0.5) { // Threshold to avoid noise when stopped
                  const paceSecPerKm = 1000 / speedMps;
                  setCurrentPaceInstant(formatPace(paceSecPerKm));
              } else {
                  setCurrentPaceInstant("--'--");
              }

              // Elevation Gain
              const currentAlt = pos.coords.altitude;
              if (currentAlt !== null && lastAltitudeRef.current !== null) {
                  const diff = currentAlt - lastAltitudeRef.current;
                  // Filter small fluctuations (GPS vertical accuracy is poor)
                  if (diff > 1.5) { 
                      setElevationGain(prev => prev + diff);
                  }
              }
              if (currentAlt !== null) lastAltitudeRef.current = currentAlt;

              const pt: RoutePoint = { 
                  lat: pos.coords.latitude, 
                  lng: pos.coords.longitude, 
                  timestamp: pos.timestamp,
                  altitude: pos.coords.altitude,
                  speed: pos.coords.speed 
              };

              setRoute(prev => {
                  if (prev.length === 0) return [pt];
                  const last = prev[prev.length - 1];
                  const R = 6371; 
                  const dLat = (pt.lat - last.lat) * (Math.PI/180);
                  const dLon = (pt.lng - last.lng) * (Math.PI/180);
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(last.lat * (Math.PI/180)) * Math.cos(pt.lat * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  const d = R * c;
                  
                  if (d > 0.003) { 
                      setDistance(curr => curr + d);
                      return [...prev, pt];
                  }
                  return prev;
              });
          },
          err => console.warn(err),
          { enableHighAccuracy: true }
      );
  };

  const pauseRun = () => {
      if(playSound) playSound('click');
      if(!currentUser) return;
      setIsPaused(true);
      const phrase = getVoiceScript('pause', currentUser.gender, currentUser.rank, selectedMode);
      speak(phrase, true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      lastPauseStartRef.current = Date.now();
  };

  const resumeRun = () => {
      if(playSound) playSound('click');
      if(!currentUser) return;
      setIsPaused(false);
      const phrase = getVoiceScript('resume', currentUser.gender, currentUser.rank, selectedMode);
      speak(phrase, true);
      totalPausedTimeRef.current += Date.now() - lastPauseStartRef.current;
      lastPauseStartRef.current = 0;
      timerIntervalRef.current = window.setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current - totalPausedTimeRef.current) / 1000));
      }, 1000);
      watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
              setGpsAccuracy(pos.coords.accuracy);
              if (pos.coords.accuracy > 30) return;
              const pt: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: pos.timestamp };
              setRoute(prev => {
                  if (prev.length === 0) return [pt];
                  const last = prev[prev.length - 1];
                  const R = 6371; 
                  const dLat = (pt.lat - last.lat) * (Math.PI/180);
                  const dLon = (pt.lng - last.lng) * (Math.PI/180);
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(last.lat * (Math.PI/180)) * Math.cos(pt.lat * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  const d = R * c;
                  if (d > 0.003) { 
                      setDistance(curr => curr + d);
                      return [...prev, pt];
                  }
                  return prev;
              });
          }, 
          () => {}, 
          { enableHighAccuracy: true }
      );
  };

  const endRun = () => {
      if(playSound) playSound('success');
      if(!currentUser) return;
      pauseRun();
      setScreen('finish');
      const phrase = getVoiceScript('finish', currentUser.gender, currentUser.rank, selectedMode);
      speak(phrase, true);
  };

  const saveRun = () => {
      if(playSound) playSound('success');
      onSaveActivity({
          distanceKm: parseFloat(distance.toFixed(2)),
          durationMin: Math.ceil(elapsedSeconds / 60),
          pace: formatPace(elapsedSeconds / (distance || 1)),
          elevationGain: Math.round(elevationGain),
          calories: calories,
          maxSpeed: parseFloat(maxSpeed.toFixed(1)),
          date: new Date().toISOString().split('T')[0],
          feeling,
          notes,
          route,
          mode: selectedMode
      });
      cleanup();
  };

  const cleanup = () => {
      setScreen('select');
      setIsActive(false);
      setRoute([]);
      setDistance(0);
      setElapsedSeconds(0);
      setIsLocked(false);
      setShowShareModal(false);
      setElevationGain(0);
      setCalories(0);
      setMaxSpeed(0);
      if (wakeLockRef.current) wakeLockRef.current.release();
  };

  const handleRecenter = () => {
      if (mapRef.current && route.length > 0) {
          const lastPoint = route[route.length - 1];
          mapRef.current.panTo([lastPoint.lat, lastPoint.lng], { animate: true });
          if(playSound) playSound('click');
      }
  };

  // --- SELECT SCREEN ---
  if (screen === 'select') {
      return (
          <div className="h-full bg-gray-950 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
              
              <div className="p-6 z-10">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                          <Cloud className="text-gray-400" size={20} />
                      </div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sala de Controle</h2>
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-widest uppercase pl-1">Configuração de Voo</p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar z-10 space-y-6">
                  
                  {/* DAILY GOAL CARD */}
                  <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/40 p-6 rounded-2xl border border-amber-500/30 relative overflow-hidden shadow-lg animate-fade-in">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Target size={80} />
                      </div>
                      <div className="relative z-10">
                          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                              <Award size={16} /> Meta do Dia
                          </h3>
                          <p className="text-xl font-bold text-white leading-relaxed italic">
                              "{dailyGoal}"
                          </p>
                      </div>
                  </div>

                  {/* MODE SELECTOR */}
                  <div>
                      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Wind size={14} /> Estampa de Vento
                      </h3>
                      <div className="space-y-4">
                        {(Object.keys(WIND_PATTERNS) as WorkoutMode[]).map(mode => {
                            const cfg = WIND_PATTERNS[mode];
                            const isSelected = selectedMode === mode;
                            
                            return (
                                <div 
                                    key={mode}
                                    onClick={() => {
                                        if(playSound) playSound('click');
                                        setSelectedMode(mode);
                                    }}
                                    className={`relative rounded-2xl transition-all duration-500 cursor-pointer border overflow-hidden group
                                        ${isSelected ? `h-60 border-transparent shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-2 ring-offset-2 ring-offset-gray-950 ${cfg.theme.split(' ')[1].replace('/30', '')}` : 'h-28 border-gray-800 opacity-60 hover:opacity-100'}`}
                                >
                                    <div className={`absolute inset-0 ${cfg.pattern} transition-opacity duration-500`}></div>
                                    {isSelected && (
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
                                    )}

                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`text-2xl font-black uppercase tracking-tight italic transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                    {cfg.title}
                                                </h3>
                                                <p className={`text-xs font-bold uppercase tracking-widest mt-1 transition-colors ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                                                    {cfg.subtitle}
                                                </p>
                                            </div>
                                            <div className={`p-3 rounded-full border backdrop-blur-sm transition-all duration-500 ${isSelected ? 'bg-white/10 border-white/20 text-white scale-110 rotate-12' : 'bg-black/20 border-white/5 text-gray-600'}`}>
                                                <cfg.icon size={isSelected ? 28 : 24} strokeWidth={2} />
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="animate-fade-in mt-auto flex flex-col gap-4">
                                                <p className="text-sm text-gray-200 font-medium leading-relaxed border-l-2 border-white/30 pl-3">
                                                    {cfg.description}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startRun();
                                                        }}
                                                        className="flex-1 bg-white hover:bg-gray-200 text-black font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 relative overflow-hidden group/btn"
                                                    >
                                                        <div className="absolute inset-0 bg-amber-400 opacity-0 group-hover/btn:opacity-20 transition-opacity animate-pulse"></div>
                                                        <Play fill="black" size={16} /> INICIAR SESSÃO
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- ACTIVE SCREEN (HUD) ---
  if (screen === 'active') {
      const cfg = WIND_PATTERNS[selectedMode];
      const pace = distance > 0 ? elapsedSeconds / distance : 0;

      return (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col select-none">
              {/* LOCK OVERLAY */}
              {isLocked && (
                  <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in">
                      <div className="bg-gray-900 p-6 rounded-full mb-8 shadow-2xl border border-gray-700 animate-bounce-slow">
                          <Lock size={64} className="text-white" />
                      </div>
                      <h3 className="text-white font-black text-2xl uppercase tracking-widest mb-12">Tela Bloqueada</h3>
                      
                      <LongPressButton 
                        onComplete={() => {
                            if(playSound) playSound('success');
                            setIsLocked(false);
                        }}
                        className="w-64 h-20 rounded-full bg-gray-800 border border-gray-600"
                      >
                          <Unlock size={24} className="text-white" />
                          <span className="text-white font-bold uppercase tracking-wider">Segure p/ Destravar</span>
                      </LongPressButton>
                  </div>
              )}

              <div className="absolute inset-0 z-0">
                  <LiveMap route={route} isPaused={isPaused} polylineColor={cfg.hexColor} onRef={(map) => mapRef.current = map} />
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
              </div>

              {/* HUD TOP */}
              <div className="relative z-10 pt-safe-top px-4 pb-4 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-auto">
                  <div className="flex items-center gap-2">
                      <GpsStatus accuracy={gpsAccuracy} />
                      
                      {isSpeaking && (
                          <div className="bg-blue-500/20 backdrop-blur-md border border-blue-500/50 px-3 py-1.5 rounded-full flex items-center gap-2 animate-fade-in">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                              <VoiceVisualizer isActive={isSpeaking} />
                          </div>
                      )}
                  </div>

                  <div className="flex gap-2">
                      <button 
                        onClick={handleRecenter}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/10 backdrop-blur text-white active:scale-95 transition-transform"
                      >
                          <Crosshair size={18} />
                      </button>
                      <button 
                        onClick={() => { if(playSound) playSound('click'); setIsLocked(true); }} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/10 backdrop-blur text-white active:scale-95 transition-transform"
                      >
                          <Lock size={18} />
                      </button>
                      <button 
                        onClick={() => { if(playSound) playSound('click'); setIsVoiceEnabled(!isVoiceEnabled); }} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-white/10 backdrop-blur text-white active:scale-95 transition-transform relative"
                      >
                          {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-red-500" />}
                      </button>
                  </div>
              </div>

              {/* Floating Pace Graph */}
              <div className="relative z-10 px-6 mt-4">
                  <PaceGraph isActive={!isPaused} paceValue={distance > 0 ? (distance/elapsedSeconds)*3600 : 0} />
              </div>

              {/* PLAYER CONTAINER & HUD BOTTOM */}
              <div className="flex-1 relative">
                  
                  {/* SPOTIFY EMBEDDED PLAYER */}
                  {showSpotify && (
                      <SpotifyPlayer 
                        embedId={cfg.spotifyEmbedId} 
                        isExpanded={isSpotifyExpanded} 
                        onToggle={() => setIsSpotifyExpanded(!isSpotifyExpanded)}
                      />
                  )}

                  {/* SPOTIFY TOGGLE BUTTON */}
                  {!showSpotify && (
                      <div className="absolute bottom-36 right-4 z-20 pointer-events-auto">
                          <button
                              onClick={() => setShowSpotify(true)}
                              className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-fade-in border border-white/20"
                          >
                              <Music size={24} className="text-white" />
                          </button>
                      </div>
                  )}

                  {/* HUD BOTTOM CONTROLS & TELEMETRY */}
                  <div className="absolute bottom-0 left-0 right-0 z-40 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800 rounded-t-[3rem] px-6 pb-10 pt-8 shadow-[0_-10px_60px_rgba(0,0,0,1)] pointer-events-auto flex flex-col gap-6">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full"></div>
                      
                      {/* Primary Stats */}
                      <div className="grid grid-cols-3 gap-4 divide-x divide-gray-800">
                          <div className="text-center">
                              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Distância</div>
                              <div className="text-5xl md:text-6xl font-black text-white font-mono leading-none tracking-tighter">
                                  {distance.toFixed(2)}
                              </div>
                              <div className="text-[9px] text-amber-500 font-bold uppercase mt-1">km</div>
                          </div>
                          <div className="text-center">
                              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tempo</div>
                              <div className="text-5xl md:text-6xl font-bold text-white font-mono leading-none tracking-tighter">
                                  {formatTime(elapsedSeconds)}
                              </div>
                              <div className="text-[9px] text-amber-500 font-bold uppercase mt-1">total</div>
                          </div>
                          <div className="text-center">
                              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ritmo (Avg)</div>
                              <div className="text-5xl md:text-6xl font-bold text-cyan-400 font-mono leading-none tracking-tighter">
                                  {currentSplitPace}
                              </div>
                              <div className="text-[9px] text-cyan-600 font-bold uppercase mt-1">/km</div>
                          </div>
                      </div>

                      {/* Secondary Telemetry (Strava-like) */}
                      <div className="grid grid-cols-3 gap-2 bg-black/30 p-3 rounded-xl border border-white/5">
                          <div className="flex flex-col items-center justify-center border-r border-white/10">
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                                  <Mountain size={10} /> Elevação
                              </div>
                              <span className="text-lg font-mono font-bold text-white">+{Math.round(elevationGain)}m</span>
                          </div>
                          <div className="flex flex-col items-center justify-center border-r border-white/10">
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                                  <Flame size={10} /> Calorias
                              </div>
                              <span className="text-lg font-mono font-bold text-white">{calories}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center">
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                                  <Gauge size={10} /> Instantâneo
                              </div>
                              <span className="text-lg font-mono font-bold text-white">{currentPaceInstant}</span>
                          </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                          {isPaused ? (
                              <>
                                <LongPressButton 
                                    onComplete={endRun} 
                                    fillClass="bg-red-500/50"
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold uppercase tracking-wide border border-gray-700"
                                >
                                    <Square size={24} fill="white" /> 
                                    <span className="text-[10px]">Segure p/ Fim</span>
                                </LongPressButton>
                                <button onClick={resumeRun} className="flex-[2] bg-white hover:bg-gray-200 text-black h-20 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.2)] text-lg">
                                    <Play size={28} fill="black" /> Retomar
                                </button>
                              </>
                          ) : (
                              <div className="flex items-center gap-4 w-full">
                                  <button 
                                    onClick={pauseRun} 
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold uppercase tracking-wide border border-gray-700 transition-all"
                                  >
                                      <Pause size={28} fill="white" />
                                      <span className="text-[10px]">Pausar</span>
                                  </button>
                                  
                                  <button 
                                    onClick={playMotivation}
                                    className="flex-[2] bg-amber-500 hover:bg-amber-400 text-black h-20 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95 transition-transform text-lg"
                                  >
                                      <Mic size={28} /> Motivação
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- FINISH SCREEN ---
  if (screen === 'finish') {
      return (
          <div className="h-full bg-black p-6 flex flex-col overflow-y-auto custom-scrollbar">
              {showShareModal && (
                  <SocialShareModal 
                      isOpen={showShareModal} 
                      onClose={() => setShowShareModal(false)} 
                      data={{
                          distance: `${distance.toFixed(2)} km`,
                          time: formatTime(elapsedSeconds),
                          pace: `${formatPace(elapsedSeconds / (distance || 1))}/km`
                      }}
                      route={route}
                  />
              )}
              
              <div className="text-center my-8 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                      <Flag size={40} className="text-white" fill="currentColor" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase italic">Missão Cumprida!</h2>
                  <p className="text-gray-400 text-sm mt-2">Dados salvos na caixa preta.</p>
                  <div className="mt-4 inline-block bg-yellow-500/20 border border-yellow-500/50 px-4 py-1 rounded-full">
                      <p className="text-yellow-400 font-black text-sm flex items-center gap-2">
                          <Zap size={14} fill="currentColor" /> +{xpEarned} XP Obtidos
                      </p>
                  </div>
              </div>

              <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-800 mb-6">
                      <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Distância</p>
                          <p className="text-2xl font-black text-white">{distance.toFixed(2)}</p>
                          <p className="text-[9px] text-amber-500">KM</p>
                      </div>
                      <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tempo</p>
                          <p className="text-2xl font-black text-white">{formatTime(elapsedSeconds)}</p>
                          <p className="text-[9px] text-amber-500">TOTAL</p>
                      </div>
                      <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Pace</p>
                          <p className="text-2xl font-black text-white">{formatPace(elapsedSeconds / (distance || 1))}</p>
                          <p className="text-[9px] text-amber-500">MÉDIO</p>
                      </div>
                  </div>
                  
                  {/* Telemetry Summary */}
                  <div className="grid grid-cols-3 gap-2 bg-black/30 p-4 rounded-xl border border-gray-700">
                      <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                              <Mountain size={12} /> Elev
                          </div>
                          <span className="text-sm font-mono font-bold text-white">+{Math.round(elevationGain)}m</span>
                      </div>
                      <div className="text-center border-l border-gray-700 pl-2">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                              <Flame size={12} /> Cal
                          </div>
                          <span className="text-sm font-mono font-bold text-white">{calories}</span>
                      </div>
                      <div className="text-center border-l border-gray-700 pl-2">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase mb-1">
                              <Gauge size={12} /> Max
                          </div>
                          <span className="text-sm font-mono font-bold text-white">{maxSpeed.toFixed(1)} km/h</span>
                      </div>
                  </div>
              </div>

              {/* Social Share Button Area */}
              <div className="mb-6">
                  <button 
                      onClick={() => setShowShareModal(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wide transition-all"
                  >
                      <Share2 size={18} /> Gerar Card Social
                  </button>
              </div>

              <div className="space-y-6 flex-1">
                  <div>
                      <label className="text-gray-500 text-xs uppercase font-bold mb-3 block pl-1">Sensação Térmica</label>
                      <div className="flex justify-between gap-2">
                          {(['great', 'good', 'hard', 'pain'] as const).map((f) => (
                              <button
                                  key={f}
                                  onClick={() => {
                                      if(playSound) playSound('click');
                                      setFeeling(f);
                                  }}
                                  className={`flex-1 aspect-square rounded-2xl text-2xl flex items-center justify-center border-2 transition-all ${
                                      feeling === f 
                                      ? 'bg-amber-500 border-amber-500 scale-105 shadow-lg text-black' 
                                      : 'bg-gray-900 border-gray-800 text-gray-600 grayscale hover:grayscale-0'
                                  }`}
                              >
                                  {f === 'great' ? '🤩' : f === 'good' ? '🙂' : f === 'hard' ? '🥵' : '🤕'}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="text-gray-500 text-xs uppercase font-bold mb-3 block pl-1">Notas de Voo</label>
                      <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Condições da pista? Vento contra?..."
                          className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 text-white text-sm focus:border-amber-500 outline-none h-24 resize-none placeholder-gray-700"
                      />
                  </div>
              </div>

              <div className="mt-8 space-y-3">
                  <button 
                      onClick={saveRun}
                      className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-2xl shadow-lg text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                      <CheckCircle size={20} /> Registrar Voo
                  </button>
                  <button 
                      onClick={() => {
                          if(playSound) playSound('click');
                          setScreen('select');
                      }}
                      className="w-full py-3 text-gray-600 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                      Descartar
                  </button>
              </div>
          </div>
      );
  }

  return null;
};
