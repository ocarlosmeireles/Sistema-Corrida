
import React, { useState, useEffect } from 'react';
import { Season, Sponsor } from '../types';
import { Settings, Plus, Trash2, Save, Gift, Calendar, Image as ImageIcon, CheckCircle, Film } from 'lucide-react';
import { MarketingStudio } from './MarketingStudio';

interface AdminPanelProps {
  currentSeason: Season;
  allSponsors: Sponsor[];
  onUpdateSeason: (season: Season) => void;
  onAddSponsor: (sponsor: Sponsor) => void;
  onRemoveSponsor: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  currentSeason, 
  allSponsors, 
  onUpdateSeason,
  onAddSponsor,
  onRemoveSponsor
}) => {
  const [activeTab, setActiveTab] = useState<'season' | 'sponsors' | 'marketing'>('season');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local State for Season Form
  const [seasonForm, setSeasonForm] = useState<Season>(currentSeason);
  
  // Local State for New Sponsor Form
  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({
    name: '',
    logoUrl: '',
    prizeDescription: '',
    prizeImageUrl: ''
  });

  useEffect(() => {
    if (successMsg) {
        const timer = setTimeout(() => setSuccessMsg(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSeasonChange = (field: keyof Season, value: any) => {
    setSeasonForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSponsorInSeason = (sponsor: Sponsor) => {
    const isSelected = seasonForm.sponsors.some(s => s.id === sponsor.id);
    let newSponsors;
    
    if (isSelected) {
        newSponsors = seasonForm.sponsors.filter(s => s.id !== sponsor.id);
    } else {
        newSponsors = [...seasonForm.sponsors, sponsor];
    }
    setSeasonForm(prev => ({ ...prev, sponsors: newSponsors }));
  };

  const saveSeason = () => {
    onUpdateSeason(seasonForm);
    setSuccessMsg("Configurações da temporada salvas com sucesso!");
  };

  const saveSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSponsor.name && newSponsor.prizeDescription) {
        const sponsor: Sponsor = {
            id: Date.now().toString(),
            name: newSponsor.name!,
            logoUrl: newSponsor.logoUrl || 'https://via.placeholder.com/150',
            prizeDescription: newSponsor.prizeDescription!,
            prizeImageUrl: newSponsor.prizeImageUrl || 'https://via.placeholder.com/150'
        };
        onAddSponsor(sponsor);
        setNewSponsor({ name: '', logoUrl: '', prizeDescription: '', prizeImageUrl: '' });
        setSuccessMsg(`Patrocinador ${sponsor.name} adicionado!`);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-fade-in relative">
      
      {/* Success Notification Toast */}
      {successMsg && (
          <div className="fixed top-6 right-6 z-[100] bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
              <div className="bg-white/20 p-1 rounded-full">
                <CheckCircle size={20} />
              </div>
              <span className="font-bold text-sm shadow-sm">{successMsg}</span>
          </div>
      )}

      <div className="flex items-center gap-4 mb-6">
         <div className="bg-gray-900 dark:bg-white p-3 rounded-xl text-white dark:text-gray-900">
             <Settings size={28} />
         </div>
         <div>
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Administração</h2>
             <p className="text-gray-500 dark:text-gray-400">Gerencie a equipe, temporadas e parcerias.</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-1 overflow-x-auto">
        <button
            onClick={() => setActiveTab('season')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'season' 
                ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            Temporada Atual
        </button>
        <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'sponsors' 
                ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            Banco de Patrocinadores
        </button>
        <button
            onClick={() => setActiveTab('marketing')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'marketing' 
                ? 'border-amber-500 text-amber-600 dark:text-amber-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            <Film size={16} />
            Estúdio Criativo (IA)
        </button>
      </div>

      {/* CONTENT: SEASON MANAGEMENT */}
      {activeTab === 'season' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="text-amber-500" />
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Dados da Temporada</h3>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Título da Temporada</label>
                    <input 
                        type="text" 
                        value={seasonForm.title}
                        onChange={(e) => handleSeasonChange('title', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Descrição / Regras</label>
                    <textarea 
                        value={seasonForm.description}
                        onChange={(e) => handleSeasonChange('description', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Data Início</label>
                        <input 
                            type="date" 
                            value={seasonForm.startDate}
                            onChange={(e) => handleSeasonChange('startDate', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Data Fim</label>
                        <input 
                            type="date" 
                            value={seasonForm.endDate}
                            onChange={(e) => handleSeasonChange('endDate', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>

                <button 
                    onClick={saveSeason}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95"
                >
                    <Save size={20} /> Salvar Configurações
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <div className="flex items-center gap-2 mb-6">
                    <Gift className="text-amber-500" />
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Patrocinadores Ativos</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Selecione quais patrocinadores do banco estão ativos nesta temporada.
                </p>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {allSponsors.length === 0 && (
                        <p className="text-center text-gray-400 py-4 text-sm italic">Banco de patrocinadores vazio.</p>
                    )}
                    {allSponsors.map(sponsor => {
                        const isSelected = seasonForm.sponsors.some(s => s.id === sponsor.id);
                        return (
                            <div 
                                key={sponsor.id}
                                onClick={() => toggleSponsorInSeason(sponsor)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4
                                    ${isSelected 
                                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' 
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {isSelected && <CheckCircle size={14} />}
                                </div>
                                <img src={sponsor.logoUrl} alt={sponsor.name} className="w-10 h-10 rounded-lg object-contain bg-white" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white">{sponsor.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{sponsor.prizeDescription}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* CONTENT: SPONSORS BANK */}
      {activeTab === 'sponsors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Sponsor Form */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-fit">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="text-amber-500" /> Novo Patrocinador
                </h3>
                <form onSubmit={saveSponsor} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Nome da Marca</label>
                        <input 
                            required
                            type="text" 
                            value={newSponsor.name}
                            onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Ex: ASICS"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">URL do Logo</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={newSponsor.logoUrl}
                                onChange={(e) => setNewSponsor({...newSponsor, logoUrl: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 pl-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Descrição do Prêmio</label>
                        <input 
                            required
                            type="text" 
                            value={newSponsor.prizeDescription}
                            onChange={(e) => setNewSponsor({...newSponsor, prizeDescription: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Ex: Tênis de Corrida"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">URL Imagem do Prêmio</label>
                        <div className="relative">
                            <Gift className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={newSponsor.prizeImageUrl}
                                onChange={(e) => setNewSponsor({...newSponsor, prizeImageUrl: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 pl-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                    >
                        <Plus size={20} /> Adicionar ao Banco
                    </button>
                </form>
            </div>

            {/* Sponsors List */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                {allSponsors.map(sponsor => (
                    <div key={sponsor.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
                        <div className="h-24 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative">
                             <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-16 max-w-[80%] object-contain" />
                             <button 
                                onClick={() => {
                                    if(window.confirm("Remover este patrocinador do banco?")) onRemoveSponsor(sponsor.id);
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h4 className="font-bold text-gray-900 dark:text-white">{sponsor.name}</h4>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-300">
                                <Gift size={14} className="text-purple-500" />
                                <span className="truncate">{sponsor.prizeDescription}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {allSponsors.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        Nenhum patrocinador cadastrado.
                    </div>
                )}
            </div>
        </div>
      )}

      {/* CONTENT: MARKETING STUDIO */}
      {activeTab === 'marketing' && (
          <div className="animate-fade-in">
              <div className="mb-6">
                  <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Estúdio Criativo (IA)</h3>
                  <p className="text-gray-500 dark:text-gray-400">Gere conteúdo audiovisual exclusivo para a equipe usando Inteligência Artificial de ponta.</p>
              </div>
              <MarketingStudio />
          </div>
      )}

    </div>
  );
};
