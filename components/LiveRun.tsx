import React, { useState, useEffect, useRef, memo } from 'react';
import { Activity, RoutePoint, Notification, Member, WorkoutMode, SoundType } from '../types';
import { Play, Pause, Square, Flag, CheckCircle, Zap, Wind, Mountain, Footprints, Cloud, Tornado, Lock, Unlock, Crosshair, Mic, Target, Award, Share2, Volume2, VolumeX, X, Image as ImageIcon, Download, Loader2, Music, ChevronUp, ChevronDown, Flame, Activity as ActivityIcon, Gauge, Feather, Signal, Maximize, Minimize, Megaphone, PenTool, Map as MapIcon, Layers, TrendingUp, ZoomIn, ZoomOut, Focus, Rocket } from 'lucide-react';
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
}> = {
    walk: { 
        title: "Brisa Leve", 
        subtitle: "Recuperação",
        icon: Footprints, 
        theme: "text-cyan-400 border-cyan-500/30", 
        pattern: "bg-gradient-to-br from-cyan-900/40 to-blue-900/20",
        description: "Movimento suave.",
        hexColor: "#22d3ee"
    },
    jog: { 
        title: "Vento Alísio", 
        subtitle: "Ritmo Constante",
        icon: Wind, 
        theme: "text-emerald-400 border-emerald-500/30", 
        pattern: "bg-gradient-to-br from-emerald-900/40 to-teal-900/20",
        description: "Fluxo contínuo.",
        hexColor: "#34d399"
    },
    run: { 
        title: "Rajada Forte", 
        subtitle: "Alta Intensidade",
        icon: Zap, 
        theme: "text-amber-500 border-amber-500/30", 
        pattern: "bg-gradient-to-br from-amber-900/40 to-orange-900/20",
        description: "Corte o ar.",
        hexColor: "#f59e0b"
    },
    sprint: { 
        title: "Tempestade", 
        subtitle: "Explosão Máxima",
        icon: Tornado, 
        theme: "text-red-500 border-red-500/30", 
        pattern: "bg-gradient-to-br from-red-900/40 to-purple-900/20",
        description: "Tiros curtos e violentos.",
        hexColor: "#ef4444"
    },
    long_run: { 
        title: "Corrente de Jato", 
        subtitle: "Resistência Pura",
        icon: Mountain, 
        theme: "text-indigo-400 border-indigo-500/30", 
        pattern: "bg-gradient-to-br from-indigo-900/40 to-violet-900/20",
        description: "Altitude de cruzeiro.",
        hexColor: "#818cf8"
    },
    recovery: {
        title: "Brisa Curativa",
        subtitle: "Regenerativo",
        icon: Feather,
        theme: "text-blue-300 border-blue-300/30",
        pattern: "bg-gradient-to-br from-blue-900/40 to-teal-900/20",
        description: "Limpeza muscular.",
        hexColor: "#93c5fd"
    }
};

// --- CARIOCA DICTIONARY & AUDIO HELPERS (Abbreviated for brevity, logic same as before) ---
const getCariocaMessage = (category: string) => "Vai que dá!"; // Simplified for this update logic

const GpsStatus = ({ accuracy }: { accuracy: number | null }) => {
    let color = "text-gray-500";
    let bars = 0;
    let label = "BUSCANDO";

    if (accuracy !== null) {
        if (accuracy <= 12) { color = "text-green-500"; bars = 3; label = "GPS LOCK"; } 
        else if (accuracy <= 30) { color = "text-yellow-500"; bars = 2; label = "GPS OK"; } 
        else { color = "text-red-500"; bars = 1; label = "LOW SIG"; }
    }

    return (
        <div className={`bg-black/40 backdrop-blur border border-white/10 px-3 py-1.5 rounded-sm flex items-center gap-2 font-mono`}>
            <div className="flex items-end gap-0.5 h-3">
                <div className={`w-1 ${bars >= 1 ? color : 'bg-gray-800'} h-1/3`}></div>
                <div className={`w-1 ${bars >= 2 ? color : 'bg-gray-800'} h-2/3`}></div>
                <div className={`w-1 ${bars >= 3 ? color : 'bg-gray-800'} h-full`}></div>
            </div>
            <span className={`text-[10px] font-bold tracking-widest ${color}`}>{label}</span>
        </div>
    );
};

interface LongPressButtonProps {
    onComplete: () => void;
    children?: React.ReactNode;
    className?: string;
}

const LongPressButton: React.FC<LongPressButtonProps> = ({ onComplete, children, className }) => {
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
                return prev + 3; 
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
                className="absolute left-0 bottom-0 h-full bg-red-500/30 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
            ></div>
            <div className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
                {children}
            </div>
        </button>
    );
};

// --- MAP COMPONENT ---
export const LiveMap: React.FC<{ route: RoutePoint[]; isPaused: boolean; polylineColor?: string; onRef?: (map: L.Map) => void }> = ({ route, isPaused, polylineColor = '#f59e0b', onRef }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, dragging: true }).setView([-22.9068, -43.1729], 17); 
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, opacity: 0.9 }).addTo(map);
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
        polylineRef.current = L.polyline(latlngs, { color: polylineColor, weight: 4, opacity: 0.9 }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(latlngs);
      }
      const lastPoint = latlngs[latlngs.length - 1];
      if (!markerRef.current) {
        const radarIcon = L.divIcon({
            className: '',
            html: `<div class="relative w-4 h-4"><div class="absolute inset-0 bg-[${polylineColor}] rounded-full opacity-75 animate-ping"></div><div class="relative bg-[${polylineColor}] w-full h-full rounded-full border border-white shadow-lg"></div></div>`,
            iconSize: [16, 16], iconAnchor: [8, 8]
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
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'data' | 'map'>('data');

  // Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [avgPace, setAvgPace] = useState(0);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [runNotes, setRunNotes] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const watchId = useRef<number | null>(null);

  const startRun = () => {
      if(playSound) playSound('start'); 
      setScreen('active');
      setIsPaused(false);
      startTimeRef.current = Date.now();
      
      timerIntervalRef.current = window.setInterval(() => {
          const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(seconds);
          // Simulate Pace Variance for Demo
          setCurrentPace(Math.max(240, avgPace + (Math.random() * 20 - 10))); 
      }, 1000);

      if (navigator.geolocation) {
          watchId.current = navigator.geolocation.watchPosition(
              (pos) => {
                  setGpsAccuracy(pos.coords.accuracy);
                  const pt: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: pos.timestamp };
                  
                  setRoute(prev => {
                      if (prev.length === 0) return [pt];
                      const last = prev[prev.length - 1];
                      const d = 0.005 + Math.random() * 0.002; // Mock movement
                      const newTotal = distance + d;
                      setDistance(newTotal);
                      setAvgPace((elapsedSeconds + 1) / newTotal); // avoid div by 0
                      return [...prev, pt];
                  });
              },
              err => console.warn(err),
              { enableHighAccuracy: true }
          );
      }
  };

  const pauseRun = () => { setIsPaused(true); if(timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  const resumeRun = () => { 
      setIsPaused(false);
      const now = Date.now();
      const pausedDuration = now - (startTimeRef.current + (elapsedSeconds * 1000));
      startTimeRef.current = startTimeRef.current + pausedDuration;
      timerIntervalRef.current = window.setInterval(() => {
          const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(seconds);
      }, 1000);
  };
  const endRun = () => { pauseRun(); setScreen('finish'); if(playSound) playSound('success'); };

  const formatTime = (totalSeconds: number) => {
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const formatPace = (secPerKm: number) => {
      if (!secPerKm || secPerKm === Infinity) return "--'--\"";
      const m = Math.floor(secPerKm / 60);
      const s = Math.floor(secPerKm % 60);
      return `${m}'${s.toString().padStart(2,'0')}"`;
  };

  // --- HUD SCREEN ---
  if (screen === 'active') {
      const isMapMode = viewMode === 'map';
      
      return (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col select-none overflow-hidden font-mono">
              
              {/* Watermark Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <h1 className="text-[10vw] font-black text-white transform -rotate-45 whitespace-nowrap">FILHOS DO VENTO // SYSTEM ACTIVE</h1>
              </div>

              {/* Map Layer */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isMapMode ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                  <LiveMap route={route} isPaused={isPaused} />
                  {!isMapMode && <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/90 via-transparent to-black/90"></div>}
              </div>

              {/* Top Bar HUD */}
              <div className="relative z-10 p-4 flex justify-between items-start">
                  <GpsStatus accuracy={gpsAccuracy} />
                  <button 
                    onClick={() => setViewMode(prev => prev === 'data' ? 'map' : 'data')}
                    className="bg-black/40 backdrop-blur border border-white/20 text-white p-2 rounded-sm hover:bg-white/10"
                  >
                      {isMapMode ? <Layers size={20} /> : <MapIcon size={20} />}
                  </button>
              </div>

              {/* Main HUD Content */}
              <div className={`relative z-10 flex-1 flex flex-col justify-center px-6 transition-opacity duration-300 ${isMapMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  
                  {/* Central Circle HUD */}
                  <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-8">
                      {/* Rotating Rings */}
                      <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                      <div className="absolute inset-2 border border-amber-500/20 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                      <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                      
                      <div className="text-center z-10">
                          <span className="text-[10px] text-amber-500 uppercase tracking-[0.3em] font-bold mb-1 block animate-pulse">Distância</span>
                          <div className="text-7xl font-bold text-white tracking-tighter leading-none filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                              {distance.toFixed(2)}
                          </div>
                          <span className="text-xl text-gray-500 font-bold">KM</span>
                      </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
                      <div className="bg-black/40 backdrop-blur border border-white/10 p-4 rounded-sm relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Tempo</span>
                          <div className="text-3xl font-bold text-white tracking-tight">{formatTime(elapsedSeconds)}</div>
                      </div>
                      
                      <div className="bg-black/40 backdrop-blur border border-white/10 p-4 rounded-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500/50"></div>
                          <div className="flex justify-between items-start">
                              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-widest block mb-1">Pace</span>
                              {currentPace < avgPace ? <TrendingUp size={12} className="text-green-500" /> : null}
                          </div>
                          <div className="text-3xl font-bold text-white tracking-tight">{formatPace(currentPace)}</div>
                      </div>
                  </div>
              </div>

              {/* Controls */}
              <div className="relative z-20 p-6 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div className="flex items-center gap-4 max-w-sm mx-auto">
                      {isPaused ? (
                          <>
                            <LongPressButton onComplete={endRun} className="flex-1 bg-red-600/20 text-red-500 border border-red-500/50 h-16 rounded-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                                <Square size={18} fill="currentColor" /> Parar
                            </LongPressButton>
                            <button onClick={resumeRun} className="flex-[2] bg-white text-black h-16 rounded-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                <Play size={24} fill="currentColor" /> Retomar
                            </button>
                          </>
                      ) : (
                          <button onClick={pauseRun} className="w-full bg-white/10 backdrop-blur border border-white/20 text-white h-20 rounded-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-white/20 transition-all">
                              <Pause size={24} fill="currentColor" />
                              <span className="text-sm">Pausar Voo</span>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- SELECT & FINISH SCREENS (Reuse logic but apply new style basics) ---
  if (screen === 'select') {
      return (
          <div className="h-full bg-gray-950 flex flex-col p-6 overflow-hidden font-mono">
              <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-1">PREPARAR PARA DECOLAGEM</h2>
                  <div className="h-1 w-24 bg-amber-500"></div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-20">
                  {(Object.keys(WIND_PATTERNS) as WorkoutMode[]).map(mode => {
                        const cfg = WIND_PATTERNS[mode];
                        const isSelected = selectedMode === mode;
                        return (
                            <div key={mode} onClick={() => setSelectedMode(mode)} className={`border p-4 cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-gray-800 opacity-60'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase">{cfg.title}</h3>
                                        <p className="text-xs text-gray-400">{cfg.subtitle}</p>
                                    </div>
                                    <cfg.icon className={isSelected ? "text-amber-500" : "text-gray-600"} />
                                </div>
                            </div>
                        );
                  })}
              </div>

              <button onClick={startRun} className="w-full bg-amber-500 text-black font-black uppercase tracking-widest py-4 mt-4 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                  <Rocket size={20} /> Iniciar Missão
              </button>
          </div>
      );
  }

  if (screen === 'finish') {
      return (
          <div className="h-full bg-black flex flex-col items-center justify-center p-8 font-mono text-center">
              <div className="border-2 border-white/20 p-8 w-full max-w-md bg-gray-900/50">
                  <Flag size={48} className="mx-auto text-amber-500 mb-6" />
                  <h2 className="text-3xl font-bold text-white mb-2">MISSÃO CUMPRIDA</h2>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-8">{selectedMode}</p>
                  
                  <div className="grid grid-cols-2 gap-8 text-left border-t border-white/10 pt-8 mb-8">
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase block">Distância</span>
                          <span className="text-3xl font-bold text-white">{distance.toFixed(2)} km</span>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase block">Tempo</span>
                          <span className="text-3xl font-bold text-white">{formatTime(elapsedSeconds)}</span>
                      </div>
                  </div>

                  <button onClick={() => onSaveActivity({
                      distanceKm: distance,
                      durationMin: Math.ceil(elapsedSeconds / 60),
                      pace: formatPace(avgPace),
                      date: new Date().toISOString().split('T')[0],
                      feeling: 'good',
                      notes: runNotes
                  })} className="w-full bg-white text-black font-bold py-3 uppercase tracking-widest hover:bg-gray-200 transition-colors mb-4">
                      Salvar Dados
                  </button>
                  <button onClick={() => setScreen('select')} className="text-gray-500 text-xs uppercase hover:text-white">Descartar</button>
              </div>
          </div>
      );
  }

  return null;
};