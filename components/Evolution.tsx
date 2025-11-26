
import React from 'react';
import { Member, Activity } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, AreaChart, Area, XAxis } from 'recharts';
import { TrendingUp, TrendingDown, Activity as ActivityIcon, Zap, Calendar, ArrowUpRight } from 'lucide-react';

interface EvolutionProps {
  currentUser: Member;
}

export const Evolution: React.FC<EvolutionProps> = ({ currentUser }) => {
  const activities = currentUser.activities;

  // --- DATA PROCESSING ---
  const today = new Date();
  const currentMonth = today.getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const thisMonthActivities = activities.filter(a => new Date(a.date).getMonth() === currentMonth);
  const lastMonthActivities = activities.filter(a => new Date(a.date).getMonth() === lastMonth);

  const thisMonthDist = thisMonthActivities.reduce((acc, curr) => acc + curr.distanceKm, 0);
  const lastMonthDist = lastMonthActivities.reduce((acc, curr) => acc + curr.distanceKm, 0);
  
  // Pace parsing
  const paceToSeconds = (pace: string) => {
      if(!pace) return 0;
      const parts = pace.replace(/"/g, '').split("'");
      return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
  }
  
  const avgPaceThisMonth = thisMonthActivities.length > 0 ? thisMonthActivities.reduce((acc, curr) => acc + paceToSeconds(curr.pace), 0) / thisMonthActivities.length : 0;
  const avgPaceLastMonth = lastMonthActivities.length > 0 ? lastMonthActivities.reduce((acc, curr) => acc + paceToSeconds(curr.pace), 0) / lastMonthActivities.length : 0;

  // Calculate evolution percentages
  const distEvolution = lastMonthDist > 0 ? ((thisMonthDist - lastMonthDist) / lastMonthDist) * 100 : 100;
  const paceEvolution = avgPaceLastMonth > 0 ? ((avgPaceLastMonth - avgPaceThisMonth) / avgPaceLastMonth) * 100 : 0; // Positive is faster

  // Spider Chart Data (Mock Logic for Attributes based on real data)
  const maxDist = 100; // arbitrary scale
  const staminaScore = Math.min(100, (currentUser.totalDistance / 500) * 100);
  const speedScore = Math.min(100, avgPaceThisMonth > 0 ? (300 / avgPaceThisMonth) * 100 : 0); // 5:00 pace = 300s = 100 score
  const consistencyScore = Math.min(100, (thisMonthActivities.length / 12) * 100); // 12 runs a month = 100
  const elevationScore = Math.min(100, (activities.reduce((acc,c) => acc + (c.elevationGain || 0), 0) / 1000) * 100);
  
  const radarData = [
    { subject: 'Velocidade', A: speedScore, fullMark: 100 },
    { subject: 'Resistência', A: staminaScore, fullMark: 100 },
    { subject: 'Consistência', A: consistencyScore, fullMark: 100 },
    { subject: 'Força (Subida)', A: elevationScore, fullMark: 100 },
    { subject: 'Experiência', A: Math.min(100, currentUser.seasonScore / 500), fullMark: 100 },
  ];

  // Consistency Heatmap Data (Last 90 days)
  const getHeatmapData = () => {
      const data = [];
      for(let i=89; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const hasRun = activities.some(a => a.date === dateStr);
          data.push({ date: dateStr, value: hasRun ? 1 : 0 });
      }
      return data;
  };
  const heatmapData = getHeatmapData();

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ActivityIcon className="text-amber-500" /> Bio-Data Evolution
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Análise profunda da sua transformação atlética.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. ATLHETE DNA (RADAR) */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">DNA do Atleta</h3>
                  <span className="bg-gray-100 dark:bg-gray-800 text-[10px] px-2 py-1 rounded font-bold text-gray-500 uppercase">Raio-X Atual</span>
              </div>
              
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                              name={currentUser.name}
                              dataKey="A"
                              stroke="#f59e0b"
                              strokeWidth={3}
                              fill="#f59e0b"
                              fillOpacity={0.4}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#f59e0b' }}
                          />
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* 2. TEMPORAL COMPARISON */}
          <div className="space-y-6">
              {/* Distance Card */}
              <div className="bg-gray-900 dark:bg-black p-6 rounded-3xl border border-gray-800 shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-6 opacity-5"><Zap size={100} className="text-white" /></div>
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Volume Mensal</h4>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">{thisMonthDist.toFixed(1)}</span>
                      <span className="text-amber-500 font-bold">km</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-3">
                      <div className={`p-1 rounded-full ${distEvolution >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {distEvolution >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                          <span className={`text-sm font-bold ${distEvolution >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {Math.abs(distEvolution).toFixed(0)}% {distEvolution >= 0 ? 'acima' : 'abaixo'}
                          </span>
                          <p className="text-[10px] text-gray-500 uppercase">vs. Mês Passado ({lastMonthDist.toFixed(1)} km)</p>
                      </div>
                  </div>
              </div>

              {/* Pace Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg">
                  <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Evolução de Ritmo</h4>
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-xs text-gray-400 mb-1">Pace Médio (Atual)</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                              {Math.floor(avgPaceThisMonth/60)}'{Math.round(avgPaceThisMonth%60).toString().padStart(2,'0')}"
                          </p>
                      </div>
                      <ArrowUpRight className="text-gray-300" size={24} />
                      <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">Pace Médio (Anterior)</p>
                          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                              {Math.floor(avgPaceLastMonth/60)}'{Math.round(avgPaceLastMonth%60).toString().padStart(2,'0')}"
                          </p>
                      </div>
                  </div>
                  <div className="mt-2 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${paceEvolution > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {paceEvolution > 0 ? '🚀 Você está mais rápido!' : '🐢 Ritmo em manutenção'}
                      </span>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. CONSISTENCY HEATMAP */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-amber-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Consistência (90 Dias)</h3>
          </div>
          
          <div className="flex flex-wrap gap-1 justify-center md:justify-start">
              {heatmapData.map((day, i) => (
                  <div 
                      key={i}
                      title={day.date}
                      className={`w-3 h-3 rounded-sm transition-all hover:scale-125 ${day.value > 0 ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'bg-gray-100 dark:bg-gray-700'}`}
                  ></div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-gray-400 uppercase font-bold">
              <span>Menos</span>
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span>Mais</span>
          </div>
      </div>

      {/* 4. FUTURE PROJECTION */}
      <div className="bg-gradient-to-r from-blue-900 to-gray-900 rounded-3xl p-8 relative overflow-hidden text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10 text-center">
              <h3 className="text-2xl font-black italic mb-2">PROJEÇÃO FUTURA</h3>
              <p className="text-blue-200 text-sm mb-6">Se mantiver o ritmo atual, em 6 meses você será:</p>
              
              <div className="inline-block border-2 border-amber-500 px-8 py-4 rounded-xl bg-black/30 backdrop-blur-md transform rotate-[-2deg]">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em] block mb-1">Rank Previsto</span>
                  <span className="text-4xl font-black text-white uppercase">
                      {currentUser.totalDistance + (thisMonthDist * 6) > 1000 ? 'TORNADO' : 
                       currentUser.totalDistance + (thisMonthDist * 6) > 600 ? 'FURACÃO' : 'TEMPESTADE'}
                  </span>
              </div>
          </div>
      </div>
    </div>
  );
};
