import React, { useState } from 'react';
import { AppUser, Handover, HandoverStatus } from '../types';
import { Calendar, UserPlus, X, Send, Save } from 'lucide-react';
import { format } from 'date-fns';

interface HandoverFormProps {
  onSubmit: (data: Partial<Handover>, sendEmail: boolean) => void;
  onCancel: () => void;
  initialData?: Handover;
  appUser: AppUser;
}

export const HandoverForm: React.FC<HandoverFormProps> = ({ onSubmit, onCancel, initialData, appUser }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [status, setStatus] = useState<HandoverStatus>(initialData?.status || 'pending');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [assignees, setAssignees] = useState<string[]>(initialData?.assignees || []);
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [sendEmail, setSendEmail] = useState(false);

  const handleAddAssignee = () => {
    if (assigneeEmail && !assignees.includes(assigneeEmail) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail)) {
      setAssignees([...assignees, assigneeEmail]);
      setAssigneeEmail('');
    }
  };

  const removeAssignee = (email: string) => {
    setAssignees(assignees.filter(e => e !== email));
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
    }, sendEmail);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="glass-morphism w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 rounded-3xl">
        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {initialData ? 'Edit Handover' : 'New Handover Task'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shift handover details..."
              required
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-white placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HandoverStatus)}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none text-slate-300 cursor-pointer"
              >
                <option value="pending" className="bg-slate-900">Pending</option>
                <option value="in progress" className="bg-slate-900">In Progress</option>
                <option value="done" className="bg-slate-900">Done</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3.5 pl-11 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white [color-scheme:dark]"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Operation Notes</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Enter detailed instructions or task status..."
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all text-white placeholder-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Teammates</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                  placeholder="name@email.com"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAssignee())}
                  className="w-full px-4 py-3.5 pl-11 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white placeholder-slate-600"
                />
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={handleAddAssignee}
                className="px-6 py-3 bg-white/10 text-slate-300 font-bold border border-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {assignees.map((email) => (
                <span key={email} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/30">
                  {email}
                  <button type="button" onClick={() => removeAssignee(email)} className="hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add small updates here..."
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-white placeholder-slate-600"
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/50 cursor-pointer appearance-none checked:bg-indigo-500 checked:border-indigo-500 transition-all"
              />
              <label htmlFor="sendEmail" className="text-sm font-bold text-slate-400 cursor-pointer ml-3 select-none">
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
              {initialData ? 'Sync Updates' : 'Broadcast Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
