
import React, { useEffect, useState } from 'react';
import { Member, Season, RaceEvent, Story, SoundType, Activity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ActivityLogger } from './ActivityLogger';
import { Sun, CloudRain, Wind, Rocket, Bot, Crown, Heart, Zap, TrendingUp, Plus, ChevronRight, MapPin, Footprints, Calendar } from 'lucide-react';
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

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
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
  const isPro = currentUser.plan === 'pro';

  // --- DATA CALCS ---
  const chartData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7) 
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit' }),
      km: a.distanceKm,
    }));

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

  // --- BENTO GRID COMPONENTS ---

  const QuickActionCard = ({ icon: Icon, label, onClick, color, sub }: { icon: any, label: string, onClick: () => void, color: string, sub: string }) => (
      <button onClick={onClick} className="group relative overflow-hidden bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md rounded-3xl p-5 text-left transition-all hover:scale-[1.02] border border-white/5 hover:border-white/10 shadow-sm hover:shadow-lg">
          <div className={`absolute right-0 top-0 p-4 opacity-10 transition-transform group-hover:scale-125 group-hover:rotate-12 ${color}`}>
              <Icon size={60} />
          </div>
          <div className={`mb-3 w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('500', '500/20')} ${color}`}>
              <Icon size={20} />
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">{label}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
      </button>
  );

  const StatCard = () => (
      <div className="bg-gray-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl col-span-1 md:col-span-2 border border-gray-800">
          <div className="flex justify-between items-start z-10 relative">
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Volume Semanal</p>
                  <h3 className="text-3xl font-black">{chartData.reduce((acc, c) => acc + c.km, 0).toFixed(1)} <span className="text-lg text-amber-500">km</span></h3>
              </div>
              <div className="bg-gray-800 p-2 rounded-xl"><TrendingUp size={20} className="text-green-400" /></div>
          </div>
          <div className="h-32 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fbbf24' }}
                      />
                      <Bar dataKey="km" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>
  );

  const WeatherCard = () => (
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg flex flex-col justify-between h-full min-h-[160px]">
          <div className="absolute top-0 right-0 p-4 opacity-20">
              <CloudRain size={80} />
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} className="opacity-70" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">Rio de Janeiro</span>
              </div>
              <h3 className="text-4xl font-black">{weather ? Math.round(weather.temperature_2m) : '--'}°C</h3>
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-2">
                  {weather && weather.weather_code <= 3 ? <Sun size={20} className="text-yellow-300" /> : <CloudRain size={20} />}
                  <span className="text-sm font-medium">{weather && weather.weather_code <= 3 ? 'Céu Limpo' : 'Nublado'}</span>
              </div>
          </div>
      </div>
  );

  const NextRaceCard = () => (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl p-6 relative overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col justify-center h-full min-h-[160px]">
          {nextEvent ? (
              <>
                  <div className="absolute top-0 right-0 p-4 text-gray-300 dark:text-gray-700">
                      <Calendar size={60} />
                  </div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2">Próxima Prova</p>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-1">{nextEvent.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(nextEvent.date).toLocaleDateString()}</p>
                  <div className="mt-3">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase">
                          {Math.ceil((new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Dias
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
      <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col md:flex-row items-center gap-6">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50 dark:opacity-20 pointer-events-none"></div>
          <div className="absolute -right-10 -bottom-10 text-gray-100 dark:text-gray-700/30 transform -rotate-12">
              <Wind size={180} />
          </div>

          <div className="relative z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-amber-400 to-orange-600">
                  <img src={currentUser.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800" alt="Profile" />
              </div>
              <div className="absolute bottom-0 right-0 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white dark:border-gray-800 uppercase tracking-wider">
                  {currentUser.rank}
              </div>
          </div>

          <div className="relative z-10 text-center md:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
                  {getGreeting()}, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">{currentUser.name}</span>
              </h2>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Distância Total</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{currentUser.totalDistance.toFixed(0)} km</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">XP Temporada</p>
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400">{currentUser.seasonScore}</p>
                  </div>
              </div>
          </div>
      </div>
  );

  const UpsellCard = () => (
      <div className="col-span-1 md:col-span-3 bg-black rounded-3xl p-1 relative overflow-hidden group cursor-pointer" onClick={onUpgradeRequest}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-purple-600/20"></div>
          <div className="relative bg-gray-900/90 h-full rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm transition-all group-hover:bg-gray-900/80">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 rounded-xl text-black shadow-lg shadow-amber-500/20">
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
    <div className="pb-24 animate-fade-in space-y-6">
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
                <button 
                    onClick={() => setIsLogModalOpen(true)}
                    className="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 flex items-center justify-center gap-2 transition-all group"
                >
                    <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full group-hover:scale-110 transition-transform">
                        <Plus size={20} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Lançamento Manual</span>
                </button>
            </div>

            {/* 5. UPSELL (If Basic) */}
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
  );
};
