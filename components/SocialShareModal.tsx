
import React, { useState, useRef } from 'react';
import { Wind, Share2, X, Image as ImageIcon, Download, Loader2, LayoutTemplate, Zap, Type, Circle, Sun, Grid, Film, Eye, EyeOff } from 'lucide-react';
import html2canvas from 'html2canvas';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    distance: string;
    time: string;
    pace: string;
  };
}

type TemplateType = 'classic' | 'minimal' | 'cyber' | 'poster' | 'sunset' | 'data' | 'vhs';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, data }) => {
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [template, setTemplate] = useState<TemplateType>('classic');
  
  // Data Toggles
  const [showDistance, setShowDistance] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showPace, setShowPace] = useState(true);
  const [showDate, setShowDate] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setShareImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const generateImage = async (): Promise<Blob | null> => {
      if (!cardRef.current) return null;
      setIsGenerating(true);
      try {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const canvas = await html2canvas(cardRef.current, {
              useCORS: true,
              scale: 2, 
              backgroundColor: null,
              logging: false
          });
          return new Promise((resolve) => {
              canvas.toBlob((blob) => {
                  setIsGenerating(false);
                  resolve(blob);
              }, 'image/png');
          });
      } catch (error) {
          console.error("Error creating image", error);
          setIsGenerating(false);
          return null;
      }
  };

  const handleShare = async () => {
      const blob = await generateImage();
      if (!blob) {
          alert("Erro ao gerar imagem. Tente novamente.");
          return;
      }

      if (navigator.share) {
          const file = new File([blob], 'treino-filhos-do-vento.png', { type: 'image/png' });
          try {
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                      files: [file],
                      title: 'Meu Treino - Filhos do Vento',
                      text: `Acabei de correr ${data.distance} com o app Filhos do Vento!`
                  });
              } else {
                  throw new Error("Sharing files not supported");
              }
          } catch (error) {
              console.log('Native sharing failed, trying download fallback', error);
              handleDownload(blob);
          }
      } else {
          handleDownload(blob);
      }
  };

  const handleDownload = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `filhos-do-vento-treino.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- RENDER TEMPLATES ---

  const renderTemplateContent = () => {
      const today = new Date().toLocaleDateString('pt-BR');

      switch (template) {
          case 'minimal':
              return (
                  <div className="absolute inset-0 p-8 flex flex-col justify-between z-10 text-black">
                      <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-black tracking-tighter drop-shadow-sm italic text-white mix-blend-difference">FDV RUN</h2>
                          {showDate && (
                              <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                                  {today}
                              </div>
                          )}
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20">
                          <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-4">
                              {showDistance && (
                                  <div>
                                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Distância</span>
                                      <div className="text-6xl font-black tracking-tighter leading-none">{data.distance.split(' ')[0]}<span className="text-2xl">km</span></div>
                                  </div>
                              )}
                              <Wind size={32} className="text-black mb-2 ml-auto" />
                          </div>
                          <div className="flex justify-between text-sm font-bold">
                              {showTime && (
                                  <div>
                                      <span className="block text-[10px] text-gray-500 uppercase">Tempo</span>
                                      {data.time}
                                  </div>
                              )}
                              {showPace && (
                                  <div className="text-right ml-auto">
                                      <span className="block text-[10px] text-gray-500 uppercase">Pace</span>
                                      {data.pace}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              );

          case 'cyber':
              return (
                  <>
                    <div className="absolute inset-0 border-[12px] border-green-400/80 z-20 pointer-events-none"></div>
                    <div className="absolute inset-0 p-6 flex flex-col justify-center items-center z-10 bg-black/40">
                        <div className="text-center mb-8">
                            <Wind size={48} className="text-green-400 mx-auto mb-2 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                            <h2 className="text-green-400 font-black text-3xl uppercase tracking-widest drop-shadow-md font-mono">MISSION<br/>COMPLETE</h2>
                        </div>
                        
                        {showDistance && (
                            <div className="text-center space-y-2 mb-8">
                                <div className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] italic transform -skew-x-12">
                                    {data.distance.split(' ')[0]}
                                </div>
                                <div className="text-3xl font-bold text-green-400 uppercase tracking-widest bg-black/80 px-4 py-1 transform -skew-x-12 inline-block border border-green-400/50">
                                    KM
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-12 w-full px-12 flex justify-between text-white font-mono text-xl font-bold drop-shadow-md">
                            {showTime && <span>{data.time}</span>}
                            {showTime && showPace && <span className="text-green-400">|</span>}
                            {showPace && <span>{data.pace}</span>}
                        </div>
                        {showDate && <div className="absolute top-6 right-6 text-green-400 font-mono text-xs">{today}</div>}
                    </div>
                  </>
              );

          case 'poster':
              return (
                  <div className="absolute inset-0 p-6 flex flex-col justify-center items-center z-10">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
                      
                      <div className="relative z-10 w-full h-full border-4 border-white flex flex-col justify-between p-4">
                          <div className="text-center border-b border-white pb-4">
                              <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Filhos<br/>do Vento</h2>
                              {showDate && <p className="text-white text-xs mt-2 tracking-[0.5em]">{today}</p>}
                          </div>

                          {showDistance && (
                              <div className="text-center my-auto">
                                  <div className="text-[10rem] leading-none font-black text-white opacity-90 mix-blend-overlay">
                                      {data.distance.split(' ')[0]}
                                  </div>
                                  <div className="text-4xl font-bold text-white uppercase tracking-[0.5em] -mt-4">KM</div>
                              </div>
                          )}

                          <div className="flex justify-between border-t border-white pt-4 text-white font-bold text-xl uppercase">
                              {showTime && <span>{data.time}</span>}
                              {showPace && <span>{data.pace}</span>}
                          </div>
                      </div>
                  </div>
              );

          case 'sunset':
              return (
                  <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-purple-500/30 to-black/80 mix-blend-overlay"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>

                      <div className="relative flex justify-between items-start">
                          <div className="text-orange-400 drop-shadow-md">
                              <Sun size={40} />
                          </div>
                          {showDate && <div className="text-white/80 text-sm font-bold uppercase tracking-widest">{today}</div>}
                      </div>

                      <div className="relative text-right space-y-2">
                          {showDistance && (
                              <div>
                                  <h1 className="text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                                      {data.distance.split(' ')[0]}
                                  </h1>
                                  <span className="text-orange-400 text-2xl font-bold uppercase tracking-widest">Quilômetros</span>
                              </div>
                          )}
                          
                          <div className="flex justify-end gap-6 mt-4">
                              {showTime && (
                                  <div className="text-center">
                                      <div className="text-xs text-gray-400 uppercase">Tempo</div>
                                      <div className="text-2xl font-bold text-white">{data.time}</div>
                                  </div>
                              )}
                              {showPace && (
                                  <div className="text-center">
                                      <div className="text-xs text-gray-400 uppercase">Pace</div>
                                      <div className="text-2xl font-bold text-white">{data.pace}</div>
                                  </div>
                              )}
                          </div>
                      </div>
                      
                      <div className="relative text-center">
                          <p className="text-[10px] text-orange-500/80 uppercase tracking-[0.5em] font-bold">Filhos do Vento</p>
                      </div>
                  </div>
              );

          case 'data':
              return (
                  <div className="absolute inset-0 p-6 flex flex-col z-10 bg-black/50 backdrop-blur-[2px]">
                      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
                          {showDistance && (
                              <div className="col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col justify-center items-center">
                                  <span className="text-gray-300 text-xs uppercase tracking-widest mb-1">Distância</span>
                                  <span className="text-6xl font-black text-white">{data.distance.split(' ')[0]}<span className="text-2xl text-gray-400">km</span></span>
                              </div>
                          )}
                          {showTime && (
                              <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col justify-center items-center ${!showDistance ? 'col-span-2' : ''}`}>
                                  <span className="text-gray-300 text-xs uppercase tracking-widest mb-1">Tempo</span>
                                  <span className="text-3xl font-bold text-white font-mono">{data.time}</span>
                              </div>
                          )}
                          {showPace && (
                              <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col justify-center items-center ${!showDistance && !showTime ? 'col-span-2' : ''}`}>
                                  <span className="text-gray-300 text-xs uppercase tracking-widest mb-1">Pace</span>
                                  <span className="text-3xl font-bold text-white font-mono">{data.pace}</span>
                              </div>
                          )}
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-white font-bold italic">
                              <Wind size={20} /> FDV
                          </div>
                          {showDate && <div className="text-xs text-gray-400 font-mono">{today}</div>}
                      </div>
                  </div>
              );

          case 'vhs':
              return (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10"></div>
                    <div className="absolute inset-0 z-20 pointer-events-none opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
                    
                    {/* Timestamp */}
                    {showDate && (
                        <div className="absolute top-8 left-8 z-30 font-mono text-orange-500 text-lg drop-shadow-md tracking-widest animate-pulse">
                            PLAY {today}
                        </div>
                    )}

                    <div className="absolute bottom-12 left-8 z-30 space-y-2">
                        {showDistance && (
                            <div className="text-6xl font-black text-white font-mono italic" style={{textShadow: '2px 2px 0px #ff00de, -2px -2px 0px #00ffff'}}>
                                {data.distance.split(' ')[0]} KM
                            </div>
                        )}
                        <div className="flex gap-6 text-2xl font-bold text-white font-mono">
                            {showTime && <span>TIME {data.time}</span>}
                            {showPace && <span>PACE {data.pace}</span>}
                        </div>
                    </div>
                    
                    {/* Scanlines */}
                    <div className="absolute inset-0 z-40 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                  </>
              );

          case 'classic':
          default:
              return (
                  <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                      
                      <div className="relative flex justify-between items-start">
                          <div className="bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                              Missão Cumprida
                          </div>
                          <Wind className="text-amber-500 drop-shadow-lg" size={32} />
                      </div>

                      <div className="relative">
                          {showDistance && (
                              <div className="mb-6">
                                  <span className="text-gray-400 text-xs uppercase font-bold tracking-widest block mb-1">Distância</span>
                                  <h1 className="text-7xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                                      {data.distance}
                                  </h1>
                              </div>
                          )}
                          
                          <div className="flex justify-between items-end border-t border-white/20 pt-4">
                              {showTime && (
                                  <div>
                                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest block">Tempo</span>
                                      <p className="text-2xl font-bold text-white font-mono">{data.time}</p>
                                  </div>
                              )}
                              {showPace && (
                                  <div className="text-right ml-auto">
                                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest block">Pace</span>
                                      <p className="text-2xl font-bold text-white font-mono">{data.pace}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                      
                      <div className="absolute bottom-2 left-0 w-full text-center">
                          <p className="text-[8px] text-gray-500 uppercase tracking-[0.3em] font-bold">Filhos do Vento</p>
                      </div>
                  </div>
              );
      }
  };

  return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-900 w-full max-w-sm rounded-3xl overflow-hidden border border-gray-800 flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-white font-bold flex items-center gap-2"><Share2 size={18} /> Estúdio Social</h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="p-6 flex flex-col gap-6">
                  
                  {/* TEMPLATE SELECTOR */}
                  <div className="overflow-x-auto pb-2 no-scrollbar">
                      <div className="flex gap-2 min-w-max">
                          {[
                              { id: 'classic', label: 'Classic', icon: LayoutTemplate, color: 'text-amber-500' },
                              { id: 'minimal', label: 'Minimal', icon: Circle, color: 'text-white' },
                              { id: 'cyber', label: 'Cyber', icon: Zap, color: 'text-green-400' },
                              { id: 'poster', label: 'Poster', icon: Type, color: 'text-white' },
                              { id: 'sunset', label: 'Sunset', icon: Sun, color: 'text-orange-400' },
                              { id: 'data', label: 'Data', icon: Grid, color: 'text-blue-400' },
                              { id: 'vhs', label: 'VHS', icon: Film, color: 'text-pink-500' },
                          ].map((t) => (
                              <button 
                                  key={t.id}
                                  onClick={() => setTemplate(t.id as TemplateType)} 
                                  className={`px-3 py-2 rounded-xl flex flex-col items-center gap-1 transition-all border ${template === t.id ? 'bg-gray-800 border-gray-600' : 'bg-transparent border-transparent hover:bg-gray-800'}`}
                              >
                                  <t.icon size={18} className={template === t.id ? t.color : 'text-gray-500'} />
                                  <span className={`text-[8px] font-bold uppercase ${template === t.id ? 'text-white' : 'text-gray-500'}`}>{t.label}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* CAPTURE AREA */}
                  <div ref={cardRef} className="relative w-full aspect-[4/5] bg-black rounded-2xl overflow-hidden shadow-lg group select-none transition-all duration-500">
                      {/* Background Image */}
                      {shareImage ? (
                          <img src={shareImage} className="absolute inset-0 w-full h-full object-cover" alt="Background" />
                      ) : (
                          <div className={`absolute inset-0 bg-gray-900 ${template === 'minimal' ? 'bg-gray-200' : template === 'sunset' ? 'bg-gradient-to-b from-orange-600 to-purple-900' : "bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"}`}>
                              {template !== 'minimal' && template !== 'sunset' && <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-black to-gray-900 opacity-90"></div>}
                          </div>
                      )}
                      
                      {renderTemplateContent()}
                  </div>

                  {/* DATA TOGGLES */}
                  <div className="grid grid-cols-4 gap-2 bg-gray-800/50 p-2 rounded-xl">
                      {[
                          { label: 'Dist', state: showDistance, set: setShowDistance },
                          { label: 'Tempo', state: showTime, set: setShowTime },
                          { label: 'Pace', state: showPace, set: setShowPace },
                          { label: 'Data', state: showDate, set: setShowDate },
                      ].map((item) => (
                          <button
                              key={item.label}
                              onClick={() => item.set(!item.state)}
                              className={`text-[9px] font-bold uppercase py-1.5 rounded-lg transition-colors flex flex-col items-center gap-1 ${item.state ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                          >
                              {item.state ? <Eye size={12} /> : <EyeOff size={12} />}
                              {item.label}
                          </button>
                      ))}
                  </div>

                  {/* Controls */}
                  <div className="space-y-3">
                      <div className="flex gap-2">
                          <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-700"
                          >
                              <ImageIcon size={16} /> Escolher Foto
                          </button>
                          <button 
                              onClick={() => setShareImage(null)}
                              className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors border border-gray-700"
                              title="Remover Foto"
                          >
                              <X size={16} />
                          </button>
                      </div>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                      />
                      
                      <button 
                          onClick={handleShare}
                          disabled={isGenerating}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 text-sm uppercase tracking-wide disabled:opacity-70"
                      >
                          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />} 
                          {isGenerating ? 'Gerando...' : 'Compartilhar / Baixar'}
                      </button>
                      <p className="text-[10px] text-gray-500 text-center">Se o compartilhamento nativo falhar, a imagem será baixada.</p>
                  </div>
              </div>
          </div>
      </div>
  );
};
