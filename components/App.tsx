
import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { DinoCoach } from './components/DinoCoach';
import { TeamManager } from './components/TeamManager';
import { Resources } from './components/Resources';
import { Events } from './components/Events';
import { LandingPage } from './components/LandingPage';
import { Community } from './components/Community';
import { Achievements, ACHIEVEMENTS_LIST } from './components/Achievements';
import { TrainingPlanGenerator } from './components/TrainingPlanGenerator';
import { LiveRun } from './components/LiveRun';
import { Seasons } from './components/Seasons';
import { UserProfile } from './components/UserProfile';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { Member, WindRank, RaceEvent, Activity, Season, Sponsor, Story, PlanType, Notification, TrainingPlan, PrivateMessage, SoundType } from './types';

// Mock Data Initialization
const MOCK_MEMBERS: Member[] = [
  {
    id: '0',
    name: 'ZEUS (Super Admin)',
    password: '123',
    gender: 'male',
    role: 'super_admin', // SUPER ADMIN
    plan: 'pro',
    proExpiresAt: '2099-12-31T23:59:59.999Z', // Lifetime
    bio: 'Controlando os ventos.',
    location: 'Olimpo, RJ',
    rank: WindRank.TORNADO,
    totalDistance: 9999.9,
    seasonScore: 9999, 
    avatarUrl: 'https://ui-avatars.com/api/?name=Zeus&background=000&color=fff',
    achievements: [],
    activities: [],
    followers: [],
    following: [],
    notifications: [],
    shoes: []
  },
  {
    id: '1',
    name: 'Carlos Admin',
    password: '123',
    gender: 'male',
    role: 'admin', // ADMIN
    plan: 'pro',
    proExpiresAt: '2025-12-31T23:59:59.999Z',
    bio: 'Correndo contra o relógio, um dia de cada vez.',
    location: 'Copacabana, RJ',
    rank: WindRank.BREEZE,
    totalDistance: 32.5,
    seasonScore: 450, // XP
    avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Admin&background=random',
    achievements: ['first_run', '5k_runner'],
    activities: [
      { id: 'a1', date: '2023-10-20', distanceKm: 5.0, durationMin: 30, pace: "6'00\"", notes: 'Trote leve no Aterro do Flamengo', feeling: 'good' },
      { id: 'a2', date: '2023-10-22', distanceKm: 7.5, durationMin: 45, pace: "6'00\"", notes: 'Chuva na Lagoa', feeling: 'hard' },
    ],
    followers: ['2', '3'],
    following: ['2'],
    notifications: [],
    shoes: [
        { id: 's1', brand: 'Nike', model: 'Pegasus 40', currentKm: 350, maxKm: 800, status: 'active', imageUrl: '' },
        { id: 's2', brand: 'Adidas', model: 'Adizero SL', currentKm: 120, maxKm: 600, status: 'active', imageUrl: '' }
    ]
  },
  {
    id: '2',
    name: 'Sarah Ventania',
    password: '123',
    gender: 'female',
    role: 'member',
    plan: 'pro',
    proExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias restantes
    bio: 'Viciada em endorfina. Maratona sub 4h loading...',
    location: 'Leblon, RJ',
    rank: WindRank.GALE,
    totalDistance: 180.2,
    seasonScore: 1250, // XP
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Ventania&background=random',
    achievements: ['first_run', '5k_runner', '10k_runner', 'veteran'],
    activities: [],
    followers: ['1', '3', '4'],
    following: ['1', '3'],
    notifications: [],
    connectedApps: [{ id: 'strava', name: 'Strava', connected: true }],
    shoes: []
  },
  {
    id: '3',
    name: 'Mike Furacão',
    password: '123',
    gender: 'male',
    role: 'member',
    plan: 'basic',
    bio: 'Treinador e amante da velocidade. Se não for pra suar, nem vou.',
    location: 'Barra, RJ',
    rank: WindRank.HURRICANE,
    totalDistance: 620.5,
    seasonScore: 890, // XP
    avatarUrl: 'https://ui-avatars.com/api/?name=Mike+Furacao&background=random',
    achievements: ['first_run', 'veteran', '21k_runner'],
    activities: [],
    followers: ['1', '2'],
    following: ['4'],
    notifications: [],
    shoes: []
  },
  {
    id: '4',
    name: 'Ana Rajada',
    password: '123',
    gender: 'female',
    role: 'member',
    plan: 'basic',
    bio: 'Começando agora mas com foco total!',
    location: 'Botafogo, RJ',
    rank: WindRank.GUST,
    totalDistance: 85.0,
    seasonScore: 600, // XP
    avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Rajada&background=random',
    achievements: ['first_run', '5k_runner'],
    activities: [],
    followers: [],
    following: ['2'],
    notifications: [],
    shoes: []
  }
];

const MOCK_EVENTS: RaceEvent[] = [
  {
    id: '1',
    name: 'Circuito das Estações',
    date: '2025-08-25',
    location: 'Aterro do Flamengo, RJ',
    distances: ['5km', '10km']
  },
  {
    id: '2',
    name: 'Maratona do Rio',
    date: '2025-06-22',
    location: 'Aterro do Flamengo, RJ',
    distances: ['21km', '42km']
  },
  {
    id: '3',
    name: 'Desafio da Serra',
    date: '2025-09-10',
    location: 'Petrópolis, RJ',
    distances: ['16km', '32km']
  }
];

const MOCK_STORIES: Story[] = [
  {
    id: '1',
    authorName: 'Carlos "Furacão" Silva',
    authorRank: WindRank.HURRICANE,
    title: 'Superando a Lesão no Joelho',
    content: 'Há 6 meses, achei que nunca mais correria. Mas com o apoio da equipe Filhos do Vento e fortalecimento, hoje completei meus primeiros 10km sem dor na Lagoa! A persistência é o segredo.',
    date: '2023-10-24',
    likes: 15
  },
  {
    id: '2',
    authorName: 'Ana Maria',
    authorRank: WindRank.GUST,
    title: 'Minha primeira prova oficial',
    content: 'Sempre tive vergonha de correr em público. O grupo me incentivou a me inscrever na Maratona do Rio. O frio na barriga foi grande, mas cruzar a linha de chegada no Aterro foi indescritível.',
    date: '2023-10-20',
    likes: 28
  }
];

const INITIAL_SPONSORS: Sponsor[] = [
  {
      id: 'sp1',
      name: 'ASICS',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Asics_Logo.svg/2560px-Asics_Logo.svg.png',
      prizeDescription: 'Tênis Novablast 3',
      prizeImageUrl: 'https://images.asics.com/is/image/asics/1011B458_400_SR_RT_GLB?$zoom$'
  },
  {
      id: 'sp2',
      name: 'Gatorade',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Gatorade_logo.svg/1200px-Gatorade_logo.svg.png',
      prizeDescription: 'Kit Hidratação Mensal',
      prizeImageUrl: 'https://m.media-amazon.com/images/I/71wM2VvB1zL._AC_SX679_.jpg'
  },
  {
      id: 'sp3',
      name: 'Águas Prata',
      logoUrl: 'https://encrypted-tbn0.gstatic.com/images/q=tbn:ANd9GcQ6yP6d8hTfoiQ82uW_jQ8-r_K-l95tF4T0hA&s',
      prizeDescription: 'Suprimento de Água Mineral',
      prizeImageUrl: 'https://www.aguasprata.com.br/wp-content/uploads/2020/09/garrafa-agua-mineral-prata.png'
  },
  {
      id: 'sp4',
      name: 'Super Mercado Zona Sul',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Zona_Sul_Supermercados_Logo.png',
      prizeDescription: 'Vale Compras Saudável R$ 500',
      prizeImageUrl: 'https://zonasul.vtexassets.com/assets/vtex.file-manager-graphql/images/8ad5c452-e97f-4f06-9073-27d1b09a2e83___655b084b61c128341697550d9b62a24a.jpg'
  }
];

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  
  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [events, setEvents] = useState<RaceEvent[]>(MOCK_EVENTS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null); // For deep linking to chat
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Admin / Season States
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  const [currentSeason, setCurrentSeason] = useState<Season>({
    id: 's1',
    title: 'Temporada Verão 2025',
    description: 'O calor do Rio não perdoa, mas a recompensa é doce. Acumule XP correndo e interagindo para ganhar prêmios exclusivos dos nossos parceiros.',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    isActive: true,
    sponsors: [INITIAL_SPONSORS[0], INITIAL_SPONSORS[1]]
  });

  // --- PUSH NOTIFICATIONS ---
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const sendPushNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      try {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2553/2553658.png' });
      } catch (e) {
        console.error("Push error", e);
      }
    }
  };

  // --- SOUND ENGINE ---
  const playUISound = (type: SoundType) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        
        // Resume if suspended (common in browsers)
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.06);
                break;
            case 'toggle':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'success':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.1, now + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.2);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'start': // Futuristic Power Up
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.1, now + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                break;
            case 'hero': // Login/Welcome sound
                // Chord
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now); // A4
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(554.37, now); // C#5
                gain2.gain.setValueAtTime(0.1, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                
                osc.start(now);
                osc2.start(now);
                osc.stop(now + 1.5);
                osc2.stop(now + 1.5);
                break;
        }
    } catch (e) {
        console.error("Audio Engine Error", e);
    }
  };

  // Theme Logic
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // PRO PLAN Expiration Check
  useEffect(() => {
     const checkProExpiration = () => {
         const now = new Date();
         const updatedMembers = members.map(m => {
             if (m.plan === 'pro' && m.proExpiresAt) {
                 const expireDate = new Date(m.proExpiresAt);
                 if (now > expireDate) {
                     addNotification(m.id, {
                         title: "Plano PRO Expirado",
                         message: "Seu período de 30 dias encerrou. Funcionalidades limitadas.",
                         type: "warning"
                     });
                     return { ...m, plan: 'basic' as PlanType, proExpiresAt: undefined };
                 }
             }
             return m;
         });
         const changed = JSON.stringify(updatedMembers) !== JSON.stringify(members);
         if (changed) setMembers(updatedMembers);
     };

     checkProExpiration();
     const interval = setInterval(checkProExpiration, 60000);
     return () => clearInterval(interval);
  }, [members]); 

  const toggleTheme = () => {
    playUISound('toggle');
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auth Handler
  const handleLogin = (userId: string) => {
      playUISound('hero');
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      
      // Request notification permission on login
      if ("Notification" in window && Notification.permission !== "granted") {
          Notification.requestPermission();
      }
      
      const user = members.find(m => m.id === userId);
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
  };

  const handleLogout = () => {
      playUISound('click');
      setIsAuthenticated(false);
      setCurrentUserId('');
      setViewingMemberId(null);
      setShowLanding(true);
  };

  const currentUserIndex = members.findIndex(m => m.id === currentUserId);
  const currentUser = currentUserIndex !== -1 ? members[currentUserIndex] : members[0];

  const addNotification = (memberId: string, notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
    if (memberId === currentUserId) {
        // Only play sound if notification is for current user
        playUISound('success');
        // Push Notification
        sendPushNotification(notification.title, notification.message);
    }
    setMembers(prevMembers => prevMembers.map(m => {
        if (m.id === memberId) {
            return {
                ...m,
                notifications: [
                    {
                        id: Date.now().toString(),
                        read: false,
                        date: new Date().toISOString(),
                        ...notification
                    },
                    ...m.notifications
                ]
            };
        }
        return m;
    }));
  };

  // Function to notify other members (passed to children)
  const handleNotifyMember = (targetId: string, title: string, message: string) => {
      addNotification(targetId, { title, message, type: 'info' });
  };

  const markNotificationsRead = () => {
      playUISound('click');
      const updatedUser = { ...currentUser, notifications: currentUser.notifications.map(n => ({ ...n, read: true })) };
      handleUpdateUser(updatedUser);
  };

  // --- MESSAGING LOGIC ---
  const handleSendMessage = (receiverId: string, content: string) => {
      playUISound('click');
      const newMessage: PrivateMessage = {
          id: Date.now().toString(),
          senderId: currentUserId,
          receiverId: receiverId,
          content: content,
          timestamp: new Date().toISOString(),
          read: false
      };
      setDirectMessages([...directMessages, newMessage]);
      
      // Notify Receiver
      const sender = members.find(m => m.id === currentUserId);
      addNotification(receiverId, {
          title: "Nova Mensagem Privada",
          message: `${sender?.name || 'Alguém'}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
          type: "info"
      });
  };

  const handleOpenChat = (userId: string) => {
      playUISound('click');
      setViewingMemberId(null);
      setTargetChatUserId(userId);
      setActiveTab('community');
  };

  // Navigation Logic
  const handleViewProfile = (memberId: string) => {
    playUISound('click');
    setViewingMemberId(memberId);
  };

  const handleTabChange = (tab: string) => {
    playUISound('click');
    setActiveTab(tab);
    setViewingMemberId(null);
    setTargetChatUserId(null); // Reset chat target on tab change
  };

  // Logic to Follow/Unfollow
  const handleToggleFollow = (targetId: string) => {
    playUISound('click');
    const isFollowing = currentUser.following.includes(targetId);
    const targetMember = members.find(m => m.id === targetId);

    const updatedMembers = members.map(m => {
        if (m.id === currentUser.id) {
            return {
                ...m,
                seasonScore: !isFollowing ? m.seasonScore + 5 : m.seasonScore,
                following: isFollowing 
                    ? m.following.filter(id => id !== targetId) 
                    : [...m.following, targetId]
            };
        }
        if (m.id === targetId) {
            return {
                ...m,
                followers: isFollowing 
                    ? m.followers.filter(id => id !== currentUser.id) 
                    : [...m.followers, currentUser.id]
            };
        }
        return m;
    });
    setMembers(updatedMembers);

    if (!isFollowing && targetMember) {
        addNotification(targetId, {
            title: "Novo Seguidor",
            message: `${currentUser.name} começou a seguir você!`,
            type: "info"
        });
    }
  };

  // === ACHIEVEMENT LOGIC HELPERS ===
  const calculateStreak = (activities: Activity[]) => {
      if (activities.length === 0) return 0;
      const dates = Array.from(new Set(activities.map(a => a.date)))
        .sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      if (dates.length === 0) return 0;

      const today = new Date();
      today.setHours(0,0,0,0);
      
      const lastRun = new Date(dates[0]);
      lastRun.setHours(0,0,0,0);
      
      const diffSinceLast = (today.getTime() - lastRun.getTime()) / (1000 * 3600 * 24);
      if (diffSinceLast > 1) return 0; 

      streak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i+1]);
        curr.setHours(0,0,0,0);
        prev.setHours(0,0,0,0);
        
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24);
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
      }
      return streak;
  };

  const getPaceInSeconds = (paceStr: string) => {
      try {
        const clean = paceStr.replace('"', '').replace("'", ':');
        const [min, sec] = clean.split(':').map(Number);
        return (min * 60) + (sec || 0);
      } catch (e) {
        return 99999;
      }
  };

  const handleUpdateUser = (updatedMember: Member) => {
    const newMembers = [...members];
    const index = newMembers.findIndex(m => m.id === updatedMember.id);
    
    if (index !== -1) {
        const newAchievements = [...updatedMember.achievements];
        const currentStreak = calculateStreak(updatedMember.activities);
        const lastActivity = updatedMember.activities[updatedMember.activities.length - 1];

        ACHIEVEMENTS_LIST.forEach(ach => {
            if (!newAchievements.includes(ach.id)) {
                let unlocked = false;
                if (ach.conditionType === 'total_distance' && updatedMember.totalDistance >= ach.threshold) unlocked = true;
                if (ach.conditionType === 'distance_single' && lastActivity && lastActivity.distanceKm >= ach.threshold) unlocked = true;
                if (ach.conditionType === 'pace' && lastActivity) {
                    const activityPaceSec = getPaceInSeconds(lastActivity.pace);
                    if (activityPaceSec > 0 && activityPaceSec <= ach.threshold) unlocked = true;
                }
                if (ach.conditionType === 'streak' && currentStreak >= ach.threshold) unlocked = true;

                if (unlocked) {
                    newAchievements.push(ach.id);
                    addNotification(updatedMember.id, {
                        title: "Conquista Desbloqueada!",
                        message: `Você alcançou: ${ach.title}`,
                        type: "achievement"
                    });
                }
            }
        });
        
        newMembers[index] = { ...updatedMember, achievements: newAchievements };
        setMembers(newMembers);
    }
  };

  const handleUpdateActivePlan = (plan: TrainingPlan) => {
      const updatedUser = { ...currentUser, activePlan: plan };
      handleUpdateUser(updatedUser);
      addNotification(currentUser.id, {
          title: "Novo Plano Definido",
          message: "Sua planilha de voo foi atualizada. Bons treinos!",
          type: "info"
      });
  };

  const handleTogglePlan = (memberId: string, newPlan: PlanType) => {
      let proExpiresAt = undefined;
      if (newPlan === 'pro') {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          proExpiresAt = expirationDate.toISOString();
      }

      const updatedMembers = members.map(m => {
        if (m.id === memberId) {
            return { 
                ...m, 
                plan: newPlan,
                proExpiresAt: proExpiresAt
            };
        }
        return m;
      });
      
      setMembers(updatedMembers);
      addNotification(memberId, {
          title: newPlan === 'pro' ? "Upgrade Confirmado!" : "Plano Alterado",
          message: newPlan === 'pro' 
            ? "Seu plano PRO está ativo por 30 dias. Aproveite o Coach IA!" 
            : "Seu plano foi alterado para Básico.",
          type: "success"
      });
  }

  const handleUpdateProfile = (updatedMember: Member) => {
    setMembers(prevMembers => 
      prevMembers.map(m => m.id === updatedMember.id ? updatedMember : m)
    );
  };

  const handleSaveLiveActivity = (activityData: Omit<Activity, 'id'>) => {
      const newActivity: Activity = {
          id: Date.now().toString(),
          ...activityData
      };

      const updatedDistance = currentUser.totalDistance + newActivity.distanceKm;
      let newRank = currentUser.rank;
      if (updatedDistance > 50) newRank = WindRank.GUST;
      if (updatedDistance > 150) newRank = WindRank.GALE;
      if (updatedDistance > 300) newRank = WindRank.STORM;
      if (updatedDistance > 600) newRank = WindRank.HURRICANE;
      if (updatedDistance > 1000) newRank = WindRank.TORNADO;

      let xpEarned = Math.round(newActivity.distanceKm * 10);
      if (newActivity.distanceKm >= 5) xpEarned += 50;
      
      let updatedShoes = [...currentUser.shoes];
      if (updatedShoes.length > 0) {
          updatedShoes[0].currentKm += newActivity.distanceKm;
      }

      handleUpdateUser({
          ...currentUser,
          totalDistance: updatedDistance,
          rank: newRank,
          seasonScore: currentUser.seasonScore + xpEarned,
          activities: [...currentUser.activities, newActivity],
          shoes: updatedShoes
      });
      
      addNotification(currentUser.id, {
          title: "Corrida Salva",
          message: `Você completou ${newActivity.distanceKm}km. +${xpEarned} XP!`,
          type: "success"
      });

      setActiveTab('dashboard');
  };

  const handleAddMember = (name: string, plan: PlanType, gender?: 'male' | 'female') => {
    let proExpiresAt = undefined;
    if (plan === 'pro') {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        proExpiresAt = expirationDate.toISOString();
    }

    const newMember: Member = {
        id: Date.now().toString(),
        name,
        password: '123', // Default password
        gender: gender || 'male',
        role: 'member',
        plan: plan, 
        proExpiresAt: proExpiresAt,
        rank: WindRank.BREEZE,
        totalDistance: 0,
        seasonScore: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        achievements: [],
        activities: [],
        followers: [],
        following: [],
        notifications: [{
            id: Date.now().toString(),
            title: "Bem-vindo!",
            message: "Sua jornada nos Filhos do Vento começou.",
            type: "success",
            read: false,
            date: new Date().toISOString()
        }],
        shoes: []
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
        playUISound('error');
        alert("A equipe precisa de pelo menos um membro!");
        return;
    }
    playUISound('click');
    setMembers(members.filter(m => m.id !== id));
    if (currentUserId === id) handleLogout();
  };

  const handleSwitchUser = (id: string) => {
    playUISound('toggle');
    setCurrentUserId(id);
    setActiveTab('dashboard');
  };

  const handleAddEvent = (newEventData: Omit<RaceEvent, 'id'>) => {
    const newEvent: RaceEvent = {
        ...newEventData,
        id: Date.now().toString()
    };
    setEvents([...events, newEvent]);
    members.forEach(m => {
        addNotification(m.id, {
            title: "Nova Prova!",
            message: `${newEvent.name} foi adicionada ao calendário.`,
            type: "info"
        });
    });
  };

  const handleRemoveEvent = (id: string) => {
    playUISound('click');
    setEvents(events.filter(e => e.id !== id));
  };

  const handleAddStory = (newStory: Story) => {
     playUISound('success');
     setStories([newStory, ...stories]);
     const updatedUser = { 
        ...currentUser, 
        seasonScore: currentUser.seasonScore + 20 
     };
     handleUpdateUser(updatedUser);
     addNotification(currentUser.id, {
         title: "História Publicada",
         message: "Sua história está no ar! +20 XP.",
         type: "success"
     });
  };

  const handleLikeStory = (id: string) => {
    playUISound('toggle');
    const likedStory = stories.find(s => s.id === id);
    if(likedStory) {
         setStories(stories.map(story => 
            story.id === id ? { ...story, likes: story.likes + 1 } : story
        ));
        
        const author = members.find(m => m.name === likedStory.authorName);
        if (author && author.id !== currentUser.id) {
            addNotification(author.id, {
                title: "Nova Curtida",
                message: `${currentUser.name} curtiu sua história "${likedStory.title}".`,
                type: "info"
            });
        }
    }
  };

  // --- Upgrade Request Handler ---
  const handleRequestUpgrade = () => {
    playUISound('click');
    const admins = members.filter(m => m.role === 'admin' || m.role === 'super_admin');
    admins.forEach(admin => {
        addNotification(admin.id, {
            title: "Solicitação de Upgrade",
            message: `O atleta ${currentUser.name} deseja assinar o Plano PRO.`,
            type: "info"
        });
    });

    addNotification(currentUser.id, {
        title: "Solicitação Enviada",
        message: "O administrador recebeu seu pedido. Aguarde contato.",
        type: "success"
    });

    alert("Solicitação enviada ao Admin com sucesso!");
    if(showLanding) setShowLanding(false);
  };

  // --- Admin Handlers ---
  const handleUpdateSeason = (updatedSeason: Season) => {
    playUISound('success');
    setCurrentSeason(updatedSeason);
  };

  const handleAddSponsor = (newSponsor: Sponsor) => {
    playUISound('success');
    setAllSponsors([...allSponsors, newSponsor]);
  };

  const handleRemoveSponsor = (id: string) => {
    playUISound('click');
    setAllSponsors(allSponsors.filter(s => s.id !== id));
    const updatedSeasonSponsors = currentSeason.sponsors.filter(s => s.id !== id);
    setCurrentSeason({ ...currentSeason, sponsors: updatedSeasonSponsors });
  };

  const renderContent = () => {
    if (viewingMemberId) {
        const memberToView = members.find(m => m.id === viewingMemberId);
        if (memberToView) {
            return (
                <UserProfile 
                    member={memberToView} 
                    currentUser={currentUser} 
                    onBack={() => setViewingMemberId(null)} 
                    onToggleFollow={handleToggleFollow}
                    onUpdateProfile={handleUpdateProfile}
                    onOpenChat={() => handleOpenChat(memberToView.id)}
                    onLogout={memberToView.id === currentUser.id ? handleLogout : undefined}
                    playSound={playUISound}
                />
            );
        }
    }

    switch (activeTab) {
      case 'dashboard':
        return (
            <Dashboard 
                currentUser={currentUser} 
                season={currentSeason}
                events={events}
                teamMembers={members}
                latestStory={stories[0]}
                onUpdateUser={handleUpdateUser} 
                isDark={theme === 'dark'} 
                onNavigate={(tab) => handleTabChange(tab)}
                playSound={playUISound}
            />
        );
      case 'run':
        return (
            <LiveRun 
                onSaveActivity={handleSaveLiveActivity} 
                addNotification={(n) => addNotification(currentUser.id, n)}
                currentUser={currentUser}
                playSound={playUISound}
            />
        );
      case 'season':
        return <Seasons season={currentSeason} members={members} onViewLeaderboard={() => setActiveTab('leaderboard')} />;
      case 'plans':
        return (
            <TrainingPlanGenerator 
                currentUser={currentUser}
                onSavePlan={handleUpdateActivePlan} 
            />
        );
      case 'activity':
        return (
             <Dashboard 
                currentUser={currentUser} 
                season={currentSeason}
                events={events}
                teamMembers={members}
                latestStory={stories[0]}
                onUpdateUser={handleUpdateUser} 
                isDark={theme === 'dark'} 
                onNavigate={(tab) => handleTabChange(tab)}
                playSound={playUISound}
            />
        );
      case 'leaderboard':
        return <Leaderboard members={members} onMemberClick={handleViewProfile} />;
      case 'achievements':
        return <Achievements unlockedIds={currentUser.achievements} />;
      case 'events':
        return <Events events={events} onAddEvent={handleAddEvent} onRemoveEvent={handleRemoveEvent} currentUser={currentUser} />;
      case 'community':
        return (
            <Community 
                stories={stories} 
                currentUser={currentUser} 
                members={members}
                onAddStory={handleAddStory} 
                onLikeStory={handleLikeStory}
                directMessages={directMessages}
                onSendMessage={handleSendMessage}
                initialChatTargetId={targetChatUserId}
                onNotifyMember={handleNotifyMember}
            />
        );
      case 'team':
        return (
            <TeamManager 
                members={members} 
                currentUserId={currentUserId}
                onAddMember={handleAddMember}
                onSwitchUser={handleSwitchUser}
                onRemoveMember={handleRemoveMember}
                onViewProfile={handleViewProfile}
                onTogglePlan={handleTogglePlan}
            />
        );
      case 'resources':
        return <Resources currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
      case 'coach':
        return <DinoCoach member={currentUser} userPlan={currentUser.plan} />;
      case 'admin':
        if (currentUser.role === 'member') return (
            <div className="flex items-center justify-center h-full text-gray-500">Acesso Restrito</div>
        );
        return (
            <AdminPanel 
                currentSeason={currentSeason}
                allSponsors={allSponsors}
                onUpdateSeason={handleUpdateSeason}
                onAddSponsor={handleAddSponsor}
                onRemoveSponsor={handleRemoveSponsor}
            />
        );
      default:
        return (
            <Dashboard 
                currentUser={currentUser} 
                season={currentSeason}
                events={events}
                teamMembers={members}
                latestStory={stories[0]}
                onUpdateUser={handleUpdateUser} 
                isDark={theme === 'dark'} 
                onNavigate={(tab) => handleTabChange(tab)}
                playSound={playUISound}
            />
        );
    }
  };

  if (showLanding) {
    return (
        <LandingPage 
            onEnter={() => { playUISound('start'); setShowLanding(false); }} 
            toggleTheme={toggleTheme} 
            isDark={theme === 'dark'} 
            onUpgradeRequest={handleRequestUpgrade}
        />
    );
  }

  if (!isAuthenticated) {
    return <Login users={members} onLogin={handleLogin} playSound={playUISound} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        toggleTheme={toggleTheme} 
        isDark={theme === 'dark'} 
        currentUser={currentUser} 
        onMarkNotificationsRead={markNotificationsRead}
        onViewProfile={(id) => handleViewProfile(id)}
      />
      <main className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 pb-32 md:pb-12">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
