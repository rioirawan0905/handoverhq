import React, { useState, useMemo } from 'react';
import { Handover, HandoverStatus } from '../types';
import { 
  Search, 
  Calendar, 
  Clock, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  Filter
} from 'lucide-react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';

interface HandoverListProps {
  handovers: Handover[];
  onEdit: (handover: Handover) => void;
  onDelete: (id: string) => void;
}

export const HandoverList: React.FC<HandoverListProps> = ({ handovers, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<HandoverStatus | 'all'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      const matchesSearch = 
        h.title.toLowerCase().includes(search.toLowerCase()) ||
        h.content.toLowerCase().includes(search.toLowerCase()) ||
        h.assignees.some(email => email.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [handovers, search, statusFilter]);

  const getStatusColor = (status: HandoverStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'in progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'done': return 'bg-green-50 text-green-700 border-green-100';
    }
  };

  const isOverdue = (handover: Handover) => {
    if (!handover.dueDate || handover.status === 'done') return false;
    return isBefore(parseISO(handover.dueDate), startOfToday());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search handovers, content, or people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-500 text-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full appearance-none pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer text-slate-300"
            >
              <option value="all" className="bg-slate-900">All Status</option>
              <option value="pending" className="bg-slate-900">Pending</option>
              <option value="in progress" className="bg-slate-900">In Progress</option>
              <option value="done" className="bg-slate-900">Done</option>
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredHandovers.length === 0 ? (
          <div className="glass-card p-16 text-center border-dashed border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/5 mb-4 border border-white/5">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">No handovers found</h3>
            <p className="text-slate-500 mt-1 font-medium">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredHandovers.map((h) => (
            <div 
              key={h.id} 
              className={`glass-card p-8 group relative overflow-hidden transition-all duration-300 hover:border-indigo-500/50 ${isOverdue(h) ? 'ring-1 ring-rose-500/30 border-rose-500/30' : ''}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                      {h.title}
                    </h3>
                    {isOverdue(h) && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded tracking-wider border border-rose-500/20">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{h.creatorEmail}</p>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === h.id ? null : h.id)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 border border-transparent hover:border-white/10"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {activeMenu === h.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => { onEdit(h); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" /> Edit Details
                        </button>
                        <button 
                          onClick={() => { if(confirm('Are you sure?')) onDelete(h.id); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/20 transition-colors border-t border-white/5"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Task
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-slate-400 text-sm mb-8 line-clamp-3 leading-relaxed font-medium">
                {h.content}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/5">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(h.status).replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')}`}>
                  {h.status}
                </div>
                
                {h.dueDate && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" />
                    Due {format(parseISO(h.dueDate), 'MMM d, yyyy')}
                  </div>
                )}

                <div className="flex items-center -space-x-2">
                  {h.assignees.slice(0, 3).map((email, idx) => (
                    <div 
                      key={idx}
                      title={email} 
                      className="w-8 h-8 rounded-full border-2 border-slate-900 bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase ring-1 ring-white/5"
                    >
                      {email.charAt(0)}
                    </div>
                  ))}
                  {h.assignees.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 ring-1 ring-white/5">
                      +{h.assignees.length - 3}
                    </div>
                  )}
                </div>

                {h.remarks && (
                  <div className="flex-1 text-right italic text-[11px] text-slate-600 font-medium">
                    "{h.remarks}"
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
