import React from 'react';
import { googleSignIn } from '../lib/auth';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onLogin: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, isLoading, setIsLoading }) => {
  const [error, setError] = React.useState<string | null>(null);
  const isInIframe = window.self !== window.top;

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onLogin(result);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please enable popups or open in a new tab.');
      } else if (err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        setError('Network connectivity issue. Please check your connection.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[20%] w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-12 glass-morphism rounded-[2.5rem] z-10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 mb-6 shadow-xl shadow-indigo-500/10">
            <LogIn className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Handover HQ</h2>
          <p className="mt-3 text-slate-400 font-medium leading-relaxed">
            A premium infrastructure for team shift transitions and critical task broadcasting.
          </p>
        </div>
        
        <div className="mt-10 space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl"
            >
              <p className="text-xs font-bold text-rose-400 leading-relaxed">
                {error}
              </p>
            </motion.div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-6 border border-white/10 text-sm font-bold rounded-2xl text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/50 transition-all duration-300 disabled:opacity-50"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-4">
              <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </span>
            <span className="uppercase tracking-widest text-xs">
              {isLoading ? 'Establishing Session...' : 'Authenticate with Google'}
            </span>
          </button>

          {isInIframe && (
            <button
              onClick={openInNewTab}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-500/10 text-indigo-400 font-bold rounded-xl hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              <span className="text-[10px] uppercase tracking-widest">Open in New Tab</span>
            </button>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
            By accessing HQ, you consent to secure workspace integration and automated broadcast protocols.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
