
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Clapperboard, Loader2, Download, AlertTriangle, Film, Sparkles } from 'lucide-react';

export const MarketingStudio: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState('');
  const [hasKey, setHasKey] = useState(false);

  // Check API Key for Veo
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for dev environments without the specific window object
        setHasKey(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(await window.aistudio.hasSelectedApiKey());
    }
  };

  const generateVideo = async () => {
    if (!hasKey) {
      await handleSelectKey();
      if (!await window.aistudio.hasSelectedApiKey()) return;
    }

    setLoading(true);
    setVideoUri(null);
    setProgressStatus('Inicializando o diretor de arte IA...');

    try {
      // Re-initialize to ensure fresh key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        A high-energy, cinematic welcome video for a running team app called "Filhos do Vento".
        Visual Style: Dark mode aesthetic, neon amber and orange lighting, fast-paced cuts.
        Content:
        1. Close up of running shoes hitting asphalt with sparks (amber light).
        2. HUD graphics overlay showing: "Pace: 3:45/km", "Rank: TORNADO", "XP: +500".
        3. A diverse group of runners sprinting along the Rio de Janeiro coastline (Aterro do Flamengo) at sunset.
        4. Digital wind effects swirling around the runners.
        5. Final shot: The text "FILHOS DO VENTO" glowing in neon amber against a dark background.
        Atmosphere: Intense, motivating, futuristic, gamified.
      `;

      setProgressStatus('Enviando roteiro para o modelo VEO...');

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      const updateProgress = () => {
        const messages = [
            "Renderizando geometria 3D dos corredores...",
            "Calculando física do vento...",
            "Aplicando paleta de cores Amber & Dark...",
            "Gerando sobreposições de gamificação...",
            "Finalizando renderização cinematográfica..."
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setProgressStatus(randomMsg);
      };

      const interval = setInterval(updateProgress, 3000);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      clearInterval(interval);
      setProgressStatus('Download do vídeo finalizado.');

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
          // Fetch with key to display
          const finalUri = `${downloadLink}&key=${process.env.API_KEY}`;
          setVideoUri(finalUri);
      }

    } catch (error) {
      console.error(error);
      setProgressStatus('Erro na produção do vídeo.');
      if (String(error).includes("Requested entity was not found")) {
         // Reset key if invalid
         setHasKey(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20">
                <Film size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Estúdio VEO</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Geração de vídeo IA para Landing Page</p>
            </div>
        </div>
        {!hasKey && (
             <button onClick={handleSelectKey} className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full font-bold border border-amber-200 dark:border-amber-500/30">
                 Conectar API Paga
             </button>
        )}
      </div>

      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        
        {!videoUri && !loading && (
            <div className="text-center max-w-lg">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clapperboard size={40} className="text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Criar Trailer da Temporada</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Utilize o modelo <strong>Veo 3.1</strong> para gerar um vídeo de 1080p apresentando a equipe, com efeitos visuais de vento, HUD de gamificação e estética dark/amber.
                </p>
                <button 
                    onClick={generateVideo}
                    className="group relative px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white dark:text-gray-900 font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                >
                    <Sparkles size={20} className="animate-pulse" />
                    Gerar Vídeo Promocional
                </button>
                <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <AlertTriangle size={12} /> Requer chave de API com faturamento ativo.
                </p>
            </div>
        )}

        {loading && (
            <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                    <Loader2 size={40} className="absolute inset-0 m-auto text-amber-500 animate-pulse" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white animate-pulse">Produzindo...</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono">{progressStatus}</p>
            </div>
        )}

        {videoUri && (
            <div className="w-full max-w-3xl animate-fade-in">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 group">
                    <video 
                        src={videoUri} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex justify-between items-center mt-6">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Trailer Gerado</h4>
                        <p className="text-xs text-green-500 font-bold uppercase">1080p • Veo 3.1 • Pronto</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={generateVideo}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Gerar Novo
                        </button>
                        <a 
                            href={videoUri} 
                            download="filhos_do_vento_promo.mp4"
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-white dark:text-gray-900 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            <Download size={18} /> Download
                        </a>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
