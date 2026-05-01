import { useState } from 'react';
import { useSmartInput } from '@shift-sync/shared';
import type { Task } from '@shift-sync/shared';
import { 
  Sparkles, Calendar as CalendarIcon, CheckCircle2, Clock, 
  FolderDot, LayoutDashboard, Settings, Loader2, CalendarPlus, CheckSquare, Square, X, Video
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import * as ics from 'ics';

type View = 'dashboard' | 'tasks' | 'calendar' | 'settings';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [includeMeetingLink, setIncludeMeetingLink] = useState(false);
  const [calendarType, setCalendarType] = useState<'google' | 'outlook'>('google');

  const {
    inputText,
    handleInputChange,
    submitCommand,
    isLoading,
    error,
    parsedTask,
    reset
  } = useSmartInput('http://localhost:3000');

  const confirmTask = () => {
    if (parsedTask) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: parsedTask.title || 'Untitled',
        category: parsedTask.category || 'General',
        scheduledAt: parsedTask.scheduledAt ? new Date(parsedTask.scheduledAt) : undefined,
        status: 'todo',
        userId: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTasks([newTask, ...tasks]);
      reset();
    }
  };

  const toggleTaskSelection = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTaskIds(newSet);
  };

  const handleExportToCalendar = () => {
    const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return;

    const events: ics.EventAttributes[] = selectedTasks.map(task => {
      let description = `Shift-Sync Task: ${task.category}`;
      let location = '';

      if (includeMeetingLink) {
        let meetingUrl = '';
        if (calendarType === 'google') {
          // Google Meet — each new meeting gets a unique link
          const meetCode = task.id.substring(0, 3) + '-' + task.id.substring(3, 7) + '-' + task.id.substring(7, 11);
          meetingUrl = `https://meet.google.com/${meetCode}`;
        } else {
          // Microsoft Teams — deep link format
          const encodedTitle = encodeURIComponent(task.title);
          meetingUrl = `https://teams.microsoft.com/l/meetup-join/ShiftSync/0?context=%7B%22Tid%22%3A%22shiftsync%22%7D&subject=${encodedTitle}`;
        }
        location = meetingUrl;
        description += `\n\nJoin ${calendarType === 'google' ? 'Google Meet' : 'Microsoft Teams'}: ${meetingUrl}`;
      }

      // Default to today if no date is set, just for calendar export purposes
      const date = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
      
      return {
        title: task.title,
        description,
        location,
        start: [
          date.getFullYear(), 
          date.getMonth() + 1, 
          date.getDate(), 
          date.getHours(), 
          date.getMinutes()
        ],
        duration: { hours: 1 }, // Default 1 hour duration
        status: 'CONFIRMED',
        busyStatus: 'BUSY'
      };
    });

    ics.createEvents(events, (error, value) => {
      if (error) {
        console.error("Error creating ICS file:", error);
        alert("Failed to create calendar file.");
        return;
      }
      
      // Trigger download
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ShiftSync-Tasks.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExportModalOpen(false);
      setSelectedTaskIds(new Set());
    });
  };

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('work') || lower.includes('api')) return <FolderDot className="w-4 h-4 text-blue-500" />;
    if (lower.includes('meet') || lower.includes('call')) return <CalendarIcon className="w-4 h-4 text-emerald-500" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-panel border-r border-t-0 border-b-0 border-l-0 hidden md:flex flex-col z-10 relative">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Shift-Sync</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} /> Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentView === 'tasks' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CheckCircle2 className={`w-5 h-5 ${currentView === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`} /> Tasks
          </button>
          <button 
            onClick={() => setCurrentView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentView === 'calendar' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CalendarIcon className={`w-5 h-5 ${currentView === 'calendar' ? 'text-blue-600' : 'text-slate-400'}`} /> Calendar
          </button>
        </nav>

        <div className="p-6 border-t border-slate-200">
          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${currentView === 'settings' ? 'text-blue-700 font-medium' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 relative z-0 pb-32">
        
        {/* Header Area */}
        <header className="mb-10 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-slate-900">
            {currentView === 'dashboard' && 'Good evening'}
            {currentView === 'tasks' && 'All Tasks'}
            {currentView === 'calendar' && 'Your Calendar'}
            {currentView === 'settings' && 'Settings'}
          </h1>
          <p className="text-slate-500 mt-1">
            {currentView === 'dashboard' && "Here is what's happening with your projects today."}
            {currentView !== 'dashboard' && "Manage your workflow."}
          </p>
        </header>

        {/* AI Command Bar (Glassmorphic Light) */}
        <div className="bg-white rounded-2xl p-2 mb-12 flex items-center gap-2 relative z-20 animate-fade-in-up shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100" style={{ animationDelay: '0.1s' }}>
          <div className="pl-4">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          </div>
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-lg text-slate-800 placeholder-slate-400 focus:outline-none p-3"
            placeholder="Tell Shift-Sync what to do... (e.g. Call Alice tomorrow at 10am)"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCommand();
            }}
          />
          <button
            onClick={submitCommand}
            disabled={isLoading || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Thinking...' : 'Sync'}
          </button>
        </div>

        {/* Floating Error */}
        {error && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-full text-sm backdrop-blur-md animate-fade-in-up z-50 shadow-sm">
            {error}
          </div>
        )}

        {/* Confirmation Dialog Overlay */}
        {parsedTask && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-up p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-100 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Task</h3>
                  <p className="text-sm text-slate-500">Shift-Sync parsed these details</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
                  <p className="text-slate-800 mt-1 font-medium">{parsedTask.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryIcon(parsedTask.category || '')}
                      <p className="text-slate-700 font-medium">{parsedTask.category}</p>
                    </div>
                  </div>
                  {parsedTask.scheduledAt && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled</label>
                      <p className="text-blue-600 mt-1 text-sm font-semibold">
                        {new Date(parsedTask.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={reset} className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all font-medium">
                  Cancel
                </button>
                <button onClick={confirmTask} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-md shadow-blue-600/20 transition-all">
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Upcoming Tasks</h2>
            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-medium">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white border-dashed border-2 border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">You're all caught up!</h3>
              <p className="text-slate-500 max-w-sm text-sm">
                No tasks on your plate right now. Use the AI command bar above to let Shift-Sync organize your day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tasks.map((task) => {
                const isSelected = selectedTaskIds.has(task.id);
                return (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTaskSelection(task.id)}
                    className={`glass-card p-6 rounded-2xl group cursor-pointer ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200 w-fit">
                        {getCategoryIcon(task.category)}
                        <span className="text-xs font-semibold text-slate-700">{task.category}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        )}
                      </div>
                    </div>
                    
                    <h4 className={`text-lg font-bold mb-6 transition-colors line-clamp-2 ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {task.title}
                    </h4>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      {task.scheduledAt ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className={`w-4 h-4 ${isPast(task.scheduledAt) ? 'text-red-500' : 'text-slate-400'}`} />
                          <span className={`${isPast(task.scheduledAt) ? 'text-red-600 font-bold' : 'text-slate-500 font-medium'}`}>
                            {formatDistanceToNow(task.scheduledAt, { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">No date set</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulk Action Bar (Slides up when tasks are selected) */}
        {selectedTaskIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200 p-4 flex items-center gap-6 z-40 animate-slide-up">
            <div className="flex items-center gap-3 border-r border-slate-200 pr-6">
              <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {selectedTaskIds.size}
              </div>
              <span className="font-semibold text-slate-700">Tasks Selected</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
              >
                <CalendarPlus className="w-4 h-4" /> Export to Calendar
              </button>
              <button 
                onClick={() => setSelectedTaskIds(new Set())}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Export to Calendar Modal */}
        {isExportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-up p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-100 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <CalendarPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Export Tasks</h3>
                    <p className="text-sm text-slate-500">Download to Outlook or Google Calendar</p>
                  </div>
                </div>
                <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">Export For</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCalendarType('google')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-all ${
                      calendarType === 'google'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/1200px-Google_Calendar_icon_%282020%29.svg.png" alt="Google" className="w-5 h-5" />
                    Google Calendar
                  </button>
                  <button
                    onClick={() => setCalendarType('outlook')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold transition-all ${
                      calendarType === 'outlook'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-5 h-5" />
                    Outlook / Teams
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      checked={includeMeetingLink}
                      onChange={(e) => setIncludeMeetingLink(e.target.checked)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <Video className="w-4 h-4 text-blue-600" />
                      {calendarType === 'google' ? 'Add Google Meet Link' : 'Add Microsoft Teams Link'}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {calendarType === 'google'
                        ? 'Automatically attach a Google Meet video link to each exported event.'
                        : 'Automatically attach a Microsoft Teams meeting link to each exported event.'
                      }
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setIsExportModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all font-medium">
                  Cancel
                </button>
                <button 
                  onClick={handleExportToCalendar}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Download .ics File
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
