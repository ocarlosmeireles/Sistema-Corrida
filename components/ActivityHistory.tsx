
import React, { useState } from 'react';
import { Member, Activity } from '../types';
import { Calendar, Download, Database, FileText, Trash2, Printer, X, MapPin, Clock, Activity as ActivityIcon, Flame, Mountain, Share2 } from 'lucide-react';
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

  const activities = [...currentUser.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const handlePrintDossier = () => {
      window.print();
  };

  // --- DOSSIER VIEW ---
  if (selectedActivity) {
      return (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col overflow-y-auto animate-fade-in">
              {/* HEADER CONTROLS (Hidden on Print) */}
              <div className="sticky top-0 z-50 flex justify-between items-center p-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 print:hidden">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedActivity(null)} className="p-2 rounded-full hover:bg-gray-800 text-white transition-colors">
                          <X size={24} />
                      </button>
                      <h2 className="text-lg font-black text-white uppercase italic tracking-wider font-teko">Dossiê de Missão</h2>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setIsShareModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                          <Share2 size={16} /> Studio
                      </button>
                      <button 
                        onClick={handlePrintDossier}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                          <Printer size={16} /> PDF / Print
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, selectedActivity.id)}
                        className="bg-red-900/20 hover:bg-red-900/40 text-red-500 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-red-900/50"
                      >
                          <Trash2 size={16} /> Excluir
                      </button>
                  </div>
              </div>

              {/* PRINTABLE CONTENT */}
              <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full print:p-0 print:max-w-none print:bg-white print:text-black">
                  
                  {/* Header Section */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 print:border-black pb-6 mb-6">
                      <div>
                          <div className="text-amber-500 print:text-black text-xs font-bold uppercase tracking-[0.3em] mb-2">Relatório Tático</div>
                          <h1 className="text-5xl md:text-7xl font-black text-white print:text-black italic tracking-tighter leading-none font-teko uppercase">
                              {selectedActivity.mode === 'run' ? 'Corrida' : selectedActivity.mode} <br/>
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 print:text-black print:bg-none">
                                  {selectedActivity.feeling === 'great' ? 'Dominada' : 'Executada'}
                              </span>
                          </h1>
                      </div>
                      <div className="text-right mt-4 md:mt-0">
                          <div className="text-xl font-bold text-white print:text-black font-mono">
                              {new Date(selectedActivity.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-sm text-gray-500 print:text-gray-600 font-bold uppercase tracking-wide flex items-center justify-end gap-1">
                              <MapPin size={14} /> Rio de Janeiro
                          </div>
                      </div>
                  </div>

                  {/* Map Preview */}
                  {selectedActivity.route && selectedActivity.route.length > 0 ? (
                      <div className="h-64 md:h-96 w-full bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 print:border-black mb-8 relative print:h-[400px] print:bg-gray-100">
                          <LiveMap route={selectedActivity.route} isPaused={true} polylineColor="#f59e0b" />
                          <div className="absolute inset-0 pointer-events-none border-[10px] border-black/10 print:border-none"></div>
                          {/* Overlay stats on map for aesthetic */}
                          <div className="absolute bottom-4 left-4 bg-black/80 print:bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-white/10 print:border-black">
                              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase font-bold">GPS Track</span>
                              <div className="text-white print:text-black font-mono text-xs">{selectedActivity.route.length} Pontos</div>
                          </div>
                      </div>
                  ) : (
                      <div className="h-32 w-full bg-gray-900/50 border border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 uppercase font-bold text-xs tracking-widest mb-8">
                          Sem dados de satélite
                      </div>
                  )}

                  {/* Primary Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gray-900/50 print:bg-gray-100 p-6 rounded-2xl border border-gray-800 print:border-gray-300 text-center">
                          <div className="flex justify-center text-amber-500 print:text-black mb-2"><ActivityIcon size={24} /></div>
                          <div className="text-4xl md:text-5xl font-black text-white print:text-black font-teko">{selectedActivity.distanceKm.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-500 print:text-gray-600 uppercase font-bold tracking-widest">Quilômetros</div>
                      </div>
                      <div className="bg-gray-900/50 print:bg-gray-100 p-6 rounded-2xl border border-gray-800 print:border-gray-300 text-center">
                          <div className="flex justify-center text-blue-500 print:text-black mb-2"><Clock size={24} /></div>
                          <div className="text-4xl md:text-5xl font-black text-white print:text-black font-teko">{selectedActivity.durationMin}'</div>
                          <div className="text-[10px] text-gray-500 print:text-gray-600 uppercase font-bold tracking-widest">Tempo Total</div>
                      </div>
                      <div className="bg-gray-900/50 print:bg-gray-100 p-6 rounded-2xl border border-gray-800 print:border-gray-300 text-center">
                          <div className="flex justify-center text-green-500 print:text-black mb-2"><ActivityIcon size={24} className="transform rotate-90" /></div>
                          <div className="text-4xl md:text-5xl font-black text-white print:text-black font-teko">{selectedActivity.pace}</div>
                          <div className="text-[10px] text-gray-500 print:text-gray-600 uppercase font-bold tracking-widest">Pace Médio</div>
                      </div>
                      <div className="bg-gray-900/50 print:bg-gray-100 p-6 rounded-2xl border border-gray-800 print:border-gray-300 text-center">
                          <div className="flex justify-center text-orange-500 print:text-black mb-2"><Flame size={24} /></div>
                          <div className="text-4xl md:text-5xl font-black text-white print:text-black font-teko">{selectedActivity.calories || '-'}</div>
                          <div className="text-[10px] text-gray-500 print:text-gray-600 uppercase font-bold tracking-widest">Calorias</div>
                      </div>
                  </div>

                  {/* Detailed Splits & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                          <h3 className="text-white print:text-black font-bold uppercase tracking-wider text-sm mb-4 border-b border-gray-800 print:border-gray-300 pb-2">Notas de Campo</h3>
                          <div className="bg-gray-900/30 print:bg-transparent p-6 rounded-2xl border border-gray-800 print:border-gray-300 min-h-[100px]">
                              <p className="text-gray-300 print:text-black italic leading-relaxed font-medium">
                                  "{selectedActivity.notes || 'Nenhuma observação registrada pelo atleta.'}"
                              </p>
                          </div>
                      </div>
                      
                      <div>
                          <h3 className="text-white print:text-black font-bold uppercase tracking-wider text-sm mb-4 border-b border-gray-800 print:border-gray-300 pb-2">Dados Ambientais</h3>
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-500 print:text-gray-600 text-xs font-bold uppercase">Sensação</span>
                                  <span className="text-white print:text-black font-bold capitalize">{selectedActivity.feeling}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-500 print:text-gray-600 text-xs font-bold uppercase">Elevação</span>
                                  <span className="text-white print:text-black font-bold flex items-center gap-1"><Mountain size={14}/> {selectedActivity.elevationGain || 0}m</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-gray-500 print:text-gray-600 text-xs font-bold uppercase">Veloc. Máx</span>
                                  <span className="text-white print:text-black font-bold">-- km/h</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-12 pt-6 border-t border-gray-800 print:border-gray-300 flex justify-between items-center text-[10px] text-gray-500 print:text-gray-600 uppercase tracking-widest font-bold">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Atividades</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Seu diário de bordo completo.</p>
        </div>
        <button 
          onClick={handleExportAllData}
          className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          <Database size={16} /> Backup Completo (JSON)
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma atividade registrada ainda.</p>
          </div>
        )}

        {activities.map(activity => (
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

            {/* Map Preview Header (if route exists) */}
            {activity.route && activity.route.length > 0 && (
              <div className="h-32 w-full bg-gray-100 dark:bg-gray-900 relative pointer-events-none">
                 <LiveMap route={activity.route} isPaused={true} />
                 <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent opacity-20"></div>
              </div>
            )}

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
