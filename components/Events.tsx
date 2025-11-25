
import React, { useState } from 'react';
import { RaceEvent, Member } from '../types';
import { Calendar, MapPin, Timer, Plus, Trash2, Flag } from 'lucide-react';

interface EventsProps {
  events: RaceEvent[];
  onAddEvent: (event: Omit<RaceEvent, 'id'>) => void;
  onRemoveEvent: (id: string) => void;
  currentUser: Member;
}

export const Events: React.FC<EventsProps> = ({ events, onAddEvent, onRemoveEvent, currentUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [distancesStr, setDistancesStr] = useState(''); // Comma separated

  // Check if user is admin or super_admin
  const canManageEvents = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  // Calculate Countdown for nearest future event
  const today = new Date();
  today.setHours(0,0,0,0);

  const futureEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const nextEvent = futureEvents.length > 0 ? futureEvents[0] : null;
  
  const getDaysRemaining = (dateString: string) => {
    const eventDate = new Date(dateString);
    const timeDiff = eventDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;

    onAddEvent({
      name,
      date,
      location,
      distances: distancesStr.split(',').map(d => d.trim()).filter(d => d !== '')
    });

    // Reset
    setName('');
    setDate('');
    setLocation('');
    setDistancesStr('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      
      {/* Hero Section: Next Race Countdown */}
      {nextEvent ? (
        <div className="bg-gradient-to-br from-green-800 to-green-900 dark:from-green-900 dark:to-gray-900 rounded-2xl p-8 border border-green-700 dark:border-green-800 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 bg-green-500/10 w-64 h-64 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center md:text-left md:flex md:justify-between md:items-center">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-green-300 dark:text-green-400 font-bold tracking-widest uppercase text-xs mb-2">
                <Timer size={14} /> Próxima Caçada
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2">{nextEvent.name}</h2>
              <div className="flex flex-col md:flex-row gap-4 text-green-100 dark:text-gray-300 text-sm font-medium">
                <span className="flex items-center justify-center gap-1"><Calendar size={16}/> {new Date(nextEvent.date).toLocaleDateString('pt-BR')}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center justify-center gap-1"><MapPin size={16}/> {nextEvent.location}</span>
              </div>
            </div>

            <div className="mt-8 md:mt-0 bg-white/10 dark:bg-gray-900/50 p-4 rounded-xl border border-white/10 dark:border-gray-700 backdrop-blur-sm">
              <div className="text-4xl font-mono font-bold text-white text-center">{getDaysRemaining(nextEvent.date)}</div>
              <div className="text-xs text-green-200 dark:text-gray-400 uppercase tracking-wider text-center">Dias Restantes</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-700 border-dashed">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma caçada à vista</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {canManageEvents ? 'Adicione um evento para começar a contagem.' : 'Aguarde o administrador adicionar novas provas.'}
          </p>
        </div>
      )}

      {/* Header List */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Calendário de Provas</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Planeje seus ataques.</p>
        </div>
        
        {canManageEvents && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-400/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={16} /> Adicionar Prova
          </button>
        )}
      </div>

      {/* Add Form (Admin Only) */}
      {isAdding && canManageEvents && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nome do Evento</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-green-500 outline-none" placeholder="Ex: Meia de Sampa" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Local</label>
                <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-green-500 outline-none" placeholder="Cidade/Estado" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Distâncias (separadas por vírgula)</label>
                <input required type="text" value={distancesStr} onChange={e => setDistancesStr(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-1 focus:ring-green-500 outline-none" placeholder="5km, 10km, 21km" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" className="bg-green-500 hover:bg-green-600 text-white dark:text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors">Salvar Evento</button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {futureEvents.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-transparent">
                <p className="text-gray-500">Nenhum evento futuro encontrado.</p>
            </div>
        )}
        
        {futureEvents.map((event) => (
          <div key={event.id} className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-green-500/50 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center min-w-[70px]">
                <span className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">{new Date(event.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{new Date(event.date).getDate()}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{event.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <MapPin size={14} /> {event.location}
                </div>
                <div className="flex gap-2 mt-3">
                    {event.distances.map(d => (
                        <span key={d} className="text-xs font-bold bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{d}</span>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700">
                <div className="text-right hidden md:block">
                    <span className="block text-xs text-gray-500">Faltam</span>
                    <span className="block font-bold text-green-600 dark:text-green-400">{getDaysRemaining(event.date)} dias</span>
                </div>
                
                {canManageEvents && (
                  <button 
                      onClick={() => {
                          if(window.confirm("Deseja realmente excluir este evento?")) onRemoveEvent(event.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-400/10 rounded-lg transition-all"
                  >
                      <Trash2 size={18} />
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
