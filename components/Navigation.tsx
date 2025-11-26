
import React, { useState } from 'react';
import { LayoutDashboard, Trophy, Activity, Bot, Users, BookOpen, CalendarDays, Heart, Medal, ScrollText, PlayCircle, Wind, Sun, Moon, Flag, Settings, Menu, X, ChevronRight, LogOut, Bell, CheckCheck, Home, Trash2, Crown, Clock, Shield, User, BarChart2 } from 'lucide-react';
import { Member } from '../types';

// Custom Winged Shoe Icon
const WingedShoeIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 14h2.5" />
    <path d="M5 14v-2a3 3 0 0 1 3-3h4" />
    <path d="M9 9l3-5 3 5" />
    <path d="M2 17h2.5" />
    <path d="M12.5 8h3.5a4 4 0 0 1 3.5 2l2.5 5" />
    <path d="M22 15h-2.5" />
    <path d="M5 17c0 1.7 1.3 3 3 3h11c1.7 0 3-1.3 3-3" />
    <path d="M5 14c0 1.7 1.3 3 3 3" />
    <path d="M22 15c0 1.7-1.3 3-3 3" />
  </svg>
);

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  currentUser: Member;
  onMarkNotificationsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearReadNotifications: () => void;
  onViewProfile?: (id: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  toggleTheme, 
  isDark, 
  currentUser, 
  onMarkNotificationsRead,
  onDeleteNotification,
  onClearReadNotifications,
  onViewProfile 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel', category: 'Principal' },
    { id: 'vip', icon: Crown, label: 'VIP Lounge', category: 'Principal', requiredPlan: 'pro' },
    { id: 'season', icon: Flag, label: 'Temporada', category: 'Principal' },
    { id: 'run', icon: PlayCircle, label: 'Correr', isAction: true, category: 'Ação' }, 
    { id: 'leaderboard', icon: Trophy, label: 'Ranking', category: 'Competição' },
    { id: 'community', icon: Heart, label: 'Social', category: 'Comunidade' },
    
    // Ícone personalizado aqui
    { id: 'training', icon: WingedShoeIcon, label: 'Central de Treinos', category: 'Treinos' },
    { id: 'coach', icon: Bot, label: 'Coach IA', category: 'Treinos' },

    // Funcionalidades Completas
    { id: 'history', icon: Clock, label: 'Histórico', category: 'Performance' },
    { id: 'activity', icon: Activity, label: 'Evolução', category: 'Performance' },
    { id: 'achievements', icon: Medal, label: 'Conquistas', category: 'Competição' },
    { id: 'events', icon: CalendarDays, label: 'Eventos', category: 'Comunidade' },
    { id: 'team', icon: Users, label: 'Equipe', category: 'Comunidade' },
    { id: 'resources', icon: BookOpen, label: 'Recursos', category: 'Educação' },
    { id: 'admin', icon: Settings, label: 'Admin', requiredRole: ['admin', 'super_admin'], category: 'Sistema' }, 
  ];

  const handleMobileNav = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  // Group items for the mobile drawer
  const groupedItems = navItems.reduce((acc, item) => {
    // Check Role Access
    if (item.requiredRole) {
        const allowedRoles = Array.isArray(item.requiredRole) ? item.requiredRole : [item.requiredRole];
        if (!allowedRoles.includes(currentUser.role)) return acc;
    }
    // Check Plan Access (For VIP Lounge visualization in menu)
    if (item.requiredPlan && item.requiredPlan === 'pro' && currentUser.plan !== 'pro' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        return acc;
    }
    
    if (item.isAction) return acc; // Skip action button in list
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  // Notification Logic
  const unreadCount = currentUser.notifications.filter(n => !n.read).length;
  const toggleNotifications = () => {
      setShowNotifications(!showNotifications);
      if (!showNotifications && unreadCount > 0) {
          // Keep generic behavior
      }
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR (UNCHANGED) --- */}
      <nav className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-50 transition-colors duration-300 fixed left-0 top-0">
        <div className="flex flex-col px-6 py-8 h-full">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="bg-amber-500 rounded-full p-2.5 shadow-lg shadow-amber-500/20 shrink-0">
                    <Wind className="text-white" size={22} strokeWidth={3} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none truncate">
                      FILHOS<span className="text-amber-500 dark:text-amber-400">DO</span>VENTO
                    </h1>
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">Running Team</span>
                  </div>
              </div>
          </div>
          
          <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
            {navItems
              .filter(item => {
                  if (item.requiredRole) {
                      const allowed = Array.isArray(item.requiredRole) ? item.requiredRole : [item.requiredRole];
                      if (!allowed.includes(currentUser.role)) return false;
                  }
                  if (item.requiredPlan === 'pro' && currentUser.plan !== 'pro' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') return false;
                  return true;
              })
              .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                  ${activeTab === item.id 
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' 
                    : item.isAction
                      ? 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 my-2 shadow-sm border border-gray-200 dark:border-gray-800'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <item.icon size={20} className={`${activeTab === item.id ? 'text-amber-500' : ''}`} />
                <span className="text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-l-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
             <div className="flex gap-2 mb-4 justify-center">
                 <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Alternar Tema"
                  >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <button 
                    onClick={toggleNotifications}
                    className={`relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${showNotifications ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800'}`}
                    title="Notificações"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-100 dark:border-gray-800 animate-pulse"></span>
                    )}
                  </button>
             </div>

             <button 
                type="button"
                className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group w-full text-left"
                onClick={() => onViewProfile && onViewProfile(currentUser.id)}
                title="Configurações de Perfil"
             >
                <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200 object-cover" alt="User" />
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                        {currentUser.name}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">{currentUser.role === 'member' ? currentUser.rank : currentUser.role.replace('_', ' ')}</p>
                </div>
                <Settings size={14} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
             </button>
          </div>
        </div>
      </nav>

      {/* --- DESKTOP NOTIFICATION DRAWER --- */}
      {showNotifications && (
          <div className="fixed left-64 top-4 z-[60] w-80 max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl animate-fade-in hidden md:flex">
              {/* Desktop Notification Content (Same as before) */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/90 backdrop-blur-sm rounded-t-xl z-10">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    Notificações 
                    {unreadCount > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                  </h3>
                  <div className="flex gap-1">
                      <button 
                        onClick={onClearReadNotifications} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-red-500 transition-colors" 
                        title="Limpar Lidas"
                      >
                          <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={onMarkNotificationsRead} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-green-500 transition-colors" 
                        title="Marcar todas como lidas"
                      >
                          <CheckCheck size={14} />
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"><X size={16} className="text-gray-500" /></button>
                  </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto custom-scrollbar flex-1">
                  {currentUser.notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">Nenhuma notificação.</div>
                  ) : (
                      currentUser.notifications.map(note => (
                          <div key={note.id} className={`p-4 transition-colors relative group hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!note.read ? 'bg-amber-50/50 dark:bg-amber-500/5' : 'opacity-70'}`}>
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteNotification(note.id);
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir"
                              >
                                <X size={12} />
                              </button>
                              
                              <div className="flex items-start gap-3 pr-4">
                                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                      !note.read ? (
                                          note.type === 'success' ? 'bg-green-500' :
                                          note.type === 'achievement' ? 'bg-yellow-400' :
                                          note.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'
                                      ) : 'bg-gray-300 dark:bg-gray-600'
                                  }`}></div>
                                  <div>
                                      <h4 className={`text-sm ${!note.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-400'}`}>{note.title}</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{note.message}</p>
                                      <span className="text-[10px] text-gray-400 mt-2 block">{new Date(note.date).toLocaleDateString()}</span>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* --- DESKTOP SPACER --- */}
      <div className="hidden md:block w-64 flex-shrink-0"></div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 z-[60] pb-[env(safe-area-inset-bottom)] transition-all duration-300">
        <div className="flex justify-between items-end h-20 px-4 pb-2">
          
          {/* 1. INÍCIO */}
          <button
             onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
             className={`flex-1 flex flex-col items-center justify-end pb-3 space-y-1 group h-full`}
          >
             <Home size={22} className={`${activeTab === 'dashboard' ? 'text-amber-500 fill-amber-500/20' : 'text-gray-400 dark:text-gray-500'} transition-colors`} />
             <span className={`text-[10px] font-bold ${activeTab === 'dashboard' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>Início</span>
          </button>

          {/* 2. TREINO */}
          <button
             onClick={() => { setActiveTab('training'); setIsMobileMenuOpen(false); }}
             className={`flex-1 flex flex-col items-center justify-end pb-3 space-y-1 group h-full`}
          >
             <WingedShoeIcon size={22} className={`${activeTab === 'training' || activeTab === 'coach' ? 'text-amber-500 fill-amber-500/20' : 'text-gray-400 dark:text-gray-500'} transition-colors`} />
             <span className={`text-[10px] font-bold ${activeTab === 'training' || activeTab === 'coach' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>Treino</span>
          </button>

          {/* 3. CENTER ACTION: RUN */}
          <div className="relative -top-5 mx-2">
              <button
                onClick={() => { setActiveTab('run'); setIsMobileMenuOpen(false); }}
                className="w-16 h-16 bg-amber-500 text-black rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] border-4 border-gray-100 dark:border-gray-950 flex items-center justify-center transform active:scale-95 transition-transform"
              >
                <Wind size={28} fill="currentColor" />
              </button>
          </div>

          {/* 4. SOCIAL */}
          <button
             onClick={() => { setActiveTab('community'); setIsMobileMenuOpen(false); }}
             className={`flex-1 flex flex-col items-center justify-end pb-3 space-y-1 group h-full`}
          >
             <Users size={22} className={`${activeTab === 'community' || activeTab === 'leaderboard' ? 'text-amber-500 fill-amber-500/20' : 'text-gray-400 dark:text-gray-500'} transition-colors`} />
             <span className={`text-[10px] font-bold ${activeTab === 'community' || activeTab === 'leaderboard' ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>Tribo</span>
          </button>

          {/* 5. PERFIL / MENU */}
          <button
             onClick={() => setIsMobileMenuOpen(true)}
             className={`flex-1 flex flex-col items-center justify-end pb-3 space-y-1 group h-full`}
          >
             <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${isMobileMenuOpen ? 'border-amber-500' : 'border-transparent'}`}>
                 <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="Menu" />
             </div>
             <span className={`text-[10px] font-bold ${isMobileMenuOpen ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>Eu</span>
          </button>
        </div>
      </nav>

      {/* --- MOBILE FULL MENU DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-gray-50 dark:bg-gray-950 animate-fade-in flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => { onViewProfile && onViewProfile(currentUser.id); setIsMobileMenuOpen(false); }}
                >
                    <img src={currentUser.avatarUrl} className="w-14 h-14 rounded-full bg-gray-200 object-cover border-2 border-amber-500" alt="User" />
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            {currentUser.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-black uppercase">{currentUser.rank}</span>
                            <span className="text-xs text-gray-500">Ver Perfil Completo <ChevronRight size={10} className="inline"/></span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200">
                    <X size={24} />
                </button>
            </div>

            {/* System Settings Row */}
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
                <button onClick={toggleTheme} className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="text-xs font-bold uppercase">Tema {isDark ? 'Claro' : 'Escuro'}</span>
                </button>
                <button onClick={toggleNotifications} className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 relative">
                    <Bell size={18} />
                    <span className="text-xs font-bold uppercase">Avisos</span>
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="mb-6">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                            {category}
                            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMobileNav(item.id)}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all border active:scale-98
                                        ${activeTab === item.id 
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400' 
                                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}
                                >
                                    <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                                    <ChevronRight size={16} className="opacity-30" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </>
  );
};
