
import React, { useEffect, useState } from 'react';
import { Member, Season, RaceEvent, Story, SoundType, Activity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { ActivityLogger } from './ActivityLogger';
import { Sun, CloudRain, Wind, Rocket, Bot, Crown, Heart, Zap, TrendingUp, Plus, ChevronRight, MapPin, Footprints, Calendar, Activity as ActivityIcon, Printer, FileText, Timer } from 'lucide-react';
import { SocialShareModal } from './SocialShareModal';

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
}

// --- HELPER FUNCTIONS ---
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
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${Math.round(totalSeconds % 60)}s`;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-sm min-w-[120px]">
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
        <p className="text-white text-xl font-black flex items-end gap-1 leading-none">
          {payload[0].value} <span className="text-amber-500 text-xs font-bold mb-0.5">km</span>
        </p>
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex items-center gap-1 text-[10px] text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Atividade Realizada
        </div>
      </div>
    );
  }
  return null;
};

const PaceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const seconds = payload[0].value;
      return (
        <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-xl shadow-2xl backdrop-blur-sm min-w-[120px]">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
          <p className="text-white text-lg font-black flex items-end gap-1 leading-none">
            {formatSecondsToPace(seconds)} <span className="text-blue-400 text-xs font-bold mb-0.5">/km</span>
          </p>
        </div>
      );
    }
    return null;
  };

// --- COMPONENT ---
export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  events, 
  onUpdateUser, 
  onNavigate,
  playSound,
  onUpgradeRequest
}) => {
  const [weather, setWeather] = useState<any>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const isPro = currentUser.plan === 'pro';

  // --- DATA CALCS ---
  const chartData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7) 
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      fullDate: new Date(a.date).toLocaleDateString('pt-BR'),
      km: a.distanceKm,
      pace: a.pace,
      feeling: a.feeling
    }));

  // Pace Evolution Data (Last 20 runs)
  const paceData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20)
    .map(a => ({
        date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        paceSeconds: paceToSeconds(a.pace),
        distance: a.distanceKm
    }))
    .filter(d => d.paceSeconds > 0 && d.distance > 1); // Filter weird data and very short runs

  // Race Predictions Logic (Riegel Formula)
  // T2 = T1 * (D2 / D1)^1.06
  const calculatePredictions = () => {
      if (currentUser.activities.length === 0) return [];
      
      // Find best recent effort (longest run with best pace)
      const bestRun = currentUser.activities
        .filter(a => a.distanceKm >= 3) // Minimum 3km to predict
        .sort((a, b) => {
            const paceA = paceToSeconds(a.pace);
            const paceB = paceToSeconds(b.pace);
            return paceA - paceB; // Lower pace is better
        })[0];

      if (!bestRun) return [];

      const d1 = bestRun.distanceKm;
      const t1 = bestRun.durationMin * 60; // seconds

      const predict = (distTarget: number) => {
          const t2 = t1 * Math.pow((distTarget / d1), 1.06);
          return formatSecondsToTime(t2);
      };

      return [
          { dist: '5 km', time: predict(5) },
          { dist: '10 km', time: predict(10) },
          { dist: '21 km', time: predict(21.097) },
          { dist: '42 km', time: predict(42.195) }
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
        alert("Limite do Plano Básico Atingido.");
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
      // Ensure the print dialog sees the print-only content
      window.print();
  };

  // --- BENTO GRID COMPONENTS ---

  const QuickActionCard = ({ icon: Icon, label, onClick, color, sub }: { icon: any, label: string, onClick: () => void, color: string, sub: string }) => {
      let gradientClass = 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900';
      let shadowClass = 'hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-black/50';
      let iconBg = 'bg-gray-100 dark:bg-gray-800';
      let glowColor = 'group-hover:shadow-gray-500/20';

      if (color.includes('amber')) {
          gradientClass = 'bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-900/20 dark:to-gray-900';
          shadowClass = 'hover:shadow-xl hover:shadow-amber-500/10';
          iconBg = 'bg-amber-100 dark:bg-amber-500/20';
          glowColor = 'group-hover:shadow-amber-500/30';
      } else if (color.includes('blue')) {
          gradientClass = 'bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/20 dark:to-gray-900';
          shadowClass = 'hover:shadow-xl hover:shadow-blue-500/10';
          iconBg = 'bg-blue-100 dark:bg-blue-500/20';
          glowColor = 'group-hover:shadow-blue-500/30';
      } else if (color.includes('purple')) {
          gradientClass = 'bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/20 dark:to-gray-900';
          shadowClass = 'hover:shadow-xl hover:shadow-purple-500/10';
          iconBg = 'bg-purple-100 dark:bg-purple-500/20';
          glowColor = 'group-hover:shadow-purple-500/30';
      } else if (color.includes('red')) {
          gradientClass = 'bg-gradient-to-br from-red-50/50 to-white dark:from-red-900/20 dark:to-gray-900';
          shadowClass = 'hover:shadow-xl hover:shadow-red-500/10';
          iconBg = 'bg-red-100 dark:bg-red-500/20';
          glowColor = 'group-hover:shadow-red-500/30';
      }

      return (
        <button onClick={onClick} className={`group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700/50 ${gradientClass} ${shadowClass}`}>
            <div className={`absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${color}`}>
                <Icon size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} ${color} shadow-lg ${glowColor} transition-all duration-300 mb-3 group-hover:scale-110`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight leading-none mb-1 group-hover:translate-x-1 transition-transform">{label}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform delay-75">{sub}</p>
                </div>
            </div>
        </button>
      );
  };

  const StatCard = () => (
      <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-3xl p-6 relative overflow-hidden shadow-2xl col-span-1 md:col-span-2 border border-gray-800 hover:border-gray-700 transition-all duration-500">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-start z-10 relative mb-4">
              <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-amber-500" /> Volume Semanal
                  </p>
                  <h3 className="text-4xl font-black tracking-tighter text-white drop-shadow-lg">
                    {chartData.reduce((acc, c) => acc + c.km, 0).toFixed(1)} 
                    <span className="text-lg text-amber-500 ml-1 font-bold">km</span>
                  </h3>
              </div>
              {/* Decorative element */}
              <div className="bg-white/5 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-inner">
                  <ActivityIcon size={20} className="text-amber-500" />
              </div>
          </div>
          
          <div className="h-32 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} onMouseMove={(state) => {
                      if (state.isTooltipActive) {
                          setActiveBarIndex(state.activeTooltipIndex ?? null);
                      } else {
                          setActiveBarIndex(null);
                      }
                  }}>
                      <CartesianGrid vertical={false} stroke="#374151" strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 600}} 
                        dy={10}
                      />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        content={<CustomTooltip />}
                      />
                      <Bar 
                        dataKey="km" 
                        radius={[4, 4, 0, 0]} 
                        barSize={24}
                        animationDuration={1000}
                      >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={activeBarIndex === index ? '#fbbf24' : 'url(#barGradient)'} 
                                className="transition-all duration-300"
                                style={{ filter: activeBarIndex === index ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none' }}
                            />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d97706" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#92400e" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>
  );

  const ProgressCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 relative overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={20} /> Comparar Progresso
                </h3>
                <p className="text-xs text-gray-500">Evolução do seu Pace (min/km)</p>
            </div>
        </div>
        <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paceData}>
                    <defs>
                        <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Tooltip content={<PaceTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area 
                        type="monotone" 
                        dataKey="paceSeconds" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPace)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2 font-bold uppercase tracking-widest">Últimas 20 Atividades</p>
    </div>
  );

  const PredictionsCard = () => (
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg col-span-1 border border-purple-500/30">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Timer size={80} /></div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
              <Timer className="text-purple-400" /> Previsão de Tempos
          </h3>
          <div className="space-y-3 relative z-10">
              {predictions.length > 0 ? predictions.map((pred, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                      <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">{pred.dist}</span>
                      <span className="font-mono font-bold text-white">{pred.time}</span>
                  </div>
              )) : (
                  <p className="text-xs text-purple-200 text-center py-4">Corra mais para gerar previsões.</p>
              )}
          </div>
      </div>
  );

  const WeatherCard = () => (
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-blue-900/20 flex flex-col justify-between h-full min-h-[160px] group border border-blue-500/30">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
              <CloudRain size={80} />
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} className="opacity-70" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">Rio de Janeiro</span>
              </div>
              <h3 className="text-4xl font-black drop-shadow-md">{weather ? Math.round(weather.temperature_2m) : '--'}°C</h3>
          </div>
          <div className="relative z-10 mt-auto">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm w-fit px-3 py-1.5 rounded-full">
                  {weather && weather.weather_code <= 3 ? <Sun size={16} className="text-yellow-300" /> : <CloudRain size={16} />}
                  <span className="text-xs font-bold uppercase tracking-wide">{weather && weather.weather_code <= 3 ? 'Céu Limpo' : 'Nublado'}</span>
              </div>
          </div>
      </div>
  );

  const NextRaceCard = () => (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 relative overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col justify-center h-full min-h-[160px] shadow-sm hover:shadow-md transition-all group">
          {nextEvent ? (
              <>
                  <div className="absolute -right-4 -top-4 text-gray-100 dark:text-gray-700/50 group-hover:scale-110 transition-transform duration-500">
                      <Calendar size={100} />
                  </div>
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1 relative z-10">
                      <Rocket size={12} /> Próxima Prova
                  </p>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-1 relative z-10">{nextEvent.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10 font-medium">{new Date(nextEvent.date).toLocaleDateString()}</p>
                  <div className="mt-4 relative z-10">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase border border-gray-200 dark:border-gray-600">
                          Faltam {Math.ceil((new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Dias
                      </span>
                  </div>
              </>
          ) : (
              <div className="text-center text-gray-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs uppercase font-bold">Sem provas</p>
              </div>
          )}
      </div>
  );

  const HeroProfileCard = () => (
      <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col md:flex-row items-center gap-6 group">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-50 dark:opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute -right-10 -bottom-10 text-gray-100 dark:text-gray-700/30 transform -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Wind size={180} />
          </div>

          <div className="relative z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1.5 bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl shadow-amber-500/20">
                  <img src={currentUser.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800" alt="Profile" />
              </div>
              <div className="absolute bottom-0 right-0 bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full border-4 border-white dark:border-gray-800 uppercase tracking-widest shadow-sm">
                  {currentUser.rank}
              </div>
          </div>

          <div className="relative z-10 text-center md:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
                  {getGreeting()}, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">{currentUser.name}</span>
              </h2>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">Distância Total</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{currentUser.totalDistance.toFixed(0)} km</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">XP Temporada</p>
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400">{currentUser.seasonScore}</p>
                  </div>
              </div>
          </div>
      </div>
  );

  const UpsellCard = () => (
      <div className="col-span-1 md:col-span-3 bg-black rounded-3xl p-1 relative overflow-hidden group cursor-pointer shadow-2xl" onClick={onUpgradeRequest}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-purple-600/20 group-hover:opacity-80 transition-opacity"></div>
          <div className="relative bg-gray-900/90 h-full rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm transition-all group-hover:bg-gray-900/80">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 rounded-xl text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                      <Crown size={24} />
                  </div>
                  <div>
                      <h3 className="text-white font-bold text-lg">Desbloqueie o Coach IA</h3>
                      <p className="text-gray-400 text-xs">Análise avançada e treinos personalizados.</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Ver Benefícios <ChevronRight size={14} />
              </div>
          </div>
      </div>
  );

  return (
    <>
        {/* PRINTABLE REPORT VIEW */}
        <div className="hidden print:block fixed inset-0 w-screen h-screen bg-white z-[99999] p-12 overflow-visible text-black left-0 top-0">
            <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                    <Wind size={32} className="text-black" />
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Filhos do Vento</h1>
                </div>
                <div className="text-right">
                    <h2 className="text-sm font-bold uppercase text-gray-500">Relatório de Performance</h2>
                    <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="flex items-start gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <img src={currentUser.avatarUrl} className="w-20 h-20 rounded-full border-2 border-gray-300" alt="User" />
                <div>
                    <h3 className="text-2xl font-bold text-black">{currentUser.name}</h3>
                    <p className="text-sm text-gray-600 uppercase font-bold tracking-wider mb-2">{currentUser.rank}</p>
                    <div className="flex gap-6 text-sm">
                        <div><span className="font-bold text-black">{currentUser.totalDistance.toFixed(1)}</span> km totais</div>
                        <div><span className="font-bold text-black">{currentUser.seasonScore}</span> XP</div>
                        <div><span className="font-bold text-black">{currentUser.activities.length}</span> Atividades</div>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">Histórico Recente</h3>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="py-2 text-xs font-black uppercase">Data</th>
                        <th className="py-2 text-xs font-black uppercase">Distância</th>
                        <th className="py-2 text-xs font-black uppercase">Tempo</th>
                        <th className="py-2 text-xs font-black uppercase">Pace</th>
                        <th className="py-2 text-xs font-black uppercase">Sensação</th>
                    </tr>
                </thead>
                <tbody>
                    {currentUser.activities.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map((act, i) => (
                        <tr key={i} className="border-b border-gray-200">
                            <td className="py-3 text-sm font-medium">{new Date(act.date).toLocaleDateString()}</td>
                            <td className="py-3 text-sm font-bold">{act.distanceKm.toFixed(2)} km</td>
                            <td className="py-3 text-sm font-mono">{act.durationMin} min</td>
                            <td className="py-3 text-sm font-mono">{act.pace}</td>
                            <td className="py-3 text-xs uppercase text-gray-500">{act.feeling}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 uppercase font-bold">
                Gerado automaticamente pelo sistema Filhos do Vento
            </div>
        </div>

        {/* MAIN DASHBOARD - HIDDEN ON PRINT */}
        <div className="pb-24 animate-fade-in space-y-6 print:hidden">
            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* 1. HERO PROFILE (Wide) */}
                <div className="col-span-1 md:col-span-3 lg:col-span-3">
                    <HeroProfileCard />
                </div>

                {/* 2. WEATHER (Tall or Square) */}
                <div className="col-span-1 md:col-span-1">
                    <WeatherCard />
                </div>

                {/* 3. QUICK ACTIONS ROW */}
                <div className="col-span-1 md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionCard 
                        icon={Rocket} 
                        label="Live Run" 
                        sub="Iniciar Treino"
                        color="text-amber-500" 
                        onClick={() => onNavigate && onNavigate('run')}
                    />
                    <QuickActionCard 
                        icon={Bot} 
                        label="Coach IA" 
                        sub={isPro ? "Pronto" : "Bloqueado"}
                        color="text-blue-500" 
                        onClick={() => onNavigate && onNavigate('coach')}
                    />
                    <QuickActionCard 
                        icon={Crown} 
                        label="Ranking" 
                        sub={`#${currentUser.rank}`}
                        color="text-purple-500" 
                        onClick={() => onNavigate && onNavigate('leaderboard')}
                    />
                    <QuickActionCard 
                        icon={Heart} 
                        label="Social" 
                        sub="Feed & Chat"
                        color="text-red-500" 
                        onClick={() => onNavigate && onNavigate('community')}
                    />
                </div>

                {/* 4. STATS & NEXT RACE */}
                <StatCard />
                
                <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-4">
                    <NextRaceCard />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsLogModalOpen(true)}
                            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 flex items-center justify-center gap-2 transition-all group shadow-sm hover:shadow-md"
                        >
                            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full group-hover:scale-110 transition-transform">
                                <Plus size={20} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Lançar</span>
                        </button>
                        <button 
                            onClick={handlePrintReport}
                            className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 flex items-center justify-center gap-2 transition-all group shadow-sm hover:shadow-md"
                        >
                            <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full group-hover:scale-110 transition-transform">
                                <Printer size={20} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Exportar</span>
                        </button>
                    </div>
                </div>

                {/* 5. NEW FEATURES: Progress & Predictions */}
                <ProgressCard />
                <PredictionsCard />

                {/* 6. UPSELL (If Basic) */}
                {!isPro && <UpsellCard />}

            </div>

            {/* --- MANUAL LOG MODAL --- */}
            {isLogModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
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
