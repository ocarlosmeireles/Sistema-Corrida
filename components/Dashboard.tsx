
import React, { useEffect, useState } from 'react';
import { Member, Season, RaceEvent, Story, SoundType, Activity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ActivityLogger } from './ActivityLogger';
import { Sun, CloudRain, Wind, Target, Flag, TrendingUp, Footprints, X, Flame, Zap, Crown, Plus, Edit3, Check, ChevronRight, Timer, Medal, FileDown, Calendar, MapPin, FileText, Share2, Mountain, Gauge, Rocket, Heart, Bot, Lock, Star, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS_LIST } from './Achievements';
import { LiveMap } from './LiveRun';
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

// Robust Pace Parser using Regex
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

const formatPaceFromSeconds = (totalSeconds: number): string => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds === 0) return "0'00\"";
    const min = Math.floor(totalSeconds / 60);
    const sec = Math.round(totalSeconds % 60);
    return `${min}'${sec.toString().padStart(2, '0')}"`;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
};

const QuickAction = ({ icon: Icon, label, onClick, color, subLabel }: { icon: any, label: string, onClick: () => void, color: string, subLabel?: string }) => (
    <button 
        onClick={onClick}
        className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[140px]"
    >
        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('text-', 'text-')}`}>
            <Icon size={100} />
        </div>
        <div className={`p-4 rounded-2xl mb-3 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-').replace('500', '100')} dark:${color.replace('text-', 'bg-').replace('500', '500/20')}`}>
            <Icon size={32} className={color} />
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{label}</span>
        {subLabel && <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">{subLabel}</span>}
    </button>
);

const ProFeaturesShowcase = ({ onUpgrade }: { onUpgrade: () => void }) => (
    <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-black rounded-3xl p-8 overflow-hidden border border-amber-500/30 shadow-2xl my-8 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute -right-10 -top-10 text-amber-500/5">
            <Crown size={300} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    <Crown size={14} /> Acesso Restrito
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                    Desbloqueie o <span className="text-amber-500">Poder Total</span>
                </h3>
                <p className="text-gray-400 max-w-md text-sm leading-relaxed">
                    Sua jornada está apenas começando. Membros PRO evoluem 3x mais rápido com ferramentas exclusivas.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { icon: Bot, label: "Coach IA" },
                    { icon: TrendingUp, label: "Análise Profunda" },
                    { icon: Share2, label: "Sync Strava" },
                    { icon: Star, label: "Suporte VIP" }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <item.icon className="text-amber-500" size={20} />
                        <span className="text-white text-xs font-bold">{item.label}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={onUpgrade}
                className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
                Solicitar Acesso Elite <ChevronRight size={16} />
            </button>
        </div>
    </div>
);

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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'simple' | 'dossier' | 'csv'>('simple');
  const [showShareModal, setShowShareModal] = useState(false);

  const isPro = currentUser.plan === 'pro';

  // Calculations
  const validActivities = currentUser.activities.filter(a => paceToSeconds(a.pace) > 0);
  const avgPaceSeconds = validActivities.length > 0 
    ? validActivities.reduce((acc, curr) => acc + paceToSeconds(curr.pace), 0) / validActivities.length
    : 0;
  const avgPace = formatPaceFromSeconds(avgPaceSeconds);

  const chartData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14) 
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      km: a.distanceKm,
      pace: a.pace,
      duration: a.durationMin
    }));

  const chartTotalKm = chartData.reduce((acc, curr) => acc + curr.km, 0);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-22.9068&longitude=-43.1729&current=temperature_2m,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo');
        const data = await res.json();
        setWeather(data.current);
      } catch (e) {}
    };
    fetchWeather();
  }, []);

  const handleAddActivity = (newActivityData: any) => {
    if (currentUser.plan === 'basic' && currentUser.activities.length >= 15) {
        if(playSound) playSound('error');
        alert("🚨 Limite do Plano Básico Atingido (15 Atividades).\n\nSolicite o Upgrade para PRO.");
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
    if(newActivity.distanceKm > 10) xpEarned += 50;

    onUpdateUser({
      ...currentUser,
      totalDistance: currentUser.totalDistance + newActivity.distanceKm,
      seasonScore: currentUser.seasonScore + xpEarned,
      activities: [...currentUser.activities, newActivity]
    });
    setIsLogModalOpen(false);
  };

  // --- EXPORT LOGIC (Simplified for brevity) ---
  const handleDownloadCSV = () => {
      // ... existing CSV logic
      if(playSound) playSound('success');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-700 text-xs">
                <p className="font-bold mb-1">{label}</p>
                <p className="text-amber-400 font-bold text-lg">{payload[0].value} km</p>
                <p className="text-gray-400">Pace: {payload[0].payload.pace}</p>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-24 animate-fade-in font-sans relative">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                {getGreeting()}, <span className="text-amber-500">{currentUser.name.split(' ')[0]}.</span>
              </h1>
              <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                      <Wind size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">{currentUser.rank}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                      ID: {currentUser.id.substring(0,6)}
                  </div>
              </div>
          </div>
          
          {weather && (
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-amber-500">
                      {weather.weather_code <= 3 ? <Sun size={24} /> : <CloudRain size={24} />}
                  </div>
                  <div>
                      <div className="font-bold text-gray-900 dark:text-white text-lg leading-none">{Math.round(weather.temperature_2m)}°C</div>
                      <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">Rio de Janeiro</div>
                  </div>
              </div>
          )}
      </div>

      {/* --- ACTION HUB (GRID) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction 
            icon={Rocket} 
            label="Iniciar Corrida" 
            subLabel="Modo Live" 
            onClick={() => onNavigate && onNavigate('run')} 
            color="text-amber-500" 
          />
          <QuickAction 
            icon={Bot} 
            label="Coach IA" 
            subLabel={isPro ? "Pronto" : "Bloqueado"}
            onClick={() => onNavigate && onNavigate('coach')} 
            color="text-blue-500" 
          />
          <QuickAction 
            icon={Crown} 
            label="Ranking" 
            subLabel={`Posição: ${currentUser.rank}`}
            onClick={() => onNavigate && onNavigate('leaderboard')} 
            color="text-purple-500" 
          />
          <QuickAction 
            icon={Heart} 
            label="Social" 
            subLabel="Feed & Chat"
            onClick={() => onNavigate && onNavigate('community')} 
            color="text-red-500" 
          />
      </div>

      {/* --- CONDITIONAL CONTENT (PRO VS BASIC) --- */}
      
      {!isPro && onUpgradeRequest && (
          <ProFeaturesShowcase onUpgrade={onUpgradeRequest} />
      )}

      {/* STATS SECTION (Always visible, but emphasized differently) */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${!isPro ? 'opacity-80' : ''}`}>
          {/* Volume Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm h-[350px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={20} className="text-amber-500" />
                      Volume Recente
                  </h3>
                  <button onClick={() => setIsLogModalOpen(true)} className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      + Manual
                  </button>
              </div>
              
              <div className="flex-1">
                  {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} />
                              <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                              <Bar dataKey="km" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados recentes.</div>
                  )}
              </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <div>
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Performance Geral</h3>
                  
                  <div className="space-y-6">
                      <div>
                          <div className="text-3xl font-black text-gray-900 dark:text-white">{currentUser.totalDistance.toFixed(1)} <span className="text-sm text-amber-500">km</span></div>
                          <div className="text-xs text-gray-400">Distância Total</div>
                      </div>
                      
                      <div>
                          <div className="text-3xl font-black text-gray-900 dark:text-white">{avgPace} <span className="text-sm text-blue-500">/km</span></div>
                          <div className="text-xs text-gray-400">Pace Médio</div>
                      </div>

                      <div>
                          <div className="text-3xl font-black text-gray-900 dark:text-white">{currentUser.seasonScore} <span className="text-sm text-purple-500">XP</span></div>
                          <div className="text-xs text-gray-400">Pontuação Temporada</div>
                      </div>
                  </div>
              </div>
              
              {isPro && (
                  <button onClick={() => onNavigate && onNavigate('activity')} className="w-full py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mt-4">
                      Ver Detalhes Completos
                  </button>
              )}
          </div>
      </div>

      {/* --- MODALS --- */}
      {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-lg relative bg-gray-900 rounded-3xl p-1">
                  <button onClick={() => setIsLogModalOpen(false)} className="absolute -top-12 right-0 text-white p-2 rounded-full bg-gray-800/50 hover:bg-gray-700">
                      <X size={24} />
                  </button>
                  <ActivityLogger onAddActivity={handleAddActivity} />
              </div>
          </div>
      )}
    </div>
  );
};
