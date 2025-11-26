import React, { useState, useEffect, useRef, memo } from 'react';
import { Activity, RoutePoint, Notification, Member, WorkoutMode, SoundType } from '../types';
import { Play, Pause, Square, Flag, CheckCircle, Zap, Wind, Mountain, Footprints, Cloud, Tornado, Lock, Unlock, Crosshair, Mic, Target, Award, Share2, Volume2, VolumeX, X, Image as ImageIcon, Download, Loader2, Music, ChevronUp, ChevronDown, Flame, Activity as ActivityIcon, Gauge, Feather, Signal, Maximize, Minimize, Megaphone, PenTool, Map as MapIcon, Layers, TrendingUp, ZoomIn, ZoomOut, Focus, Rocket, Timer, List } from 'lucide-react';
import * as L from 'leaflet';
import { SocialShareModal } from './SocialShareModal';

interface LiveRunProps {
  onSaveActivity: (activity: Omit<Activity, 'id'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  currentUser?: Member;
  playSound?: (type: SoundType) => void;
}

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
        spotifyEmbedId: "37i9dQZF1DX6GwdWRQMQMQpq"
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

// --- CARIOCA DICTIONARY --- (Same as before)
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

interface LongPressButtonProps {
    onComplete: () => void;
    children?: React.ReactNode;
    className?: string;
    fillClass?: string;
}

const LongPressButton: React.FC<LongPressButtonProps> = ({ onComplete, children, className, fillClass = "bg-white/30" }) => {
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
  
  // View Mode (Map vs Data)
  const [viewMode, setViewMode] = useState<'data' | 'map' | 'splits'>('data');

  // Telemetry & Other States...
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); // Seconds per km
  const [avgPace, setAvgPace] = useState(0); // Seconds per km
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [motivationalMsg, setMotivationalMsg] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [runNotes, setRunNotes] = useState(''); // Notes state
  const [paceHistory, setPaceHistory] = useState<number[]>([]); // For graph visualization
  
  // Splits Logic
  const [splits, setSplits] = useState<{ km: number; time: number; pace: string }[]>([]);
  const lastSplitTimeRef = useRef<number>(0);
  const [currentSplitPace, setCurrentSplitPace] = useState(0); // Pace for current KM

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastAltitudeRef = useRef<number | null>(null);
  const lastKmTriggerRef = useRef<number>(0); // Track last spoken KM
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const currentPaceRef = useRef(0); // Ref for stable access inside interval

  // Mock Goal
  useEffect(() => { setDailyGoal("Correr 5km sentindo a brisa."); }, []);

  // Load Voices
  useEffect(() => {
      const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
              setAvailableVoices(voices);
          }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const requestWakeLock = async () => {
      try {
          if ('wakeLock' in navigator) {
              wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
      } catch (err) {
          console.warn('Wake Lock error:', err);
      }
  };

  const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
      }
  };

  const requestFullScreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => console.warn("Fullscreen denied:", err));
      }
  };

  const speak = (text: string) => {
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); 
          const utterance = new SpeechSynthesisUtterance(text);
          const ptVoices = availableVoices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt-PT'));
          const bestVoice = ptVoices.find(v => v.name.includes('Google')) || 
                            ptVoices.find(v => v.name.includes('Luciana')) || 
                            ptVoices.find(v => v.name.includes('Joana')) || 
                            ptVoices[0];
          if (bestVoice) utterance.voice = bestVoice;
          utterance.lang = 'pt-BR';
          utterance.rate = 1.1 + Math.random() * 0.15; 
          utterance.pitch = 0.95 + Math.random() * 0.1; 
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
      requestWakeLock(); // Keep screen on
      const intro = getCariocaMessage('start');
      speak(intro);
      setRunNotes(''); // Reset notes
      setPaceHistory([]); // Reset graph
      setSplits([]); // Reset splits
      lastKmTriggerRef.current = 0; // Reset triggers
      lastSplitTimeRef.current = 0;

      setTimeout(() => {
          setScreen('active');
          setIsActive(true);
          setIsPaused(false);
          setIsStarting(false);
          startTimeRef.current = Date.now();
          
          timerIntervalRef.current = window.setInterval(() => {
              const totalSecondsNow = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setElapsedSeconds(totalSecondsNow);
              
              // Update pace graph every second
              // Use currentPaceRef to access the latest calculated pace
              const validPace = currentPaceRef.current > 0 && currentPaceRef.current < 1200 ? currentPaceRef.current : 0; 
              setPaceHistory(prev => {
                  const newHistory = [...prev, validPace];
                  return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
              });

          }, 1000);

          if (navigator.geolocation) {
              watchId.current = navigator.geolocation.watchPosition(
                  (pos) => {
                      setGpsAccuracy(pos.coords.accuracy);
                      if(pos.coords.accuracy > 40) return; // Ignore poor signal
                      
                      const speedMps = pos.coords.speed || 0; 
                      const kmh = speedMps * 3.6; // Convert to km/h
                      setCurrentSpeed(kmh);

                      const instantPaceSec = speedMps > 0.5 ? (1000 / speedMps) : 0;
                      setCurrentPace(instantPaceSec);
                      currentPaceRef.current = instantPaceSec; // Sync ref
                      
                      const currentAlt = pos.coords.altitude;
                      if (currentAlt !== null && lastAltitudeRef.current !== null) {
                          const diff = currentAlt - lastAltitudeRef.current;
                          // Basic filter for elevation jumps
                          if (diff > 0.5 && diff < 10) { setElevationGain(prev => prev + diff); }
                      }
                      if (currentAlt !== null) lastAltitudeRef.current = currentAlt;
                      
                      const pt: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: pos.timestamp, speed: speedMps, altitude: currentAlt };
                      
                      setRoute(prev => {
                          if (prev.length === 0) return [pt];
                          const last = prev[prev.length - 1];
                          const R = 6371e3; 
                          const φ1 = last.lat * Math.PI/180; const φ2 = pt.lat * Math.PI/180;
                          const Δφ = (pt.lat-last.lat) * Math.PI/180; const Δλ = (pt.lng-last.lng) * Math.PI/180;
                          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); const d = R * c; 
                          
                          // Filter noise: only add point if moved > 3m
                          if (d > 3) { 
                              const newTotalDistKm = (distance * 1000 + d) / 1000;
                              setDistance(newTotalDistKm);
                              
                              // Calculate distance in current split
                              const kmReached = Math.floor(newTotalDistKm);
                              const distInCurrentSplit = newTotalDistKm - lastKmTriggerRef.current;
                              
                              // Calculate current split pace (avg pace for this km so far)
                              const timeSinceLastSplit = (Date.now() - startTimeRef.current)/1000 - lastSplitTimeRef.current;
                              if (distInCurrentSplit > 0.05) {
                                  setCurrentSplitPace(timeSinceLastSplit / distInCurrentSplit);
                              }

                              // Audio Trigger for KM milestones & Splits
                              if (kmReached > lastKmTriggerRef.current) {
                                  if (playSound) playSound('success');
                                  
                                  // Record Split
                                  const totalSecondsNow = Math.floor((Date.now() - startTimeRef.current) / 1000);
                                  const splitTime = totalSecondsNow - lastSplitTimeRef.current;
                                  
                                  speak(`Quilômetro ${kmReached} concluído. Ritmo: ${formatPaceSpeech(splitTime)}`);

                                  lastSplitTimeRef.current = totalSecondsNow;
                                  
                                  setSplits(s => [...s, { 
                                      km: kmReached, 
                                      time: splitTime, 
                                      pace: formatPace(splitTime) // Pace for 1km is just time
                                  }]);

                                  lastKmTriggerRef.current = kmReached;
                                  // Reset split pace for new km
                                  setCurrentSplitPace(0); 
                              }

                              const weight = currentUser?.weight || 70;
                              setCalories(Math.floor(newTotalDistKm * weight * 1.036));
                              const totalTimeSec = (Date.now() - startTimeRef.current) / 1000;
                              if (newTotalDistKm > 0.05) { setAvgPace(totalTimeSec / newTotalDistKm); }
                              return [...prev, pt];
                          }
                          return prev;
                      });
                  },
                  err => console.warn(err),
                  { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
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
      // Adjust start time to account for pause
      const now = Date.now();
      const pausedDuration = now - (startTimeRef.current + (elapsedSeconds * 1000));
      startTimeRef.current = startTimeRef.current + pausedDuration;

      timerIntervalRef.current = window.setInterval(() => {
          const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(seconds);
          
          // Continue updating pace graph
          const validPace = currentPaceRef.current > 0 && currentPaceRef.current < 1200 ? currentPaceRef.current : 0; 
          setPaceHistory(prev => {
              const newHistory = [...prev, validPace];
              return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
          });
      }, 1000);
  };

  const endRun = () => {
      pauseRun();
      setScreen('finish');
      releaseWakeLock();
      if(playSound) playSound('success');
      speak(getCariocaMessage('finish'));
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
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

  const formatPaceSpeech = (secPerKm: number) => {
      const m = Math.floor(secPerKm / 60);
      const s = Math.floor(secPerKm % 60);
      return `${m} minutos e ${s} segundos`;
  }

  // Calculate Pace Visual Feedback
  const getPaceColor = () => {
      if (!currentPace || !avgPace) return 'text-white';
      // If current pace is significantly faster (lower value) than avg pace
      if (currentPace < avgPace * 0.9) return 'text-green-400'; // Faster
      // If current pace is significantly slower (higher value) than avg pace
      if (currentPace > avgPace * 1.1) return 'text-red-400'; // Slower
      return 'text-white'; // On pace
  };

  const handleZoom = (delta: number) => {
      if (mapRef.current) {
          mapRef.current.setZoom(mapRef.current.getZoom() + delta);
      }
  };

  const handleCenterMap = () => {
      if (mapRef.current && route.length > 0) {
          const lastPoint = route[route.length - 1];
          mapRef.current.panTo([lastPoint.lat, lastPoint.lng], { animate: true });
      }
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
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-mono">Sala de Controle</h2>
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
                                            <button onClick={(e) => { e.stopPropagation(); startRun(); }} className="bg-white text-black font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95">
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
      const isMapMode = viewMode === 'map';
      const isSplitsMode = viewMode === 'splits';
      const paceColor = getPaceColor();

      return (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col select-none overflow-hidden">
              
              {/* Map Background Layer */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isMapMode ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}>
                  <LiveMap route={route} isPaused={isPaused} onRef={(map) => mapRef.current = map} />
                  {!isMapMode && <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>}
              </div>

              {/* Map Controls (Visible in Map Mode) */}
              {isMapMode && (
                  <div className="absolute right-4 top-32 z-50 flex flex-col gap-3">
                      <button onClick={() => handleZoom(1)} className="bg-gray-900/80 p-3 rounded-full text-white hover:bg-gray-700 border border-gray-700 shadow-lg">
                          <ZoomIn size={20} />
                      </button>
                      <button onClick={() => handleZoom(-1)} className="bg-gray-900/80 p-3 rounded-full text-white hover:bg-gray-700 border border-gray-700 shadow-lg">
                          <ZoomOut size={20} />
                      </button>
                      <button onClick={handleCenterMap} className="bg-amber-500 p-3 rounded-full text-black hover:bg-amber-400 shadow-lg border border-amber-400/50">
                          <Focus size={20} />
                      </button>
                  </div>
              )}

              {/* Elevation Graph (Map Mode Only - Bottom) */}
              {isMapMode && route.length > 20 && (
                  <div className="absolute bottom-24 left-0 right-0 h-16 bg-black/60 z-10 backdrop-blur-sm border-t border-white/10 flex items-end px-4 pb-2">
                      <div className="w-full h-10 flex items-end gap-0.5 opacity-70">
                          {route.slice(-50).map((pt, i) => {
                              const h = Math.min(100, Math.max(10, (pt.altitude || 0) / 2)); // Mock scaling
                              return (
                                  <div key={i} className="flex-1 bg-gray-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                              )
                          })}
                      </div>
                      <div className="absolute top-1 left-4 text-[10px] text-gray-400 font-bold uppercase">Perfil de Elevação</div>
                  </div>
              )}

              {motivationalMsg && (
                  <div className="absolute top-20 left-4 right-4 z-50 animate-fade-in pointer-events-none">
                      <div className="bg-amber-500 text-black p-4 rounded-2xl shadow-xl border-2 border-white flex items-center gap-3">
                          <div className="bg-black text-amber-500 p-2 rounded-full"><Megaphone className="animate-bounce" size={20} /></div>
                          <p className="font-black text-sm uppercase italic leading-tight">{motivationalMsg}</p>
                      </div>
                  </div>
              )}

              {/* Top Bar */}
              <div className="relative z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                  <GpsStatus accuracy={gpsAccuracy} />
                  <div className="flex flex-col gap-2 items-end">
                      <div className="bg-red-600/20 border border-red-500/50 text-red-500 px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-[10px] font-bold uppercase">REC</span>
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setViewMode('splits')}
                            className={`bg-gray-800/80 border ${isSplitsMode ? 'border-amber-500 text-amber-500' : 'border-gray-600 text-white'} p-2 rounded-lg transition-colors`}
                          >
                              <List size={20} />
                          </button>
                          <button 
                            onClick={() => setViewMode(prev => prev === 'data' ? 'map' : 'data')}
                            className={`bg-gray-800/80 border ${isMapMode ? 'border-amber-500 text-amber-500' : 'border-gray-600 text-white'} p-2 rounded-lg transition-colors`}
                          >
                              {isMapMode ? <Layers size={20} /> : <MapIcon size={20} />}
                          </button>
                      </div>
                  </div>
              </div>

              {/* HUD Content */}
              <div className={`relative z-10 flex-1 flex flex-col justify-end pb-8 px-4 transition-opacity duration-300 ${isMapMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  
                  {/* SPLITS VIEW (OVERLAY) */}
                  {isSplitsMode && (
                      <div className="absolute inset-4 bottom-24 bg-black/90 backdrop-blur-xl rounded-3xl border border-gray-800 p-6 overflow-y-auto custom-scrollbar z-20 animate-fade-in">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-2"><Flag size={20} className="text-amber-500"/> Parciais</h3>
                              <button onClick={() => setViewMode('data')} className="p-2 bg-gray-800 rounded-full text-white"><X size={16}/></button>
                          </div>
                          <table className="w-full text-left">
                              <thead className="text-xs text-gray-500 uppercase font-bold border-b border-gray-800">
                                  <tr>
                                      <th className="pb-2">KM</th>
                                      <th className="pb-2">Pace</th>
                                      <th className="pb-2 text-right">Tempo</th>
                                  </tr>
                              </thead>
                              <tbody className="text-sm text-gray-300 font-mono">
                                  {splits.length === 0 && (
                                      <tr><td colSpan={3} className="py-8 text-center text-gray-600 italic">Corra 1km para registrar parciais.</td></tr>
                                  )}
                                  {splits.map((s, i) => (
                                      <tr key={i} className="border-b border-gray-800/50">
                                          <td className="py-3 font-bold text-white">{s.km}</td>
                                          <td className="py-3 text-amber-500">{s.pace}</td>
                                          <td className="py-3 text-right">{formatTime(s.time)}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}

                  {/* Stats Area - Conditional Layout based on Mode */}
                  {!isMapMode && !isSplitsMode && (
                      <div className="flex flex-col gap-4 mb-6">
                          
                          {/* Main Row: Distance & Time */}
                          <div className="grid grid-cols-1 gap-2 text-center">
                              <div>
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Distância Percorrida</span>
                                  <div className="text-[6rem] font-black text-white italic tracking-tighter leading-none drop-shadow-2xl font-mono">
                                      {distance.toFixed(2)}
                                      <span className="text-4xl text-amber-500 not-italic ml-2 font-sans">km</span>
                                  </div>
                              </div>
                              <div>
                                  <div className="inline-block bg-gray-900/50 backdrop-blur px-4 py-1 rounded-full border border-white/10">
                                      <span className="text-4xl font-mono font-bold text-gray-200 tracking-tight">{formatTime(elapsedSeconds)}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Pace & Speed Graph Area */}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                              {/* PACE CARD with Sparkline Background */}
                              <div className={`relative bg-gray-900/60 backdrop-blur-md rounded-3xl p-5 border border-gray-700 overflow-hidden ${currentPace > 0 && currentPace < 300 ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500/50' : ''}`}>
                                  {/* Visual Pace Graph (Sparkline) */}
                                  <div className="absolute inset-0 opacity-20 pointer-events-none flex items-end">
                                      {paceHistory.length > 1 && (
                                          <svg className="w-full h-full" preserveAspectRatio="none">
                                              <polyline 
                                                  points={paceHistory.map((p, i) => `${(i / (paceHistory.length - 1)) * 100},${100 - (Math.min(Math.max(0, (1000 - p)/10), 100))}`).join(' ')}
                                                  fill="none" 
                                                  stroke="#f59e0b" 
                                                  strokeWidth="2" 
                                              />
                                          </svg>
                                      )}
                                  </div>
                                  
                                  <div className="relative z-10">
                                      <div className="flex items-center gap-2 mb-1">
                                          <ActivityIcon size={14} className={currentPace > 0 ? "text-amber-500 animate-pulse" : "text-gray-500"} />
                                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pace Atual</span>
                                      </div>
                                      <div className={`text-5xl font-black ${paceColor} transition-colors duration-500 font-mono`}>{formatPace(currentPace)}</div>
                                      <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">min/km</div>
                                  </div>
                              </div>

                              {/* SPEED / SPLIT CARD */}
                              <div className="bg-gray-900/60 backdrop-blur-md rounded-3xl p-5 border border-gray-700 flex flex-col justify-center">
                                  <div className="flex items-center gap-2 mb-1">
                                      <Gauge size={14} className="text-blue-500" />
                                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Velocidade</span>
                                  </div>
                                  <div className="text-5xl font-black text-white font-mono">{currentSpeed.toFixed(1)}<span className="text-lg text-gray-500 ml-1 font-sans">km/h</span></div>
                                  <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase font-bold mt-1 text-amber-500">
                                      <Timer size={10} /> Ritmo da Volta: {formatPace(currentSplitPace)}
                                  </div>
                              </div>
                          </div>

                          {/* Secondary Mini Stats */}
                          <div className="grid grid-cols-2 gap-4 px-2">
                              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                  <span className="text-xs text-gray-500 font-bold uppercase">Pace Médio</span>
                                  <span className="text-xl font-mono font-bold text-gray-300">{formatPace(avgPace)}</span>
                              </div>
                              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                  <span className="text-xs text-gray-500 font-bold uppercase">Calorias Queimadas</span>
                                  <span className="text-xl font-mono font-bold text-orange-400">{calories} kcal</span>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                      {isPaused ? (
                          <>
                            <LongPressButton onComplete={endRun} className="flex-1 bg-red-600 text-white h-20 rounded-2xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 border border-red-400/20">
                                <Square size={24} fill="currentColor" /> Segure p/ Parar
                            </LongPressButton>
                            <button onClick={resumeRun} className="flex-[2] bg-green-500 text-black h-20 rounded-2xl font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 hover:scale-105 transition-transform border border-green-400/20">
                                <Play size={32} fill="currentColor" /> RETOMAR
                            </button>
                          </>
                      ) : (
                          <>
                            <button onClick={triggerMotivation} className="w-20 h-20 bg-amber-500/10 border border-amber-500/50 text-amber-500 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-amber-500/10">
                                <Zap size={32} fill="currentColor" />
                            </button>
                            <button onClick={pauseRun} className="flex-1 bg-white text-black h-20 rounded-2xl font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
                                <Pause size={32} fill="currentColor" /> PAUSAR
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
          <div className="h-full bg-black p-8 flex flex-col items-center justify-center text-center relative overflow-hidden overflow-y-auto custom-scrollbar">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
              
              <div className="relative z-10 bg-gray-900/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md w-full max-w-md animate-fade-in">
                  <div className="inline-block p-4 rounded-full bg-amber-500 text-black mb-6 shadow-lg shadow-amber-500/30 animate-bounce-slow">
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

                  {/* Notes Input Area */}
                  <div className="mb-6 relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition-opacity blur"></div>
                      <div className="relative bg-gray-900 rounded-xl border border-gray-700 p-3">
                          <div className="flex items-center gap-2 mb-2 text-amber-500">
                              <PenTool size={14} />
                              <label className="text-xs font-bold uppercase tracking-wider">Notas da Corrida</label>
                          </div>
                          <textarea 
                              value={runNotes}
                              onChange={(e) => setRunNotes(e.target.value)}
                              className="w-full bg-transparent text-white text-sm focus:outline-none resize-none h-24 placeholder-gray-600"
                              placeholder="Descreva como foi seu treino, terreno, sensação..."
                          />
                      </div>
                  </div>

                  <button 
                      onClick={() => setIsShareModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl uppercase tracking-widest mb-3 hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
                  >
                      <Share2 size={18} /> Compartilhar Conquista
                  </button>

                  <button onClick={() => onSaveActivity({
                      distanceKm: distance,
                      durationMin: Math.ceil(elapsedSeconds / 60),
                      pace: formatPace(avgPace),
                      date: new Date().toISOString().split('T')[0],
                      feeling: 'good',
                      notes: runNotes,
                      elevationGain: elevationGain,
                      calories: calories,
                      route: route,
                      mode: selectedMode
                  })} className="w-full bg-white text-black font-black py-3 rounded-xl uppercase tracking-widest mb-4 hover:scale-105 transition-transform shadow-xl">
                      Salvar e Sair
                  </button>
                  
                  <button onClick={() => { setScreen('select'); setRunNotes(''); }} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                      Descartar sem salvar
                  </button>
              </div>

              {/* INTEGRATED SHARE MODAL */}
              <SocialShareModal 
                  isOpen={isShareModalOpen} 
                  onClose={() => setIsShareModalOpen(false)}
                  data={{
                      distance: `${distance.toFixed(2)} KM`,
                      time: formatTime(elapsedSeconds),
                      pace: formatPace(avgPace)
                  }}
                  route={route}
              />
          </div>
      );
  }

  return null;
};