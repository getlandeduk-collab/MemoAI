import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Brain, Layers, CheckSquare, Sparkles, FolderOpen, Menu, Calendar, FileText } from 'lucide-react';
import AssistantTab from './components/AssistantTab';
import MemoryTab from './components/MemoryTab';
import DocumentsTab from './components/DocumentsTab';
import TasksTab from './components/TasksTab';
import LabsTab from './components/LabsTab';
import CalendarTab from './components/CalendarTab';
import MeetingNotesTab from './components/MeetingNotesTab';
import AuthScreen from './components/AuthScreen';
import { clearUser } from './types';

import DashboardTab from './components/DashboardTab';
import Sidebar from './components/Sidebar'; // Import the new Sidebar

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string, id: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const userId = localStorage.getItem('memoai_user_id');
    const userName = localStorage.getItem('memoai_user_name');
    if (userId && userName) {
      setIsAuthenticated(true);
      setCurrentUser({ id: userId, name: userName });
    }
  }, []);

  const handleLogin = (userId: string, userName: string) => {
    setIsAuthenticated(true);
    setCurrentUser({ id: userId, name: userName });
  };

  const handleLogout = () => {
    clearUser();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Layers, component: DashboardTab },
    { id: 'assistant', label: 'Assistant', icon: Bot, component: AssistantTab },
    { id: 'memory', label: 'Memory', icon: Brain, component: MemoryTab },
    { id: 'meetings', label: 'Meetings', icon: FileText, component: MeetingNotesTab },
    { id: 'documents', label: 'Knowledge', icon: FolderOpen, component: DocumentsTab },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, component: TasksTab },
    { id: 'calendar', label: 'Calendar', icon: Calendar, component: CalendarTab },
    { id: 'labs', label: 'Labs', icon: Sparkles, component: LabsTab },
  ];

  return (
    <div className="flex h-screen bg-bg-deep text-white overflow-hidden font-sans">
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-bg-deep/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="font-bold text-white">M</span>
            </div>
            <span className="font-bold">MemoAI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400">
            <Menu size={24} />
          </button>
        </div>

        {/* Content Content */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8 relative">
          {/* Ambient Background */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full relative z-10"
            >
              {tabs.map(tab => {
                if (tab.id === activeTab) {
                  const Component = tab.component;
                  return <Component key={tab.id} />;
                }
                return null;
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
