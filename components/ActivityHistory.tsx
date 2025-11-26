
import React from 'react';
import { Member, Activity } from '../types';
import { Calendar, Download, Database, FileText } from 'lucide-react';
import { LiveMap } from './LiveRun';

interface ActivityHistoryProps {
  currentUser: Member;
  isDark: boolean;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ currentUser, isDark }) => {
  const activities = [...currentUser.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- EXPORT LOGIC ---
  const generateGPX = (activity: Activity): string => {
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

    return header + points + footer;
  };

  const handleDownloadGPX = (activity: Activity) => {
    if (!activity.route || activity.route.length === 0) {
      alert("Esta atividade não possui dados de GPS para exportar.");
      return;
    }
    const gpxData = generateGPX(activity);
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
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
          <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            {/* Map Preview Header (if route exists) */}
            {activity.route && activity.route.length > 0 && (
              <div className="h-48 w-full bg-gray-100 dark:bg-gray-900 relative">
                 <LiveMap route={activity.route} isPaused={true} />
                 <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white dark:from-gray-800 to-transparent opacity-20"></div>
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
                    <Calendar size={12} /> {new Date(activity.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    {activity.mode === 'run' ? 'Corrida' : activity.mode === 'walk' ? 'Caminhada' : 'Atividade'} 
                    <span className="text-amber-500 text-sm font-normal bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                      {activity.feeling === 'great' ? '🤩' : activity.feeling === 'good' ? '🙂' : activity.feeling === 'hard' ? '🥵' : '🤕'}
                    </span>
                  </h3>
                </div>
                
                {activity.route && activity.route.length > 0 && (
                  <button 
                    onClick={() => handleDownloadGPX(activity)}
                    className="text-xs font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    title="Exportar para Strava/Garmin"
                  >
                    <Download size={14} /> GPX
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Distância</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{activity.distanceKm.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Tempo</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{activity.durationMin} min</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Pace Médio</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{activity.pace}</p>
                </div>
              </div>

              {activity.notes && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-amber-500">
                  "{activity.notes}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
