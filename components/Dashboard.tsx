import React, { useEffect, useState } from 'react';
import { Member, Season, RaceEvent, Story, SoundType, Activity, Challenge } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, YAxis, CartesianGrid } from 'recharts';
import { ActivityLogger } from './ActivityLogger';
import { Sun, CloudRain, Wind, Rocket, Bot, Crown, Heart, Zap, TrendingUp, Plus, ChevronRight, MapPin, Footprints, Calendar, Activity as ActivityIcon, Printer, Award, Clock, Flag, Lock, Check, Gauge, Info, RotateCw, Sparkles, ArrowUpRight, Dumbbell, User } from 'lucide-react';

// --- HELPER FUNCTIONS (MANTIDAS) ---
const paceToSeconds = (pace: string): number => {
  if (!pace) return 0;
  try {
    const match = pace.match(/(\d+)[.:,'"]+(\d+)/);
    if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        return (min * 60) + sec;
    }
    const floatVal = parseFloat(pace);
    if (!isNaN(floatVal)) return floatVal * 60;
    return 0;
  } catch (e) {
    return 0;
  }
};

const formatSecondsToPace = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return `${m}'${s.toString().padStart(2, '0')}"`;
};

const formatSecondsToTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-sm min-w-[120px]">
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
        <p className="text-white text-xl font-black flex items-end gap-1 leading-none">
          {payload[0].value} <span className="text-amber-500 text-xs font-bold mb-0.5">km</span>
        </p>
      </div>
    );
  }
  return null;
};

const PaceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Payload contains the data object for the hovered point
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-sm min-w-[140px]">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2">{label}</p>
          
          <div className="mb-2">
            <span className="text-[9px] text-gray-500 uppercase font-bold block">Pace Médio</span>
            <p className="text-white text-lg font-black flex items-end gap-1 leading-none">
              {data.formattedPace} <span className="text-blue-400 text-[10px] font-bold mb-0.5">/km</span>
            </p>
          </div>

          <div>
            <span className="text-[9px] text-gray-500 uppercase font-bold block">Distância</span>
            <p className="text-gray-300 text-sm font-bold flex items-end gap-1 leading-none">
              {data.distance.toFixed(2)} <span className="text-gray-500 text-[10px] font-bold mb-0.5">km</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

interface DashboardProps {
  currentUser: Member;
  season: Season;
  events: RaceEvent[];
  teamMembers: Member[];
  latestStory?: Story;
  onUpdateUser: (member: Member) => void;
  isDark?: boolean;
  onNavigate?: (tab: string) => void;
  playSound?: (type: SoundType) => void;
  onUpgradeRequest?: () => void;
  challenges?: Challenge[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  events, 
  onUpdateUser, 
  onNavigate,
  playSound,
  onUpgradeRequest,
  challenges = []
}) => {
  const [weather, setWeather] = useState<any>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showTunnelInfo, setShowTunnelInfo] = useState(false);
  const isPro = currentUser.plan === 'pro';

  // --- DATA CALCS ---
  const chartData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7) 
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      fullDate: new Date(a.date).toLocaleDateString('pt-BR'),
      km: a.distanceKm,
      pace: a.pace,
      feeling: a.feeling
    }));

  const totalWeeklyKm = chartData.reduce((acc, c) => acc + c.km, 0);
  const getGoalByRank = (rank: string) => {
      if(rank.includes("Brisa")) return 15;
      if(rank.includes("Rajada")) return 30;
      if(rank.includes("Ventania")) return 45;
      if(rank.includes("Tempestade")) return 60;
      if(rank.includes("Furacão")) return 80;
      return 100;
  };
  const weeklyGoal = getGoalByRank(currentUser.rank);
  const goalPercent = Math.min(100, (totalWeeklyKm / weeklyGoal) * 100);

  const avgPaceSec = chartData.length > 0 
    ? chartData.reduce((acc, curr) => acc + paceToSeconds(curr.pace), 0) / chartData.length
    : 0;
  const windVelocity = avgPaceSec > 0 ? (3600 / avgPaceSec).toFixed(1) : "0.0";

  const paceData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20)
    .map(a => ({
        date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        paceSeconds: paceToSeconds(a.pace),
        formattedPace: a.pace,
        distance: a.distanceKm
    }))
    .filter(d => d.paceSeconds > 0 && d.distance > 1);

  const activeChallenge = challenges.find(c => c.participants.includes(currentUser.id));
  const challengeProgress = activeChallenge ? (() => {
      const startDate = new Date(activeChallenge.startDate || '2000-01-01');
      const relevantActivities = currentUser.activities.filter(a => new Date(a.date) >= startDate);
      const totalKm = relevantActivities.reduce((acc, a) => acc + a.distanceKm, 0);
      return {
          totalKm,
          percentage: Math.min(100, (totalKm / activeChallenge.targetKm) * 100),
          remaining: Math.max(0, activeChallenge.targetKm - totalKm)
      };
  })() : null;

  const calculatePredictions = () => {
      if (currentUser.activities.length === 0) return null;
      const bestRun = currentUser.activities
        .filter(a => a.distanceKm >= 1) 
        .sort((a, b) => { return b.distanceKm - a.distanceKm; })[0];

      if (!bestRun) return null;

      const d1 = bestRun.distanceKm;
      const t1 = bestRun.durationMin * 60; 

      const predict = (distTarget: number) => {
          const t2 = t1 * Math.pow((distTarget / d1), 1.06);
          const paceSeconds = t2 / distTarget;
          return {
              time: formatSecondsToTime(t2),
              pace: formatSecondsToPace(paceSeconds)
          };
      };

      return [
          { dist: '5', unit: 'km', ...predict(5) },
          { dist: '10', unit: 'km', ...predict(10) },
          { dist: '21,1', unit: 'km', ...predict(21.097) },
          { dist: '42,2', unit: 'km', ...predict(42.195) }
      ];
  };

  const predictions = calculatePredictions();

  const nextEvent = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo');
        const data = await res.json();
        setWeather(data.current);
      } catch (e) {}
    };
    fetchWeather();
  }, []);

  const handleAddActivity = (newActivityData: any) => {
    if (currentUser.plan === 'basic' && currentUser.activities.length >= 15) {
        alert("Limite do Plano Básico Atingido. Assine o PRO para registros ilimitados.");
        return;
    }
    if(playSound) playSound('success');

    let paceString = "0'00\"";
    if (newActivityData.distanceKm > 0 && newActivityData.durationMin > 0) {
        const paceVal = newActivityData.durationMin / newActivityData.distanceKm;
        const min = Math.floor(paceVal);
        const sec = Math.round((paceVal - min) * 60);
        paceString = `${min}'${sec.toString().padStart(2, '0')}"`;
    }

    const newActivity = {
      id: Date.now().toString(),
      ...newActivityData,
      pace: paceString
    };
    
    let xpEarned = Math.round(newActivity.distanceKm * 10);
    onUpdateUser({
      ...currentUser,
      totalDistance: currentUser.totalDistance + newActivity.distanceKm,
      seasonScore: currentUser.seasonScore + xpEarned,
      activities: [...currentUser.activities, newActivity]
    });
    setIsLogModalOpen(false);
  };

  const handlePrintReport = () => {
      setIsPrinting(true);
      setTimeout(() => {
          window.print();
          setTimeout(() => setIsPrinting(false), 500);
      }, 100);
  };

  // --- NEW MOBILE HOME (COCKPIT STYLE) ---
  const MobileHome = () => (
      <div className="md:hidden space-y-6 animate-fade-in pb-20">
          
          {/* 1. Header Compacto */}
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <img src={currentUser.avatarUrl} className="w-10 h-10 rounded-full border border-gray-800 object-cover" alt="User" />
                  <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">{getGreeting()}</p>
                      <h2 className="text-lg font-black text-white leading-none">{currentUser.name.split(' ')[0]}</h2>
                  </div>
              </div>
              {weather && (
                  <div className="bg-gray-900 rounded-full px-3 py-1 border border-gray-800 flex items-center gap-2">
                      {weather.weather_code <= 3 ? <Sun size={14} className="text-amber-500" /> : <CloudRain size={14} className="text-blue-400" />}
                      <span className="text-xs font-bold text-white">{Math.round(weather.temperature_2m)}°</span>
                  </div>
              )}
          </div>

          {/* 2. Card Identidade do Piloto (Main Stats) */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 relative overflow-hidden border border-gray-800 shadow-2xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Patente Atual</p>
                      <div className="flex items-center gap-2">
                          <Crown size={20} className="text-amber-500" />
                          <h1 className="text-3xl font-black text-white italic uppercase">{currentUser.rank}</h1>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Nível XP</p>
                      <p className="text-xl font-mono font-bold text-purple-400">{currentUser.seasonScore}</p>
                  </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm border border-white/5">
                  <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Distância Total</p>
                      <p className="text-2xl font-black text-white">{currentUser.totalDistance.toFixed(0)} <span className="text-sm text-gray-500 font-normal">km</span></p>
                  </div>
                  <div className="h-8 w-px bg-gray-700"></div>
                  <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Semana</p>
                      <p className="text-2xl font-black text-amber-500">{totalWeeklyKm.toFixed(1)} <span className="text-sm text-gray-500 font-normal">km</span></p>
                  </div>
              </div>
          </div>

          {/* 3. Meta Semanal (Progress Ring) */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 flex items-center gap-5">
              <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2937" strokeWidth="8" />
                      <circle 
                          cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="8" 
                          strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * goalPercent / 100)} 
                          strokeLinecap="round"
                      />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{Math.round(goalPercent)}%</span>
                  </div>
              </div>
              <div className="flex-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1">Meta da Semana</h3>
                  <p className="text-xs text-gray-400">Você correu <strong>{totalWeeklyKm.toFixed(1)}km</strong> de {weeklyGoal}km previstos para o nível {currentUser.rank}.</p>
              </div>
          </div>

          {/* 4. Ações Rápidas (Grid) */}
          <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" /> Acesso Rápido
              </h3>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onNavigate && onNavigate('history')} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-left transition-colors">
                      <Clock size={24} className="text-blue-400 mb-2" />
                      <span className="block text-sm font-bold text-white">Histórico</span>
                      <span className="text-[10px] text-gray-500">Ver atividades</span>
                  </button>
                  <button onClick={() => onNavigate && onNavigate('resources')} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-left transition-colors">
                      <Footprints size={24} className="text-orange-400 mb-2" />
                      <span className="block text-sm font-bold text-white">Meus Tênis</span>
                      <span className="text-[10px] text-gray-500">Gestão de km</span>
                  </button>
                  <button onClick={() => onNavigate && onNavigate('activity')} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-left transition-colors">
                      <TrendingUp size={24} className="text-green-400 mb-2" />
                      <span className="block text-sm font-bold text-white">Evolução</span>
                      <span className="text-[10px] text-gray-500">Gráficos</span>
                  </button>
                  <button onClick={() => setIsLogModalOpen(true)} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-left transition-colors border border-gray-700">
                      <Plus size={24} className="text-white mb-2" />
                      <span className="block text-sm font-bold text-white">Manual</span>
                      <span className="text-[10px] text-gray-500">Lançar treino</span>
                  </button>
              </div>
          </div>

          {/* 5. Próxima Prova Mini */}
          {nextEvent && (
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Próxima Missão</p>
                      <h4 className="text-sm font-bold text-white">{nextEvent.name}</h4>
                  </div>
                  <div className="bg-black/40 px-3 py-1 rounded-lg">
                      <span className="text-lg font-mono font-bold text-white">{Math.ceil((new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))}</span>
                      <span className="text-[10px] text-gray-400 ml-1">dias</span>
                  </div>
              </div>
          )}
      </div>
  );

  // --- DESKTOP COMPONENTS (Bento Grid) ---
  // ... [Reusing existing components for desktop view] ...
  const QuickActionCard = ({ icon: Icon, label, onClick, color, sub, locked }: { icon: any, label: string, onClick: () => void, color: string, sub: string, locked?: boolean }) => {
      let iconBg = 'bg-gray-100 dark:bg-gray-700/50';
      return (
        <button onClick={locked ? onUpgradeRequest : onClick} className={`group relative rounded-3xl p-5 text-left transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-800/40 backdrop-blur-sm overflow-hidden shadow-lg`}>
            {locked && <div className="absolute inset-0 bg-gray-900/60 z-20 flex items-center justify-center backdrop-blur-[1px]"><Lock size={24} className="text-gray-400" /></div>}
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} transition-transform duration-300 group-hover:scale-110 mb-4`}>
                    <Icon size={24} strokeWidth={2.5} className={color.replace('text-', 'text-')} />
                </div>
                <div>
                    <h4 className={`font-black text-sm uppercase tracking-tight leading-none mb-1 text-gray-900 dark:text-white group-hover:translate-x-1 transition-transform`}>{label}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform delay-75">{sub}</p>
                </div>
            </div>
        </button>
      );
  };

  const WindTurbineCard = () => (
      <div className="col-span-1 md:col-span-2 h-[280px] perspective-1000 cursor-pointer" onClick={() => setShowTunnelInfo(!showTunnelInfo)}>
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${showTunnelInfo ? 'rotate-y-180' : ''}`}>
              {/* FRONT */}
              <div className="absolute inset-0 backface-hidden bg-[#09090b] rounded-3xl p-6 overflow-hidden shadow-2xl border border-white/5 group hover:border-amber-500/30 flex flex-col justify-between">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent opacity-50"></div>
                  <div className="flex justify-between items-start z-10 relative">
                      <div>
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Wind size={12} className="text-amber-500" /> Túnel de Vento</p>
                          <div className="flex items-baseline gap-2"><h3 className="text-5xl font-black tracking-tighter text-white drop-shadow-lg">{totalWeeklyKm.toFixed(1)}</h3><span className="text-xl text-amber-500 font-bold uppercase">km</span></div>
                      </div>
                      <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1f2937" strokeWidth="8" />
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * goalPercent / 100)} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs font-bold text-white">{Math.round(goalPercent)}%</span></div>
                      </div>
                  </div>
                  <div className="h-32 w-full relative z-10 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                              <defs><linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                              <Tooltip cursor={{stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4'}} content={<CustomTooltip />}/>
                              <Area type="monotone" dataKey="km" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#windGradient)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
              {/* BACK */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#18181b] rounded-3xl p-6 border border-amber-500/30 shadow-2xl flex flex-col justify-center items-center text-center">
                  <RotateCw size={16} className="absolute top-4 right-4 text-gray-500 animate-spin-slow" />
                  <div className="mb-4"><div className="inline-block p-3 bg-amber-900/20 rounded-full border border-amber-500/30 mb-3"><Gauge size={32} className="text-amber-500" /></div><h3 className="text-lg font-bold text-white uppercase tracking-wider">Aerodinâmica</h3></div>
                  <p className="text-xs text-gray-400 max-w-[80%] leading-relaxed mb-6">Sua meta semanal mantém seu Rank <strong>{currentUser.rank}</strong>.</p>
              </div>
          </div>
      </div>
  );

  const ProgressCard = () => (
    <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2 group">
        {!isPro && (
            <div className="absolute inset-0 z-20 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                <Lock size={32} className="text-blue-500 mb-2" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Análise de Pace</h3>
                <button onClick={onUpgradeRequest} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow-lg mt-2">Liberar PRO</button>
            </div>
        )}
        <div className={`flex justify-between items-center mb-4 ${!isPro ? 'blur-[2px]' : ''}`}>
            <div><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><TrendingUp className="text-blue-500" size={20} /> Evolução</h3><p className="text-xs text-gray-500">Histórico de Pace</p></div>
        </div>
        <div className={`h-40 ${!isPro ? 'blur-[2px]' : ''}`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paceData}>
                    <defs><linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <Tooltip content={<PaceTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="paceSeconds" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPace)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );

  const HeroProfileCard = () => (
      <div className="col-span-1 md:col-span-3 lg:col-span-3 hidden md:block">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col md:flex-row items-center gap-6 group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-50 dark:opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
              <div className="relative z-10">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1.5 bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl shadow-amber-500/20">
                      <img src={currentUser.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800" alt="Profile" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full border-4 border-white dark:border-gray-800 uppercase tracking-widest shadow-sm">{currentUser.rank}</div>
              </div>
              <div className="relative z-10 text-center md:text-left flex-1">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">{getGreeting()}, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">{currentUser.name}</span></h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm"><p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Distância Total</p><p className="text-lg font-black text-gray-900 dark:text-white">{currentUser.totalDistance.toFixed(0)} km</p></div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm"><p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">XP Temporada</p><p className="text-lg font-black text-purple-600 dark:text-purple-400">{currentUser.seasonScore}</p></div>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <>
        {/* PRINTABLE REPORT VIEW */}
        {isPrinting && (
            <div className="fixed inset-0 w-screen h-screen bg-white z-[99999] p-12 overflow-visible text-black left-0 top-0">
                <h1 className="text-3xl font-black mb-4">Filhos do Vento - Relatório</h1>
                <p>Atleta: {currentUser.name}</p>
                <p>Data: {new Date().toLocaleDateString()}</p>
                <p>Total KM: {currentUser.totalDistance.toFixed(2)}</p>
            </div>
        )}

        {/* MAIN DASHBOARD */}
        <div className="pb-24 animate-fade-in space-y-6 print:hidden">
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>

            {/* --- MOBILE VIEW (NEW) --- */}
            <MobileHome />

            {/* --- DESKTOP VIEW (BENTO GRID) --- */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <HeroProfileCard />
                
                {/* Weather Card */}
                <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between h-full min-h-[160px]">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><CloudRain size={80} /></div>
                    <div className="relative z-10"><div className="flex items-center gap-2 mb-1"><MapPin size={14} className="opacity-70" /><span className="text-xs font-bold uppercase tracking-wider opacity-70">Rio de Janeiro</span></div><h3 className="text-4xl font-black drop-shadow-md">{weather ? Math.round(weather.temperature_2m) : '--'}°C</h3></div>
                </div>

                {/* Quick Actions */}
                <div className="col-span-1 md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionCard icon={Rocket} label="Live Run" sub="Iniciar Treino" color="text-amber-500" onClick={() => onNavigate && onNavigate('run')}/>
                    <QuickActionCard icon={Bot} label="Coach IA" sub={isPro ? "Pronto" : "PRO Apenas"} color="text-blue-500" onClick={() => onNavigate && onNavigate('coach')} locked={!isPro}/>
                    <QuickActionCard icon={Crown} label="Ranking" sub={`#${currentUser.rank}`} color="text-purple-500" onClick={() => onNavigate && onNavigate('leaderboard')}/>
                    <QuickActionCard icon={Heart} label="Social" sub="Feed & Chat" color="text-red-500" onClick={() => onNavigate && onNavigate('community')}/>
                </div>

                <WindTurbineCard />
                
                <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 relative overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col justify-center h-full shadow-sm">
                        {nextEvent ? (
                            <>
                                <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1 relative z-10"><Rocket size={12} /> Próxima Prova</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-1 relative z-10">{nextEvent.name}</h3>
                                <div className="mt-4 relative z-10"><span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase border border-gray-200 dark:border-gray-600">Faltam {Math.ceil((new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Dias</span></div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400"><Calendar size={32} className="mx-auto mb-2 opacity-50" /><p className="text-xs uppercase font-bold">Sem provas</p></div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsLogModalOpen(true)} className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 flex items-center justify-center gap-2 transition-all group shadow-sm hover:shadow-md"><Plus size={20} className="text-gray-600 dark:text-gray-400" /><span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Lançar</span></button>
                        <button onClick={handlePrintReport} className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 flex items-center justify-center gap-2 transition-all group shadow-sm hover:shadow-md"><Printer size={20} className="text-gray-600 dark:text-gray-400" /><span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Exportar</span></button>
                    </div>
                </div>

                <ProgressCard />
            </div>

            {/* --- MANUAL LOG MODAL --- */}
            {isLogModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg relative bg-gray-900 rounded-3xl p-1">
                        <ActivityLogger onAddActivity={handleAddActivity} />
                        <button onClick={() => setIsLogModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">X</button>
                    </div>
                </div>
            )}
        </div>
    </>
  );
};