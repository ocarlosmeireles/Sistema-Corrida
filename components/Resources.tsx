
import React, { useState, useEffect, useRef } from 'react';
import { Utensils, Lightbulb, ChevronDown, ChevronUp, Search, Zap, Droplets, Wheat, Calculator, Timer, Activity, Lock, Crown, Music2, HeartPulse, Scale, Footprints, Trash2, Plus, TrendingUp, Gauge } from 'lucide-react';
import { getNutritionAdvice } from '../services/geminiService';
import { Member, Shoe } from '../types';
import { ProGate } from './ProGate';

type ResourceTab = 'tips' | 'nutrition' | 'tools' | 'garage';

interface ResourcesProps {
    currentUser: Member;
    onUpdateUser?: (member: Member) => void;
}

export const Resources: React.FC<ResourcesProps> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<ResourceTab>('tips');
  const userPlan = currentUser.plan;
  
  // Nutrition AI State
  const [nutriQuery, setNutriQuery] = useState('');
  const [nutriAnswer, setNutriAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Garage State
  const [isAddingShoe, setIsAddingShoe] = useState(false);
  const [newShoe, setNewShoe] = useState<Partial<Shoe>>({ brand: '', model: '', currentKm: 0, maxKm: 800 });

  // Tools - Pace Calculator
  const [calcDist, setCalcDist] = useState('');
  const [calcTime, setCalcTime] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // Tools - Race Predictor
  const [predDist, setPredDist] = useState('5'); // km input
  const [predTime, setPredTime] = useState(''); // min input
  const [predictions, setPredictions] = useState<{dist: string, time: string}[] | null>(null);

  // Tools - Speed Converter (NEW)
  const [speedKmh, setSpeedKmh] = useState('');
  const [speedPace, setSpeedPace] = useState('');

  // Tools - HR Zones (NEW)
  const [age, setAge] = useState('');
  const [hrZones, setHrZones] = useState<{zone: string, range: string}[] | null>(null);

  // Tools - BMI (IMC)
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiResult, setBmiResult] = useState<string | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string | null>(null);

  // Metronome State
  const [bpm, setBpm] = useState(180);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm); 

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Hydration State
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [hydrationResult, setHydrationResult] = useState<string | null>(null);

  // Tips Data
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const tipsData = [
    {
      title: "Respiração Eficiente",
      content: "Tente manter uma respiração rítmica. Um padrão comum é 2:2 (inspira por 2 passos, expira por 2 passos). Isso mantém um fluxo constante de oxigênio para seus músculos."
    },
    {
      title: "Cadência Ideal (180 BPM)",
      content: "Aumentar sua cadência para perto de 180 passos por minuto reduz o impacto nas articulações e melhora a eficiência. Use nosso Metrônomo na aba Ferramentas."
    },
    {
      title: "Ciclo de Vida do Tênis",
      content: "Tênis de corrida duram entre 600km e 800km. Após isso, o amortecimento perde eficácia, aumentando risco de lesão. Use a aba Garagem para controlar."
    },
    {
      title: "Aerodinâmica & Postura",
      content: "Mantenha a postura ereta e relaxe os ombros. Imagine que o vento está te empurrando para frente. Evite cruzar os braços na frente do corpo."
    },
    {
      title: "Recuperação Ativa",
      content: "Após treinos intensos, faça um trote leve ou caminhada no dia seguinte para ajudar a limpar o ácido lático e soltar a musculatura."
    }
  ];

  // --- HANDLERS ---

  const handleNutriSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userPlan === 'basic') return;
    if (!nutriQuery.trim()) return;
    setLoading(true);
    const answer = await getNutritionAdvice(nutriQuery);
    setNutriAnswer(answer);
    setLoading(false);
  };

  const calculatePace = () => {
    const d = parseFloat(calcDist);
    const t = parseFloat(calcTime);
    if(d > 0 && t > 0) {
        const paceDec = t / d;
        const min = Math.floor(paceDec);
        const sec = Math.round((paceDec - min) * 60);
        setCalcResult(`${min}'${sec < 10 ? '0' : ''}${sec}" /km`);
    }
  };

  const calculatePredictions = () => {
      const d1 = parseFloat(predDist);
      const t1Min = parseFloat(predTime);
      
      if(d1 > 0 && t1Min > 0) {
          const predict = (distTarget: number) => {
             const t2Min = t1Min * Math.pow((distTarget / d1), 1.06);
             const h = Math.floor(t2Min / 60);
             const m = Math.floor(t2Min % 60);
             const s = Math.round((t2Min - Math.floor(t2Min)) * 60);
             return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          };

          setPredictions([
              { dist: '10 km', time: predict(10) },
              { dist: '21 km', time: predict(21.097) },
              { dist: '42 km', time: predict(42.195) },
          ]);
      }
  };

  const convertSpeed = (kmhStr: string) => {
      setSpeedKmh(kmhStr);
      const kmh = parseFloat(kmhStr);
      if (kmh > 0) {
          const minPerKm = 60 / kmh;
          const min = Math.floor(minPerKm);
          const sec = Math.round((minPerKm - min) * 60);
          setSpeedPace(`${min}'${sec < 10 ? '0' : ''}${sec}"`);
      } else {
          setSpeedPace('');
      }
  };

  const calculateHRZones = () => {
      const userAge = parseFloat(age);
      if (userAge > 0) {
          const maxHR = 220 - userAge;
          setHrZones([
              { zone: 'Z1 (Recuperação)', range: `${Math.round(maxHR * 0.50)} - ${Math.round(maxHR * 0.60)} bpm` },
              { zone: 'Z2 (Aeróbico Leve)', range: `${Math.round(maxHR * 0.60)} - ${Math.round(maxHR * 0.70)} bpm` },
              { zone: 'Z3 (Aeróbico Mod)', range: `${Math.round(maxHR * 0.70)} - ${Math.round(maxHR * 0.80)} bpm` },
              { zone: 'Z4 (Limiar)', range: `${Math.round(maxHR * 0.80)} - ${Math.round(maxHR * 0.90)} bpm` },
              { zone: 'Z5 (Máximo)', range: `${Math.round(maxHR * 0.90)} - ${Math.round(maxHR)} bpm` },
          ]);
      }
  };

  const calculateBMI = () => {
      const w = parseFloat(bmiWeight);
      const h = parseFloat(bmiHeight);
      
      if (w > 0 && h > 0) {
          const heightM = h / 100; // Convert cm to m
          const bmi = w / (heightM * heightM);
          setBmiResult(bmi.toFixed(1));
          
          if (bmi < 18.5) setBmiCategory('Abaixo do Peso');
          else if (bmi < 24.9) setBmiCategory('Peso Normal');
          else if (bmi < 29.9) setBmiCategory('Sobrepeso');
          else setBmiCategory('Obesidade');
      }
  };

  const handleAddShoe = () => {
      if(newShoe.brand && newShoe.model && onUpdateUser) {
          const shoe: Shoe = {
              id: Date.now().toString(),
              brand: newShoe.brand,
              model: newShoe.model,
              currentKm: parseFloat(String(newShoe.currentKm)) || 0,
              maxKm: parseFloat(String(newShoe.maxKm)) || 800,
              status: 'active',
              imageUrl: 'https://cdn-icons-png.flaticon.com/512/2553/2553658.png'
          };
          const updatedUser = { ...currentUser, shoes: [...currentUser.shoes, shoe] };
          onUpdateUser(updatedUser);
          setIsAddingShoe(false);
          setNewShoe({ brand: '', model: '', currentKm: 0, maxKm: 800 });
      }
  };

  const handleDeleteShoe = (id: string) => {
      if(onUpdateUser && window.confirm("Aposentar este tênis?")) {
          const updatedUser = { ...currentUser, shoes: currentUser.shoes.filter(s => s.id !== id) };
          onUpdateUser(updatedUser);
      }
  };

  const toggleMetronome = async () => {
      if (isPlaying) {
          if(timerIDRef.current) window.clearTimeout(timerIDRef.current);
          setIsPlaying(false);
      } else {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
          nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
          setIsPlaying(true);
          scheduler();
      }
  };

  const scheduleNote = (time: number) => {
      if (!audioContextRef.current) return;
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      osc.frequency.value = 1000;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start(time);
      osc.stop(time + 0.05);
  };

  const scheduler = () => {
      while (nextNoteTimeRef.current < audioContextRef.current!.currentTime + 0.1) {
          scheduleNote(nextNoteTimeRef.current);
          const secondsPerBeat = 60.0 / bpmRef.current;
          nextNoteTimeRef.current += secondsPerBeat;
      }
      timerIDRef.current = window.setTimeout(scheduler, 25);
  };

  const calculateHydration = () => {
      const w = parseFloat(weight);
      const d = parseFloat(duration);
      if (w > 0 && d > 0) {
          const baseDaily = w * 35;
          const activityLoss = (d / 60) * 800;
          const total = Math.round(baseDaily + activityLoss);
          setHydrationResult(`${(total/1000).toFixed(2)} Litros`);
      }
  };

  useEffect(() => {
      return () => {
          if(timerIDRef.current) window.clearTimeout(timerIDRef.current);
          if(audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  // Nutrition Component with conditional ProGate
  const NutritionContent = (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-green-200 dark:border-green-500/30 shadow-lg animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
            <Utensils className="text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nutri-Vento AI</h3>
        </div>
        <form onSubmit={handleNutriSearch} className="relative mb-6">
            <input type="text" value={nutriQuery} onChange={(e) => setNutriQuery(e.target.value)} placeholder="Pergunte sobre alimentação..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-4 pr-12 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
            <button type="submit" disabled={loading || !nutriQuery} className="absolute right-2 top-2 p-1.5 bg-green-500 text-white rounded-lg"><Search size={20} /></button>
        </form>
        {loading && <div className="text-center text-green-500 animate-pulse">Consultando...</div>}
        {nutriAnswer && !loading && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{nutriAnswer}</div>
        )}
    </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Arsenal do Atleta</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Ferramentas de precisão para performance.</p>
        </div>
      </div>

      {/* Custom Tab Switcher */}
      <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('tips')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'tips' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Lightbulb size={16} /> Dicas
        </button>
        <button
          onClick={() => setActiveTab('garage')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'garage' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Footprints size={16} /> Garagem
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'tools' ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calculator size={16} /> Ferramentas
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'nutrition' ? 'bg-green-500 dark:bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {userPlan === 'basic' && <Lock size={14} className="mr-1 opacity-70" />}
          <Utensils size={16} /> Nutrição
        </button>
      </div>

      {/* CONTENT: TIPS */}
      {activeTab === 'tips' && (
        <div className="space-y-4 animate-fade-in">
          {tipsData.map((tip, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setExpandedTip(expandedTip === index ? null : index)}
                className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="font-bold text-gray-900 dark:text-white">{tip.title}</span>
                {expandedTip === index ? <ChevronUp className="text-amber-500" /> : <ChevronDown className="text-gray-400" />}
              </button>
              {expandedTip === index && (
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-700/50 pt-4">
                  {tip.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CONTENT: GARAGE (SHOES) */}
      {activeTab === 'garage' && (
          <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white">Meus Tênis</h3>
                  <button onClick={() => setIsAddingShoe(!isAddingShoe)} className="text-xs flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg font-bold">
                      <Plus size={14} /> Adicionar
                  </button>
              </div>

              {isAddingShoe && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <input type="text" placeholder="Marca (ex: Nike)" value={newShoe.brand} onChange={e => setNewShoe({...newShoe, brand: e.target.value})} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 outline-none text-sm dark:text-white" />
                          <input type="text" placeholder="Modelo (ex: Pegasus 40)" value={newShoe.model} onChange={e => setNewShoe({...newShoe, model: e.target.value})} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 outline-none text-sm dark:text-white" />
                          <input type="number" placeholder="Km Atual" value={newShoe.currentKm} onChange={e => setNewShoe({...newShoe, currentKm: parseFloat(e.target.value)})} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 outline-none text-sm dark:text-white" />
                          <input type="number" placeholder="Vida Útil (padrão 800)" value={newShoe.maxKm} onChange={e => setNewShoe({...newShoe, maxKm: parseFloat(e.target.value)})} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-700 outline-none text-sm dark:text-white" />
                      </div>
                      <button onClick={handleAddShoe} className="w-full bg-amber-500 text-white font-bold py-2 rounded-lg">Salvar Tênis</button>
                  </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                  {currentUser.shoes.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-8">Nenhum tênis cadastrado. Adicione seus equipamentos para controlar o desgaste.</p>
                  ) : (
                      currentUser.shoes.map(shoe => {
                          const percentage = Math.min(100, (shoe.currentKm / shoe.maxKm) * 100);
                          const isWornOut = percentage >= 100;
                          const isWarning = percentage >= 80 && !isWornOut;

                          return (
                              <div key={shoe.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 relative overflow-hidden">
                                  {isWornOut && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold uppercase rounded-bl-lg z-10">Aposentar</div>}
                                  
                                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Footprints className="text-gray-400" size={32} />
                                  </div>
                                  
                                  <div className="flex-1">
                                      <h4 className="font-bold text-gray-900 dark:text-white">{shoe.brand} {shoe.model}</h4>
                                      <div className="flex justify-between text-xs text-gray-500 mb-1 mt-1">
                                          <span>{shoe.currentKm} km</span>
                                          <span>{shoe.maxKm} km</span>
                                      </div>
                                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                          <div 
                                              className={`h-full rounded-full transition-all duration-500 ${isWornOut ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                              style={{ width: `${percentage}%` }}
                                          />
                                      </div>
                                  </div>
                                  
                                  <button onClick={() => handleDeleteShoe(shoe.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      )}

      {/* CONTENT: TOOLS */}
      {activeTab === 'tools' && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* HR Zones Calculator */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-lg text-red-600 dark:text-red-400">
                        <HeartPulse size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zonas de FC</h3>
                </div>
                <div className="flex gap-4 mb-4">
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Sua Idade" />
                    <button onClick={calculateHRZones} className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 rounded-xl transition-colors">Calcular</button>
                </div>
                {hrZones && (
                    <div className="space-y-2 mt-4">
                        {hrZones.map((zone, i) => (
                            <div key={i} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-gray-700 dark:text-gray-300">{zone.zone}</span>
                                <span className="font-mono text-red-500">{zone.range}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Speed Converter */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Gauge size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Velocidade ↔ Pace</h3>
                </div>
                <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Velocidade (km/h)</label>
                    <input type="number" value={speedKmh} onChange={(e) => convertSpeed(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="ex: 10.5" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-xl text-center">
                    <span className="text-xs text-gray-500 uppercase font-bold">Pace Estimado</span>
                    <div className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{speedPace || "--'--\""}/km</div>
                </div>
            </div>

            {/* BMI Calculator (NEW) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-teal-100 dark:bg-teal-500/20 p-2 rounded-lg text-teal-600 dark:text-teal-400">
                        <Scale size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Calculadora IMC</h3>
                </div>
                <div className="flex gap-4 mb-4">
                     <input type="number" value={bmiWeight} onChange={(e) => setBmiWeight(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Peso (kg)" />
                     <input type="number" value={bmiHeight} onChange={(e) => setBmiHeight(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Altura (cm)" />
                </div>
                <button onClick={calculateBMI} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl mb-4 transition-colors">Calcular</button>
                {bmiResult && (
                    <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-xl text-center">
                        <div className="text-2xl font-mono font-bold text-teal-600 dark:text-teal-400">{bmiResult}</div>
                        <div className={`text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded inline-block ${
                            bmiCategory === 'Peso Normal' ? 'bg-green-100 text-green-700' : 
                            bmiCategory === 'Sobrepeso' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                        }`}>{bmiCategory}</div>
                    </div>
                )}
            </div>

            {/* 1. Race Predictor */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg text-purple-600 dark:text-purple-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Previsão de Prova</h3>
                        <p className="text-xs text-gray-500">Baseado no método Riegel.</p>
                    </div>
                </div>
                
                <div className="flex gap-4 mb-4">
                     <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Distância Base (km)</label>
                        <select value={predDist} onChange={e => setPredDist(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white">
                            <option value="3">3 km</option>
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="21.097">21 km</option>
                        </select>
                     </div>
                     <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Seu Tempo (min)</label>
                        <input type="number" value={predTime} onChange={e => setPredTime(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white outline-none" placeholder="Ex: 25" />
                     </div>
                </div>
                <button onClick={calculatePredictions} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl mb-4 transition-colors">Calcular Previsões</button>
                
                {predictions && (
                    <div className="grid grid-cols-3 gap-2">
                        {predictions.map((p, i) => (
                            <div key={i} className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">{p.dist}</p>
                                <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">{p.time}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Cadence Metronome */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-pink-100 dark:bg-pink-500/20 p-2 rounded-lg text-pink-600 dark:text-pink-400">
                        <Music2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Metrônomo</h3>
                </div>
                <div className="text-center mb-4">
                    <div className="text-5xl font-black text-gray-900 dark:text-white mb-1">{bpm}</div>
                    <div className="text-xs uppercase font-bold text-gray-500 tracking-widest">BPM</div>
                </div>
                <input type="range" min="120" max="220" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 mb-4" />
                <button onClick={toggleMetronome} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-pink-500 text-white hover:bg-pink-600'}`}>
                    {isPlaying ? 'Parar' : 'Iniciar'}
                </button>
            </div>

            {/* 3. Pace Calculator */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <Timer size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Calc Pace</h3>
                </div>
                <div className="flex gap-4 mb-4">
                     <input type="number" value={calcDist} onChange={(e) => setCalcDist(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Km" />
                     <input type="number" value={calcTime} onChange={(e) => setCalcTime(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Min" />
                </div>
                <button onClick={calculatePace} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl mb-4 transition-colors">Calcular</button>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-xl text-center">
                    <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">{calcResult || "--'--\""}</div>
                </div>
            </div>

            {/* 4. Hydration */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-cyan-100 dark:bg-cyan-500/20 p-2 rounded-lg text-cyan-600 dark:text-cyan-400">
                        <Droplets size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hidratação</h3>
                </div>
                <div className="flex gap-4 mb-4">
                     <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Peso (kg)" />
                     <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm dark:text-white outline-none" placeholder="Treino (min)" />
                </div>
                <button onClick={calculateHydration} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-xl mb-4 transition-colors">Calcular</button>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-xl text-center">
                    <div className="text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-400">{hydrationResult || "-- L"}</div>
                </div>
            </div>
        </div>
      )}

      {/* CONTENT: NUTRITION */}
      {activeTab === 'nutrition' && (
        userPlan === 'basic' ? (
             <ProGate 
                featureName="Nutri-Vento AI"
                description="Consultoria nutricional instantânea focada em performance e recuperação para corredores."
                onUpgradeRequest={() => alert("Solicite upgrade ao administrador na aba Equipe.")}
             >
                {NutritionContent}
             </ProGate>
        ) : (
            NutritionContent
        )
      )}
    </div>
  );
};
