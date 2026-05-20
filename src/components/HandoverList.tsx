import React, { useState, useMemo } from 'react';
import { Handover, HandoverStatus, SubTask } from '../types';
import { 
  Search, 
  Calendar, 
  Clock, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronDown,
  Filter,
  ArrowRight,
  UserCheck,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, isBefore, startOfToday, differenceInCalendarDays } from 'date-fns';

interface HandoverListProps {
  handovers: Handover[];
  onEdit: (handover: Handover) => void;
  onDelete: (id: string) => void;
}

export const HandoverList: React.FC<HandoverListProps> = ({ handovers, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<HandoverStatus | 'all'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      const matchesSearch = 
        h.title.toLowerCase().includes(search.toLowerCase()) ||
        h.content.toLowerCase().includes(search.toLowerCase()) ||
        (h.outgoingPersonnel?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.incomingPersonnel?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        h.assignees.some(email => email.toLowerCase().includes(search.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [handovers, search, statusFilter]);

  const getStatusDisplay = (status: HandoverStatus) => {
    switch (status) {
      case 'routine': return { label: 'Routine', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'urgent': return { label: 'Urgent', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }
  };

  const getSubTaskStatusIcon = (status: SubTask['status']) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'delayed': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Circle className="w-4 h-4 text-blue-500" />;
    }
  };

  const isOverdue = (handover: Handover) => {
    if (!handover.dueDate) return false;
    // Check if all subtasks are done
    const allDone = handover.subTasks?.length > 0 && handover.subTasks.every(t => t.status === 'done');
    if (allDone) return false;
    return isBefore(parseISO(handover.dueDate), startOfToday());
  };

  const getRemainingDays = (dueDate: string) => {
    const today = startOfToday();
    const target = parseISO(dueDate);
    const diff = differenceInCalendarDays(target, today);
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search operations, personnel, or content..."
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
              className="w-full appearance-none pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none cursor-pointer text-slate-300 font-bold"
            >
              <option value="all" className="bg-slate-900">All Operations</option>
              <option value="routine" className="bg-slate-900">Routine</option>
              <option value="urgent" className="bg-slate-900">Urgent</option>
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
            <h3 className="text-xl font-bold text-white tracking-tight">No handover records found</h3>
            <p className="text-slate-500 mt-1 font-medium italic">Adjust filters or create a new authorization</p>
          </div>
        ) : (
          filteredHandovers.map((h) => (
            <div 
              key={h.id} 
              className={`glass-card group relative overflow-hidden transition-all duration-300 hover:border-indigo-500/30 ${isOverdue(h) ? 'ring-1 ring-rose-500/30 border-rose-500/30' : ''}`}
            >
              <div 
                className="p-8 cursor-pointer"
                onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              >
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                        {h.title}
                      </h3>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusDisplay(h.status).color}`}>
                        {getStatusDisplay(h.status).label}
                      </div>
                      {isOverdue(h) && (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded tracking-wider border border-rose-500/20">
                          Overdue
                        </span>
                      )}
                    </div>
                    
                    {/* Personnel Handshake Info */}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 mt-3">
                       <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 uppercase tracking-tighter">
                         <span className="text-slate-600">Outgoing:</span>
                         <span className="text-slate-300">{h.outgoingPersonnel?.name || 'Unassigned'}</span>
                         {h.outgoingPersonnel?.email && <span className="text-slate-600 lowercase font-medium border-l border-white/10 pl-2">{h.outgoingPersonnel.email}</span>}
                       </div>
                       <ArrowRight className="w-3 h-3 text-slate-700" />
                       <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-500/5 rounded-lg border border-indigo-500/10 uppercase tracking-tighter">
                         <span className="text-slate-600">Incoming:</span>
                         <span className="text-indigo-400">{h.incomingPersonnel?.name || 'Unassigned'}</span>
                         {h.incomingPersonnel?.email && <span className="text-indigo-400/50 lowercase font-medium border-l border-indigo-500/10 pl-2">{h.incomingPersonnel.email}</span>}
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === h.id ? null : h.id)}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 border border-transparent hover:border-white/10"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform duration-300 ${expandedId === h.id ? 'rotate-180 text-white' : ''}`} />
                  </div>
                </div>

                {/* Main Content (Collapsed view shows snippet) */}
                <div className={`text-slate-400 text-sm transition-all duration-300 leading-relaxed font-medium ${expandedId === h.id ? '' : 'line-clamp-2'}`}>
                  {h.content}
                </div>

                {/* Expanded Section */}
                <AnimatePresence>
                  {expandedId === h.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/5 space-y-6"
                    >
                      {/* Sub-tasks Grid */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Operational Task Breakdown</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {h.subTasks && h.subTasks.length > 0 ? h.subTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                              <div className="shrink-0">{getSubTaskStatusIcon(task.status)}</div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                  {task.title}
                                </p>
                                <p className="text-[9px] text-slate-600 font-black uppercase">Due: {task.dueDate}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-xs text-slate-600 italic">No specific sub-tasks defined for this operation.</p>
                          )}
                        </div>
                      </div>

                      {/* Mandatory Personnel Section */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Authorization Personnel</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10">
                                <span className="text-[10px] font-black text-slate-500">OUT</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white uppercase tracking-tight">{h.outgoingPersonnel?.name || 'Unassigned'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{h.outgoingPersonnel?.title || 'Operational Staff'}</p>
                              </div>
                            </div>
                            {h.outgoingPersonnel?.email && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl">
                                <span className="text-[10px] text-slate-400 font-bold lowercase truncate">{h.outgoingPersonnel.email}</span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                                <span className="text-[10px] font-black text-indigo-400">INC</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white uppercase tracking-tight">{h.incomingPersonnel?.name || 'Unassigned'}</p>
                                <p className="text-[10px] text-indigo-400 font-bold uppercase">{h.incomingPersonnel?.title || 'Relieving Staff'}</p>
                              </div>
                            </div>
                            {h.incomingPersonnel?.email && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <span className="text-[11px] text-indigo-400 font-bold lowercase truncate">{h.incomingPersonnel.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div>
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Technical Assignees</p>
                              <div className="flex flex-wrap gap-1.5">
                                {h.assignees.map((email, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-400 font-bold">
                                    {email}
                                  </span>
                                ))}
                              </div>
                           </div>
                        </div>

                        {h.remarks && (
                          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                            <p className="text-[10px] font-black text-indigo-400/50 uppercase tracking-widest mb-2">Final Remarks</p>
                            <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                              "{h.remarks}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Overlays within expanded */}
                      {activeMenu === h.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                          <div className="absolute right-8 top-20 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden py-1">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(h); setActiveMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                             >
                                <Edit2 className="w-4 h-4" /> Edit Record
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm('Delete record?')) onDelete(h.id); setActiveMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                             >
                                <Trash2 className="w-4 h-4" /> Delete Task
                             </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Labels */}
                <div className="flex flex-wrap items-center gap-6 pt-6 mt-6 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    Ref: {h.id.slice(0, 8)}
                  </div>
                  
                  {h.dueDate && (
                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <div className={`flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-widest shadow-sm ${
                        isOverdue(h) 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : getRemainingDays(h.dueDate) <= 2 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {format(parseISO(h.dueDate), 'MMM d, yyyy')}
                      </div>
                      
                      {(() => {
                        const days = getRemainingDays(h.dueDate);
                        const allDone = h.subTasks?.length > 0 && h.subTasks.every(t => t.status === 'done');
                        if (allDone) return null;
                        
                        return (
                          <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            days < 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            days <= 1 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                            'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {days < 0 ? 'Delayed' : days === 0 ? 'Due Today' : `${days} Days Remain`}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex items-center -space-x-2 ml-auto">
                    {h.assignees.slice(0, 4).map((email, idx) => (
                      <div 
                        key={idx}
                        title={email} 
                        className="w-8 h-8 rounded-full border-2 border-slate-950 bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase ring-1 ring-white/5"
                      >
                        {email.charAt(0)}
                      </div>
                    ))}
                    {h.assignees.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 ring-1 ring-white/5">
                        +{h.assignees.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
