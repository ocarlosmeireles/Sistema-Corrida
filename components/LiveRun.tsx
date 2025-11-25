
import React, { useState, useEffect, useRef, memo } from 'react';
import { Activity, RoutePoint, Notification, Member, WorkoutMode, SoundType } from '../types';
import { Play, Pause, Square, Flag, CheckCircle, Zap, Wind, Mountain, Footprints, Cloud, Tornado, Lock, Unlock, Crosshair, Mic, Target, Award, Share2, Volume2, VolumeX, X, Image as ImageIcon, Download, Loader2, Music, ChevronUp, ChevronDown, Flame, Activity as ActivityIcon, Gauge, Feather, Signal, Maximize, Minimize, Megaphone } from 'lucide-react';
import * as L from 'leaflet';
import { SocialShareModal } from './SocialShareModal';

interface LiveRunProps {
  onSaveActivity: (activity: Omit<Activity, 'id'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  currentUser?: Member;
  playSound?: (type: SoundType) => void;
}

// ... (SpotifyPlayer code remains the same, omitted for brevity but assumed present) ...
const SpotifyPlayer = memo(({ embedId, isExpanded, onToggle }: { embedId: string, isExpanded: boolean, onToggle: () => void }) => {
    return (
        <div 
            className={`absolute bottom-36 left-4 right-4 z-30 transition-all duration-500 ease-in-out ${isExpanded ? 'h-[350px]' : 'h-[80px]'}`}
        >
            <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
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
                <div className="flex-1 bg-black relative">
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
        spotifyEmbedId: "37i9dQZF1DX3qCx5yEZkcJ"
    },
    jog: { 
        title: "Vento Alísio", 
        subtitle: "Ritmo Constante",
        icon: Wind, 
        theme: "text-emerald-400 border-emerald-500/30", 
        pattern: "bg-gradient-to-br from-emerald-900/40 to-teal-900/20",
        description: "Fluxo contínuo e eficiente. Construção de base aeróbica.",
        hexColor: "#34d399",
        spotifyEmbedId: "37i9dQZF1DXadOVCgGhS7j"
    },
    run: { 
        title: "Rajada Forte", 
        subtitle: "Alta Intensidade",
        icon: Zap, 
        theme: "text-amber-500 border-amber-500/30", 
        pattern: "bg-gradient-to-br from-amber-900/40 to-orange-900/20",
        description: "Corte o ar. Treino principal de ganho de performance.",
        hexColor: "#f59e0b",
        spotifyEmbedId: "37i9dQZF1DX7Z7kYpbkT4D"
    },
    sprint: { 
        title: "Tempestade", 
        subtitle: "Explosão Máxima",
        icon: Tornado, 
        theme: "text-red-500 border-red-500/30", 
        pattern: "bg-gradient-to-br from-red-900/40 to-purple-900/20",
        description: "Tiros curtos e violentos. Elevando o VO2 Max ao limite.",
        hexColor: "#ef4444",
        spotifyEmbedId: "37i9dQZF1DX6GwdWRQMQpq"
    },
    long_run: { 
        title: "Corrente de Jato", 
        subtitle: "Resistência Pura",
        icon: Mountain, 
        theme: "text-indigo-400 border-indigo-500/30", 
        pattern: "bg-gradient-to-br from-indigo-900/40 to-violet-900/20",
        description: "Altitude de cruzeiro por longas distâncias. Mentalidade de aço.",
        hexColor: "#818cf8",
        spotifyEmbedId: "37i9dQZF1DX9XIFQuFvzM4"
    },
    recovery: {
        title: "Brisa Curativa",
        subtitle: "Recuperação Ativa",
        icon: Feather,
        theme: "text-blue-300 border-blue-300/30",
        pattern: "bg-gradient-to-br from-blue-900/40 to-teal-900/20",
        description: "Movimento regenerativo. Foco em soltar a musculatura e limpar o ácido lático.",
        hexColor: "#93c5fd",
        spotifyEmbedId: "37i9dQZF1DWV7EzJMK2FUI"
    }
};

// --- CARIOCA DICTIONARY (NO AI - PURE SOUL) ---
const CARIOCA_DICT = {
    start: [
        "Coé rapaziada! Filhos do Vento na pista. Decola!",
        "Fala tu! Hora de separar os crianças dos adultos. Arrebenta!",
        "Já é! Aquece os motores que o asfalto tá chamando.",
        "Atenção tripulação, tempo bom no Aterro. Vamo voar baixo!",
        "Bora, sangue bom! Hoje é dia de bater recorde."
    ],
    pause: [
        "Ué, parou por quê? Tá pegando fôlego ou admirando a paisagem?",
        "Pausa pro mate? Beleza, mas não esfria o motor não!",
        "Segurou o ritmo? Tranquilo, respira fundo que a gente volta já.",
        "O vento parou? Que nada, recupera aí guerreiro."
    ],
    resume: [
        "Isso aí! De volta ao jogo. Acelera!",
        "Bora retomar essa bronca! Foco total!",
        "É isso mermão, desistir não é opção. Voa!",
        "Sente o vento na cara de novo. É a melhor sensação do mundo."
    ],
    finish: [
        "Que isso! Tirou onda demais hoje! Treino pago com sucesso.",
        "Esquece! Tu é uma máquina. Merece aquele açaí reforçado.",
        "Final de prova! Mandou muito bem, representou os Filhos do Vento.",
        "Acabou! Agora é só resenha e descanso. Tu é sinistro!"
    ],
    motivation: {
        male: [
            "Bora, meu parceiro! Mostra que tu é cria!",
            "Acelera, malandro! Tá num ritmo de passeio no shopping?",
            "Isso aí, guerreiro! Mantém a postura de quem manda na pista!",
            "Fala, irmão! Transforma essa brisa em um furacão!",
            "Tu é máquina ou não é? Bota pra quebrar!",
            "Não deixa o ritmo cair, moleque! Tá voando!",
            "Passada larga, respiração controlada. Tu é o dono da orla!"
        ],
        female: [
            "Bora, minha parceira! Mostra a força da natureza!",
            "Acelera, braba! Deixa todo mundo comendo poeira!",
            "Isso aí, guerreira! Postura de rainha do asfalto!",
            "Fala, musa! Transforma essa brisa em tempestade!",
            "Tu é poderosa ou não é? Arrebenta, gata!",
            "Mantém o foco, irmã! Tá linda a passada!",
            "Não para não! Tu nasceu pra brilhar nessa pista!"
        ],
        neutral: [
            "Esquece! O ritmo tá insano!",
            "Sente a maresia e vai! O Rio é nosso!",
            "Pique de trem bala! Ninguém te pega hoje!",
            "Se o vento tá contra, a gente fura ele na marra!",
            "Tá fluindo igual água, continua assim!",
            "Deixa de ser brisa e vira logo um Tufão!",
            "Foca na linha de chegada, o resto é paisagem!"
        ]
    }
};

const getCariocaMessage = (category: 'start' | 'pause' | 'resume' | 'finish' | 'motivation', gender: 'male' | 'female' = 'male') => {
    let pool: string[] = [];
    
    if (category === 'motivation') {
        const genderPhrases = gender === 'female' ? CARIOCA_DICT.motivation.female : CARIOCA_DICT.motivation.male;
        pool = [...CARIOCA_DICT.motivation.neutral, ...genderPhrases];
    } else {
        pool = CARIOCA_DICT[category];
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
};

const GpsStatus = ({ accuracy }: { accuracy: number | null }) => {
    let color = "text-gray-500";
    let bars = 0;
    let label = "BUSCANDO";

    if (accuracy !== null) {
        if (accuracy <= 12) { color = "text-green-500"; bars = 3; label = "GPS FORTE"; } 
        else if (accuracy <= 30) { color = "text-yellow-500"; bars = 2; label = "GPS OK"; } 
        else { color = "text-red-500"; bars = 1; label = "SINAL FRACO"; }
    }

    return (
        <div className={`bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors`}>
            <div className="flex items-end gap-0.5 h-3">
                <div className={`w-1 rounded-sm ${bars >= 1 ? color : 'bg-gray-700'} h-1/3`}></div>
                <div className={`w-1 rounded-sm ${bars >= 2 ? color : 'bg-gray-700'} h-2/3`}></div>
                <div className={`w-1 rounded-sm ${bars >= 3 ? color : 'bg-gray-700'} h-full`}></div>
            </div>
            <span className={`text-[10px] font-bold ${accuracy === null ? 'animate-pulse text-gray-400' : color}`}>{label}</span>
        </div>
    );
};

const LongPressButton = ({ onComplete, children, className, fillClass = "bg-white/30" }: any) => {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<number | null>(null);

    const startPress = () => {
        setProgress(0);
        intervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(intervalRef.current!);
                    onComplete();
                    return 100;
                }
                return prev + 2; 
            });
        }, 20);
    };

    const endPress = () => {
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

// --- START TRANSITION COMPONENT ---
const WindTunnelOverlay = ({ active }: { active: boolean }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center overflow-hidden pointer-events-none">
            {/* Speed Lines */}
            {Array.from({ length: 20 }).map((_, i) => (
                <div 
                    key={i}
                    className="absolute h-[2px] bg-white/50 rounded-full animate-wind-rush"
                    style={{
                        top: `${Math.random() * 100}%`,
                        width: `${Math.random() * 300 + 100}px`,
                        left: `-${Math.random() * 500}px`,
                        animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        opacity: Math.random() * 0.8
                    }}
                ></div>
            ))}
            <div className="relative z-10 text-center animate-pulse">
                <Wind size={80} className="text-amber-500 mx-auto mb-4 animate-spin" style={{animationDuration: '0.5s'}} />
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Iniciando...</h2>
            </div>
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

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const center: [number, number] = initialCenter || [-22.9068, -43.1729];
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, dragging: true }).setView(center, 17); 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, opacity: 0.8 }).addTo(map);
    mapInstanceRef.current = map;
    if (onRef) onRef(map);
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const latlngs = route.map(p => [p.lat, p.lng] as [number, number]);
    if (latlngs.length > 0) {
      if (!polylineRef.current) {
        polylineRef.current = L.polyline(latlngs, { color: polylineColor, weight: 5, opacity: 0.8 }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(latlngs);
      }
      const lastPoint = latlngs[latlngs.length - 1];
      if (!markerRef.current) {
        const radarIcon = L.divIcon({
            className: '',
            html: `<div class="relative w-6 h-6"><div class="absolute inset-0 bg-[${polylineColor}] rounded-full opacity-75 animate-ping"></div><div class="relative bg-[${polylineColor}] w-full h-full rounded-full border-2 border-white shadow-lg"></div></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        });
        markerRef.current = L.marker(lastPoint, { icon: radarIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng(lastPoint);
      }
      if (!isPaused) map.panTo(lastPoint, { animate: true });
    }
  }, [route, isPaused]);

  return <div ref={mapContainerRef} className="w-full h-full bg-[#050505] z-0" />;
};

export const LiveRun: React.FC<LiveRunProps> = ({ onSaveActivity, addNotification, currentUser, playSound }) => {
  const [screen, setScreen] = useState<'select' | 'active' | 'finish'>('select');
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>('run');
  const [dailyGoal, setDailyGoal] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false); // Start Animation State
  const [isPaused, setIsPaused] = useState(false);
  
  // Telemetry & Other States...
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); // Seconds per km
  const [avgPace, setAvgPace] = useState(0); // Seconds per km
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [motivationalMsg, setMotivationalMsg] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const mapRef = useRef<L.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastAltitudeRef = useRef<number | null>(null);

  // Mock Goal
  useEffect(() => { setDailyGoal("Correr 5km sentindo a brisa."); }, []);

  // Load Voices for more natural sound
  useEffect(() => {
      const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
              setAvailableVoices(voices);
          }
      };
      
      // Initial load
      loadVoices();
      
      // Event listener for when voices are loaded (Chrome needs this)
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
          window.speechSynthesis.onvoiceschanged = null;
      };
  }, []);

  // Helper to toggle full screen
  const requestFullScreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => console.warn("Fullscreen denied:", err));
      }
  };

  // Helper for Audio Motivation (Natural Carioca Style)
  const speak = (text: string) => {
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // Cancel previous
          
          const utterance = new SpeechSynthesisUtterance(text);
          
          // 1. Voice Selection Strategy: Prioritize "Google Português do Brasil" or "Luciana" or "Joana"
          // These sound much better than the default Microsoft voices
          const ptVoices = availableVoices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt-PT'));
          const bestVoice = ptVoices.find(v => v.name.includes('Google')) || 
                            ptVoices.find(v => v.name.includes('Luciana')) || 
                            ptVoices.find(v => v.name.includes('Joana')) || 
                            ptVoices[0];
                            
          if (bestVoice) utterance.voice = bestVoice;
          
          utterance.lang = 'pt-BR';
          
          // 2. Prosody Variation (Humanization)
          // Vary speed slightly to sound less robotic
          const randomRate = 1.1 + Math.random() * 0.15; // 1.1 to 1.25 (Faster = more colloquial)
          utterance.rate = randomRate; 
          
          // Vary pitch slightly
          const randomPitch = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
          utterance.pitch = randomPitch;

          window.speechSynthesis.speak(utterance);
      }
  };

  const triggerMotivation = () => {
      const gender = currentUser?.gender || 'male';
      const phrase = getCariocaMessage('motivation', gender);
      setMotivationalMsg(phrase);
      speak(phrase);
      setTimeout(() => setMotivationalMsg(null), 6000);
  };

  const startRun = async () => {
      if(playSound) playSound('start'); 
      setIsStarting(true); 
      requestFullScreen(); 

      // Intro Message
      const intro = getCariocaMessage('start');
      speak(intro);

      // Delay actual screen switch
      setTimeout(() => {
          setScreen('active');
          setIsActive(true);
          setIsPaused(false);
          setIsStarting(false);
          
          // Start Logic
          startTimeRef.current = Date.now();
          timerIntervalRef.current = window.setInterval(() => {
              const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setElapsedSeconds(seconds);
          }, 1000);

          if (navigator.geolocation) {
              watchId.current = navigator.geolocation.watchPosition(
                  (pos) => {
                      setGpsAccuracy(pos.coords.accuracy);
                      if(pos.coords.accuracy > 35) return; // Filter bad GPS
                      
                      const speedMps = pos.coords.speed || 0; 
                      const instantPaceSec = speedMps > 0.5 ? (1000 / speedMps) : 0;
                      setCurrentPace(instantPaceSec);

                      const currentAlt = pos.coords.altitude;
                      if (currentAlt !== null && lastAltitudeRef.current !== null) {
                          const diff = currentAlt - lastAltitudeRef.current;
                          if (diff > 0.5) { 
                              setElevationGain(prev => prev + diff);
                          }
                      }
                      if (currentAlt !== null) lastAltitudeRef.current = currentAlt;

                      const pt: RoutePoint = { 
                          lat: pos.coords.latitude, 
                          lng: pos.coords.longitude, 
                          timestamp: pos.timestamp,
                          speed: speedMps,
                          altitude: currentAlt 
                      };

                      setRoute(prev => {
                          if (prev.length === 0) return [pt];
                          
                          const last = prev[prev.length - 1];
                          const R = 6371e3; 
                          const φ1 = last.lat * Math.PI/180;
                          const φ2 = pt.lat * Math.PI/180;
                          const Δφ = (pt.lat-last.lat) * Math.PI/180;
                          const Δλ = (pt.lng-last.lng) * Math.PI/180;
                          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                          const d = R * c; 
                          
                          if (d > 2) { 
                              const newTotalDistKm = (distance * 1000 + d) / 1000;
                              setDistance(newTotalDistKm);
                              
                              const weight = currentUser?.weight || 70;
                              setCalories(Math.floor(newTotalDistKm * weight * 1.036));

                              const totalTimeSec = (Date.now() - startTimeRef.current) / 1000;
                              if (newTotalDistKm > 0.05) {
                                  setAvgPace(totalTimeSec / newTotalDistKm);
                              }

                              return [...prev, pt];
                          }
                          return prev;
                      });
                  },
                  err => console.warn(err),
                  { enableHighAccuracy: true, maximumAge: 1000 }
              );
          }
      }, 2500); 
  };

  const pauseRun = () => {
      setIsPaused(true);
      speak(getCariocaMessage('pause'));
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const resumeRun = () => {
      setIsPaused(false);
      speak(getCariocaMessage('resume'));
      timerIntervalRef.current = window.setInterval(() => {
          setElapsedSeconds(prev => prev + 1); 
      }, 1000);
  };

  const endRun = () => {
      pauseRun();
      setScreen('finish');
      if(playSound) playSound('success');
      speak(getCariocaMessage('finish'));
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  };

  const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
      return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const formatPace = (secPerKm: number) => {
      if (!secPerKm || secPerKm === Infinity || secPerKm > 3600) return "--'--\"";
      const m = Math.floor(secPerKm / 60);
      const s = Math.floor(secPerKm % 60);
      return `${m}'${s.toString().padStart(2,'0')}"`;
  };

  // --- SELECT SCREEN ---
  if (screen === 'select') {
      return (
          <div className="h-full bg-gray-950 flex flex-col relative overflow-hidden">
              <WindTunnelOverlay active={isStarting} />
              
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
                  <div className="bg-gradient-to-r from-amber-900/40 to-amber-800/40 p-6 rounded-2xl border border-amber-500/30 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={80} /></div>
                      <div className="relative z-10">
                          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2"><Award size={16} /> Meta do Dia</h3>
                          <p className="text-xl font-bold text-white leading-relaxed italic">"{dailyGoal}"</p>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Wind size={14} /> Estampa de Vento</h3>
                      <div className="space-y-4">
                        {(Object.keys(WIND_PATTERNS) as WorkoutMode[]).map(mode => {
                            const cfg = WIND_PATTERNS[mode];
                            const isSelected = selectedMode === mode;
                            return (
                                <div key={mode} onClick={() => setSelectedMode(mode)} className={`relative rounded-2xl transition-all duration-500 cursor-pointer border overflow-hidden ${isSelected ? `h-60 border-transparent shadow-lg ring-2 ring-amber-500` : 'h-28 border-gray-800 opacity-60'}`}>
                                    <div className={`absolute inset-0 ${cfg.pattern}`}></div>
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`text-2xl font-black uppercase italic ${isSelected ? 'text-white' : 'text-gray-400'}`}>{cfg.title}</h3>
                                                <p className="text-xs font-bold uppercase tracking-widest mt-1 text-white/70">{cfg.subtitle}</p>
                                            </div>
                                            <cfg.icon size={28} className={isSelected ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        {isSelected && (
                                            <button onClick={(e) => { e.stopPropagation(); startRun(); }} className="bg-white text-black font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                                <Play fill="black" size={16} /> INICIAR SESSÃO
                                            </button>
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

  // --- ACTIVE HUD (PROFESSIONAL MODE) ---
  if (screen === 'active') {
      return (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col select-none overflow-hidden">
              {/* Map Background (Dimmed) */}
              <div className="absolute inset-0 z-0 opacity-40 grayscale-[50%]">
                  <LiveMap route={route} isPaused={isPaused} onRef={(map) => mapRef.current = map} />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
              </div>

              {/* Motivational Pop-up */}
              {motivationalMsg && (
                  <div className="absolute top-20 left-4 right-4 z-50 animate-fade-in">
                      <div className="bg-amber-500 text-black p-4 rounded-2xl shadow-xl border-2 border-white flex items-center gap-3">
                          <div className="bg-black text-amber-500 p-2 rounded-full">
                             <Megaphone className="animate-bounce" size={20} />
                          </div>
                          <p className="font-black text-sm uppercase italic leading-tight">{motivationalMsg}</p>
                      </div>
                  </div>
              )}

              {/* Top Status Bar */}
              <div className="relative z-10 p-4 flex justify-between items-center">
                  <GpsStatus accuracy={gpsAccuracy} />
                  <div className="flex gap-2">
                      <div className="bg-red-600/20 border border-red-500/50 text-red-500 px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-[10px] font-bold uppercase">REC</span>
                      </div>
                  </div>
              </div>

              {/* MAIN METRICS HUD */}
              <div className="relative z-10 flex-1 flex flex-col justify-end pb-8 px-4">
                  
                  {/* Primary Big Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border-l-4 border-amber-500">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Distância (km)</span>
                          <span className="text-6xl font-black text-white italic tracking-tighter">{distance.toFixed(2)}</span>
                      </div>
                      <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border-l-4 border-blue-500 text-right">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Tempo</span>
                          <span className="text-5xl font-mono font-bold text-white tracking-tight">{formatTime(elapsedSeconds)}</span>
                      </div>
                  </div>

                  {/* Secondary Grid Metrics */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                      <div className="bg-gray-900/80 backdrop-blur rounded-xl p-2 text-center border border-white/5">
                          <span className="text-[8px] text-gray-500 uppercase font-bold block">Pace Atual</span>
                          <span className="text-lg font-black text-white">{formatPace(currentPace)}</span>
                      </div>
                      <div className="bg-gray-900/80 backdrop-blur rounded-xl p-2 text-center border border-white/5">
                          <span className="text-[8px] text-gray-500 uppercase font-bold block">Pace Médio</span>
                          <span className="text-lg font-black text-gray-300">{formatPace(avgPace)}</span>
                      </div>
                      <div className="bg-gray-900/80 backdrop-blur rounded-xl p-2 text-center border border-white/5">
                          <span className="text-[8px] text-gray-500 uppercase font-bold block">Calorias</span>
                          <span className="text-lg font-black text-orange-400">{calories}</span>
                      </div>
                      <div className="bg-gray-900/80 backdrop-blur rounded-xl p-2 text-center border border-white/5">
                          <span className="text-[8px] text-gray-500 uppercase font-bold block">Elevação</span>
                          <span className="text-lg font-black text-green-400">{elevationGain.toFixed(0)}m</span>
                      </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                      {isPaused ? (
                          <>
                            <LongPressButton onComplete={endRun} className="flex-1 bg-red-600 text-white h-16 rounded-2xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-900/50">
                                <Square size={24} fill="currentColor" /> Parar
                            </LongPressButton>
                            <button onClick={resumeRun} className="flex-[2] bg-green-500 text-black h-16 rounded-2xl font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:scale-105 transition-transform">
                                <Play size={28} fill="currentColor" /> Retomar
                            </button>
                          </>
                      ) : (
                          <>
                            <button onClick={triggerMotivation} className="w-16 h-16 bg-amber-500/20 border border-amber-500 text-amber-500 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
                                <Zap size={28} fill="currentColor" />
                            </button>
                            <button onClick={pauseRun} className="flex-1 bg-white text-black h-16 rounded-2xl font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl">
                                <Pause size={28} fill="currentColor" /> Pausar
                            </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- FINISH SCREEN ---
  if (screen === 'finish') {
      return (
          <div className="h-full bg-black p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
              
              <div className="relative z-10 bg-gray-900/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md w-full max-w-sm">
                  <div className="inline-block p-4 rounded-full bg-amber-500 text-black mb-6 shadow-lg shadow-amber-500/30">
                      <Flag size={40} fill="currentColor" />
                  </div>
                  
                  <h2 className="text-3xl font-black text-white uppercase italic mb-2">Treino Finalizado</h2>
                  <p className="text-gray-400 text-sm mb-8 uppercase tracking-widest font-bold">{selectedMode.replace('_', ' ')}</p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8 text-left">
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Distância</span>
                          <div className="text-3xl font-black text-white">{distance.toFixed(2)}<span className="text-sm text-amber-500">km</span></div>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Tempo</span>
                          <div className="text-3xl font-black text-white">{formatTime(elapsedSeconds)}</div>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Pace Médio</span>
                          <div className="text-3xl font-black text-white">{formatPace(avgPace)}</div>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Calorias</span>
                          <div className="text-3xl font-black text-white">{calories}</div>
                      </div>
                  </div>

                  <button onClick={() => onSaveActivity({
                      distanceKm: distance,
                      durationMin: Math.ceil(elapsedSeconds / 60),
                      pace: formatPace(avgPace),
                      date: new Date().toISOString().split('T')[0],
                      feeling: 'good',
                      notes: '',
                      elevationGain: elevationGain,
                      calories: calories,
                      route: route,
                      mode: selectedMode
                  })} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest mb-4 hover:scale-105 transition-transform shadow-xl">
                      Salvar Atividade
                  </button>
                  
                  <button onClick={() => setScreen('select')} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                      Descartar sem salvar
                  </button>
              </div>
          </div>
      );
  }

  return null;
};
