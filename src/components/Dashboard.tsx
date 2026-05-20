import React, { useMemo } from 'react';
import { Handover, HandoverStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Clock, AlertTriangle, CheckCircle, List } from 'lucide-react';
import { isBefore, parseISO, startOfToday } from 'date-fns';

interface DashboardProps {
  handovers: Handover[];
}

export const Dashboard: React.FC<DashboardProps> = ({ handovers }) => {
  const stats = useMemo(() => {
    const today = startOfToday();
    const routine = handovers.filter(h => h.status === 'routine');
    const urgent = handovers.filter(h => h.status === 'urgent');
    
    // Sub-task accounting
    const allSubTasks = handovers.flatMap(h => h.subTasks || []);
    const subDone = allSubTasks.filter(t => t.status === 'done');
    const subDelayed = allSubTasks.filter(t => t.status === 'delayed');
    const subInProgress = allSubTasks.filter(t => t.status === 'in-progress');
    
    const overdue = handovers.filter(h => {
      if (!h.dueDate) return false;
      // Overdue if due date passed AND not all subtasks done
      const allDone = h.subTasks?.length > 0 && h.subTasks.every(t => t.status === 'done');
      if (allDone) return false;
      return isBefore(parseISO(h.dueDate), today);
    });

    return {
      routine: routine.length,
      urgent: urgent.length,
      subDone: subDone.length,
      subTotal: allSubTasks.length,
      subDelayed: subDelayed.length,
      subInProgress: subInProgress.length,
      overdue: overdue.length,
      total: handovers.length
    };
  }, [handovers]);

  const statusData = [
    { name: 'Routine', value: stats.routine, color: '#6366F1' },
    { name: 'Urgent', value: stats.urgent, color: '#F43F5E' }
  ];

  const subTaskData = [
    { name: 'Done', value: stats.subDone, color: '#10B981' },
    { name: 'Delay', value: stats.subDelayed, color: '#F43F5E' },
    { name: 'In Progress', value: stats.subInProgress, color: '#3B82F6' }
  ];

  const completionRate = stats.subTotal > 0 ? Math.round((stats.subDone / stats.subTotal) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<List className="w-6 h-6 text-indigo-400" />} 
          label="Routine Ops" 
          value={stats.routine} 
          color="border-indigo-500/50"
        />
        <StatCard 
          icon={<AlertTriangle className="w-6 h-6 text-rose-500" />} 
          label="Urgent Alerts" 
          value={stats.urgent} 
          color="border-rose-500/50"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-emerald-500" />} 
          label="Tasks Finished" 
          value={stats.subDone} 
          color="border-emerald-500/50"
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-slate-400" />} 
          label="Active Load" 
          value={stats.total} 
          color="border-slate-400/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-white tracking-tight">Operation Priority</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">Primary Strategy</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-white tracking-tight">Technical Task Progress</h3>
            <div className="flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <CheckCircle className="w-3 h-3" /> Real-time
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subTaskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {subTaskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-white tracking-tighter">{completionRate}%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-1">Efficiency</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center flex-wrap gap-4">
            {subTaskData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className={`glass-card p-6 border-l-4 ${color} transform hover:-translate-y-1 transition-all duration-300`}>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5">{value}</p>
      </div>
    </div>
  </div>
);
