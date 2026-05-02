import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface CommandBarProps {
  onParsed: (data: { title: string; category: string; scheduledAt?: string }[]) => void;
  onProjectPlanned: (project: any, tasks: any[]) => void;
  onLoading?: (loading: boolean) => void;
  userId: string;
  activeView: 'tasks' | 'projects';
}

export function CommandBar({ onParsed, onProjectPlanned, onLoading, userId, activeView }: CommandBarProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    onLoading?.(true);
    setError(null);
    try {
      const lowerText = inputText.toLowerCase().trim();
      const isProjectCommand = lowerText.startsWith('plan') || lowerText.startsWith('project') || activeView === 'projects';
      
      if (isProjectCommand) {
        const { project, tasks } = await api.planProject(inputText, userId);
        onProjectPlanned(project, tasks);
      } else {
        const data = await api.parseAI(inputText);
        onParsed(data);
      }
      setInputText('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse');
    } finally {
      setIsLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <div className="relative z-20">
      <div className={`glow-pill rounded-[2rem] p-1.5 flex items-center gap-2 transition-all duration-700 glass-card ${inputText ? 'border-indigo-500/50' : 'border-white/5'} ${isLoading ? 'is-thinking' : ''}`}>
        <div className="pl-6 relative">
          <Sparkles className={`w-6 h-6 transition-colors ${inputText ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
          {isLoading && (
             <div className="absolute inset-0 bg-indigo-500 blur-md opacity-50 animate-pulse rounded-full"></div>
          )}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            className={`w-full bg-transparent border-none text-xl text-white placeholder-slate-600 focus:outline-none p-4 font-bold transition-opacity ${isLoading ? 'opacity-30' : 'opacity-100'}`}
            placeholder={isLoading ? 'Analyzing neural patterns...' : 'Tell Planora anything...'}
            value={inputText}
            disabled={isLoading}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          {isLoading && (
            <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden">
               <div className="h-full thinking-gradient w-full"></div>
            </div>
          )}
        </div>
        <button
          onClick={submit}
          disabled={isLoading || !inputText.trim()}
          className={`bg-indigo-600 hover:bg-indigo-500 disabled:opacity-0 disabled:scale-90 disabled:pointer-events-none text-white px-8 py-4 rounded-[1.5rem] font-black transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 uppercase tracking-widest text-xs ${isLoading ? 'opacity-0' : ''}`}
        >
          Schedule
        </button>
      </div>
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-center animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
}
