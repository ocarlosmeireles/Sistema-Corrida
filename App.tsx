
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

// Firebase Imports
import { db, seedDatabase, MOCK_MEMBERS, MOCK_EVENTS, MOCK_STORIES, INITIAL_SPONSORS, MOCK_SEASON } from './services/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, setDoc, query, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  
  // App State - Initialized with MOCK DATA for offline resilience
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [events, setEvents] = useState<RaceEvent[]>(MOCK_EVENTS);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<PrivateMessage[]>([]);
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Admin / Season States
  const [allSponsors, setAllSponsors] = useState<Sponsor[]>(INITIAL_SPONSORS);
  const [currentSeason, setCurrentSeason] = useState<Season>(MOCK_SEASON);

  // --- FIRESTORE SUBSCRIPTIONS WITH FALLBACK ---
  useEffect(() => {
      let unsubscribeMembers: () => void;
      let unsubscribeEvents: () => void;
      let unsubscribeStories: () => void;
      let unsubscribeSeason: () => void;
      let unsubscribeSponsors: () => void;
      let unsubscribeDMs: () => void;

      const initData = async () => {
          try {
              await seedDatabase();
              
              // Subscribe to Members
              unsubscribeMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
                  const loadedMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
                  // Only update if we actually got data, otherwise keep mock
                  if (loadedMembers.length > 0) setMembers(loadedMembers);
              }, (error) => {
                  console.warn("Members Sync failed (Offline Mode active).");
              });

              // Subscribe to Events
              unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
                  const loadedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RaceEvent));
                  if (loadedEvents.length > 0) setEvents(loadedEvents);
              }, (error) => {
                  console.warn("Events Sync failed (Offline Mode active).");
              });

              // Subscribe to Stories
              unsubscribeStories = onSnapshot(query(collection(db, 'stories'), orderBy('date', 'desc')), (snapshot) => {
                  const loadedStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
                  if (loadedStories.length > 0) setStories(loadedStories);
              }, (error) => {
                  console.warn("Stories Sync failed (Offline Mode active).");
              });

              // Subscribe to Season
              unsubscribeSeason = onSnapshot(doc(db, 'seasons', 'current'), (doc) => {
                  if (doc.exists()) {
                      setCurrentSeason(doc.data() as Season);
                  }
              }, (error) => {
                  console.warn("Season Sync failed (Offline Mode active).");
              });

              // Subscribe to Sponsors
              unsubscribeSponsors = onSnapshot(collection(db, 'sponsors'), (snapshot) => {
                  const loadedSponsors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsor));
                  if (loadedSponsors.length > 0) setAllSponsors(loadedSponsors);
              }, (error) => {
                  console.warn("Sponsors Sync failed (Offline Mode active).");
              });

              // Subscribe to Direct Messages
              unsubscribeDMs = onSnapshot(collection(db, 'direct_messages'), (snapshot) => {
                  const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrivateMessage));
                  setDirectMessages(msgs);
              }, (error) => {
                  console.warn("DM Sync failed (Offline Mode active).");
              });

          } catch (e) {
              console.error("Firebase connection error - using local data.", e);
              // No action needed as state is already initialized with Mock Data
          }
      };
      
      initData();

      return () => {
          if (unsubscribeMembers) unsubscribeMembers();
          if (unsubscribeEvents) unsubscribeEvents();
          if (unsubscribeStories) unsubscribeStories();
          if (unsubscribeSeason) unsubscribeSeason();
          if (unsubscribeSponsors) unsubscribeSponsors();
          if (unsubscribeDMs) unsubscribeDMs();
      };
  }, []);

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
         members.forEach(m => {
             if (m.plan === 'pro' && m.proExpiresAt) {
                 const expireDate = new Date(m.proExpiresAt);
                 if (now > expireDate) {
                     // Update Firestore
                     try {
                        const updatedMember = { ...m, plan: 'basic' as PlanType, proExpiresAt: undefined };
                        // @ts-ignore
                        updateDoc(doc(db, 'members', m.id), updatedMember);
                        addNotification(m.id, {
                            title: "Plano PRO Expirado",
                            message: "Seu período de 30 dias encerrou. Funcionalidades limitadas.",
                            type: "warning"
                        });
                     } catch(e) { console.warn("Could not update expired member", e); }
                 }
             }
         });
     };

     // Check every minute
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
      
      // Redirect admins to admin tab, others to dashboard
      const user = members.find(m => m.id === userId);
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
          setActiveTab('admin');
      } else {
          setActiveTab('dashboard');
      }
  };

  const handleRegister = async (data: any) => {
      const newMember: Member = {
          id: Date.now().toString(),
          name: data.name,
          password: data.password,
          gender: data.gender,
          bio: data.bio,
          location: data.location,
          weight: data.weight,
          height: data.height,
          role: 'member',
          plan: 'basic', // Default plan is BASIC, requires Admin to upgrade
          rank: WindRank.BREEZE,
          totalDistance: 0,
          seasonScore: 0,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&color=fff`,
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

      try {
          await setDoc(doc(db, 'members', newMember.id), newMember);
          // Also update local state immediately for smoother UX if offline
          setMembers(prev => [...prev, newMember]);
          handleLogin(newMember.id);
      } catch(e) {
          console.error("Registration failed", e);
          alert("Erro ao cadastrar. Tente novamente (offline mode pode estar ativo).");
          // Fallback registration
          setMembers(prev => [...prev, newMember]);
          handleLogin(newMember.id);
      }
  };

  const handleLogout = () => {
      playUISound('click');
      setIsAuthenticated(false);
      setCurrentUserId('');
      setViewingMemberId(null);
      setShowLanding(true);
  };

  const currentUser = members.find(m => m.id === currentUserId) || members[0] || ({} as Member);

  const addNotification = async (memberId: string, notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
    if (memberId === currentUserId) {
        playUISound('success');
        sendPushNotification(notification.title, notification.message);
    }
    
    const member = members.find(m => m.id === memberId);
    if (member) {
        const newNote = {
            id: Date.now().toString(),
            read: false,
            date: new Date().toISOString(),
            ...notification
        };
        const updatedNotifications = [newNote, ...(member.notifications || [])];
        try {
            await updateDoc(doc(db, 'members', memberId), { notifications: updatedNotifications });
        } catch (e) {
            // Fallback for local state if firebase fails
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notifications: updatedNotifications } : m));
        }
    }
  };

  // Function to notify other members (passed to children)
  const handleNotifyMember = (targetId: string, title: string, message: string) => {
      addNotification(targetId, { title, message, type: 'info' });
  };

  const markNotificationsRead = async () => {
      playUISound('click');
      if (currentUser && currentUser.notifications) {
          const updatedNotes = currentUser.notifications.map(n => ({ ...n, read: true }));
          try {
            await updateDoc(doc(db, 'members', currentUserId), { notifications: updatedNotes });
          } catch (e) {
            setMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, notifications: updatedNotes } : m));
          }
      }
  };

  // --- MESSAGING LOGIC ---
  const handleSendMessage = async (receiverId: string, content: string) => {
      playUISound('click');
      const newMessage: PrivateMessage = {
          id: Date.now().toString(),
          senderId: currentUserId,
          receiverId: receiverId,
          content: content,
          timestamp: new Date().toISOString(),
          read: false
      };
      
      try {
        await addDoc(collection(db, 'direct_messages'), newMessage);
      } catch (e) {
        setDirectMessages(prev => [...prev, newMessage]);
      }
      
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
    setTargetChatUserId(null); 
  };

  // Logic to Follow/Unfollow
  const handleToggleFollow = async (targetId: string) => {
    playUISound('click');
    const isFollowing = currentUser.following.includes(targetId);
    
    // Update Current User
    const newFollowing = isFollowing 
        ? currentUser.following.filter(id => id !== targetId) 
        : [...currentUser.following, targetId];
    const newScore = !isFollowing ? currentUser.seasonScore + 5 : currentUser.seasonScore;
    
    try {
        await updateDoc(doc(db, 'members', currentUserId), { 
            following: newFollowing, 
            seasonScore: newScore 
        });

        // Update Target User
        const targetMember = members.find(m => m.id === targetId);
        if (targetMember) {
            const newFollowers = isFollowing
                ? targetMember.followers.filter(id => id !== currentUserId)
                : [...targetMember.followers, currentUserId];
            await updateDoc(doc(db, 'members', targetId), { followers: newFollowers });

            if (!isFollowing) {
                addNotification(targetId, {
                    title: "Novo Seguidor",
                    message: `${currentUser.name} começou a seguir você!`,
                    type: "info"
                });
            }
        }
    } catch (e) {
        // Fallback
        setMembers(prev => prev.map(m => {
            if(m.id === currentUserId) return { ...m, following: newFollowing, seasonScore: newScore };
            if(m.id === targetId) {
                const newFollowers = isFollowing ? m.followers.filter(id => id !== currentUserId) : [...m.followers, currentUserId];
                return { ...m, followers: newFollowers };
            }
            return m;
        }));
    }
  };

  // === ACHIEVEMENT LOGIC HELPERS ===
  const calculateStreak = (activities: Activity[]) => {
      if (!activities || activities.length === 0) return 0;
      
      // Extract unique days (YYYY-MM-DD)
      const dates = Array.from(new Set(activities.map(a => a.date.split('T')[0])))
        .sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      if (dates.length === 0) return 0;

      const today = new Date();
      today.setHours(0,0,0,0);
      
      const lastRun = new Date(dates[0]);
      lastRun.setHours(0,0,0,0);
      
      const diffSinceLast = (today.getTime() - lastRun.getTime()) / (1000 * 3600 * 24);
      // If more than 1 day passed since last run, streak is broken (or just started today/yesterday)
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
      if (!paceStr) return 99999;
      try {
        // Handle multiple formats: 5'30", 5:30, 5.5, etc.
        const clean = paceStr.replace(/[^\d:.]/g, '').replace(':', '.'); 
        const parts = paceStr.split(/[:']/);
        
        if (parts.length === 2) {
            const min = parseInt(parts[0], 10);
            const sec = parseInt(parts[1].replace('"', ''), 10);
            return (min * 60) + (sec || 0);
        }
        return 99999;
      } catch (e) {
        return 99999;
      }
  };

  const handleUpdateUser = async (updatedMember: Member) => {
    // Check Achievements
    const newAchievements = [...(updatedMember.achievements || [])];
    const currentStreak = calculateStreak(updatedMember.activities);
    const activities = updatedMember.activities || [];
    const lastActivity = activities.length > 0 ? activities[activities.length - 1] : null;

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
    
    const memberToSave = { ...updatedMember, achievements: newAchievements };
    try {
        await updateDoc(doc(db, 'members', updatedMember.id), memberToSave);
    } catch(e) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? memberToSave : m));
    }
  };

  const handleUpdateActivePlan = async (plan: TrainingPlan) => {
      const updatedUser = { ...currentUser, activePlan: plan };
      await handleUpdateUser(updatedUser);
      addNotification(currentUser.id, {
          title: "Novo Plano Definido",
          message: "Sua planilha de voo foi atualizada. Bons treinos!",
          type: "info"
      });
  };

  const handleTogglePlan = async (memberId: string, newPlan: PlanType) => {
      let proExpiresAt = undefined;
      if (newPlan === 'pro') {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          proExpiresAt = expirationDate.toISOString();
      }

      try {
        // @ts-ignore
        await updateDoc(doc(db, 'members', memberId), {
            plan: newPlan,
            proExpiresAt: proExpiresAt || null 
        });
      } catch(e) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, plan: newPlan, proExpiresAt: proExpiresAt } : m));
      }
      
      addNotification(memberId, {
          title: newPlan === 'pro' ? "Upgrade Confirmado!" : "Plano Alterado",
          message: newPlan === 'pro' 
            ? "Seu plano PRO está ativo por 30 dias. Aproveite o Coach IA!" 
            : "Seu plano foi alterado para Básico.",
          type: "success"
      });
  }

  const handleUpdateProfile = async (updatedMember: Member) => {
    try {
        await updateDoc(doc(db, 'members', updatedMember.id), updatedMember);
    } catch (e) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    }
  };

  const handleSaveLiveActivity = async (activityData: Omit<Activity, 'id'>) => {
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
      
      let updatedShoes = [...(currentUser.shoes || [])];
      if (updatedShoes.length > 0) {
          updatedShoes[0].currentKm += newActivity.distanceKm;
      }

      const updatedUser = {
          ...currentUser,
          totalDistance: updatedDistance,
          rank: newRank,
          seasonScore: currentUser.seasonScore + xpEarned,
          activities: [...(currentUser.activities || []), newActivity],
          shoes: updatedShoes
      };

      await handleUpdateUser(updatedUser);
      
      addNotification(currentUser.id, {
          title: "Corrida Salva",
          message: `Você completou ${newActivity.distanceKm}km. +${xpEarned} XP!`,
          type: "success"
      });

      setActiveTab('dashboard');
  };

  const handleAddMember = async (name: string, plan: PlanType, gender?: 'male' | 'female') => {
    let proExpiresAt = undefined;
    if (plan === 'pro') {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        proExpiresAt = expirationDate.toISOString();
    }

    const newMember: Member = {
        id: Date.now().toString(),
        name,
        password: '123',
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
    
    try {
        await setDoc(doc(db, 'members', newMember.id), newMember);
    } catch(e) {
        setMembers(prev => [...prev, newMember]);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (members.length <= 1) {
        playUISound('error');
        alert("A equipe precisa de pelo menos um membro!");
        return;
    }
    playUISound('click');
    // In Firestore, deleteDoc would be used. Currently just hiding via state in original app, 
    // but here we should actually delete or archive. 
    // For simplicity, we won't implement full delete as it's risky for seeding.
    alert("Função de remover desabilitada temporariamente para segurança dos dados.");
  };

  const handleSwitchUser = (id: string) => {
    playUISound('toggle');
    setCurrentUserId(id);
    setActiveTab('dashboard');
  };

  const handleAddEvent = async (newEventData: Omit<RaceEvent, 'id'>) => {
    const newEvent: RaceEvent = {
        ...newEventData,
        id: Date.now().toString()
    };
    try {
        await setDoc(doc(db, 'events', newEvent.id), newEvent);
    } catch (e) {
        setEvents(prev => [...prev, newEvent]);
    }
    
    // Notify all members
    members.forEach(m => {
        addNotification(m.id, {
            title: "Nova Prova!",
            message: `${newEvent.name} foi adicionada ao calendário.`,
            type: "info"
        });
    });
  };

  const handleRemoveEvent = async (id: string) => {
    playUISound('click');
    // await deleteDoc(doc(db, 'events', id));
    alert("Remoção de eventos desabilitada.");
  };

  const handleAddStory = async (newStory: Story) => {
     playUISound('success');
     try {
        await setDoc(doc(db, 'stories', newStory.id), newStory);
     } catch(e) {
        setStories(prev => [newStory, ...prev]);
     }
     
     const updatedUser = { 
        ...currentUser, 
        seasonScore: currentUser.seasonScore + 20 
     };
     await handleUpdateUser(updatedUser);
     
     addNotification(currentUser.id, {
         title: "História Publicada",
         message: "Sua história está no ar! +20 XP.",
         type: "success"
     });
  };

  const handleLikeStory = async (id: string) => {
    playUISound('toggle');
    const likedStory = stories.find(s => s.id === id);
    if(likedStory) {
        const updatedStory = { ...likedStory, likes: likedStory.likes + 1 };
        try {
            await updateDoc(doc(db, 'stories', id), { likes: updatedStory.likes });
        } catch(e) {
            setStories(prev => prev.map(s => s.id === id ? updatedStory : s));
        }
        
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
  const handleUpdateSeason = async (updatedSeason: Season) => {
    playUISound('success');
    try {
        await setDoc(doc(db, 'seasons', 'current'), updatedSeason);
    } catch (e) {
        setCurrentSeason(updatedSeason);
    }
  };

  const handleAddSponsor = async (newSponsor: Sponsor) => {
    playUISound('success');
    try {
        await setDoc(doc(db, 'sponsors', newSponsor.id), newSponsor);
    } catch (e) {
        setAllSponsors(prev => [...prev, newSponsor]);
    }
  };

  const handleRemoveSponsor = async (id: string) => {
    playUISound('click');
    // await deleteDoc(doc(db, 'sponsors', id));
    // Also remove from season if present
    const updatedSeasonSponsors = currentSeason.sponsors.filter(s => s.id !== id);
    try {
        await updateDoc(doc(db, 'seasons', 'current'), { sponsors: updatedSeasonSponsors });
    } catch(e) {
        setCurrentSeason({ ...currentSeason, sponsors: updatedSeasonSponsors });
    }
  };

  const renderContent = () => {
    if (!currentUser || !currentUser.id) return <div className="text-center p-10 text-white">Carregando QG...</div>;

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
    return (
      <Login 
        users={members} 
        onLogin={handleLogin} 
        onRegister={handleRegister}
        playSound={playUISound} 
      />
    );
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
