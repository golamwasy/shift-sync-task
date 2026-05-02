import { useState } from 'react';
import { Sparkles, Loader2, Calendar, Clock, Video, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TaskData {
  title: string;
  category: string;
  scheduledAt: string | null;
  meetingLink: string | null;
}

interface ConfirmDialogProps {
  parsedTasks: { title: string; category: string; scheduledAt?: string }[];
  isCreating: boolean;
  onConfirm: (finalTasks: TaskData[]) => void;
  onCancel: () => void;
}

function toLocalDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalTimeInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function generateJitsiLink(title: string): string {
  const slug = title.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').substring(0, 30);
  const id = Math.random().toString(36).substring(2, 8);
  return `https://meet.jit.si/Planora-${slug}-${id}`;
}

export function ConfirmDialog({ parsedTasks, isCreating, onConfirm, onCancel }: ConfirmDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editedTasks, setEditedTasks] = useState<TaskData[]>(() => 
    parsedTasks.map(t => ({
      title: t.title,
      category: t.category,
      scheduledAt: t.scheduledAt || null,
      meetingLink: null
    }))
  );

  const currentTask = editedTasks[currentIndex];

  const updateCurrentTask = (updates: Partial<TaskData>) => {
    setEditedTasks(prev => prev.map((t, i) => i === currentIndex ? { ...t, ...updates } : t));
  };

  const handleDateChange = (val: string) => {
    const time = toLocalTimeInput(currentTask.scheduledAt || undefined) || '12:00';
    updateCurrentTask({ scheduledAt: val ? `${val}T${time}:00` : null });
  };

  const handleTimeChange = (val: string) => {
    const date = toLocalDateInput(currentTask.scheduledAt || undefined);
    if (date) {
      updateCurrentTask({ scheduledAt: `${date}T${val}:00` });
    }
  };

  const toggleMeeting = () => {
    updateCurrentTask({ meetingLink: currentTask.meetingLink ? null : generateJitsiLink(currentTask.title) });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in-up p-4">
      <div className="glass-panel w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border-white/10 relative overflow-hidden">
        {/* Progress Background Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / editedTasks.length) * 100}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Sync Batch</h3>
              <p className="text-slate-400 font-medium text-sm">Reviewing task {currentIndex + 1} of {editedTasks.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || isCreating}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentIndex(prev => Math.min(editedTasks.length - 1, prev + 1))}
              disabled={currentIndex === editedTasks.length - 1 || isCreating}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] block mb-2.5">Event Identity</label>
            <input
              type="text"
              value={currentTask.title}
              onChange={(e) => updateCurrentTask({ title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] block mb-2.5">Classification</label>
              <input
                type="text"
                value={currentTask.category}
                onChange={(e) => updateCurrentTask({ category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div 
              onClick={toggleMeeting}
              className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between ${currentTask.meetingLink ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <Video className={`w-5 h-5 ${currentTask.meetingLink ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className={`font-bold text-sm ${currentTask.meetingLink ? 'text-emerald-400' : 'text-slate-300'}`}>
                  Virtual Room
                </span>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 transition-all ${currentTask.meetingLink ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${currentTask.meetingLink ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2.5">
                <Calendar className="w-3.5 h-3.5" /> Temporal Date
              </label>
              <input
                type="date"
                value={toLocalDateInput(currentTask.scheduledAt || undefined)}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2.5">
                <Clock className="w-3.5 h-3.5" /> Temporal Time
              </label>
              <input
                type="time"
                value={toLocalTimeInput(currentTask.scheduledAt || undefined) || '12:00'}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-between pt-4 border-t border-white/5">
          <button onClick={onCancel} className="px-6 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all font-bold text-sm">
            Cancel Batch
          </button>
          
          <div className="flex gap-4">
             {currentIndex < editedTasks.length - 1 ? (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  Verify Next <ChevronRight className="w-4 h-4" />
                </button>
             ) : (
                <button
                  onClick={() => onConfirm(editedTasks)}
                  disabled={isCreating || !currentTask.title.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3"
                >
                  {isCreating && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCreating ? 'Creating Batch...' : `Create All ${editedTasks.length} Events`}
                  <Check className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
