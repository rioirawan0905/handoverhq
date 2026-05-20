import React, { useState } from 'react';
import { AppUser, Handover, HandoverStatus, SubTask, Personnel } from '../types';
import { getAccessToken } from '../lib/auth';
import { Calendar, UserPlus, X, Send, Save, Plus, Trash2, User, Users, Download } from 'lucide-react';
import { DRILLING_PERSONNEL } from '../data/personnel';

interface HandoverFormProps {
  onSubmit: (data: Partial<Handover>, sendEmail: boolean) => void;
  onCancel: () => void;
  initialData?: Handover;
  appUser: AppUser;
  handovers: Handover[];
}

export const HandoverForm: React.FC<HandoverFormProps> = ({ onSubmit, onCancel, initialData, appUser, handovers }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [status, setStatus] = useState<HandoverStatus>(initialData?.status || 'routine');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [assignees, setAssignees] = useState<string[]>(initialData?.assignees || []);
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [sendEmail, setSendEmail] = useState(false);
  
  // New Fields
  const [outgoingPersonnel, setOutgoingPersonnel] = useState<Personnel | undefined>(initialData?.outgoingPersonnel);
  const [incomingPersonnel, setIncomingPersonnel] = useState<Personnel | undefined>(initialData?.incomingPersonnel);
  const [subTasks, setSubTasks] = useState<SubTask[]>(initialData?.subTasks || []);
  
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskDate, setNewSubTaskDate] = useState('');

  const handleImportPendingTasks = () => {
    // Find all subtasks in previous handovers that are not marked as 'done'
    const pendingTasks: SubTask[] = [];
    const seenTitles = new Set(subTasks.map(t => t.title.toLowerCase()));

    handovers.forEach(h => {
      h.subTasks?.forEach(t => {
        if (t.status !== 'done' && !seenTitles.has(t.title.toLowerCase())) {
          pendingTasks.push({
            ...t,
            id: crypto.randomUUID() // New ID for the new handover record
          });
          seenTitles.add(t.title.toLowerCase());
        }
      });
    });

    if (pendingTasks.length > 0) {
      setSubTasks([...subTasks, ...pendingTasks]);
    }
  };

  const handleAddAssignee = () => {
    if (assigneeEmail && !assignees.includes(assigneeEmail) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail)) {
      setAssignees([...assignees, assigneeEmail]);
      setAssigneeEmail('');
    }
  };

  const removeAssignee = (email: string) => {
    setAssignees(assignees.filter(e => e !== email));
  };

  const handleAddSubTask = () => {
    if (newSubTaskTitle && newSubTaskDate) {
      const newTask: SubTask = {
        id: crypto.randomUUID(),
        title: newSubTaskTitle,
        dueDate: newSubTaskDate,
        status: 'in-progress'
      };
      setSubTasks([...subTasks, newTask]);
      setNewSubTaskTitle('');
      setNewSubTaskDate('');
    }
  };

  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter(t => t.id !== id));
  };

  const updateSubTaskStatus = (id: string, status: SubTask['status']) => {
    setSubTasks(subTasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      content,
      status,
      dueDate: dueDate || null,
      assignees,
      remarks,
      outgoingPersonnel,
      incomingPersonnel,
      subTasks,
    }, sendEmail);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="glass-morphism w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 rounded-3xl">
        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {initialData ? 'Update Operation' : 'Initialize Handover'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Status and Title */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HandoverStatus)}
                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none cursor-pointer transition-colors font-bold ${
                  status === 'urgent' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <option value="routine" className="bg-slate-900">Routine</option>
                <option value="urgent" className="bg-slate-900">Urgent</option>
              </select>
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Subject</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Drilling status or maintenance shift..."
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-white placeholder-slate-600"
              />
            </div>
          </div>

          {/* Personnel Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Outgoing Personnel</label>
              <div className="relative">
                <select
                  value={outgoingPersonnel?.email || ''}
                  onChange={(e) => setOutgoingPersonnel(DRILLING_PERSONNEL.find(p => p.email === e.target.value))}
                  className="w-full px-4 py-3.5 pl-11 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none text-slate-300 cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Select Personnel...</option>
                  {DRILLING_PERSONNEL.map(p => (
                    <option key={p.email} value={p.email} className="bg-slate-900">{p.name} ({p.title})</option>
                  ))}
                </select>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Incoming Personnel (Receiver)</label>
              <div className="relative">
                <select
                  value={incomingPersonnel?.email || ''}
                  onChange={(e) => setIncomingPersonnel(DRILLING_PERSONNEL.find(p => p.email === e.target.value))}
                  className="w-full px-4 py-3.5 pl-11 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none text-slate-300 cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Select Personnel...</option>
                  {DRILLING_PERSONNEL.map(p => (
                    <option key={p.email} value={p.email} className="bg-slate-900">{p.name} ({p.title})</option>
                  ))}
                </select>
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
              {incomingPersonnel && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-in slide-in-from-top-1 duration-200">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter shrink-0">Recipient:</span>
                  <span className="text-[11px] text-indigo-300 font-medium lowercase truncate">{incomingPersonnel.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Operation Notes</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Enter detailed instructions or task status..."
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all text-white placeholder-slate-600"
            />
          </div>

          {/* Sub-tasks Section */}
          <div className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Specific Tasks Breakdown</label>
              <button 
                type="button" 
                onClick={handleImportPendingTasks}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
              >
                <Download className="w-3 h-3" /> Import Pending
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="Task description..."
                className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <input
                type="date"
                value={newSubTaskDate}
                onChange={(e) => setNewSubTaskDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]"
              />
              <button
                type="button"
                onClick={handleAddSubTask}
                className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {subTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-900 border border-white/5 rounded-xl group">
                  <select
                    value={task.status}
                    onChange={(e) => updateSubTaskStatus(task.id, e.target.value as SubTask['status'])}
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border outline-none ${
                        task.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        task.status === 'delayed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                    }`}
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="delayed">Delay</option>
                    <option value="done">Done</option>
                  </select>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-300 truncate">{task.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Due: {task.dueDate}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeSubTask(task.id)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Remark</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Final sign-off or handover code..."
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white placeholder-slate-600"
            />
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={!getAccessToken()}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer appearance-none checked:bg-indigo-500 checked:border-indigo-500 transition-all disabled:opacity-30"
              />
              <label htmlFor="sendEmail" className={`text-sm font-bold cursor-pointer select-none ${getAccessToken() ? 'text-slate-400' : 'text-slate-600 cursor-not-allowed'}`}>
                Notify all assignees via professional email
              </label>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 px-6 border border-white/10 text-slate-400 font-bold rounded-2xl hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-4 px-6 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all transform active:scale-95"
            >
              {initialData ? <Save className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              {initialData ? 'Sync Updates' : 'Authorize Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
