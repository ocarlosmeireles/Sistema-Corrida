
import React, { useState, useEffect } from 'react';
import { Activity } from '../types';
import { PlusCircle, Watch, MapPin, Calendar, Calculator } from 'lucide-react';

interface ActivityLoggerProps {
  onAddActivity: (activity: Omit<Activity, 'id' | 'pace'>) => void;
}

export const ActivityLogger: React.FC<ActivityLoggerProps> = ({ onAddActivity }) => {
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [feeling, setFeeling] = useState<Activity['feeling']>('good');
  const [notes, setNotes] = useState('');
  const [estimatedPace, setEstimatedPace] = useState<string>("0'00\"/km");

  // Auto-calculate pace preview
  useEffect(() => {
      const d = parseFloat(distance);
      const t = parseFloat(duration);
      if (d > 0 && t > 0) {
          const paceVal = t / d;
          const min = Math.floor(paceVal);
          const sec = Math.round((paceVal - min) * 60);
          setEstimatedPace(`${min}'${sec.toString().padStart(2, '0')}"/km`);
      } else {
          setEstimatedPace("0'00\"/km");
      }
  }, [distance, duration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distance || !duration) return;

    onAddActivity({
      distanceKm: parseFloat(distance),
      durationMin: parseFloat(duration),
      date,
      feeling,
      notes
    });

    // Reset form
    setDistance('');
    setDuration('');
    setNotes('');
    setFeeling('good');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center space-x-2 mb-6">
        <PlusCircle className="text-amber-500 dark:text-amber-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Corrida</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Data</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Distância (km)</label>
             <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tempo (minutos)</label>
             <div className="relative">
              <Watch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="number" 
                required
                placeholder="0"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 p-2 text-center">
              <label className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <Calculator size={12} /> Pace Estimado
              </label>
              <div className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tighter">
                  {estimatedPace}
              </div>
          </div>
        </div>

        <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sensação</label>
            <div className="grid grid-cols-4 gap-2">
              {(['great', 'good', 'hard', 'pain'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling(f)}
                  className={`py-2 rounded-lg text-lg border ${
                    feeling === f 
                    ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-500 scale-105' 
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50 hover:opacity-100'
                  } transition-all`}
                >
                  {f === 'great' ? '🤩' : f === 'good' ? '🙂' : f === 'hard' ? '🥵' : '🤕'}
                </button>
              ))}
            </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Notas (Opcional)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como foi o treino? Terreno, clima..."
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-2.5 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none h-20 resize-none transition-colors"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white dark:text-gray-900 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
        >
          Registrar Evolução
        </button>
      </form>
    </div>
  );
};
