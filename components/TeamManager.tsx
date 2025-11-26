
import React, { useState } from 'react';
import { Member, PlanType } from '../types';
import { UserPlus, CheckCircle2, LogIn, Trash2, Users, Zap, Medal, ChevronRight, Crown, Shield, Clock, X } from 'lucide-react';

interface TeamManagerProps {
  members: Member[];
  currentUserId: string;
  onAddMember: (name: string, plan: PlanType, gender?: 'male' | 'female') => void;
  onSwitchUser: (id: string) => void;
  onRemoveMember: (id: string) => void;
  onViewProfile: (id: string) => void;
  onTogglePlan: (id: string, plan: PlanType) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ 
  members, 
  currentUserId, 
  onAddMember, 
  onSwitchUser,
  onRemoveMember,
  onViewProfile,
  onTogglePlan
}) => {
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<PlanType>('basic');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [isAdding, setIsAdding] = useState(false);

  // Authorization Checks
  const currentUser = members.find(m => m.id === currentUserId);
  const isAdmin = currentUser?.role === 'admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canManage = isAdmin || isSuperAdmin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddMember(newName, newPlan, newGender);
      setNewName('');
      setNewPlan('basic');
      setNewGender('male');
      setIsAdding(false);
    }
  };

  // Helper to format date
  const formatDate = (isoStr?: string) => {
      if (!isoStr) return '-';
      return new Date(isoStr).toLocaleDateString('pt-BR');
  };

  // Team Stats Calculation
  const totalTeamKm = members.reduce((acc, curr) => acc + curr.totalDistance, 0);
  const totalActivities = members.reduce((acc, curr) => acc + curr.activities.length, 0);

  const handleProfileClick = (targetId: string) => {
      // Allow everyone to view profiles to interact/follow
      onViewProfile(targetId);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Team Stats */}
      <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Central da Equipe</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Acompanhe o progresso do pelotão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Cards */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-500 dark:text-amber-400">
                <Users size={24} />
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Membros</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-500 dark:text-orange-400">
                <Zap size={24} />
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">KM Equipe</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTeamKm.toFixed(1)} km</p>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl text-yellow-500 dark:text-yellow-400">
                <Medal size={24} />
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Corridas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActivities}</p>
            </div>
        </div>
      </div>

      {/* ADMIN ZONE - Only Visible to Admins */}
      {canManage && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Shield size={200} />
              </div>

              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                          <div className="bg-amber-500 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20">
                              <Shield size={20} />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-white">Zona do Treinador</h3>
                              <p className="text-xs text-gray-400">Gestão de contratos e acessos.</p>
                          </div>
                      </div>
                      
                      {!isAdding && (
                          <button 
                              onClick={() => setIsAdding(true)}
                              className="bg-white text-gray-900 hover:bg-gray-100 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors shadow-lg"
                          >
                              <UserPlus size={18} />
                              Cadastrar Membro
                          </button>
                      )}
                  </div>

                  {/* Add Member Form */}
                  {isAdding && (
                      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 animate-fade-in relative">
                          <button 
                              onClick={() => setIsAdding(false)} 
                              className="absolute top-4 right-4 text-gray-500 hover:text-white"
                          >
                              <X size={20} />
                          </button>
                          
                          <h4 className="text-amber-500 font-bold uppercase text-xs tracking-wider mb-4">Novo Contrato</h4>
                          
                          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                  <label className="block text-xs text-gray-400 mb-1 ml-1">Nome do Atleta</label>
                                  <input
                                      type="text"
                                      value={newName}
                                      onChange={(e) => setNewName(e.target.value)}
                                      placeholder="Ex: Ana Silva"
                                      className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                                      autoFocus
                                  />
                              </div>
                              <div className="md:w-40">
                                  <label className="block text-xs text-gray-400 mb-1 ml-1">Gênero</label>
                                  <select
                                      value={newGender}
                                      onChange={(e) => setNewGender(e.target.value as 'male' | 'female')}
                                      className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                                  >
                                      <option value="male">Masculino</option>
                                      <option value="female">Feminino</option>
                                  </select>
                              </div>
                              <div className="md:w-64">
                                  <label className="block text-xs text-gray-400 mb-1 ml-1">Plano Inicial</label>
                                  <select
                                      value={newPlan}
                                      onChange={(e) => setNewPlan(e.target.value as PlanType)}
                                      className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                                  >
                                      <option value="basic">Plano Básico (Gratuito)</option>
                                      <option value="pro">Plano PRO (30 Dias)</option>
                                  </select>
                              </div>
                              <div className="flex items-end">
                                  <button 
                                      type="submit"
                                      disabled={!newName.trim()}
                                      className="bg-amber-500 text-white hover:bg-amber-400 font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto shadow-lg shadow-amber-500/20"
                                  >
                                      Confirmar
                                  </button>
                              </div>
                          </form>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Members Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Membros Ativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
                const isCurrentUser = member.id === currentUserId;
                const isMemberAdmin = member.role === 'admin' || member.role === 'super_admin';
                const canEditThisUser = isSuperAdmin || (isAdmin && member.role === 'member');
                const showControls = canManage && canEditThisUser;

                return (
                    <div 
                        key={member.id} 
                        onClick={() => handleProfileClick(member.id)}
                        className={`relative group p-4 rounded-2xl border transition-all shadow-sm overflow-hidden cursor-pointer
                            ${isCurrentUser 
                                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md'}
                        `}
                    >
                        {isMemberAdmin && (
                            <div className="absolute top-0 right-0 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold uppercase z-20">
                                {member.role.replace('_', ' ')}
                            </div>
                        )}

                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center space-x-3">
                                <img 
                                    src={member.avatarUrl} 
                                    alt={member.name} 
                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 bg-gray-200 dark:bg-gray-900"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{member.name}</h4>
                                        {member.plan === 'pro' && (
                                            <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">PRO</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded inline-block border border-gray-200 dark:border-gray-700">
                                            {member.rank}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-600">
                                            {member.gender === 'female' ? '♀' : '♂'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {isCurrentUser ? (
                                    <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs font-bold bg-amber-100 dark:bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-400/20">
                                        <CheckCircle2 size={14} /> Eu
                                    </div>
                                ) : (
                                    <>
                                        {isSuperAdmin && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSwitchUser(member.id);
                                                }}
                                                className="bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-400 p-2 rounded-lg transition-colors z-10 shadow-sm"
                                                title="Entrar como este usuário (Modo Espião)"
                                            >
                                                <LogIn size={16} />
                                            </button>
                                        )}
                                        {showControls && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm(`Tem certeza que deseja remover ${member.name} da equipe?`)) {
                                                        onRemoveMember(member.id);
                                                    }
                                                }}
                                                className="bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-400 p-2 rounded-lg transition-colors z-10"
                                                title="Remover membro"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Expiration Info for PRO */}
                        {member.plan === 'pro' && member.proExpiresAt && (
                             <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                 <Clock size={12} className="text-amber-500" />
                                 <span>Vence em: {formatDate(member.proExpiresAt)}</span>
                             </div>
                        )}

                        {/* Admin Plan Switcher */}
                        {showControls && (
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Shield size={12} /> Plano (30 dias):
                                    </span>
                                    <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
                                        <button 
                                            onClick={() => onTogglePlan(member.id, 'basic')}
                                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${member.plan === 'basic' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-400'}`}
                                        >
                                            Básico
                                        </button>
                                        <button 
                                            onClick={() => onTogglePlan(member.id, 'pro')}
                                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${member.plan === 'pro' ? 'bg-amber-500 text-white shadow' : 'text-gray-400'}`}
                                        >
                                            <Crown size={10} /> PRO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-between text-sm">
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Seguidores</p>
                                <p className="text-gray-900 dark:text-white font-mono text-lg">{member.followers.length}</p>
                            </div>
                            <div className="text-right flex items-center justify-end gap-2 text-gray-400 group-hover:text-amber-500 transition-colors">
                                <span className="text-xs">Ver Perfil</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
