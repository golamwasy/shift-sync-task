import type { Task } from '@shift-sync/shared';
import { format, differenceInDays, startOfDay, addDays } from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return dateA - dateB;
  });

  const validTasks = sortedTasks.filter(t => t.scheduledAt);
  if (validTasks.length === 0) return null;

  const startDate = startOfDay(new Date(validTasks[0].scheduledAt!));
  const endDate = addDays(startOfDay(new Date(validTasks[validTasks.length - 1].scheduledAt!)), 7);
  const totalDays = differenceInDays(endDate, startDate) || 1;

  return (
    <div className="glass-card p-10 rounded-[2.5rem] overflow-hidden border-white/5 mb-10 reveal-item">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Project Timeline</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Schedule & Dependencies</p>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Header Dates */}
          <div className="flex border-b border-white/5 mb-6 pb-4">
            <div className="w-48 flex-shrink-0"></div>
            <div className="flex-1 flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {Array.from({ length: 5 }).map((_, i) => {
                const date = addDays(startDate, Math.floor((totalDays / 4) * i));
                return <span key={i}>{format(date, 'MMM dd')}</span>;
              })}
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-4">
            {validTasks.map((task) => {
              const startOffset = differenceInDays(new Date(task.scheduledAt!), startDate);
              const leftPercent = (startOffset / totalDays) * 100;
              const widthPercent = Math.max((1 / totalDays) * 100, 5); // Min 5% width for visibility

              return (
                <div key={task.id} className="flex items-center group">
                  <div className="w-48 pr-4 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex-1 h-6 relative bg-white/[0.02] rounded-full overflow-hidden">
                    <div 
                      className={`absolute h-full rounded-full transition-all duration-1000 ${task.status === 'done' ? 'bg-emerald-500/40' : 'bg-indigo-500/40 shadow-[0_0_15px_rgba(79,70,229,0.3)]'}`}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${widthPercent}%` 
                      }}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
