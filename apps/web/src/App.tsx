import { useState, useEffect, useCallback } from 'react';
import type { Task, Project } from '@shift-sync/shared';
import { X, Loader2, AlertCircle, CalendarRange, Sparkles, Brain, LayoutGrid, ListTodo } from 'lucide-react';
import * as ics from 'ics';
import { api } from './lib/api';
import { CommandBar } from './components/CommandBar';
import { TaskCard } from './components/TaskCard';
import { ProjectCard } from './components/ProjectCard';
import { ConfirmDialog } from './components/ConfirmDialog';

const getOrCreateUserId = () => {
  let id = localStorage.getItem('planora_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('planora_user_id', id);
  }
  return id;
};

const USER_ID = getOrCreateUserId();

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeView, setActiveView] = useState<'tasks' | 'projects'>('tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [pendingParsed, setPendingParsed] = useState<{ title: string; category: string; scheduledAt?: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setAppError(null);
      const [tasksData, projectsData] = await Promise.all([
        api.fetchTasks(USER_ID),
        api.fetchProjects(USER_ID)
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (e: any) {
      setAppError(e.message);
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createAllTasks = async (finalTasks: { title: string; category: string; scheduledAt: string | null; meetingLink: string | null }[]) => {
    setIsCreating(true);
    try {
      const createdTasks: Task[] = [];
      
      // Create all tasks in parallel or sequence
      for (const taskData of finalTasks) {
        const created = await api.createTask({
          ...taskData,
          status: 'todo',
          userId: USER_ID,
        });
        
        const task: Task = {
          ...created,
          scheduledAt: created.scheduledAt ? new Date(created.scheduledAt as any) : undefined,
          createdAt: created.createdAt ? new Date(created.createdAt as any) : undefined,
          updatedAt: created.updatedAt ? new Date(created.updatedAt as any) : undefined,
        };
        createdTasks.push(task);
      }

      setTasks(prev => [...createdTasks, ...prev]);
      
      // Clear queue
      setPendingParsed([]);
    } catch (e: any) {
      setAppError(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id, USER_ID);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      setAppError('Could not delete.');
    }
  };

  const handleToggleStatus = async (id: string, newStatus: Task['status']) => {
    try {
      await api.updateTask(id, { status: newStatus }, USER_ID);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch {
      setAppError('Status update failed.');
    }
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));

  const exportToCalendar = () => {
    if (selectedTasks.length === 0) return;
    const events: ics.EventAttributes[] = selectedTasks.map(task => {
      let description = `Category: ${task.category}`;
      let location = task.meetingLink || '';
      if (task.meetingLink) description += `\n\nJoin: ${task.meetingLink}`;
      const date = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
      return {
        title: task.title,
        description,
        location,
        start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],
        duration: { hours: 1 },
      };
    });

    ics.createEvents(events, (error, value) => {
      if (error) return;
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Planora-Events.ics');
      link.click();
      window.URL.revokeObjectURL(url);
      setSelectedTaskIds(new Set());
    });
  };
  const handleProjectPlanned = (project: Project, newTasks: Task[]) => {
    setProjects(prev => [project, ...prev]);
    setTasks(prev => [...newTasks, ...prev]);
    setActiveView('projects');
    setSelectedProjectId(project.id);
  };

  const filteredTasks = selectedProjectId 
    ? tasks.filter(t => t.projectId === selectedProjectId)
    : tasks;
  return (
    <div className="app-viewport">
      {/* Thinking Overlay */}
      {isThinking && (
        <div className="thinking-overlay">
          <div className="neural-core">
            <Brain className="w-8 h-8 text-white animate-pulse" />
            <div className="orbit-ring ring-1"></div>
            <div className="orbit-ring ring-2"></div>
          </div>
          <div className="mt-12 flex flex-col items-center">
            <h2 className="text-xl font-black text-white mb-1 tracking-tight glow-text">Analyzing Intent</h2>
            <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[8px] animate-pulse">Neural Engine Active</p>
          </div>
        </div>
      )}

      {/* Floating Header */}
      <header className={`flex flex-col items-center mb-16 animate-float transition-all duration-700 ${isThinking ? 'blur-2xl opacity-20 scale-95' : ''}`}>
        <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-6 rotate-12">
          <CalendarRange className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Planora</h1>
        <p className="text-slate-400 font-medium">Simple. Powerful. AI-Driven.</p>
      </header>

      {/* Global Error */}
      {appError && (
        <div className="mb-10 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 animate-bounce">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{appError}</span>
          <button onClick={() => setAppError(null)} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Central Input Hub */}
      <section className={`mb-20 transition-all duration-700 ${isThinking ? 'blur-2xl opacity-20 scale-95' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8 justify-center">
            <button 
              onClick={() => { setActiveView('tasks'); setSelectedProjectId(null); }}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeView === 'tasks' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5" /> Tasks
              </div>
            </button>
            <button 
              onClick={() => setActiveView('projects')}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeView === 'projects' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-3.5 h-3.5" /> Projects
              </div>
            </button>
          </div>
          
          <CommandBar 
            userId={USER_ID}
            onParsed={(data) => {
              setPendingParsed(data);
            }} 
            onProjectPlanned={handleProjectPlanned}
            onLoading={setIsThinking} 
          />
          
          <div className="mt-4 flex justify-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] animate-pulse">Try: "Plan a 2-week website redesign"</span>
          </div>
        </div>
      </section>

      {/* Dynamic Content Area */}
      <main className={`transition-all duration-700 ${isThinking ? 'blur-2xl opacity-20 scale-95' : ''}`}>
        {isAppLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Waking Up...</span>
          </div>
        ) : activeView === 'projects' && !selectedProjectId ? (
          <div className="space-y-10">
             <div className="flex items-center justify-between reveal-item">
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Active Projects</h2>
              <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-400 border border-white/5">{projects.length} Total</span>
            </div>
            
            {projects.length === 0 ? (
               <div className="text-center py-20 reveal-item">
                <Sparkles className="w-12 h-12 text-slate-800 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-300">No Projects Yet</h3>
                <p className="text-slate-500 text-sm mt-2">Use the command bar to architect your first project.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {projects.map((project, index) => (
                  <div key={project.id} className="reveal-item" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProjectCard
                      project={project}
                      tasks={tasks}
                      onClick={(id) => setSelectedProjectId(id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 reveal-item">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
                  {selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'Upcoming Events'}
                </h2>
                {selectedProjectId && (
                  <button 
                    onClick={() => setSelectedProjectId(null)}
                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                  >
                    View All
                  </button>
                )}
              </div>
              <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-400 border border-white/5">{filteredTasks.length} Total</span>
            </div>

            {filteredTasks.length === 0 ? (
               <div className="text-center py-20 reveal-item">
                <Sparkles className="w-12 h-12 text-slate-800 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-300">Clean Slate</h3>
                <p className="text-slate-500 text-sm mt-2">Add an event or select a project.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredTasks.map((task, index) => (
                  <div key={task.id} className="reveal-item" style={{ animationDelay: `${index * 0.1}s` }}>
                    <TaskCard
                      task={task}
                      isSelected={selectedTaskIds.has(task.id)}
                      onToggleSelect={toggleTaskSelection}
                      onDelete={handleDeleteTask}
                      onToggleStatus={handleToggleStatus}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bulk Action Bar - Floating at bottom */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-2xl p-4 flex items-center gap-6 z-50 animate-bounce">
          <div className="flex items-center gap-3 pl-2">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">
              {selectedTaskIds.size}
            </div>
            <span className="font-bold text-slate-900 text-sm">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCalendar}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-800"
            >
              Sync Calendar
            </button>
            <button
              onClick={() => setSelectedTaskIds(new Set())}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Overlays */}
      {pendingParsed.length > 0 && (
        <ConfirmDialog
          parsedTasks={pendingParsed}
          isCreating={isCreating}
          onConfirm={createAllTasks}
          onCancel={() => {
            setPendingParsed([]);
          }}
        />
      )}
    </div>
  );
}

export default App;
