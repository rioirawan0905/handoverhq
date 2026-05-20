import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Check, Sun, Moon, Rocket, Waves } from 'lucide-react';
import { AppUser, AppTheme } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SettingsProps {
  onClose: () => void;
  appUser: AppUser | null;
  onUpdateUser: (user: AppUser) => void;
}

const THEMES: { id: AppTheme; name: string; icon: any; colors: string }[] = [
  { id: 'slate', name: 'Professional Slate', icon: Sun, colors: 'from-slate-900 via-slate-950 to-slate-900 border-slate-700' },
  { id: 'obsidian', name: 'Dark Obsidian', icon: Moon, colors: 'from-black via-zinc-950 to-black border-zinc-800' },
  { id: 'midnight', name: 'Cyber Midnight', icon: Rocket, colors: 'from-blue-950 via-slate-950 to-indigo-950 border-indigo-900/50' },
  { id: 'ocean', name: 'Deep Ocean', icon: Waves, colors: 'from-teal-950 via-slate-950 to-emerald-950 border-emerald-900/50' },
];

export const Settings: React.FC<SettingsProps> = ({ onClose, appUser, onUpdateUser }) => {
  const handleThemeChange = async (theme: AppTheme) => {
    if (!appUser) return;
    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        themePreference: theme
      });
      onUpdateUser({ ...appUser, themePreference: theme });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Palette className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">System Preferences</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Personalise your workspace</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Visual Interface Theme</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 text-left group overflow-hidden ${
                    appUser?.themePreference === theme.id 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-20 ${theme.colors}`} />
                  
                  <div className="relative flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      appUser?.themePreference === theme.id ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <theme.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className={`block text-sm font-bold tracking-tight ${appUser?.themePreference === theme.id ? 'text-white' : 'text-slate-300'}`}>
                        {theme.name}
                      </span>
                      {appUser?.themePreference === theme.id && (
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Active Choice</span>
                      )}
                    </div>
                    {appUser?.themePreference === theme.id && (
                      <Check className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">Cloud Preference Sync</p>
                <p className="text-xs text-slate-500">Your theme is saved to your secure profile</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                ENABLED
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm"
          >
            Close Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};
