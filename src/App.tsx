import React, { useState, useEffect, useCallback } from 'react';
import { 
  initAuth, 
  logout, 
  getAccessToken 
} from './lib/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { HandoverList } from './components/HandoverList';
import { HandoverForm } from './components/HandoverForm';
import { AppUser, Handover, Notification } from './types';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  LogOut, 
  Bell,
  Menu,
  X,
  User as UserIcon,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<'dashboard' | 'handovers'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState<Handover | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    initAuth(
      (user, token, appUser) => {
        setUser(user);
        setAppUser(appUser);
        setIsLoading(false);
      },
      () => {
        setUser(null);
        setAppUser(null);
        setIsLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'handovers'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Handover));
        setHandovers(docs);
      });

      const nq = query(collection(db, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'));
      const nUnsubscribe = onSnapshot(nq, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(docs);
      });

      return () => {
        unsubscribe();
        nUnsubscribe();
      };
    }
  }, [user]);

  const handleSendEmail = async (handover: Partial<Handover>) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    const subject = `[Handover HQ] New Assignment: ${handover.title}`;
    const body = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #efefef; rounded: 12px;">
        <h2 style="color: #2563eb;">New Handover Assignment</h2>
        <p><strong>Title:</strong> ${handover.title}</p>
        <p><strong>Status:</strong> ${handover.status}</p>
        <p><strong>Due Date:</strong> ${handover.dueDate || 'No due date'}</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Notes:</strong></p>
          <p>${handover.content}</p>
        </div>
        <p><strong>Remarks:</strong> ${handover.remarks || 'None'}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">This is an automated notification from Handover HQ.</p>
      </div>
    `;

    for (const email of (handover.assignees || [])) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, subject, body, accessToken })
        });
      } catch (error) {
        console.error('Failed to send email to', email, error);
      }
    }
  };

  const handleSubmitHandover = async (data: Partial<Handover>, sendEmail: boolean) => {
    try {
      if (editingHandover) {
        await updateDoc(doc(db, 'handovers', editingHandover.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'handovers'), {
          ...data,
          creatorId: user.uid,
          creatorEmail: user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      if (sendEmail) {
        await handleSendEmail(data);
      }

      setIsFormOpen(false);
      setEditingHandover(undefined);
    } catch (error) {
      console.error('Error saving handover:', error);
    }
  };

  const handleDeleteHandover = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'handovers', id));
    } catch (error) {
      console.error('Error deleting handover:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !appUser) {
    return <AuthScreen onLogin={() => {}} isLoading={isLoading} setIsLoading={setIsLoading} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[20%] w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white/5 backdrop-blur-xl border-r border-white/10 fixed h-full z-30">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Handover HQ</h1>
          </div>
          
          <nav className="space-y-2">
            <NavButton 
              active={view === 'dashboard'} 
              onClick={() => setView('dashboard')} 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Dashboard" 
            />
            <NavButton 
              active={view === 'handovers'} 
              onClick={() => setView('handovers')} 
              icon={<ClipboardList className="w-5 h-5" />} 
              label="Handovers" 
            />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate tracking-tight">{appUser.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{appUser.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 text-slate-400 font-bold rounded-xl hover:bg-rose-500/10 hover:text-rose-500 border border-white/10 transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen relative z-10">
        <header className="sticky top-0 z-20 bg-slate-950/50 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 lg:px-8">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {view === 'dashboard' ? 'Overview' : 'Handover Management'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 hover:bg-white/5 rounded-xl transition-colors relative group text-slate-300 border border-transparent hover:border-white/10"
              >
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950" />
                )}
              </button>
            </div>

            <button 
              onClick={() => { setEditingHandover(undefined); setIsFormOpen(true); }}
              className="hidden sm:flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              <Plus className="w-5 h-5" /> New Task
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {view === 'dashboard' ? (
            <Dashboard handovers={handovers} />
          ) : (
            <HandoverList 
              handovers={handovers} 
              onEdit={(h) => { setEditingHandover(h); setIsFormOpen(true); }}
              onDelete={handleDeleteHandover}
            />
          )}
        </div>

        {/* FAB for Mobile */}
        <button 
          onClick={() => { setEditingHandover(undefined); setIsFormOpen(true); }}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center z-30 active:scale-90 transition-transform"
        >
          <Plus className="w-7 h-7" />
        </button>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {isFormOpen && (
          <HandoverForm 
            onCancel={() => setIsFormOpen(false)} 
            onSubmit={handleSubmitHandover}
            initialData={editingHandover}
            appUser={appUser}
          />
        )}

        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-white/10 z-50 p-8 flex flex-col lg:hidden"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight uppercase">HQ</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <nav className="space-y-2">
                <NavButton 
                  active={view === 'dashboard'} 
                  onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} 
                  icon={<LayoutDashboard className="w-5 h-5" />} 
                  label="Dashboard" 
                />
                <NavButton 
                  active={view === 'handovers'} 
                  onClick={() => { setView('handovers'); setIsSidebarOpen(false); }} 
                  icon={<ClipboardList className="w-5 h-5" />} 
                  label="Handovers" 
                />
              </nav>
              <div className="mt-auto pt-8 border-t border-white/10">
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-500 font-bold rounded-xl border border-rose-500/20">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
      active 
        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10' 
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
      {icon}
    </div>
    <span className="uppercase tracking-wider text-[11px]">{label}</span>
    {active && <motion.div layoutId="nav-pill" className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]" />}
  </button>
);
