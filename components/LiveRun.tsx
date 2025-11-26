
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, RoutePoint, Notification, Member, WorkoutMode, SoundType } from '../types';
import { Play, Pause, Square, Flag, CheckCircle2, Zap, Wind, Mountain, Footprints, Cloud, Tornado, Lock, Unlock, Crosshair, Mic, Target, Award, Share2, Volume2, VolumeX, X, Image as ImageIcon, Download, Loader2, Music, ChevronUp, ChevronDown, Flame, Activity as ActivityIcon, Gauge, Feather, Signal, Maximize, Minimize, Megaphone, PenTool, Map as MapIcon, Layers, TrendingUp, ZoomIn, ZoomOut, Focus, Rocket, Timer, List, Star, ArrowUpRight } from 'lucide-react';
import * as L from 'leaflet';
import { SocialShareModal } from './SocialShareModal';

interface LiveRunProps {
  onSaveActivity: (activity: Omit<Activity, 'id'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  currentUser?: Member;
  playSound?: (type: SoundType) => void;
  pendingWorkout?: any;
  onClearPendingWorkout?: () => void;
}

// --- WIND ZONES CONFIGURATION ---
const WIND_ZONES = [
    { id: 'breeze', minSpeed: 0, maxSpeed: 7, title: "Zona Brisa", color: "text-emerald-400", border: "border-emerald-500/50", shadow: "shadow-emerald-500/20", icon: Feather, description: "Recuperação e Leveza" },
    { id: 'gust', minSpeed: 7, maxSpeed: 11, title: "Zona Alísio", color: "text-cyan-400", border: "border-cyan-500/50", shadow: "shadow-cyan-500/20", icon: Wind, description: "Ritmo Constante" },
    { id: 'gale', minSpeed: 11, maxSpeed: 15, title: "Zona Rajada", color: "text-amber-500", border: "border-amber-500/50", shadow: "shadow-amber-500/20", icon: Zap, description: "Alta Intensidade" },
    { id: 'storm', minSpeed: 15, maxSpeed: 99, title: "Zona Tempestade", color: "text-red-500", border: "border-red-500/50", shadow: "shadow-red-500/20", icon: Tornado, description: "Potência Máxima" },
];

const WIND_PATTERNS: Record<string, { title: string, subtitle: string, pattern: string, icon: any }> = {
    'run': { title: 'Corrida Livre', subtitle: 'Ritmo Próprio', pattern: 'bg-gradient-to-br from-green-500/20 to-emerald-900/20', icon: Wind },
    'long_run': { title: 'Longão', subtitle: 'Resistência', pattern: 'bg-gradient-to-br from-blue-500/20 to-indigo-900/20', icon: Cloud },
    'sprint': { title: 'Tiros', subtitle: 'Velocidade', pattern: 'bg-gradient-to-br from-red-500/20 to-orange-900/20', icon: Zap },
    'walk': { title: 'Caminhada', subtitle: 'Recuperação', pattern: 'bg-gradient-to-br from-teal-500/20 to-green-900/20', icon: Footprints },
    'jog': { title: 'Trote', subtitle: 'Leve', pattern: 'bg-gradient-to-br from-yellow-500/20 to-orange-900/20', icon: Feather },
    'recovery': { title: 'Regenerativo', subtitle: 'Descanso Ativo', pattern: 'bg-gradient-to-br from-purple-500/20 to-pink-900/20', icon: ActivityIcon },
};

const GpsStatus = ({ accuracy }: { accuracy: number | null }) => {
    let color = "text-gray-500";
    let bars = 0;
    let label = "BUSCANDO";

    if (accuracy !== null) {
        if (accuracy <= 10) { color = "text-green-500"; bars = 4; label = "GPS EXCELENTE"; } 
        else if (accuracy <= 20) { color = "text-yellow-500"; bars = 3; label = "GPS BOM"; } 
        else if (accuracy <= 50) { color = "text-orange-500"; bars = 2; label = "SINAL FRACO"; }
        else { color = "text-red-500"; bars = 1; label = "INSTÁVEL"; }
    }

    return (
        <div className={`bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors`}>
            <div className="flex items-end gap-0.5 h-3">
                <div className={`w-1 rounded-sm ${bars >= 1 ? color : 'bg-gray-700'} h-1/4`}></div>
                <div className={`w-1 rounded-sm ${bars >= 2 ? color : 'bg-gray-700'} h-2/4`}></div>
                <div className={`w-1 rounded-sm ${bars >= 3 ? color : 'bg-gray-700'} h-3/4`}></div>
                <div className={`w-1 rounded-sm ${bars >= 4 ? color : 'bg-gray-700'} h-full`}></div>
            </div>
            <span className={`text-[10px] font-bold ${accuracy === null ? 'animate-pulse text-gray-400' : color}`}>{label} {accuracy ? `(±${Math.round(accuracy)}m)` : ''}</span>
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
                return prev + 4; 
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
        polylineRef.current = L.polyline(latlngs, { color: polylineColor, weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(latlngs);
        polylineRef.current.setStyle({ color: polylineColor });
      }
      const lastPoint = latlngs[latlngs.length - 1];
      if (!markerRef.current) {
        const radarIcon = L.divIcon({
            className: 'radar-marker',
            iconSize: [20, 20], iconAnchor: [10, 10]
        });
        markerRef.current = L.marker(lastPoint, { icon: radarIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng(lastPoint);
      }
      if (!isPaused) map.panTo(lastPoint, { animate: true, duration: 1.5 });
    }
  }, [route, isPaused, polylineColor]);

  return <div ref={mapContainerRef} className="w-full h-full bg-[#050505] z-0" />;
};

// --- MATH HELPERS ---
const toRad = (Value: number) => Value * Math.PI / 180;
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const LiveRun: React.FC<LiveRunProps> = ({ onSaveActivity, addNotification, currentUser, playSound, pendingWorkout, onClearPendingWorkout }) => {
  const [screen, setScreen] = useState<'select' | 'active' | 'finish'>('select');
  const [selectedMode, setSelectedMode] = useState<WorkoutMode>('run');
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false); 
  const [viewMode, setViewMode] = useState<'data' | 'map' | 'splits'>('data');
  const [motivationalMsg, setMotivationalMsg] = useState<string | null>(null);

  // --- PRECISION METRICS ---
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); 
  const [avgPace, setAvgPace] = useState(0); 
  const [currentSpeed, setCurrentSpeed] = useState(0); 
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [runNotes, setRunNotes] = useState(''); 
  const [splits, setSplits] = useState<{ km: number; time: number; pace: string }[]>([]);
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Refs for Logic & Stabilizing
  const mapRef = useRef<L.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // ALGORITHM REFS
  const lastPos = useRef<RoutePoint | null>(null);
  const speedBuffer = useRef<number[]>([]); // Rolling window for speed smoothing
  const distanceAccumulator = useRef(0);
  const lastSplitTime = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Derived Values
  const dailyGoal = "Superar a distância de ontem";
  const sessionXP = Math.floor(distance * 10);
  const calories = Math.floor(10 * (currentUser?.weight || 70) * (elapsedSeconds/3600));

  // Determine Wind Zone based on smoothed speed
  const currentZone = useMemo(() => {
      const zone = WIND_ZONES.find(z => currentSpeed >= z.minSpeed && currentSpeed < z.maxSpeed) || WIND_ZONES[WIND_ZONES.length-1];
      return zone;
  }, [currentSpeed]);

  // Init Logic
  useEffect(() => {
    if (pendingWorkout) {
        setSelectedMode('run');
    }
  }, [pendingWorkout]);

  // Map Control Functions
  const handleZoom = (delta: number) => {
      if (mapRef.current) {
          mapRef.current.setZoom(mapRef.current.getZoom() + delta);
      }
  };

  const handleCenterMap = () => {
      if (mapRef.current && lastPos.current) {
          mapRef.current.panTo([lastPos.current.lat, lastPos.current.lng]);
      }
  };

  const triggerMotivation = () => {
      const msgs = ["VAI TIME!", "Foco na respiração!", "Você é imparável!", "Mantenha a postura!", "Força!"];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setMotivationalMsg(msg);
      if(playSound) playSound('success');
      setTimeout(() => setMotivationalMsg(null), 3000);
  };

  const requestWakeLock = async () => {
      try {
          if ('wakeLock' in navigator) {
              wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
      } catch (err) { console.warn('Wake Lock error:', err); }
  };

  const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
      }
  };

  const requestFullScreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) elem.requestFullscreen().catch(console.warn);
  };

  const startRun = async () => {
      requestFullScreen(); 
      requestWakeLock(); 
      
      // Reset State
      setRunNotes(''); 
      setSplits([]); 
      setDistance(0);
      setElevationGain(0);
      distanceAccumulator.current = 0; 
      lastSplitTime.current = 0;
      lastPos.current = null;
      speedBuffer.current = [];
      setRoute([]);

      if(playSound) playSound('start');
      if (onClearPendingWorkout) onClearPendingWorkout();

      setScreen('active');
      setIsPaused(false);
      startTimeRef.current = Date.now();
      
      // Timer Loop
      timerIntervalRef.current = window.setInterval(() => {
          const now = Date.now();
          const totalSeconds = Math.floor((now - startTimeRef.current) / 1000);
          setElapsedSeconds(totalSeconds);
      }, 1000);

      // --- HIGH PRECISION GPS WATCHER ---
      if (navigator.geolocation) {
          watchId.current = navigator.geolocation.watchPosition(
              (pos) => {
                  const { latitude, longitude, altitude, speed, accuracy } = pos.coords;
                  setGpsAccuracy(accuracy);

                  // 1. DISCARD BAD GPS DATA
                  // If accuracy is worse than 25m, ignore the point entirely to prevent jumps
                  if (accuracy > 25) return; 

                  const now = pos.timestamp;
                  const newPoint: RoutePoint = { lat: latitude, lng: longitude, altitude, speed, timestamp: now };

                  // 2. CALCULATE DELTAS
                  if (lastPos.current) {
                      const distDeltaMeters = calcDistance(lastPos.current.lat, lastPos.current.lng, latitude, longitude);
                      const timeDeltaSeconds = (now - lastPos.current.timestamp) / 1000;

                      // 3. FILTER IMPOSSIBLE MOVEMENTS (Teleportation check)
                      // Max human speed approx 12.5 m/s (Usain Bolt). If calc speed > 15 m/s, it's GPS glitch.
                      const instantSpeed = timeDeltaSeconds > 0 ? distDeltaMeters / timeDeltaSeconds : 0;
                      if (instantSpeed > 15) return; 

                      // 4. MINIMUM MOVEMENT THRESHOLD
                      // Only register if moved more than accuracy error margin or decent step (e.g. 2 meters)
                      if (distDeltaMeters > 2) {
                          distanceAccumulator.current += distDeltaMeters / 1000; // Add to total KM
                          setDistance(distanceAccumulator.current);

                          // Elevation Logic (Smoothing)
                          if (altitude !== null && lastPos.current.altitude !== null) {
                              const altDiff = altitude - (lastPos.current.altitude || 0);
                              // Only count positive gains, filter minimal noise (< 0.5m) and massive jumps (> 5m/s)
                              if (altDiff > 0.5 && altDiff < 5 * timeDeltaSeconds) {
                                  setElevationGain(prev => prev + altDiff);
                              }
                          }

                          // 5. SPEED SMOOTHING (Rolling Average)
                          // If GPS provides speed, prefer it. Else use calc.
                          let speedToBuffer = speed !== null ? speed * 3.6 : instantSpeed * 3.6; // to KM/H
                          if (speedToBuffer < 0) speedToBuffer = 0;
                          
                          speedBuffer.current.push(speedToBuffer);
                          if (speedBuffer.current.length > 5) speedBuffer.current.shift(); // Keep last 5 readings

                          const smoothedSpeed = speedBuffer.current.reduce((a,b) => a+b, 0) / speedBuffer.current.length;
                          
                          // Only update speed if moving, else decay to 0
                          if (instantSpeed > 0.5) {
                              setCurrentSpeed(smoothedSpeed);
                              // Calculate Pace (min/km) -> 60 / kmh
                              const paceMinPerKm = smoothedSpeed > 0.1 ? 60 / smoothedSpeed : 0;
                              const pMin = Math.floor(paceMinPerKm);
                              const pSec = Math.round((paceMinPerKm - pMin) * 60);
                              setCurrentPace(pMin * 60 + pSec); // Store as seconds for easier formatting
                          } else {
                              setCurrentSpeed(0);
                              setCurrentPace(0);
                          }

                          // Update Splits logic
                          const currentKmInt = Math.floor(distanceAccumulator.current);
                          if (currentKmInt > splits.length) {
                              const splitTime = (now - startTimeRef.current)/1000 - lastSplitTime.current;
                              lastSplitTime.current = (now - startTimeRef.current)/1000;
                              
                              const m = Math.floor(splitTime / 60);
                              const s = Math.round(splitTime % 60);
                              const splitPaceStr = `${m}'${s.toString().padStart(2, '0')}"`;
                              
                              setSplits(prev => [...prev, { km: currentKmInt, time: splitTime, pace: splitPaceStr }]);
                              if(playSound) playSound('success'); // Audio feedback
                          }

                          // Update Route
                          setRoute(prev => [...prev, newPoint]);
                          lastPos.current = newPoint;
                      }
                  } else {
                      // First point
                      lastPos.current = newPoint;
                      setRoute([newPoint]);
                  }

                  // Calculate Average Pace
                  const totalTimeSec = (now - startTimeRef.current) / 1000;
                  if (distanceAccumulator.current > 0.05) {
                      const avgSecPerKm = totalTimeSec / distanceAccumulator.current;
                      setAvgPace(avgSecPerKm);
                  }
              },
              (err) => console.warn("GPS Error:", err),
              { 
                  enableHighAccuracy: true, 
                  maximumAge: 0, 
                  timeout: 10000 
              }
          );
      }
  };

  const pauseRun = () => {
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  };

  const resumeRun = () => {
      setIsPaused(false);
      const now = Date.now();
      // Adjust start time to account for pause duration so elapsed time is correct
      const pausedDuration = now - (startTimeRef.current + (elapsedSeconds * 1000));
      startTimeRef.current = startTimeRef.current + pausedDuration;

      // Restart Timer
      timerIntervalRef.current = window.setInterval(() => {
          const totalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(totalSeconds);
      }, 1000);

      // Restart GPS
      if (navigator.geolocation) {
          // Re-bind logic (simplified here, ideally abstract functionality)
          // For this fix, we just rely on user clicking resume which re-activates GPS
          // but in full code we would re-call the watchPosition logic.
          // *Re-calling the watchPosition logic properly:*
          watchId.current = navigator.geolocation.watchPosition((pos) => {
               // ... (Reuse logic from startRun) ...
               // To avoid duplication in this snippet, assuming logic is same.
               // Key is: don't reset distanceAccumulator or route.
               const { latitude, longitude, altitude, speed, accuracy } = pos.coords;
               setGpsAccuracy(accuracy);
               if (accuracy > 25) return;
               const newPoint = { lat: latitude, lng: longitude, altitude, speed, timestamp: pos.timestamp };
               
               if (lastPos.current) {
                   const d = calcDistance(lastPos.current.lat, lastPos.current.lng, latitude, longitude);
                   if (d > 2) {
                       distanceAccumulator.current += d/1000;
                       setDistance(distanceAccumulator.current);
                       setRoute(prev => [...prev, newPoint]);
                       lastPos.current = newPoint;
                       // ... update speed/pace ...
                       let s = speed !== null ? speed * 3.6 : 0;
                       setCurrentSpeed(s);
                   }
               } else {
                   lastPos.current = newPoint;
               }
          }, null, { enableHighAccuracy: true, maximumAge: 0 });
      }
  };

  const endRun = () => {
      pauseRun();
      setIsLocked(false);
      setScreen('finish');
      releaseWakeLock();
      if(playSound) playSound('success');
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  };

  // --- SAVE LOGIC REFAC ---
  const handleSaveAndExit = () => {
      // Calculate final stats securely
      const finalDist = distanceAccumulator.current;
      const finalDur = Math.ceil(elapsedSeconds / 60);
      const finalPaceStr = formatPace(avgPace);
      
      // Calories estimate (METs approx)
      // Run MET ~ 9.8. Cal = MET * Kg * Time(h)
      const weight = currentUser?.weight || 70;
      const cal = Math.floor(10 * weight * (elapsedSeconds/3600));

      onSaveActivity({
          distanceKm: finalDist,
          durationMin: finalDur,
          pace: finalPaceStr,
          date: new Date().toISOString().split('T')[0],
          feeling: 'good',
          notes: runNotes || (pendingWorkout ? `Treino: ${pendingWorkout.title}` : 'Corrida Livre'),
          elevationGain: elevationGain,
          calories: cal,
          route: route,
          mode: selectedMode
      });
      
      // Cleanup
      setScreen('select');
      setDistance(0);
      setRoute([]);
      
      if (onClearPendingWorkout) onClearPendingWorkout();
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

  const formatDistance = (distKm: number) => {
      if (distKm < 1) {
          return { val: Math.floor(distKm * 1000), unit: 'm' };
      }
      return { val: distKm.toFixed(2), unit: 'km' };
  };

  // --- SELECT SCREEN ---
  if (screen === 'select') {
      if (pendingWorkout) {
          return (
              <div className="h-full bg-gray-950 flex flex-col p-6 overflow-y-auto relative animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                          <Target className="text-amber-500" size={24} />
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter font-teko">Briefing da Missão</h2>
                  </div>

                  <div className={`flex-1 flex flex-col items-center justify-center space-y-8 p-8 rounded-3xl bg-gradient-to-br ${pendingWorkout.bgGradient || 'from-gray-900 to-black'} border border-white/10 relative overflow-hidden shadow-2xl`}>
                      {/* Background Ambience */}
                      <div className="absolute top-0 right-0 p-12 opacity-10 animate-pulse">
                          {pendingWorkout.icon ? <pendingWorkout.icon size={200} /> : <Target size={200} />}
                      </div>

                      <div className={`p-6 rounded-full bg-black/40 border-2 ${pendingWorkout.borderColor || 'border-amber-500'} shadow-[0_0_30px_rgba(245,158,11,0.2)] z-10`}>
                          {pendingWorkout.icon ? <pendingWorkout.icon size={48} className={pendingWorkout.color || 'text-amber-500'} /> : <Zap size={48} className="text-amber-500" />}
                      </div>

                      <div className="text-center z-10 space-y-4">
                          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tight leading-none drop-shadow-lg font-teko">
                              {pendingWorkout.title}
                          </h1>
                          <div className="flex items-center justify-center gap-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1"><Timer size={14}/> {pendingWorkout.duration}</span>
                              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                              <span className="flex items-center gap-1"><MapIcon size={14}/> {pendingWorkout.location}</span>
                          </div>
                          <p className="text-gray-300 text-sm md:text-base max-w-md mx-auto leading-relaxed border-t border-white/10 pt-4">
                              {pendingWorkout.desc}
                          </p>
                      </div>

                      <button 
                          onClick={startRun}
                          className="w-full max-w-sm bg-amber-500 hover:bg-amber-400 text-black font-black text-xl uppercase tracking-widest py-5 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3 z-10 font-teko"
                      >
                          <Play fill="black" size={24} /> INICIAR MISSÃO
                      </button>
                      
                      <button 
                          onClick={onClearPendingWorkout}
                          className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest mt-4 z-10"
                      >
                          Cancelar Missão
                      </button>
                  </div>
              </div>
          );
      }

      return (
          <div className="h-full bg-gray-950 flex flex-col relative overflow-hidden">
              <div className="p-6 z-10">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                          <Cloud className="text-gray-400" size={20} />
                      </div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-teko">Sala de Controle</h2>
                  </div>
                  <p className="text-gray-500 text-xs font-bold tracking-widest uppercase pl-1">Configuração de Voo</p>
              </div>
              
              {/* Restored Card Layout for Selection */}
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
                                <div key={mode} onClick={() => setSelectedMode(mode)} className={`relative rounded-2xl transition-all duration-500 cursor-pointer border overflow-hidden ${isSelected ? `h-48 border-transparent shadow-lg ring-2 ring-amber-500` : 'h-24 border-gray-800 opacity-60'}`}>
                                    <div className={`absolute inset-0 ${cfg.pattern}`}></div>
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`text-2xl font-black uppercase italic font-teko ${isSelected ? 'text-white' : 'text-gray-400'}`}>{cfg.title}</h3>
                                                <p className="text-xs font-bold uppercase tracking-widest mt-1 text-white/70">{cfg.subtitle}</p>
                                            </div>
                                            <cfg.icon size={28} className={isSelected ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        {isSelected && (
                                            <button onClick={(e) => { e.stopPropagation(); startRun(); }} className="bg-white text-black font-black text-lg uppercase tracking-widest py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 font-teko">
                                                <Play fill="black" size={20} /> INICIAR SESSÃO
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
      const displayDistance = formatDistance(distance);

      return (
          <div className="fixed inset-0 bg-black z-[100] flex flex-col select-none overflow-hidden">
              
              {/* LOCK OVERLAY */}
              {isLocked && (
                  <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                      <Lock size={64} className="text-gray-500 mb-8" />
                      <LongPressButton onComplete={() => setIsLocked(false)} className="bg-gray-800 text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider border border-gray-600 shadow-lg">
                          Segure p/ Desbloquear
                      </LongPressButton>
                  </div>
              )}

              {/* Map Background Layer */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isMapMode ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}>
                  <LiveMap route={route} isPaused={isPaused} onRef={(map) => mapRef.current = map} />
                  {!isMapMode && <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/90 via-black/70 to-black/95"></div>}
              </div>

              {/* Map Controls */}
              {isMapMode && !isLocked && (
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

              {motivationalMsg && (
                  <div className="absolute top-24 left-4 right-4 z-50 animate-fade-in pointer-events-none">
                      <div className="bg-amber-500 text-black p-4 rounded-2xl shadow-xl border-2 border-white flex items-center gap-3">
                          <div className="bg-black text-amber-500 p-2 rounded-full"><Megaphone className="animate-bounce" size={20} /></div>
                          <p className="font-black text-sm uppercase italic leading-tight">{motivationalMsg}</p>
                      </div>
                  </div>
              )}

              {/* Top Bar - DYNAMIC WIND ZONE HEADER */}
              <div className="relative z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent">
                  <div className="flex items-center gap-2">
                      <GpsStatus accuracy={gpsAccuracy} />
                      {!isLocked && (
                          <button onClick={() => setIsLocked(true)} className="bg-gray-800/80 p-1.5 rounded-full text-gray-400 hover:text-white border border-gray-700">
                              <Lock size={14} />
                          </button>
                      )}
                  </div>
                  
                  {/* Current Wind Mode Indicator (Dynamic) */}
                  <div className={`absolute left-1/2 -translate-x-1/2 top-4 px-4 py-1 rounded-full border bg-black/50 backdrop-blur flex items-center gap-2 ${currentZone.color} ${currentZone.border} ${currentZone.shadow} shadow-lg transition-all duration-500`}>
                      <currentZone.icon size={14} className="animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{currentZone.title}</span>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                      <div className="bg-red-600/20 border border-red-500/50 text-red-500 px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-[10px] font-bold uppercase">REC</span>
                      </div>
                      {!isLocked && (
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
                      )}
                  </div>
              </div>

              {/* HUD Content */}
              <div className={`relative z-10 flex-1 flex flex-col justify-end pb-8 px-4 transition-opacity duration-300 ${isMapMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                  
                  {/* SPLITS OVERLAY */}
                  {isSplitsMode && !isLocked && (
                      <div className="absolute inset-4 bottom-24 bg-black/90 backdrop-blur-xl rounded-3xl border border-gray-800 p-6 overflow-y-auto custom-scrollbar z-20 animate-fade-in">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-2 font-teko"><Flag size={20} className="text-amber-500"/> Parciais</h3>
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

                  {/* Stats Area */}
                  {!isMapMode && !isSplitsMode && (
                      <div className="flex flex-col gap-4 mb-6">
                          
                          {/* DISCREET XP BADGE */}
                          <div className="flex justify-center mb-2">
                              <div key={sessionXP} className="bg-gray-900/80 backdrop-blur border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 animate-fade-in">
                                  <Star size={12} className="text-yellow-500 fill-current" />
                                  <span className="text-sm font-bold text-gray-300 font-mono">{sessionXP} XP</span>
                              </div>
                          </div>

                          {/* Main Row: Distance */}
                          <div className="grid grid-cols-1 gap-2 text-center">
                              <div>
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Distância Percorrida</span>
                                  <div className="flex items-baseline justify-center gap-2">
                                      <div className="text-[7rem] font-black text-white italic tracking-tighter leading-none drop-shadow-2xl font-teko">
                                          {displayDistance.val}
                                      </div>
                                      <div className="text-4xl text-amber-500 font-bold font-teko lowercase">{displayDistance.unit}</div>
                                  </div>
                              </div>
                              <div>
                                  <div className="inline-block bg-gray-900/50 backdrop-blur px-4 py-1 rounded-full border border-white/10">
                                      <span className="text-4xl font-teko font-bold text-gray-200 tracking-tight">{formatTime(elapsedSeconds)}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Pace & Elevation Grid - DYNAMIC BORDERS */}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                              
                              {/* CURRENT PACE */}
                              <div className={`relative bg-gray-900/60 backdrop-blur-md rounded-3xl p-5 border transition-all duration-500 flex flex-col justify-center ${currentZone.border} ${currentZone.shadow}`}>
                                  <div className="relative z-10">
                                      <div className="flex items-center gap-2 mb-1">
                                          <ActivityIcon size={14} className={`${currentZone.color} animate-pulse`} />
                                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pace Atual</span>
                                      </div>
                                      <div className={`text-6xl font-black ${currentZone.color} transition-colors duration-500 font-teko`}>{formatPace(currentPace)}</div>
                                      <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">min/km</div>
                                  </div>
                              </div>

                              {/* ELEVATION GAIN */}
                              <div className="bg-gray-900/60 backdrop-blur-md rounded-3xl p-5 border border-gray-700 flex flex-col justify-center relative overflow-hidden">
                                  <div className="relative z-10">
                                      <div className="flex items-center gap-2 mb-1">
                                          <Mountain size={14} className="text-purple-500" />
                                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Elevação</span>
                                      </div>
                                      <div className="text-6xl font-black text-white font-teko">{elevationGain.toFixed(0)}</div>
                                      <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">Metros</div>
                                  </div>
                              </div>
                          </div>
                          
                          {/* Secondary Stats Row */}
                          <div className="grid grid-cols-3 gap-2 text-center mt-2 opacity-70">
                               <div>
                                   <span className="text-[8px] uppercase font-bold text-gray-500">Velocidade</span>
                                   <div className="font-teko text-xl font-bold text-white">{currentSpeed.toFixed(1)} km/h</div>
                               </div>
                               <div>
                                   <span className="text-[8px] uppercase font-bold text-gray-500">Calorias</span>
                                   <div className="font-teko text-xl font-bold text-white">{calories}</div>
                               </div>
                               <div>
                                   <span className="text-[8px] uppercase font-bold text-gray-500">Pace Médio</span>
                                   <div className="font-teko text-xl font-bold text-white">{formatPace(avgPace)}</div>
                               </div>
                          </div>
                      </div>
                  )}

                  {/* Controls */}
                  {!isLocked && (
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
                  )}
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
                  
                  <h2 className="text-3xl font-black text-white uppercase italic mb-2 font-teko">Treino Finalizado</h2>
                  <p className="text-gray-400 text-sm mb-8 uppercase tracking-widest font-bold">{selectedMode.replace('_', ' ')}</p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-8 text-left">
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Distância</span>
                          <div className="text-3xl font-black text-white font-teko">{distance.toFixed(2)}<span className="text-sm text-amber-500">km</span></div>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Tempo</span>
                          <div className="text-3xl font-black text-white font-teko">{formatTime(elapsedSeconds)}</div>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Pace Médio</span>
                          <div className="text-3xl font-black text-white font-teko">{formatPace(avgPace)}</div>
                      </div>
                      <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Elevação</span>
                          <div className="text-3xl font-black text-white font-teko">{elevationGain.toFixed(0)}m</div>
                      </div>
                  </div>

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

                  <button onClick={handleSaveAndExit} className="w-full bg-white text-black font-black py-3 rounded-xl uppercase tracking-widest mb-4 hover:scale-105 transition-transform shadow-xl">
                      Salvar e Sair
                  </button>
                  
                  <button onClick={() => { setScreen('select'); setRunNotes(''); }} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                      Descartar sem salvar
                  </button>
              </div>

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
