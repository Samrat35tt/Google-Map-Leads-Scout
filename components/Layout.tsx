import React from 'react';
import { MapPin, Users, Settings, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <MapPin className="h-6 w-6" />
              <span>LeadScout AI</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg">
              <Users size={20} />
              Lead Search
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
              <Settings size={20} />
              Settings
            </a>
          </nav>

          <div className="p-4 border-t border-slate-100">
             <div className="flex items-center gap-3 px-4 py-3 text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               System Operational
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 lg:hidden p-4 flex items-center justify-between">
          <div className="font-bold text-slate-800">Lead Search</div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;