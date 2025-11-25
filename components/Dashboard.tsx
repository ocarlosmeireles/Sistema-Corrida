
import React, { useEffect, useState } from 'react';
import { Member, Season, RaceEvent, Story, SoundType, Activity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { ActivityLogger } from './ActivityLogger';
import { Sun, CloudRain, Wind, Target, Flag, TrendingUp, Footprints, X, Flame, Zap, Crown, Plus, Edit3, Check, ChevronRight, Timer, Medal, FileDown, Calendar, MapPin, FileText, Lock, FileSpreadsheet, Printer, Share2, Mountain, Gauge } from 'lucide-react';
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
}

// Robust Pace Parser using Regex
const paceToSeconds = (pace: string): number => {
  if (!pace) return 0;
  try {
    // Matches 5'30", 5:30, 5.30, 5,30
    const match = pace.match(/(\d+)[.:,'"]+(\d+)/);
    if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        return (min * 60) + sec;
    }
    // Fallback if it's just a number (minutes)
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

const getNextRankInfo = (currentDist: number) => {
    if (currentDist < 50) return { nextThreshold: 50, nextRank: 'Rajada', prevThreshold: 0 };
    if (currentDist < 150) return { nextThreshold: 150, nextRank: 'Ventania', prevThreshold: 50 };
    if (currentDist < 300) return { nextThreshold: 300, nextRank: 'Tempestade', prevThreshold: 150 };
    if (currentDist < 600) return { nextThreshold: 600, nextRank: 'Furacão', prevThreshold: 300 };
    if (currentDist < 1000) return { nextThreshold: 1000, nextRank: 'Tornado', prevThreshold: 600 };
    return { nextThreshold: 10000, nextRank: 'Lenda', prevThreshold: 1000 };
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  events, 
  onUpdateUser, 
  onNavigate,
  playSound
}) => {
  const [weather, setWeather] = useState<any>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false); 
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'simple' | 'dossier' | 'csv'>('simple');
  
  // Goal State
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(currentUser.currentGoal || '');

  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);

  const validActivities = currentUser.activities.filter(a => paceToSeconds(a.pace) > 0);
  const avgPaceSeconds = validActivities.length > 0 
    ? validActivities.reduce((acc, curr) => acc + paceToSeconds(curr.pace), 0) / validActivities.length
    : 0;
  const avgPace = formatPaceFromSeconds(avgPaceSeconds);

  const rankInfo = getNextRankInfo(currentUser.totalDistance);
  const distanceToNextRank = Math.max(0, rankInfo.nextThreshold - currentUser.totalDistance);
  const progressToNextRank = Math.min(100, Math.max(0, ((currentUser.totalDistance - rankInfo.prevThreshold) / (rankInfo.nextThreshold - rankInfo.prevThreshold)) * 100));

  const recentAchievements = currentUser.achievements.slice(-3).map(id => 
      ACHIEVEMENTS_LIST.find(a => a.id === id)
  ).filter(Boolean);

  const WEEKLY_GOAL = 30;
  // Calculate actual weekly km
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0,0,0,0);
  
  const currentWeeklyKm = currentUser.activities
    .filter(a => new Date(a.date) >= startOfWeek)
    .reduce((acc, curr) => acc + curr.distanceKm, 0);

  const ringData = [
      { name: 'Completed', value: currentWeeklyKm, color: '#f59e0b' },
      { name: 'Remaining', value: Math.max(0, WEEKLY_GOAL - currentWeeklyKm), color: '#1f2937' } 
  ];

  const today = new Date();
  today.setHours(0,0,0,0);
  const nextEvent = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const daysToEvent = nextEvent ? Math.ceil((new Date(nextEvent.date).getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;

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

    // Safe Pace Calculation
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

  const handleMissionComplete = () => {
      if(missionCompleted) return;
      if(playSound) playSound('success');
      setMissionCompleted(true);
      const newXP = currentUser.seasonScore + 100;
      onUpdateUser({ ...currentUser, seasonScore: newXP });
  };

  const handleSaveGoal = () => {
      if(playSound) playSound('click');
      onUpdateUser({ ...currentUser, currentGoal: goalInput });
      setIsEditingGoal(false);
  };

  // --- NEW WINDOW PRINTING LOGIC ---
  const openReportInNewWindow = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
          alert("Por favor, permita pop-ups para gerar o relatório.");
          return;
      }

      const rows = [...currentUser.activities].reverse().map((act, i) => `
        <tr class="${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-200">
            <td class="py-3 px-4 font-mono text-sm text-gray-700">${new Date(act.date).toLocaleDateString()}</td>
            <td class="py-3 px-4 text-sm text-gray-700 capitalize">${act.mode || 'Corrida'}</td>
            <td class="py-3 px-4 font-bold text-gray-900">${act.distanceKm} km</td>
            <td class="py-3 px-4 text-gray-700">${act.durationMin} min</td>
            <td class="py-3 px-4 font-mono text-gray-700">${act.pace}/km</td>
            ${exportType === 'dossier' ? `
            <td class="py-3 px-4">
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden w-24">
                    <div class="h-full bg-amber-50" style="width: ${Math.min(100, (act.distanceKm / 10) * 100)}%"></div>
                </div>
            </td>` : ''}
            <td class="py-3 px-4 text-xs text-gray-500 italic truncate max-w-[200px]">${act.notes || '-'}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório - ${currentUser.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @media print {
                    @page { margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none; }
                }
                body { font-family: 'Inter', sans-serif; background: white; padding: 40px; }
            </style>
        </head>
        <body>
            <div class="max-w-4xl mx-auto">
                <!-- Controls -->
                <div class="no-print flex justify-between items-center mb-8 bg-gray-100 p-4 rounded-xl">
                    <p class="text-sm text-gray-600 font-medium">Visualização de Impressão</p>
                    <button onclick="window.print()" class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        Imprimir / Salvar PDF
                    </button>
                </div>

                <!-- Header -->
                <div class="flex justify-between items-end border-b-4 border-amber-500 pb-4 mb-8">
                    <div>
                        <h1 class="text-4xl font-black uppercase tracking-tighter text-black">Filhos <span class="text-amber-500">do</span> Vento</h1>
                        <p class="text-sm font-bold uppercase tracking-widest text-gray-500 mt-1">
                            ${exportType === 'dossier' ? 'Dossiê de Performance Tática' : 'Relatório de Campo'}
                        </p>
                    </div>
                    <div class="text-right">
                        <h2 class="text-xl font-bold text-black">${currentUser.name}</h2>
                        <p class="text-xs text-gray-500">ID: ${currentUser.id.substring(0,8)} • Rank: ${currentUser.rank}</p>
                        <p class="text-xs text-gray-400 mt-1">${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <!-- Stats Grid (Dossier Only) -->
                ${exportType === 'dossier' ? `
                <div class="mb-8 grid grid-cols-4 gap-4 text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div>
                        <div class="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Distância Total</div>
                        <div class="text-3xl font-black text-gray-900">${currentUser.totalDistance.toFixed(1)} <span class="text-sm font-normal text-gray-400">km</span></div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Pace Médio</div>
                        <div class="text-3xl font-black text-gray-900">${avgPace}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Season XP</div>
                        <div class="text-3xl font-black text-gray-900">${currentUser.seasonScore}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Missões</div>
                        <div class="text-3xl font-black text-gray-900">${currentUser.activities.length}</div>
                    </div>
                </div>` : ''}

                <!-- Table -->
                <h3 class="text-sm font-bold uppercase border-b border-gray-300 pb-2 mb-4 flex items-center gap-2 text-black">
                    Registro de Operações
                </h3>
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b-2 border-gray-800">
                            <th class="py-2 px-4 font-bold uppercase text-xs text-black">Data</th>
                            <th class="py-2 px-4 font-bold uppercase text-xs text-black">Tipo</th>
                            <th class="py-2 px-4 font-bold uppercase text-xs text-black">Distância</th>
                            <th class="py-2 px-4 font-bold uppercase text-xs text-black">Tempo</th>
                            <th class="py-2 px-4 font-bold uppercase text-xs text-black">Pace</th>
                            ${exportType === 'dossier' ? '<th class="py-2 px-4 font-bold uppercase text-xs text-black">Esforço</th>' : ''}
                            <th class="py-2 px-4 font-bold uppercase text-xs text-black">Obs</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="mt-12 pt-4 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-400">
                    <span>Gerado pelo Sistema Filhos do Vento v2.5</span>
                    <span>filhosdovento.app</span>
                </div>
            </div>
            <script>
                // Auto print on load if desired, or let user click
                // window.onload = () => window.print();
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setIsExportModalOpen(false);
  };

  const handleDownloadCSV = () => {
      const headers = ["Data", "Distância (km)", "Tempo (min)", "Pace", "Sensação", "Notas"];
      const rows = currentUser.activities.map(act => [
          new Date(act.date).toLocaleDateString('pt-BR'),
          act.distanceKm.toString().replace('.', ','),
          act.durationMin.toString(),
          act.pace,
          act.feeling === 'great' ? 'Ótimo' : act.feeling === 'good' ? 'Bom' : act.feeling === 'hard' ? 'Difícil' : 'Dor',
          `"${(act.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = "\ufeff" + [
          headers.join(';'), 
          ...rows.map(e => e.join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `missoes_${currentUser.name.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if(playSound) playSound('success');
  };

  // Prepare Chart Data (Volume)
  const chartData = currentUser.activities
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14) 
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      km: a.distanceKm,
      pace: a.pace,
      duration: a.durationMin,
      fullDate: new Date(a.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })
    }));

  const chartTotalKm = chartData.reduce((acc, curr) => acc + curr.km, 0);

  // Prepare Pace Evolution Data (Last 5 Runs) - Guard against NaN
  const paceEvolutionData = currentUser.activities
    .filter(a => paceToSeconds(a.pace) > 0)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5)
    .map(a => ({
        date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        paceSeconds: paceToSeconds(a.pace),
        paceLabel: a.pace,
        km: a.distanceKm
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-700 text-xs">
                <p className="font-bold mb-1">{label}</p>
                <p className="text-amber-400 font-bold text-lg">{payload[0].value} km</p>
                <p className="text-gray-400">Pace: {payload[0].payload.pace}</p>
                <p className="text-gray-400">Tempo: {payload[0].payload.duration} min</p>
            </div>
        );
    }
    return null;
  };

  const PaceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-700 text-xs">
                <p className="font-bold mb-1">{label}</p>
                <p className="text-cyan-400 font-bold text-lg">{payload[0].payload.paceLabel}/km</p>
                <p className="text-gray-400">Distância: {payload[0].payload.km} km</p>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-sans relative">
      {showShareModal && selectedActivity && (
          <SocialShareModal 
              isOpen={showShareModal} 
              onClose={() => setShowShareModal(false)} 
              data={{
                  distance: `${selectedActivity.distanceKm.toFixed(2)} km`,
                  time: `${selectedActivity.durationMin} min`,
                  pace: `${selectedActivity.pace}/km`
              }}
              route={selectedActivity.route}
          />
      )}
      
      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="space-y-6">
          {/* HEADER & WEATHER */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
              <div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                    {getGreeting()}, <span className="text-amber-500">{currentUser.name.split(' ')[0]}.</span>
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-2 flex items-center gap-2">
                      Pronto para dominar os ventos hoje?
                  </p>
              </div>
              <div className="flex items-center gap-3">
                  {weather && (
                      <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
          </div>

          {/* --- VISUAL STATS GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rank Card */}
              <div 
                onClick={() => onNavigate && onNavigate('leaderboard')}
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:border-amber-500/50 transition-all group relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Crown size={80} />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                          <Wind size={20} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Nível Atual</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{currentUser.rank}</h3>
                  <p className="text-xs text-gray-400 mb-4">
                      {currentUser.totalDistance.toFixed(1)} km percorridos
                  </p>

                  <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                          <span>Progresso</span>
                          <span>Faltam {distanceToNextRank.toFixed(0)} km</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${progressToNextRank}%` }}></div>
                      </div>
                  </div>
              </div>

              {/* Pace Card */}
              <div 
                onClick={() => onNavigate && onNavigate('activity')}
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:border-blue-500/50 transition-all group relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Timer size={80} />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                          <Zap size={20} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Ritmo Médio</span>
                  </div>

                  <h3 className="text-4xl font-mono font-black text-gray-900 dark:text-white mb-1 tracking-tighter">
                      {avgPace}<span className="text-sm font-sans font-normal text-gray-400 ml-1">/km</span>
                  </h3>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs text-green-500 font-bold bg-green-100 dark:bg-green-500/10 py-1 px-2 rounded-lg w-fit">
                      <TrendingUp size={14} />
                      <span>Estável</span>
                  </div>
              </div>

              {/* Achievements Card */}
              <div 
                onClick={() => onNavigate && onNavigate('achievements')}
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:border-purple-500/50 transition-all group relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Medal size={80} />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Crown size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Conquistas</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                  </div>

                  <div className="flex gap-2">
                      {recentAchievements.length > 0 ? (
                          recentAchievements.map((ach, i) => (
                              <div key={i} className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-2 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700" title={ach?.title}>
                                  <span className="text-2xl mb-1 filter drop-shadow-sm">{ach?.icon}</span>
                                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400 leading-none line-clamp-1">{ach?.title}</span>
                              </div>
                          ))
                      ) : (
                          <p className="text-xs text-gray-400 italic">Nenhuma conquista recente.</p>
                      )}
                      {[...Array(Math.max(0, 3 - recentAchievements.length))].map((_, i) => (
                          <div key={`placeholder-${i}`} className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center opacity-50">
                              <Medal size={16} className="text-gray-300 dark:text-gray-700" />
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* --- ACTION CENTER --- */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => {
                    if(playSound) playSound('click');
                    setIsLogModalOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-2xl font-bold shadow-lg shadow-amber-500/20 flex flex-col items-start justify-between h-32 transition-all group"
              >
                  <div className="bg-black/10 p-2 rounded-lg group-hover:bg-black/20 transition-colors"><Plus size={24} /></div>
                  <span className="text-sm uppercase tracking-wider text-left">Registrar<br/>Treino Manual</span>
              </button>
              
              <div 
                onClick={() => {
                    if(playSound) playSound('click');
                    onNavigate && onNavigate('events');
                }}
                className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col justify-between h-32 cursor-pointer hover:bg-gray-800 transition-colors group"
              >
                  <div className="text-gray-400 group-hover:text-amber-500 transition-colors"><Flag size={24} /></div>
                  <div>
                      <span className="text-xs text-gray-500 uppercase font-bold">Próximo Alvo</span>
                      <div className="text-white font-bold text-sm truncate">{nextEvent ? nextEvent.name : 'Definir Evento'}</div>
                      {daysToEvent && <div className="text-green-500 text-xs font-mono">Faltam {daysToEvent} dias</div>}
                  </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col justify-between h-32 relative group md:col-span-1 col-span-2">
                  <div className="flex justify-between items-start text-gray-400">
                      <Target size={24} />
                      {!isEditingGoal && (
                          <button onClick={() => {
                              if(playSound) playSound('click');
                              setIsEditingGoal(true);
                          }} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-amber-500">
                              <Edit3 size={16} />
                          </button>
                      )}
                  </div>
                  
                  {isEditingGoal ? (
                      <div className="flex flex-col gap-2">
                          <input 
                              type="text" 
                              value={goalInput}
                              onChange={(e) => setGoalInput(e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500"
                              placeholder="Ex: Maratona sub 4h"
                              autoFocus
                          />
                          <button 
                              onClick={handleSaveGoal}
                              className="bg-amber-500 text-black text-[10px] font-bold rounded py-1 hover:bg-amber-400"
                          >
                              <Check size={12} className="inline mr-1" /> Salvar
                          </button>
                      </div>
                  ) : (
                      <div>
                          <span className="text-xs text-gray-500 uppercase font-bold">Objetivo Principal</span>
                          <div className={`font-bold text-sm truncate ${currentUser.currentGoal ? 'text-white' : 'text-gray-600 italic'}`}>
                              {currentUser.currentGoal || 'Definir Foco'}
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. MISSION CARD */}
              <div className={`md:col-span-2 rounded-3xl p-8 border transition-all relative overflow-hidden ${missionCompleted ? 'bg-green-600 border-green-500' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  {missionCompleted ? (
                      <div className="flex items-center justify-center h-full text-center text-white gap-4">
                          <Crown size={48} />
                          <div>
                              <h3 className="text-2xl font-black uppercase italic">Missão Cumprida!</h3>
                              <p className="text-green-100 font-medium">+100 XP Garantidos</p>
                          </div>
                      </div>
                  ) : (
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div>
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
                                  <Flame size={14} /> Missão Diária
                              </div>
                              <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                                  Correr 5km <br/>abaixo de 30min
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                                  Complete o desafio hoje para ganhar bônus de XP e subir no ranking.
                              </p>
                          </div>
                          <button 
                              onClick={handleMissionComplete}
                              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 px-8 rounded-2xl shadow-xl hover:scale-105 transition-transform whitespace-nowrap"
                          >
                              Concluir Missão
                          </button>
                      </div>
                  )}
              </div>

              {/* 2. WEEKLY RING */}
              <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center relative min-h-[250px]">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider absolute top-6 left-6">Semana Atual</h3>
                  <div className="relative w-40 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={ringData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={70}
                                  startAngle={90}
                                  endAngle={-270}
                                  dataKey="value"
                                  stroke="none"
                                  cornerRadius={10}
                              >
                                  {ringData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-gray-900 dark:text-white">{Math.round((currentWeeklyKm/WEEKLY_GOAL)*100)}%</span>
                      </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">{currentWeeklyKm.toFixed(1)} / {WEEKLY_GOAL} km</p>
              </div>

              {/* 3. CHART: EVOLUÇÃO DE VOLUME */}
              <div id="evolution-chart-card" className="md:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                              <TrendingUp size={20} className="text-amber-500" />
                              Volume Recente
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total do período: <span className="font-bold text-amber-500">{chartTotalKm.toFixed(1)} km</span></p>
                      </div>
                      
                      <button 
                        onClick={() => {
                            if(playSound) playSound('click');
                            setIsExportModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors"
                      >
                          <FileDown size={16} /> Exportar Relatório
                      </button>
                  </div>
                  
                  <div className="flex-1 w-full h-full">
                      {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                  <XAxis 
                                      dataKey="date" 
                                      tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                                      tickLine={false} 
                                      axisLine={false} 
                                  />
                                  <YAxis 
                                      tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                                      tickLine={false} 
                                      axisLine={false} 
                                  />
                                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                  <Bar 
                                      dataKey="km" 
                                      fill="#f59e0b" 
                                      radius={[4, 4, 0, 0]} 
                                      barSize={30}
                                      animationDuration={1500}
                                  />
                              </BarChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                              <p className="text-sm">Sem dados suficientes para o gráfico.</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* 4. CHART: EVOLUÇÃO DE PACE (LINE) */}
              <div className="md:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 h-[400px] flex flex-col">
                  <div className="mb-6">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                          <Timer size={20} className="text-cyan-500" />
                          Evolução de Pace (Últimas 5 Corridas)
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Quanto mais baixo o ponto no gráfico, mais rápido você correu.
                      </p>
                  </div>

                  <div className="flex-1 w-full h-full">
                      {paceEvolutionData.length > 1 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={paceEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                  <XAxis 
                                      dataKey="date" 
                                      tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                                      tickLine={false} 
                                      axisLine={false} 
                                  />
                                  <YAxis 
                                      tickFormatter={(val) => formatPaceFromSeconds(val)} 
                                      domain={['dataMin - 30', 'dataMax + 30']} 
                                      tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                                      tickLine={false} 
                                      axisLine={false} 
                                      reversed={false}
                                  />
                                  <Tooltip content={<PaceTooltip />} cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                  <Line 
                                      type="monotone" 
                                      dataKey="paceSeconds" 
                                      stroke="#06b6d4" 
                                      strokeWidth={3} 
                                      dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }} 
                                      activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4' }}
                                      animationDuration={1500}
                                  />
                              </LineChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                              <p className="text-sm">Corra pelo menos 2 vezes para gerar a curva de evolução.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* --- COMPLETE HISTORY / DOSSIER EXPORT --- */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText size={24} className="text-amber-500" />
                          Diário de Missões
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          Registro tático de todas as operações.
                      </p>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => {
                            if(playSound) playSound('click');
                            setIsExportModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
                      >
                          <FileDown size={16} /> Central de Exportação
                      </button>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                      <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                              <th className="py-3 pl-2">Data</th>
                              <th className="py-3">Tipo</th>
                              <th className="py-3">Distância</th>
                              <th className="py-3">Tempo</th>
                              <th className="py-3">Pace</th>
                              <th className="py-3 text-right pr-2">Detalhes</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {[...currentUser.activities].reverse().map(act => (
                              <tr key={act.id} onClick={() => setSelectedActivity(act)} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                                  <td className="py-4 pl-2 font-mono text-xs">{new Date(act.date).toLocaleDateString()}</td>
                                  <td className="py-4">
                                      <div className="flex items-center gap-2">
                                          {act.mode === 'run' ? <Zap size={14} className="text-amber-500" /> : act.mode === 'walk' ? <Footprints size={14} className="text-cyan-500" /> : <Timer size={14} className="text-gray-400" />}
                                          <span className="capitalize">{act.mode || 'Treino'}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 font-bold text-gray-900 dark:text-white">{act.distanceKm} km</td>
                                  <td className="py-4">{act.durationMin} min</td>
                                  <td className="py-4 font-mono text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded w-fit">{act.pace}/km</td>
                                  <td className="py-4 text-right pr-2">
                                      <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity" />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {currentUser.activities.length === 0 && (
                      <p className="text-center text-gray-500 py-8">Nenhuma atividade registrada.</p>
                  )}
              </div>
          </div>
      </div>

      {/* EXPORT MODAL */}
      {isExportModalOpen && (
          // ... (Existing Export Modal Code)
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
              {/* ... same as previous version ... */}
              <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh]">
                  {/* Sidebar Options */}
                  <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <FileDown size={20} className="text-amber-500" /> Exportar Dados
                      </h3>
                      <button onClick={() => setExportType('simple')} className={`p-4 rounded-xl border text-left transition-all ${exportType === 'simple' ? 'bg-white dark:bg-gray-800 border-amber-500 shadow-md' : 'border-transparent hover:bg-white dark:hover:bg-gray-800'}`}>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">Relatório de Campo</div>
                          <div className="text-xs text-gray-500 mt-1">Lista simples em PDF. Grátis.</div>
                      </button>
                      <button onClick={() => setExportType('dossier')} className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${exportType === 'dossier' ? 'bg-gradient-to-br from-gray-900 to-black text-white border-amber-500 shadow-md' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                          <div className="font-bold text-sm flex items-center gap-2">Dossiê de Inteligência <Crown size={14} className="text-amber-500" /></div>
                          <div className="text-xs text-gray-400 mt-1">Análise completa, gráficos e IA.</div>
                      </button>
                      <button onClick={() => setExportType('csv')} className={`p-4 rounded-xl border text-left transition-all ${exportType === 'csv' ? 'bg-white dark:bg-gray-800 border-green-500 shadow-md' : 'border-transparent hover:bg-white dark:hover:bg-gray-800'}`}>
                          <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">Extração de Dados <FileSpreadsheet size={14} className="text-green-500" /></div>
                          <div className="text-xs text-gray-500 mt-1">Formato CSV/Excel.</div>
                      </button>
                  </div>
                  
                  {/* Preview Area */}
                  <div className="flex-1 p-8 bg-gray-100 dark:bg-gray-900 overflow-y-auto relative">
                      <div className="absolute top-4 right-4">
                          <button onClick={() => setIsExportModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                              <X size={20} className="text-gray-500" />
                          </button>
                      </div>
                      <div className="max-w-md mx-auto h-full flex flex-col justify-center text-center">
                          <h4 className="font-bold text-xl dark:text-white mb-2">
                              {exportType === 'simple' ? 'Relatório Básico' : exportType === 'dossier' ? 'Dossiê Completo' : 'Dados Brutos'}
                          </h4>
                          <p className="text-gray-500 text-sm mb-6">Prepare a impressora ou o download.</p>
                          <button onClick={exportType === 'csv' ? handleDownloadCSV : openReportInNewWindow} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                              <Printer size={18} /> {exportType === 'csv' ? 'Baixar' : 'Gerar'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ACTIVITY DETAIL MODAL - UPDATED WITH TELEMETRY */}
      {selectedActivity && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in no-print">
              <div className="w-full max-w-4xl bg-gray-900 rounded-3xl border border-gray-700 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="bg-gray-800 p-6 flex justify-between items-start border-b border-gray-700">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <span className="bg-amber-500 text-black text-xs font-black px-2 py-1 rounded uppercase tracking-widest">
                                  CONFIDENCIAL
                              </span>
                              <span className="text-gray-400 text-xs uppercase font-mono tracking-widest">
                                  ID: {selectedActivity.id}
                              </span>
                          </div>
                          <h2 className="text-3xl font-black text-white uppercase italic">
                              RELATÓRIO DE MISSÃO
                          </h2>
                          <p className="text-gray-400 flex items-center gap-2 mt-1">
                              <Calendar size={14} /> {new Date(selectedActivity.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setShowShareModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors">
                              <Share2 size={20} />
                          </button>
                          <button onClick={() => setSelectedActivity(null)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors">
                              <X size={24} />
                          </button>
                      </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-1 space-y-4">
                              <div className="bg-black/40 p-4 rounded-2xl border border-gray-700">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Distância Total</p>
                                  <p className="text-4xl font-black text-white">{selectedActivity.distanceKm} <span className="text-sm text-amber-500">km</span></p>
                              </div>
                              <div className="bg-black/40 p-4 rounded-2xl border border-gray-700">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Tempo de Voo</p>
                                  <p className="text-4xl font-black text-white">{selectedActivity.durationMin} <span className="text-sm text-amber-500">min</span></p>
                              </div>
                              <div className="bg-black/40 p-4 rounded-2xl border border-gray-700">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Ritmo Médio</p>
                                  <p className="text-4xl font-black text-white">{selectedActivity.pace} <span className="text-sm text-amber-500">/km</span></p>
                              </div>
                              
                              {/* Extended Telemetry */}
                              {(selectedActivity.elevationGain || selectedActivity.calories) && (
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-black/40 p-3 rounded-xl border border-gray-700 text-center">
                                          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase font-bold mb-1">
                                              <Mountain size={10} /> Elevação
                                          </div>
                                          <span className="text-lg font-mono font-bold text-white">+{selectedActivity.elevationGain || 0}m</span>
                                      </div>
                                      <div className="bg-black/40 p-3 rounded-xl border border-gray-700 text-center">
                                          <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase font-bold mb-1">
                                              <Flame size={10} /> Calorias
                                          </div>
                                          <span className="text-lg font-mono font-bold text-white">{selectedActivity.calories || 0}</span>
                                      </div>
                                      {selectedActivity.maxSpeed && (
                                          <div className="col-span-2 bg-black/40 p-3 rounded-xl border border-gray-700 text-center">
                                              <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase font-bold mb-1">
                                                  <Gauge size={10} /> Vel. Máxima
                                              </div>
                                              <span className="text-lg font-mono font-bold text-white">{selectedActivity.maxSpeed} km/h</span>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>

                          <div className="lg:col-span-2 space-y-6">
                              <div className="h-64 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden relative">
                                  {selectedActivity.route && selectedActivity.route.length > 0 ? (
                                      <div className="absolute inset-0">
                                          <div className="w-full h-full pointer-events-none opacity-80">
                                              <LiveMap route={selectedActivity.route} isPaused={true} />
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex flex-col items-center justify-center h-full text-gray-600">
                                          <MapPin size={48} className="mb-2 opacity-20" />
                                          <p className="text-sm">Sem dados de GPS para esta missão.</p>
                                      </div>
                                  )}
                              </div>
                              <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50 relative">
                                  <div className="absolute -left-1 top-6 bottom-6 w-1 bg-amber-500 rounded-r"></div>
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Diário de Bordo</h4>
                                  <p className="text-gray-300 italic leading-relaxed">"{selectedActivity.notes || 'Sem anotações para este registro.'}"</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Share Modal Layer */}
      {showShareModal && selectedActivity && (
          <SocialShareModal 
              isOpen={showShareModal} 
              onClose={() => setShowShareModal(false)} 
              data={{
                  distance: `${selectedActivity.distanceKm.toFixed(2)} km`,
                  time: `${selectedActivity.durationMin} min`,
                  pace: `${selectedActivity.pace}/km`
              }}
              route={selectedActivity.route}
          />
      )}

      {/* LOG MODAL */}
      {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
              <div className="w-full max-w-lg relative bg-gray-900 rounded-3xl p-1">
                  <button 
                    onClick={() => {
                        if(playSound) playSound('click');
                        setIsLogModalOpen(false);
                    }}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-gray-800/50 p-2 rounded-full"
                  >
                      <X size={24} />
                  </button>
                  <ActivityLogger onAddActivity={handleAddActivity} />
              </div>
          </div>
      )}
    </div>
  );
};
