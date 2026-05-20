import React, { useState, useEffect, useCallback } from 'react';
import { 
  initAuth, 
  logout, 
  googleSignIn,
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
import { Dashboard } from './components/Dashboard';
import { HandoverList } from './components/HandoverList';
import { HandoverForm } from './components/HandoverForm';
import { Settings as SettingsView } from './components/Settings';
import { AuthScreen } from './components/AuthScreen';
import { AppUser, Handover, Notification, AppTheme } from './types';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Plus, 
  LogOut, 
  Bell,
  Menu,
  X,
  User as UserIcon,
  Search,
  Settings as SettingsIcon,
  Palette,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<'dashboard' | 'handovers'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState<Handover | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDbConnecting, setIsDbConnecting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const getThemeClasses = (theme?: AppTheme) => {
    switch (theme) {
      case 'slate': return 'bg-slate-950 text-slate-200';
      case 'obsidian': return 'bg-black text-zinc-100';
      case 'midnight': return 'bg-[#020617] text-blue-100';
      case 'ocean': return 'bg-[#000d0d] text-emerald-100';
      default: return 'bg-slate-950 text-slate-200';
    }
  };

  const getThemeAccentClasses = (theme?: AppTheme) => {
    switch (theme) {
      case 'ocean': return 'bg-emerald-500/10';
      case 'midnight': return 'bg-blue-600/10';
      case 'obsidian': return 'bg-zinc-800/10';
      case 'slate': return 'bg-indigo-600/10';
      default: return 'bg-indigo-600/10';
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

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
      let unsubscribe: () => void;
      let nUnsubscribe: () => void;
      let uUnsubscribe: () => void;

      const setupListeners = () => {
        setIsDbConnecting(true);
        
        // 1. Listen to Handover records
        const q = query(collection(db, 'handovers'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Handover));
            setHandovers(docs);
            setIsDbConnecting(false);
          },
          (error) => {
            console.error('Handovers listener error:', error);
            if (error.code === 'unavailable' || error.message?.includes('offline')) {
              setIsDbConnecting(true);
              setTimeout(setupListeners, 5000);
            } else {
              setIsDbConnecting(false);
            }
          }
        );

        // 2. Listen to User Notifications
        const nq = query(collection(db, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'));
        nUnsubscribe = onSnapshot(nq, 
          (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(docs);
          },
          (error) => console.error('Notifications listener error:', error)
        );

        // 3. Listen to User Profile (for Theme persistence)
        uUnsubscribe = onSnapshot(doc(db, 'users', user.uid), 
          (snapshot) => {
            if (snapshot.exists()) {
              setAppUser(snapshot.data() as AppUser);
            }
          },
          (error) => console.error('User profile listener error:', error)
        );
      };

      setupListeners();

      return () => {
        if (unsubscribe) unsubscribe();
        if (nUnsubscribe) nUnsubscribe();
        if (uUnsubscribe) uUnsubscribe();
      };
    }
  }, [user]);

  const handleSendEmail = async (handover: Partial<Handover>) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.warn("Email notification skipped: No access token available (Sign-in required for Gmail API)");
      return;
    }

    const subject = `[OFFICIAL HANDOVER] ${handover.status === 'urgent' ? '⚠️ URGENT:' : ''} ${handover.title}`;
    const recipients = Array.from(new Set([
      ...(handover.assignees || []),
      ...(handover.outgoingPersonnel?.email ? [handover.outgoingPersonnel.email] : []),
      ...(handover.incomingPersonnel?.email ? [handover.incomingPersonnel.email] : [])
    ]));

    const body = `
      <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
           <h1 style="color: #4f46e5; margin: 0; font-size: 24px; letter-spacing: -0.025em;">Operation Handover Authorization</h1>
           <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Drilling Operation Management System</p>
        </div>

        <div style="background-color: ${handover.status === 'urgent' ? '#fff1f2' : '#f0f9ff'}; padding: 15px; border-radius: 12px; border: 1px solid ${handover.status === 'urgent' ? '#fecaca' : '#bae6fd'}; margin-bottom: 25px;">
          <table style="width: 100%;">
            <tr>
              <td style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Status</td>
              <td style="font-size: 11px; font-weight: 800; color: ${handover.status === 'urgent' ? '#e11d48' : '#0284c7'}; text-transform: uppercase; letter-spacing: 0.1em;">Priority: ${handover.status}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; font-weight: 700; color: #1e293b; padding-top: 4px;">Subject</td>
              <td style="font-size: 14px; font-weight: 700; color: #1e293b; padding-top: 4px;">${handover.title}</td>
            </tr>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px;">
          <div style="flex: 1; padding: 15px; background: #f8fafc; border-radius: 12px;">
             <p style="margin: 0; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Outgoing Personnel</p>
             <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #334155;">${handover.outgoingPersonnel?.name || 'Not Specified'}</p>
             <p style="margin: 0; font-size: 11px; color: #64748b;">${handover.outgoingPersonnel?.title || ''}</p>
          </div>
          <div style="flex: 1; padding: 15px; background: #f0fdf4; border-radius: 12px;">
             <p style="margin: 0; font-size: 10px; font-weight: 900; color: #16a34a; text-transform: uppercase;">Incoming Receiver</p>
             <p style="margin: 4px 0 0; font-size: 13px; font-weight: 700; color: #166534;">${handover.incomingPersonnel?.name || 'Not Specified'}</p>
             <p style="margin: 0; font-size: 11px; color: #15803d;">${handover.incomingPersonnel?.title || ''}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <p style="font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Detailed Operation Notes</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${handover.content}</div>
        </div>

        ${handover.subTasks?.length ? `
        <div style="margin-bottom: 25px;">
          <p style="font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 12px;">Specific Action Items</p>
          ${handover.subTasks.map(task => `
            <div style="padding: 10px 15px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 13px; font-weight: 600; color: #334155;">${task.title}</span>
              <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Due: ${task.dueDate}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; font-weight: 500;">
            This document is an official operational handover authorization.<br/>
            Ref: #${handover.id || 'NEW'} | Authorized by ${appUser.name}
          </p>
        </div>
      </div>
    `;

    const results = { success: [] as string[], failed: [] as string[] };

    for (const email of recipients) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email, subject, body, accessToken })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Server error');
        }
        results.success.push(email);
      } catch (error: any) {
        console.error('Failed to send email to', email, error);
        results.failed.push(`${email} (${error.message || 'Unknown error'})`);
      }
    }

    if (results.failed.length > 0) {
      showToast(`Emails: ${results.success.length} sent. FAILED: ${results.failed.join(', ')}`, 'error');
    } else {
      showToast(`Authorization emails broadcasted successfully to all ${recipients.length} recipients.`, 'success');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications`, id), {
        read: true
      });
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleSubmitHandover = async (data: Partial<Handover>, sendEmail: boolean) => {
    try {
      showToast('Saving handover authorization...', 'info');
      
      let handoverId = editingHandover?.id;
      
      if (editingHandover) {
        await updateDoc(doc(db, 'handovers', editingHandover.id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'handovers'), {
          ...data,
          creatorId: user.uid,
          creatorEmail: appUser.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        handoverId = docRef.id;
      }

      // Close the form immediately after saving to DB for responsiveness
      setIsFormOpen(false);
      setEditingHandover(undefined);

      // Add a notification for the current user to show in the bell icon
      try {
        await addDoc(collection(db, `users/${user.uid}/notifications`), {
          userId: user.uid,
          title: editingHandover ? 'Authorization Updated' : 'New Authorization',
          message: `Operation "${data.title}" has been successfully ${editingHandover ? 'updated' : 'recorded in HQ'}.`,
          read: false,
          type: 'info',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Silent notification failure:', err);
      }

      if (sendEmail) {
        await handleSendEmail({ ...data, id: handoverId });
      } else {
        showToast('Record saved successfully.', 'success');
      }
    } catch (error: any) {
      console.error('Error saving handover:', error);
      showToast(`Failed to save: ${error.message || 'Check connection'}`, 'error');
    }
  };

  const handleDeleteHandover = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'handovers', id));
    } catch (error) {
      console.error('Error deleting handover:', error);
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      showToast('Connecting to HQ Security...', 'info');
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAppUser(result.appUser);
        showToast('Mission profile synchronized.', 'success');
      }
    } catch (e: any) { 
      console.error(e);
      if (e.code === 'auth/popup-blocked') {
        showToast('Popup blocked. Please open in a new tab.', 'error');
      } else {
        showToast('Authentication failed.', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        onLogin={(result) => {
          setUser(result.user);
          setAppUser(result.appUser);
        }}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    );
  }

  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto">
            <X className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Sync Failure</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            The application failed to synchronize your secure mission profile. This usually occurs during network fluctuations or security handshake delays.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
          >
            Reconnect to HQ
          </button>
        </div>
      </div>
    );
  }

  if (isDbConnecting && handovers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-20 h-20 border-2 border-indigo-500/20 rounded-full mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-t-2 border-indigo-400 rounded-full animate-spin mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Establishing Security</h2>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
              Syncing with secure database connection...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex relative overflow-hidden transition-colors duration-700 ${getThemeClasses(appUser?.themePreference)}`}>
      {/* Background Decoration */}
      <div className={`absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${getThemeAccentClasses(appUser?.themePreference)}`}></div>
      <div className={`absolute bottom-[-50px] left-[20%] w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${appUser?.themePreference === 'ocean' ? 'bg-teal-500/10' : 'bg-teal-500/10'}`}></div>

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
            <NavButton 
              active={isSettingsOpen} 
              onClick={() => setIsSettingsOpen(true)} 
              icon={<Palette className="w-5 h-5" />} 
              label="Settings" 
            />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
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
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Reset Session
          </button>
          
          {!getAccessToken() ? (
            <button 
              onClick={handleLoginWithGoogle}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-500/10 text-indigo-400 font-bold rounded-xl hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-300 group"
            >
              <SettingsIcon className="w-4 h-4" /> Enable Gmail API
            </button>
          ) : (
            <div className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 text-emerald-500 font-black text-[10px] uppercase tracking-widest rounded-xl border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Gmail Authorization Active
            </div>
          )}
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

          <div className="flex-1 px-4 lg:px-8 flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {view === 'dashboard' ? 'Overview' : 'Handover Management'}
            </h2>
            {user?.isAnonymous ? (
              <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded border border-white/5">Guest Mode</span>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded border border-indigo-500/20">
                <ShieldCheck className="w-3 h-3" /> Verified
              </div>
            )}
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

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</span>
                        {unreadCount > 0 && <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-600 italic text-sm">No notifications yet</div>
                        ) : (
                          notifications.map(n => (
                            <button 
                              key={n.id}
                              onClick={() => { markNotificationRead(n.id); setIsNotificationsOpen(false); }}
                              className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${!n.read ? 'bg-indigo-500/5' : ''}`}
                            >
                              {n.title && <p className={`text-[10px] uppercase tracking-widest font-black mb-1 ${!n.read ? 'text-indigo-400' : 'text-slate-500'}`}>{n.title}</p>}
                              <p className={`text-sm ${!n.read ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>{n.message}</p>
                              <p className="text-[10px] text-slate-600 mt-1 font-bold">
                                {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
            <Dashboard handovers={handovers} user={user} onLogin={handleLoginWithGoogle} />
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
            handovers={handovers}
          />
        )}

        {isSettingsOpen && (
          <SettingsView 
            onClose={() => setIsSettingsOpen(false)}
            appUser={appUser}
            onUpdateUser={setAppUser}
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
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-slate-400 font-bold rounded-xl border border-white/10">
                  <LogOut className="w-4 h-4" /> Reset Session
                </button>
              </div>
            </motion.aside>
          </>
        )}
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[300px] backdrop-blur-xl ${
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                'bg-slate-800/80 border-white/10 text-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                toast.type === 'success' ? 'bg-emerald-500' :
                toast.type === 'error' ? 'bg-rose-500' :
                'bg-slate-400'
              }`} />
              <span className="text-sm font-bold tracking-tight">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
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
