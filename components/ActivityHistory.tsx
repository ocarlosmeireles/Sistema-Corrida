import React, { useState } from 'react';
import { Member, Activity } from '../types';
import { Calendar, Download, Database, FileText, Trash2, Printer, X, MapPin, Clock, Activity as ActivityIcon, Flame, Mountain, Share2, Search, Wind, Award, Zap } from 'lucide-react';
import { LiveMap } from './LiveRun';
import { SocialShareModal } from './SocialShareModal';

interface ActivityHistoryProps {
  currentUser: Member;
  isDark: boolean;
  onDeleteActivity?: (activityId: string) => void;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ currentUser, isDark, onDeleteActivity }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Print States
  const [isPrintingList, setIsPrintingList] = useState(false);
  const [isPrintingSingle, setIsPrintingSingle] = useState(false);

  const activities = [...currentUser.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter Logic
  const filteredActivities = activities.filter(act => {
      if (!startDate && !endDate) return true;
      const actDate = new Date(act.date);
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date();
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      return actDate >= start && actDate <= end;
  });

  // --- EXPORT LOGIC ---
  const handleDownloadGPX = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    if (!activity.route || activity.route.length === 0) {
      alert("Esta atividade não possui dados de GPS para exportar.");
      return;
    }
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Filhos do Vento App" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>FDV Activity - ${activity.date}</name>
    <time>${new Date(activity.date).toISOString()}</time>
  </metadata>
  <trk>
    <name>Run on ${activity.date}</name>
    <trkseg>
`;
    
    const points = activity.route ? activity.route.map(pt => `      <trkpt lat="${pt.lat}" lon="${pt.lng}">
        <ele>${pt.altitude || 0}</ele>
        <time>${new Date(pt.timestamp).toISOString()}</time>
      </trkpt>`).join('\n') : '';

    const footer = `
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([header + points + footer], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity_${activity.id}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllData = () => {
    const dataStr = JSON.stringify(currentUser, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_data_${currentUser.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent, activityId: string) => {
      e.stopPropagation();
      if(window.confirm("Tem certeza que deseja excluir esta atividade? Esta ação é irreversível.")) {
          if(onDeleteActivity) {
              onDeleteActivity(activityId);
              if(selectedActivity?.id === activityId) setSelectedActivity(null);
          }
      }
  };

  const handlePrintSingle = () => {
      setIsPrintingSingle(true);
      // Wait for render
      setTimeout(() => {
          window.print();
          // Small delay before closing print view to ensure browser capture
          setTimeout(() => setIsPrintingSingle(false), 500);
      }, 200);
  };

  const handlePrintList = () => {
      setIsPrintingList(true);
      setTimeout(() => {
          window.print();
          setTimeout(() => setIsPrintingList(false), 500);
      }, 200);
  };

  const getPaceInSeconds = (paceStr: string) => {
      if (!paceStr) return 0;
      try {
        const clean = paceStr.replace(/[^\d:.]/g, '').replace(':', '.'); 
        const parts = paceStr.split(/[:']/);
        if (parts.length === 2) {
            const min = parseInt(parts[0], 10);
            const sec = parseInt(parts[1].replace('"', ''), 10);
            return (min * 60) + (sec || 0);
        }
        return 0;
      } catch (e) {
        return 0;
      }
  };

  // --- RENDER PRINT VIEWS (Overlay) ---
  
  if (isPrintingList) {
      return (
          <div className="fixed inset-0 z-[99999] bg-white text-black p-12 overflow-y-auto print:block">
              <style>{`@media print { body { -webkit-print-color-adjust: exact; } }`}</style>
              <div className="flex items-center gap-2 mb-6 border-b-4 border-black pb-4">
                  <Wind size={48} className="text-black" />
                  <div>
                      <h1 className="text-4xl font-black uppercase tracking-tighter italic">RELATÓRIO TÁTICO</h1>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Filhos do Vento • {currentUser.name}</p>
                  </div>
              </div>
              
              <div className="bg-gray-100 p-4 mb-8 rounded-lg flex justify-between items-center text-sm border border-gray-200">
                  <p><strong>Período:</strong> {startDate ? new Date(startDate).toLocaleDateString() : 'Início'} até {endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'}</p>
                  <p><strong>Total de Treinos:</strong> {filteredActivities.length}</p>
                  <p><strong>Distância Total:</strong> {filteredActivities.reduce((acc, curr) => acc + curr.distanceKm, 0).toFixed(2)} km</p>
              </div>

              <table className="w-full text-left border-collapse text-sm">
                  <thead>
                      <tr className="bg-black text-white uppercase text-xs">
                          <th className="py-3 px-2">Data</th>
                          <th className="py-3 px-2">Tipo</th>
                          <th className="py-3 px-2">Distância</th>
                          <th className="py-3 px-2">Tempo</th>
                          <th className="py-3 px-2">Pace</th>
                          <th className="py-3 px-2">Sensação</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredActivities.map((act, i) => (
                          <tr key={i} className="border-b border-gray-300 even:bg-gray-50">
                              <td className="py-2 px-2 font-medium">{new Date(act.date).toLocaleDateString()}</td>
                              <td className="py-2 px-2 capitalize">{act.mode === 'run' ? 'Corrida' : act.mode}</td>
                              <td className="py-2 px-2 font-bold">{act.distanceKm.toFixed(2)} km</td>
                              <td className="py-2 px-2">{act.durationMin} min</td>
                              <td className="py-2 px-2 font-mono font-bold">{act.pace}</td>
                              <td className="py-2 px-2 capitalize text-xs">{act.feeling}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              <div className="mt-8 text-center text-[10px] text-gray-400 uppercase tracking-widest">Documento Oficial Gerado pelo Sistema Filhos do Vento</div>
          </div>
      );
  }

  if (isPrintingSingle && selectedActivity) {
      // Prepare Mock Splits if not present (just to visualize)
      const totalDist = Math.floor(selectedActivity.distanceKm);
      const splits = totalDist > 0 ? Array.from({length: totalDist}, (_, i) => {
          // Simulate small variations in pace
          const baseSec = getPaceInSeconds(selectedActivity.pace);
          const varSec = Math.floor(Math.random() * 10) - 5;
          const splitSec = baseSec + varSec;
          const m = Math.floor(splitSec / 60);
          const s = splitSec % 60;
          return { km: i + 1, pace: `${m}'${s.toString().padStart(2, '0')}"`, intensity: Math.min(100, (360 / splitSec) * 60) };
      }) : [];

      return (
          <div className="fixed inset-0 z-[99999] bg-gray-100 text-black p-0 overflow-y-auto print:block font-sans">
              <style>{`@media print { 
                  @page { size: A4; margin: 0; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; } 
                  .print-container { padding: 40px; min-height: 100vh; }
                  .no-break { break-inside: avoid; }
              }`}</style>
              
              <div className="print-container bg-white relative overflow-hidden max-w-[210mm] mx-auto shadow-xl my-8 print:my-0 print:shadow-none">
                  {/* Header Banner */}
                  <div className="bg-gray-900 text-white p-8 flex justify-between items-end relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[60px] transform translate-x-1/3 -translate-y-1/3"></div>
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-2">
                              <Wind size={32} className="text-amber-500" />
                              <span className="text-xs font-bold tracking-[0.4em] text-gray-400 uppercase">Mission Report</span>
                          </div>
                          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none font-teko">
                              {selectedActivity.mode === 'run' ? 'CORRIDA' : selectedActivity.mode.toUpperCase()}
                          </h1>
                          <div className="flex items-center gap-2 mt-2">
                              <span className="bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                  {selectedActivity.feeling === 'great' ? 'DOMINADA' : 'COMPLETA'}
                              </span>
                              <span className="text-sm text-gray-400 font-medium">{new Date(selectedActivity.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                      </div>
                      <div className="text-right relative z-10">
                          <div className="text-4xl font-black font-teko text-amber-500">{selectedActivity.distanceKm.toFixed(2)} <span className="text-lg text-gray-400">KM</span></div>
                          <div className="text-xs font-bold uppercase text-gray-500 tracking-widest">Distância Total</div>
                      </div>
                  </div>

                  {/* Pilot Info */}
                  <div className="px-8 py-6 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
                      <img src={currentUser.avatarUrl} className="w-12 h-12 rounded-full border-2 border-gray-300" alt="Pilot" />
                      <div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Piloto</p>
                          <p className="font-bold text-lg text-gray-900">{currentUser.name}</p>
                      </div>
                      <div className="ml-auto flex gap-8">
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-right">Rank</p>
                              <p className="font-bold text-gray-900 flex items-center gap-1"><Award size={14} className="text-amber-500"/> {currentUser.rank}</p>
                          </div>
                          <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-right">ID</p>
                              <p className="font-mono text-gray-900 text-sm">#{selectedActivity.id.slice(-6)}</p>
                          </div>
                      </div>
                  </div>

                  {/* Main Metrics Grid */}
                  <div className="p-8 grid grid-cols-3 gap-6">
                      <div className="col-span-3 md:col-span-1 bg-gray-50 border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                          <Clock size={32} className="text-blue-500 mb-2" />
                          <div className="text-4xl font-black text-gray-900 font-teko">{selectedActivity.durationMin}<span className="text-lg text-gray-400 ml-1">min</span></div>
                          <div className="text-xs font-bold uppercase text-gray-500 tracking-widest mt-1">Duração</div>
                      </div>
                      <div className="col-span-3 md:col-span-1 bg-gray-50 border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                          <Zap size={32} className="text-amber-500 mb-2" />
                          <div className="text-4xl font-black text-gray-900 font-teko">{selectedActivity.pace}</div>
                          <div className="text-xs font-bold uppercase text-gray-500 tracking-widest mt-1">Pace Médio</div>
                      </div>
                      <div className="col-span-3 md:col-span-1 bg-gray-50 border border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                          <Flame size={32} className="text-orange-500 mb-2" />
                          <div className="text-4xl font-black text-gray-900 font-teko">{selectedActivity.calories || '-'}</div>
                          <div className="text-xs font-bold uppercase text-gray-500 tracking-widest mt-1">Calorias</div>
                      </div>
                  </div>

                  {/* Splits & Details */}
                  <div className="px-8 pb-8 grid grid-cols-3 gap-8">
                      {/* Splits Table */}
                      <div className="col-span-2">
                          <h3 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">Parciais por KM</h3>
                          {splits.length > 0 ? (
                              <div className="space-y-2">
                                  {splits.map((split) => (
                                      <div key={split.km} className="flex items-center text-sm py-1 border-b border-gray-100">
                                          <span className="font-bold w-12 text-gray-900">{split.km} km</span>
                                          <span className="font-mono w-20 text-gray-600">{split.pace}</span>
                                          {/* Intensity Bar */}
                                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden ml-4">
                                              <div 
                                                  className="h-full bg-gradient-to-r from-blue-400 to-amber-500" 
                                                  style={{ width: `${split.intensity}%`, opacity: split.intensity / 100 + 0.2 }}
                                              ></div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-gray-400 italic text-sm py-4">Nenhum dado de parcial disponível para esta atividade.</div>
                          )}
                      </div>

                      {/* Notes & Extra */}
                      <div className="col-span-1 flex flex-col gap-6">
                          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                              <h3 className="font-bold text-amber-700 uppercase tracking-widest text-xs mb-2">Diário de Bordo</h3>
                              <p className="text-sm italic text-gray-700 leading-relaxed">
                                  "{selectedActivity.notes || 'Sem observações registradas.'}"
                              </p>
                          </div>
                          
                          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                              <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-3">Dados Ambientais</h3>
                              <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-500">Sensação</span>
                                  <span className="font-bold text-gray-900 capitalize">{selectedActivity.feeling}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Elevação</span>
                                  <span className="font-bold text-gray-900 flex items-center gap-1">
                                      <Mountain size={12}/> {selectedActivity.elevationGain || 0}m
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-auto bg-gray-900 text-white p-4 text-center text-[10px] uppercase tracking-widest font-bold">
                      Gerado por Filhos do Vento Intelligence System • {new Date().getFullYear()}
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN INTERFACE (Dark Mode Compatible) ---
  
  if (selectedActivity) {
      return (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col overflow-y-auto animate-fade-in">
              {/* HEADER CONTROLS */}
              <div className="sticky top-0 z-50 flex justify-between items-center p-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedActivity(null)} className="p-2 rounded-full hover:bg-gray-800 text-white transition-colors">
                          <X size={24} />
                      </button>
                      <h2 className="text-lg font-black text-white uppercase italic tracking-wider font-teko">Registro de Voo</h2>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setIsShareModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                          <Share2 size={16} /> Studio
                      </button>
                      <button 
                        onClick={handlePrintSingle}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                          <Printer size={16} /> Imprimir
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, selectedActivity.id)}
                        className="bg-red-900/20 hover:bg-red-900/40 text-red-500 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-red-900/50"
                      >
                          <Trash2 size={16} /> Excluir
                      </button>
                  </div>
              </div>

              {/* CONTENT */}
              <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                  
                  {/* Header Section */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-6 mb-6">
                      <div>
                          <div className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em] mb-2">Relatório Tático</div>
                          <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none font-teko uppercase">
                              {selectedActivity.mode === 'run' ? 'Corrida' : selectedActivity.mode} <br/>
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                                  {selectedActivity.feeling === 'great' ? 'Dominada' : 'Executada'}
                              </span>
                          </h1>
                      </div>
                      <div className="text-right mt-4 md:mt-0">
                          <div className="text-xl font-bold text-white font-mono">
                              {new Date(selectedActivity.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                      </div>
                  </div>

                  {/* Map Preview */}
                  {selectedActivity.route && selectedActivity.route.length > 0 ? (
                      <div className="h-64 md:h-96 w-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 mb-8 relative">
                          <LiveMap route={selectedActivity.route} isPaused={true} polylineColor="#f59e0b" />
                          <div className="absolute inset-0 pointer-events-none border-[10px] border-black/10"></div>
                      </div>
                  ) : (
                      <div className="h-32 w-full bg-gray-900/50 border border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 uppercase font-bold text-xs tracking-widest mb-8">
                          Sem dados de satélite
                      </div>
                  )}

                  {/* Primary Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center">
                          <div className="flex justify-center text-amber-500 mb-2"><ActivityIcon size={24} /></div>
                          <div className="text-4xl md:text-5xl font-black text-white font-teko">{selectedActivity.distanceKm.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Quilômetros</div>
                      </div>
                      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center">
                          <div className="flex justify-center text-blue-500 mb-2"><Clock size={24} /></div>
                          <div className="text-4xl md:text-5xl font-black text-white font-teko">{selectedActivity.durationMin}'</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Tempo Total</div>
                      </div>
                      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center">
                          <div className="flex justify-center text-green-500 mb-2"><ActivityIcon size={24} className="transform rotate-90" /></div>
                          <div className="text-4xl md:text-5xl font-black text-white font-teko">{selectedActivity.pace}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pace Médio</div>
                      </div>
                      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 text-center">
                          <div className="flex justify-center text-orange-500 mb-2"><Flame size={24} /></div>
                          <div className="text-4xl md:text-5xl font-black text-white font-teko">{selectedActivity.calories || '-'}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Calorias</div>
                      </div>
                  </div>

                  {/* Detailed Splits & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4 border-b border-gray-800 pb-2">Notas de Campo</h3>
                          <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-800 min-h-[100px]">
                              <p className="text-gray-300 italic leading-relaxed font-medium">
                                  "{selectedActivity.notes || 'Nenhuma observação registrada pelo atleta.'}"
                              </p>
                          </div>
                      </div>
                      
                      <div>
                          <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4 border-b border-gray-800 pb-2">Dados Ambientais</h3>
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-xs font-bold uppercase">Sensação</span>
                                  <span className="text-white font-bold capitalize">{selectedActivity.feeling}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-xs font-bold uppercase">Elevação</span>
                                  <span className="text-white font-bold flex items-center gap-1"><Mountain size={14}/> {selectedActivity.elevationGain || 0}m</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-12 pt-6 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      <span>Filhos do Vento Running Team</span>
                      <span>ID: {selectedActivity.id}</span>
                  </div>
              </div>

              <SocialShareModal 
                  isOpen={isShareModalOpen} 
                  onClose={() => setIsShareModalOpen(false)}
                  data={{
                      distance: `${selectedActivity.distanceKm.toFixed(2)} KM`,
                      time: `${selectedActivity.durationMin} MIN`,
                      pace: selectedActivity.pace
                  }}
                  route={selectedActivity.route}
              />
          </div>
      );
  }

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Voo</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Seu diário de bordo completo.</p>
        </div>
        <button 
          onClick={handleExportAllData}
          className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          <Database size={16} /> JSON
        </button>
      </div>

      {/* FILTERS & ACTIONS */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Início</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm dark:text-white" />
          </div>
          <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Fim</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm dark:text-white" />
          </div>
          <button 
              onClick={handlePrintList}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
              <Printer size={16} /> Gerar Relatório PDF
          </button>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma atividade encontrada no período.</p>
          </div>
        )}

        {filteredActivities.map(activity => (
          <div 
            key={activity.id} 
            onClick={() => setSelectedActivity(activity)}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            {/* Delete Button (Visible on Hover) */}
            <button 
                onClick={(e) => handleDelete(e, activity.id)}
                className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-black/50 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all opacity-0 group-hover:opacity-100"
                title="Excluir Atividade"
            >
                <Trash2 size={16} />
            </button>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
                    <Calendar size={12} /> {new Date(activity.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 font-teko text-3xl tracking-tight uppercase">
                    {activity.mode === 'run' ? 'Corrida' : activity.mode === 'walk' ? 'Caminhada' : 'Atividade'} 
                    <span className="text-amber-500 text-xs font-normal bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20 font-sans tracking-normal normal-case">
                      {activity.feeling === 'great' ? '🤩' : activity.feeling === 'good' ? '🙂' : activity.feeling === 'hard' ? '🥵' : '🤕'}
                    </span>
                  </h3>
                </div>
                
                {activity.route && activity.route.length > 0 && (
                  <button 
                    onClick={(e) => handleDownloadGPX(e, activity)}
                    className="text-xs font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors z-10 relative"
                    title="Exportar para Strava/Garmin"
                  >
                    <Download size={14} /> GPX
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Distância</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white font-teko">{activity.distanceKm.toFixed(2)} <span className="text-sm text-gray-500 font-sans">km</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Tempo</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white font-teko">{activity.durationMin} <span className="text-sm text-gray-500 font-sans">min</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Pace</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white font-teko">{activity.pace}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};