import type { Project, Task } from '@shift-sync/shared';
import { LayoutGrid, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onClick: (id: string) => void;
}

export function ProjectCard({ project, tasks, onClick }: ProjectCardProps) {
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedCount = projectTasks.filter(t => t.status === 'done').length;
  const totalCount = projectTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div 
      onClick={() => onClick(project.id)}
      className="glass-card p-8 rounded-[2.5rem] group cursor-pointer transition-all hover:scale-[1.02] border-white/5 hover:border-indigo-500/30 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors"></div>
      
      <div className="flex items-start justify-between mb-8 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/30 transition-all">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-1">{project.name}</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
              {project.status}
            </span>
          </div>
        </div>
        <ArrowRight className="w-6 h-6 text-slate-700 group-hover:text-indigo-500 transition-all transform group-hover:translate-x-1" />
      </div>

      <p className="text-slate-400 text-sm mb-10 line-clamp-2 font-medium">
        {project.description || 'No description provided.'}
      </p>

      <div className="space-y-4 relative">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span>Progress</span>
          <span className="text-indigo-400">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
             <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
             {completedCount}/{totalCount} Tasks
          </div>
          {project.dueDate && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Calendar className="w-4 h-4" />
              {new Date(project.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
