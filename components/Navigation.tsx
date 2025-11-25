
import React, { useState } from 'react';
import { LayoutDashboard, Trophy, Activity, Bot, Users, BookOpen, CalendarDays, Heart, Medal, ScrollText, PlayCircle, Wind, Sun, Moon, Flag, Settings, Menu, X, ChevronRight, LogOut, Bell, CheckCheck, Home } from 'lucide-react';
import { Member } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  currentUser: Member;
  onMarkNotificationsRead: () => void;
  onViewProfile?: (id: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, toggleTheme, isDark, currentUser, onMarkNotificationsRead, onViewProfile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel', category: 'Principal' },
    { id: 'season', icon: Flag, label: 'Temporada', category: 'Principal' },
    { id: 'run', icon: PlayCircle, label: 'Correr', isAction: true, category: 'Ação' }, 
    { id: 'leaderboard', icon: Trophy, label: 'Ranking', category: 'Competição' },
    { id: 'community', icon: Heart, label: 'Social', category: 'Comunidade' },
    
    // Funcionalidades Completas
    { id: 'coach', icon: Bot, label: 'Coach IA', category: 'Performance' },
    { id: 'plans', icon: ScrollText, label: 'Planilhas', category: 'Performance' },
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
    
    if (item.isAction) return acc; // Skip action button in list
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  // Notification Logic
  const unreadCount = currentUser.notifications.filter(n => !n.read).length;
  const toggleNotifications = () => {
      setShowNotifications(!showNotifications);
  };

  const handleClearNotifications = () => {
      onMarkNotificationsRead();
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
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
                  if (!item.requiredRole) return true;
                  const allowed = Array.isArray(item.requiredRole) ? item.requiredRole : [item.requiredRole];
                  return allowed.includes(currentUser.role);
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

      {/* --- DESKTOP NOTIFICATION DRAWER (Absolute) --- */}
      {showNotifications && (
          <div className="fixed left-64 top-4 z-[60] w-80 max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl animate-fade-in">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/90 backdrop-blur-sm rounded-t-xl z-10">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Notificações 
                    {unreadCount > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                  </h3>
                  <div className="flex gap-1">
                      {unreadCount > 0 && (
                          <button onClick={handleClearNotifications} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-green-500" title="Marcar todas como lidas">
                              <CheckCheck size={16} />
                          </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"><X size={16} className="text-gray-500" /></button>
                  </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto custom-scrollbar flex-1">
                  {currentUser.notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">Nenhuma notificação recente.</div>
                  ) : (
                      currentUser.notifications.map(note => (
                          <div key={note.id} className={`p-4 transition-colors ${!note.read ? 'bg-amber-50 dark:bg-amber-500/5' : 'opacity-70 grayscale-[0.5]'}`}>
                              <div className="flex items-start gap-3">
                                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                      note.type === 'success' ? 'bg-green-500' :
                                      note.type === 'achievement' ? 'bg-yellow-400' :
                                      note.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'
                                  }`}></div>
                                  <div>
                                      <h4 className={`text-sm ${!note.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{note.title}</h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{note.message}</p>
                                      <span className="text-[10px] text-gray-400 mt-2 block">{new Date(note.date).toLocaleString()}</span>
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

      {/* --- MOBILE BOTTOM NAVIGATION (MODERN DOCK) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-[60] pb-[env(safe-area-inset-bottom)] transition-all duration-300 shadow-[0_-5px_25px_rgba(0,0,0,0.15)]">
        <div className="flex justify-around items-center h-16 px-2">
          
          {/* 1. Dashboard (Home) */}
          <button
             onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
             className={`flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-90 transition-transform duration-200 group`}
          >
             <div className={`p-1.5 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-amber-100 dark:bg-amber-500/20 scale-110' : ''}`}>
                <Home size={24} className={`${activeTab === 'dashboard' ? 'text-amber-600 dark:text-amber-400 fill-current' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
             </div>
             <span className={`text-[9px] font-bold mt-0.5 ${activeTab === 'dashboard' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>Painel</span>
          </button>

          {/* 2. Community (Social) */}
          <button
             onClick={() => { setActiveTab('community'); setIsMobileMenuOpen(false); }}
             className={`flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-90 transition-transform duration-200 group`}
          >
             <div className={`p-1.5 rounded-2xl transition-all duration-300 ${activeTab === 'community' ? 'bg-amber-100 dark:bg-amber-500/20 scale-110' : ''}`}>
                <Heart size={24} className={`${activeTab === 'community' ? 'text-amber-600 dark:text-amber-400 fill-current' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={activeTab === 'community' ? 2.5 : 2} />
             </div>
             <span className={`text-[9px] font-bold mt-0.5 ${activeTab === 'community' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>Social</span>
          </button>

          {/* 3. MAIN ACTION: RUN (Floating FAB) */}
          <button
            onClick={() => { setActiveTab('run'); setIsMobileMenuOpen(false); }}
            className="relative -top-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white w-16 h-16 rounded-full shadow-2xl shadow-amber-500/40 border-4 border-gray-50 dark:border-gray-950 transform transition-transform active:scale-90 flex items-center justify-center z-10 group"
          >
            <PlayCircle size={32} fill="currentColor" className="group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-active:opacity-30"></div>
          </button>

          {/* 4. Leaderboard (Rank) */}
          <button
             onClick={() => { setActiveTab('leaderboard'); setIsMobileMenuOpen(false); }}
             className={`flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-90 transition-transform duration-200 group`}
          >
             <div className={`p-1.5 rounded-2xl transition-all duration-300 ${activeTab === 'leaderboard' ? 'bg-amber-100 dark:bg-amber-500/20 scale-110' : ''}`}>
                <Trophy size={24} className={`${activeTab === 'leaderboard' ? 'text-amber-600 dark:text-amber-400 fill-current' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={activeTab === 'leaderboard' ? 2.5 : 2} />
             </div>
             <span className={`text-[9px] font-bold ${activeTab === 'leaderboard' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>Rank</span>
          </button>

          {/* 5. MENU (More) */}
          <button
             onClick={() => setIsMobileMenuOpen(true)}
             className={`flex flex-col items-center justify-center w-16 h-full space-y-1 active:scale-90 transition-transform duration-200 group`}
          >
             <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isMobileMenuOpen ? 'bg-amber-100 dark:bg-amber-500/20 scale-110' : ''}`}>
                <Menu size={24} className={`${isMobileMenuOpen ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={isMobileMenuOpen ? 2.5 : 2} />
             </div>
             <span className={`text-[9px] font-bold mt-0.5 ${isMobileMenuOpen ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>Menu</span>
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
                    <img src={currentUser.avatarUrl} className="w-12 h-12 rounded-full bg-gray-200 object-cover border-2 border-gray-100 dark:border-gray-800" alt="User" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {currentUser.name}
                            <Settings size={16} className="text-amber-500" />
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-bold uppercase">{currentUser.role === 'member' ? currentUser.rank : currentUser.role.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200">
                    <X size={24} />
                </button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-4 p-4 justify-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <button onClick={toggleNotifications} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${showNotifications ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    <div className="relative">
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
                    </div>
                    <span className="text-[10px] font-bold uppercase">Avisos</span>
                </button>
                <button onClick={toggleTheme} className="flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="text-[10px] font-bold uppercase">Tema</span>
                </button>
            </div>

            {/* Notifications Panel inside Drawer */}
            {showNotifications ? (
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
                     <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell size={16} /> Notificações</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleClearNotifications} className="text-xs text-green-600 dark:text-green-400 font-bold uppercase flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                <CheckCheck size={12} /> Marcar Lidas
                            </button>
                        )}
                     </div>
                     <div className="space-y-3">
                        {currentUser.notifications.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <Bell size={48} className="mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500">Nada novo por aqui.</p>
                            </div>
                        ) : (
                            currentUser.notifications.map(note => (
                                <div key={note.id} className={`p-4 rounded-xl border transition-all ${!note.read ? 'bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-500/30 shadow-sm' : 'bg-gray-100 dark:bg-gray-900 border-transparent opacity-70'}`}>
                                     <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-sm ${!note.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{note.title}</h4>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{new Date(note.date).toLocaleDateString()}</span>
                                     </div>
                                     <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{note.message}</p>
                                </div>
                            ))
                        )}
                     </div>
                </div>
            ) : (
                /* Menu List */
                <div className="flex-1 overflow-y-auto p-4 pb-24">
                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="mb-6">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">{category}</h3>
                            <div className="space-y-2">
                                {items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleMobileNav(item.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-98
                                            ${activeTab === item.id 
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                <item.icon size={20} />
                                            </div>
                                            <span className="font-bold text-sm">{item.label}</span>
                                        </div>
                                        <ChevronRight size={16} className={activeTab === item.id ? 'text-white/70' : 'text-gray-300 dark:text-gray-600'} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
    </>
  );
};
