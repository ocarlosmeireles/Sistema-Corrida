
import React from 'react';
import { Zap, Check, Lock, Crown } from 'lucide-react';

interface ProGateProps {
  featureName: string;
  description: string;
  onUpgradeRequest?: () => void;
  children?: React.ReactNode; // Content to blur behind the gate
}

export const ProGate: React.FC<ProGateProps> = ({ featureName, description, onUpgradeRequest, children }) => {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden group">
         {/* Underlying Content (Blurred) */}
         <div className="absolute inset-0 filter blur-md opacity-40 pointer-events-none select-none overflow-hidden bg-gray-100 dark:bg-gray-900 z-0">
            {children || (
                // Default skeleton if no children provided
                <div className="p-8 space-y-8">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                </div>
            )}
         </div>

         {/* The Gate Overlay */}
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center bg-gray-900/60 backdrop-blur-[2px] transition-all duration-500">
             
             <div className="bg-gradient-to-br from-gray-800 to-black p-6 rounded-full border border-gray-700 shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                 <Lock size={40} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
                 <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1.5 border-2 border-gray-900">
                    <Crown size={12} className="text-black fill-current" />
                 </div>
             </div>
             
             <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-lg">
                 Recurso <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">PRO</span>
             </h2>
             
             <p className="text-gray-200 mb-8 max-w-md font-medium text-sm leading-relaxed drop-shadow-md bg-black/40 p-4 rounded-xl backdrop-blur-md border border-white/10">
                 {description}
             </p>

             <button 
                onClick={onUpgradeRequest}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105 flex items-center gap-3 uppercase tracking-wider"
             >
                 <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full duration-1000 transform -skew-x-12 w-full transition-transform origin-left"></div>
                 <Zap size={20} fill="currentColor" />
                 Desbloquear {featureName}
             </button>

             <div className="mt-8 flex gap-6 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Check size={12} className="text-green-400" /> IA Avançada</span>
                 <span className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Sync Auto</span>
                 <span className="flex items-center gap-1"><Check size={12} className="text-green-400" /> Suporte VIP</span>
             </div>
         </div>
    </div>
  );
};
