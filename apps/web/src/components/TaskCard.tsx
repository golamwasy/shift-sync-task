import type { Task } from '@shift-sync/shared';
import { CheckCircle2, Clock, Calendar as CalendarIcon, Trash2, Video, Hash, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDistanceToNow, isPast } from 'date-fns';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: Task['status']) => void;
}

export function TaskCard({ task, isSelected, onToggleSelect, onDelete, onToggleStatus }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const isDone = task.status === 'done';

  const handleDecompose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDecomposing) return;
    setIsDecomposing(true);
    setIsExpanded(true);
    try {
      const data = await api.decomposeTask(task.title);
      setSubtasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <div
      onClick={() => onToggleSelect(task.id)}
      className={`glass-card p-6 rounded-3xl group cursor-pointer relative overflow-hidden ${isSelected ? 'border-indigo-500 bg-indigo-500/5' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDone ? 'bg-slate-900 border border-slate-800' : 'bg-white/5 border border-white/5 group-hover:border-indigo-500/30'}`}>
            <Hash className={`w-4 h-4 ${isDone ? 'text-slate-600' : 'text-indigo-400'}`} />
          </div>
          <div>
            <h4 className={`text-xl font-bold transition-all ${isDone ? 'text-slate-600 line-through' : 'text-white'}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{task.category}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all rounded-xl hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-2 text-slate-500 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          {subtasks.length === 0 && !isDecomposing ? (
            <button 
              onClick={handleDecompose}
              className="flex items-center gap-3 w-full p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-all text-indigo-400 group/ai"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover/ai:scale-110 transition-transform">
                <Wand2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">AI Decompose Task</span>
            </button>
          ) : (
            <div className="space-y-3">
               {isDecomposing && (
                <div className="flex items-center gap-3 p-4 text-slate-500 animate-pulse">
                  <Wand2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Breaking it down...</span>
                </div>
              )}
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 font-medium">
                  <div className="w-4 h-4 rounded border border-white/20"></div>
                  {st}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-4">
        <div className="flex items-center gap-4">
          {task.scheduledAt ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Clock className={`w-3.5 h-3.5 ${isPast(task.scheduledAt) && !isDone ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
                {formatDistanceToNow(task.scheduledAt, { addSuffix: true })}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider ml-5">
                <CalendarIcon className="w-3 h-3" />
                {new Date(task.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-600 font-bold">UNSCHEDULED</span>
          )}

          {task.meetingLink && (
            <a
              href={task.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:text-emerald-300 transition-colors"
            >
              <Video className="w-3.5 h-3.5" /> Meeting Link
            </a>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id, isDone ? 'todo' : 'done');
          }}
          className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all tracking-widest ${
            isDone
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
          }`}
        >
          {isDone ? 'DONE' : 'MARK COMPLETE'}
        </button>
      </div>
    </div>
  );
}
