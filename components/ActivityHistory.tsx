
import React, { useState } from 'react';
import { Member, Activity } from '../types';
import { Calendar, Download, Database, FileText, Trash2, Printer, X, Search, Filter, ArrowDown, MapPin, Clock, Zap, Activity as ActivityIcon, Mountain, Award, Footprints } from 'lucide-react';
import { LiveMap } from './LiveRun';

interface ActivityHistoryProps {
  currentUser: Member;
  isDark: boolean;
  onDeleteActivity?: (activityId: string) => void;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ currentUser, isDark, onDeleteActivity }) => {
  const [filterMonth, setFilterMonth] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const activities = [...currentUser.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredActivities = activities.filter(act => {
      const date = new Date(act.date);
      const monthMatch = filterMonth ? date.toISOString().slice(0, 7) === filterMonth : true;
      const typeMatch = filterType === 'all' ? true : act.mode === filterType;
      return monthMatch && typeMatch;
  });

  // Stats for Hub Header
  const totalDist = activities.reduce((acc, c) => acc + c.distanceKm, 0);
  const totalTime = activities.reduce((acc, c) => acc + c.durationMin, 0);
  const totalRuns = activities.length;

  const handlePrintDossier = () => {
      window.print();
  };

  const handleDownloadGPX = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    if (!activity.route || activity.route.length === 0) {
      alert("Esta atividade não possui dados de GPS para exportar.");
      return;
    }
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Filhos do Vento App">
  <trk><name>Run ${activity.date}</name><trkseg>
    ${activity.route.map(pt => `<trkpt lat="${pt.lat}" lon="${pt.lng}"><ele>${pt.altitude||0}</ele></trkpt>`).join('')}
  </trkseg></trk>
</gpx>`;
    const blob = new Blob([header], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_${activity.id}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Excluir atividade permanentemente?")) {
          if(onDeleteActivity) onDeleteActivity(id);
      }
  };

  // Dynamic Splits Calculation for Dossier
  const calculateSplits = (activity: Activity) => {
      if (!activity.route || activity.route.length === 0) return [];
      
      const splits = [];
      let distanceAcc = 0;
      let lastSplitTime = 0;
      let lastPoint = activity.route[0];

      // Haversine helper
      const calcDist = (p1: any, p2: any) => {
          const R = 6371e3;
          const q1 = p1.lat * Math.PI/180; const q2 = p2.lat * Math.PI/180;
          const dq = (p2.lat-p1.lat)*Math.PI/180; const dl = (p2.lng-p1.lng)*Math.PI/180;
          const a = Math.sin(dq/2)*Math.sin(dq/2) + Math.cos(q1)*Math.cos(q2)*Math.sin(dl/2)*Math.sin(dl/2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }

      for (let i=1; i<activity.route.length; i++) {
          const p = activity.route[i];
          const d = calcDist(lastPoint, p);
          distanceAcc += d;
          
          // Check if KM boundary crossed
          if (Math.floor(distanceAcc/1000) > splits.length) {
              const time = (p.timestamp - activity.route[0].timestamp) / 1000;
              const splitDuration = time - lastSplitTime;
              const m = Math.floor(splitDuration / 60);
              const s = Math.round(splitDuration % 60);
              splits.push({ km: splits.length + 1, time: `${m}'${s.toString().padStart(2,'0')}"`, rawTime: splitDuration });
              lastSplitTime = time;
          }
          lastPoint = p;
      }
      return splits;
  };

  return (
    <div className="space-y-8 pb-24 animate-fade-in relative">
      {/* PRINT STYLES - DOSSIER SPECIFIC - FIXED FOR MULTI-PAGE */}
      <style>{`
        @media print {
            body * { visibility: hidden; }
            #dossier-modal, #dossier-modal * { visibility: visible; }
            #dossier-modal { 
                position: absolute; left: 0; top: 0; width: 100%; height: auto; min-height: 100%;
                background: white; color: black; padding: 0; margin: 0; z-index: 9999;
                display: block !important;
                overflow: visible !important;
            }
            .no-print { display: none !important; }
            .print-black { color: black !important; }
            .print-border { border-color: #ddd !important; border-width: 1px !important; }
            .print-break-inside { break-inside: avoid; }
            
            /* Reset dark mode for print */
            .dark .print-black { color: black !important; }
            .dark .bg-gray-900 { background-color: white !important; }
            .dark .text-white { color: black !important; }
            
            /* Page Setup */
            @page { margin: 10mm; size: A4; }
            html, body { height: auto; overflow: visible !important; }
        }
      `}</style>

      {/* DOSSIER MODAL */}
      {selectedActivity && (
          <div id="dossier-modal" className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:rounded-none print:shadow-none">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800 print:bg-white print:border-black">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <div className="bg-amber-500 text-white p-1.5 rounded-lg no-print"><ActivityIcon size={16} /></div>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest print-black">Relatório Técnico</span>
                          </div>
                          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic leading-none print-black">
                              {selectedActivity.mode === 'run' ? 'MISSÃO: CORRIDA' : 'ATIVIDADE REGISTRADA'}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 print-black">
                              {new Date(selectedActivity.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                      </div>
                      <div className="flex gap-2 no-print">
                          <button onClick={handlePrintDossier} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition-colors"><Printer size={20} /></button>
                          <button onClick={() => setSelectedActivity(null)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-red-100 text-gray-600 hover:text-red-500 transition-colors"><X size={20} /></button>
                      </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar print:overflow-visible print:h-auto">
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-4 text-center">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 print-border print:bg-transparent">
                              <span className="block text-[10px] text-gray-500 uppercase font-bold print-black">Distância</span>
                              <span className="block text-3xl font-black text-gray-900 dark:text-white font-teko print-black">{selectedActivity.distanceKm.toFixed(2)} <span className="text-sm text-gray-400 print-black">km</span></span>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 print-border print:bg-transparent">
                              <span className="block text-[10px] text-gray-500 uppercase font-bold print-black">Tempo</span>
                              <span className="block text-3xl font-black text-gray-900 dark:text-white font-teko print-black">{selectedActivity.durationMin} <span className="text-sm text-gray-400 print-black">min</span></span>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 print-border print:bg-transparent">
                              <span className="block text-[10px] text-gray-500 uppercase font-bold print-black">Pace Médio</span>
                              <span className="block text-3xl font-black text-gray-900 dark:text-white font-teko print-black">{selectedActivity.pace}</span>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 print-border print:bg-transparent">
                              <span className="block text-[10px] text-gray-500 uppercase font-bold print-black">Calorias</span>
                              <span className="block text-3xl font-black text-gray-900 dark:text-white font-teko print-black">{selectedActivity.calories || '-'} <span className="text-sm text-gray-400 print-black">kcal</span></span>
                          </div>
                      </div>

                      {/* Map & Elevation */}
                      {selectedActivity.route && selectedActivity.route.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:space-y-6">
                              <div className="lg:col-span-2 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative print-border print:bg-white print:h-96">
                                  <LiveMap route={selectedActivity.route} isPaused={true} />
                                  <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded text-[10px] font-bold text-black z-[1000] no-print">FILHOS DO VENTO</div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 print-border print:bg-transparent print:mt-4">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2 print-black"><Mountain size={14}/> Altimetria</h4>
                                  <div className="text-center py-8">
                                      <span className="block text-4xl font-black text-gray-900 dark:text-white font-teko print-black">+{selectedActivity.elevationGain || 0}m</span>
                                      <span className="text-xs text-gray-400 print-black">Ganho de Elevação</span>
                                  </div>
                                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden print:bg-gray-300">
                                      <div className="h-full bg-purple-500 w-1/2 print:bg-black"></div>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 print-border">
                              <p className="text-gray-500 text-sm print-black">Dados de GPS não disponíveis para esta atividade.</p>
                          </div>
                      )}

                      {/* Splits Table */}
                      <div className="print-break-inside">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2 print-black"><Zap size={16} className="text-amber-500 print-black"/> Parciais (Splits)</h4>
                          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 print-border">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold uppercase text-xs print:bg-gray-100 print-black">
                                      <tr>
                                          <th className="p-3">KM</th>
                                          <th className="p-3">Pace</th>
                                          <th className="p-3 text-right">Diferença</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900 print:divide-gray-300">
                                      {calculateSplits(selectedActivity).length > 0 ? (
                                          calculateSplits(selectedActivity).map((split, i, arr) => {
                                              const prev = arr[i-1]?.rawTime || split.rawTime;
                                              const diff = split.rawTime - prev;
                                              return (
                                                  <tr key={i} className="print-black">
                                                      <td className="p-3 font-bold text-gray-900 dark:text-white print-black">{split.km}</td>
                                                      <td className="p-3 font-mono text-amber-600 dark:text-amber-400 print-black">{split.time}</td>
                                                      <td className="p-3 text-right font-mono text-xs text-gray-400 print-black">
                                                          {i === 0 ? '-' : diff > 0 ? `+${diff.toFixed(0)}s` : `${diff.toFixed(0)}s`}
                                                      </td>
                                                  </tr>
                                              );
                                          })
                                      ) : (
                                          <tr><td colSpan={3} className="p-4 text-center text-gray-500 italic print-black">Parciais indisponíveis.</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {/* Notes */}
                      {selectedActivity.notes && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-500/20 print-border print:bg-transparent print-break-inside">
                              <h4 className="text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-2 print-black">Notas do Atleta</h4>
                              <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed print-black">"{selectedActivity.notes}"</p>
                          </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-[10px] text-gray-400 uppercase font-bold tracking-widest print-black print:bg-transparent">
                      Filhos do Vento Running Team • Análise de Performance
                  </div>
              </div>
          </div>
      )}

      {/* HEADER STATS CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-4 no-print">
          <div className="bg-gradient-to-br from-gray-900 to-black p-4 rounded-2xl border border-gray-800 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10"><ActivityIcon size={48} className="text-white"/></div>
              <p className="text-xs text-gray-400 uppercase font-bold">Volume Total</p>
              <p className="text-2xl font-black text-white font-teko">{totalDist.toFixed(1)} km</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold">Tempo Total</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white font-teko">{Math.floor(totalTime/60)}h {totalTime%60}m</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-bold">Sessões</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white font-teko">{totalRuns}</p>
          </div>
      </div>

      {/* HEADER ACTIONS (NO PRINT) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="text-amber-500" /> HUB de Atividades
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerenciamento completo de registros.</p>
        </div>
      </div>

      {/* FILTERS (NO PRINT) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex gap-4 no-print shadow-sm">
          <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mês</label>
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-lg p-2 text-sm dark:text-white" />
          </div>
          <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-lg p-2 text-sm dark:text-white">
                  <option value="all">Todos</option>
                  <option value="run">Corrida</option>
                  <option value="walk">Caminhada</option>
                  <option value="long_run">Longão</option>
              </select>
          </div>
      </div>

      {/* LIST VIEW */}
      <div className="space-y-3 no-print">
          {filteredActivities.length === 0 && (
              <div className="text-center py-12 text-gray-500">Nenhuma atividade encontrada.</div>
          )}
          {filteredActivities.map(act => (
              <div 
                  key={act.id} 
                  onClick={() => setSelectedActivity(act)}
                  className="group bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors">
                          {act.mode === 'run' ? <Zap size={20} /> : act.mode === 'long_run' ? <Award size={20}/> : <Footprints size={20} />}
                      </div>
                      <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">{new Date(act.date).toLocaleDateString()}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="font-bold text-amber-600 dark:text-amber-400">{act.distanceKm.toFixed(2)} km</span>
                              <span>•</span>
                              <span>{act.durationMin} min</span>
                              <span>•</span>
                              <span>{act.pace}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      {act.route && act.route.length > 0 && <MapPin size={14} className="text-gray-400" />}
                      <button onClick={(e) => handleDelete(e, act.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
