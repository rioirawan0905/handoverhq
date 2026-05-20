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
    const pending = handovers.filter(h => h.status === 'pending');
    const inProgress = handovers.filter(h => h.status === 'in progress');
    const done = handovers.filter(h => h.status === 'done');
    const overdue = pending.concat(inProgress).filter(h => {
      if (!h.dueDate) return false;
      return isBefore(parseISO(h.dueDate), today);
    });

    return {
      pending: pending.length,
      inProgress: inProgress.length,
      done: done.length,
      overdue: overdue.length,
      total: handovers.length
    };
  }, [handovers]);

  const chartData = [
    { name: 'Pending', value: stats.pending, color: '#F59E0B' },
    { name: 'In Progress', value: stats.inProgress, color: '#6366F1' },
    { name: 'Done', value: stats.done, color: '#10B981' }
  ];

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Clock className="w-6 h-6 text-amber-500" />} 
          label="Pending" 
          value={stats.pending} 
          color="border-amber-500/50"
        />
        <StatCard 
          icon={<AlertTriangle className="w-6 h-6 text-rose-500" />} 
          label="Overdue" 
          value={stats.overdue} 
          color="border-rose-500/50"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-emerald-500" />} 
          label="Completed" 
          value={stats.done} 
          color="border-emerald-500/50"
        />
        <StatCard 
          icon={<List className="w-6 h-6 text-indigo-400" />} 
          label="Total Tasks" 
          value={stats.total} 
          color="border-indigo-400/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold mb-8 text-white tracking-tight">Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 flex flex-col">
          <h3 className="text-lg font-bold mb-8 text-white tracking-tight">Handover Progress</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
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
          <div className="mt-6 flex justify-center gap-6">
            {chartData.map((item) => (
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
