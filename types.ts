
export enum WindRank {
  BREEZE = "Brisa",
  GUST = "Rajada",
  GALE = "Ventania",
  STORM = "Tempestade",
  HURRICANE = "Furacão",
  TORNADO = "Tornado"
}

export type PlanType = 'basic' | 'pro';

export interface RoutePoint {
  lat: number;
  lng: number;
  altitude?: number | null; // Altitude em metros
  speed?: number | null; // Velocidade em m/s
  timestamp: number;
}

export type WorkoutMode = 'walk' | 'jog' | 'run' | 'sprint' | 'long_run' | 'recovery';

export interface Activity {
  id: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  pace: string; // min/km formato "5'30""
  elevationGain?: number; // Metros subidos
  calories?: number; // Kcal gastas
  maxSpeed?: number; // km/h
  notes: string;
  feeling: 'great' | 'good' | 'hard' | 'pain';
  route?: RoutePoint[]; // Rota GPS gravada
  shoeId?: string; // Tênis usado
  mode?: WorkoutMode; // Modalidade do treino
}

export interface Shoe {
  id: string;
  brand: string;
  model: string;
  currentKm: number;
  maxKm: number; // Vida útil estimada (ex: 800km)
  imageUrl?: string;
  status: 'active' | 'retired';
  nickname?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionType: 'distance_single' | 'total_distance' | 'pace' | 'streak';
  threshold: number; // Km, Segundos (para pace) ou Dias (para streak)
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  prizeDescription: string;
  prizeImageUrl: string;
}

export interface Season {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  sponsors: Sponsor[];
  isActive: boolean;
}

// --- SAAS FEATURES TYPES ---

export interface TrainingPlan {
  id: string;
  createdAt: string;
  goal: string;
  durationWeeks: number;
  content: string; // Markdown content from AI
  status: 'active' | 'completed' | 'archived';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'achievement';
  read: boolean;
  date: string;
}

export interface ConnectedApp {
  id: 'strava' | 'garmin' | 'polar' | 'apple';
  name: string;
  connected: boolean;
  lastSync?: string;
}

export interface Member {
  id: string;
  name: string;
  password?: string; // New password field
  gender: 'male' | 'female'; 
  role: 'super_admin' | 'admin' | 'member'; 
  plan: PlanType; 
  proExpiresAt?: string; 
  bio?: string; 
  location?: string;
  weight?: number; // kg
  height?: number; // cm
  totalDistance: number;
  seasonScore: number; 
  rank: WindRank;
  avatarUrl: string;
  activities: Activity[];
  achievements: string[]; 
  followers: string[]; 
  following: string[]; 
  currentGoal?: string; 
  
  // New Fields
  activePlan?: TrainingPlan;
  notifications: Notification[];
  connectedApps?: ConnectedApp[];
  shoes: Shoe[]; 
}

export interface Challenge {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  targetKm: number;
  participants: string[]; // IDs of members
  startDate: string; // Data de início para calcular progresso
  endDate: string;
}

export interface TeamStats {
  totalKm: number;
  activeMembers: number;
  upcomingRace: string;
  daysToRace: number;
}

export interface RaceEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  distances: string[]; // e.g. ["5km", "10km"]
}

export interface Story {
  id: string;
  authorName: string;
  authorRank: WindRank;
  title: string;
  content: string;
  date: string;
  likes: number;
  imageUrl?: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetDistance?: number; // km
  rewardXP: number; // Pontos fictícios de evolução
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  channel: 'geral' | 'elites' | 'longao' | 'iniciantes';
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string; // ISO String
  read: boolean;
}

export interface Track {
    title: string;
    artist: string;
    coverUrl: string;
    duration: number; // seconds
}

// Sound System Type
export type SoundType = 'click' | 'success' | 'start' | 'error' | 'toggle' | 'hero';
