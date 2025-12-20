
import React from 'react';
import { MapPin, Users, Menu, X, Zap, Plus } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  credits: number;
  onOpenPricing: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, credits, onOpenPricing }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // Calculate percentage for progress bar (assuming base max of 500 for visual scaling)
  const percentage = Math.min((credits / 500) * 100, 100);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-50 to-white">
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
            <div className="flex items-center gap-2 text-sky-600 font-bold text-2xl tracking-tighter">
              <MapPin className="h-6 w-6" />
              <span>Map<span className="text-slate-900">x</span></span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-sky-600 bg-sky-50 rounded-xl">
              <Users size={20} />
              Lead Search
            </a>
            
            {/* Commercial Dashboard Placeholder */}
            <div className="mt-6 px-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Workspace</p>
              <div className="flex items-center gap-3 px-2 py-2 text-sm text-slate-500 font-medium opacity-50 cursor-not-allowed">
                 <div className="w-2 h-2 rounded-full bg-slate-300"></div> History
              </div>
              <div className="flex items-center gap-3 px-2 py-2 text-sm text-slate-500 font-medium opacity-50 cursor-not-allowed">
                 <div className="w-2 h-2 rounded-full bg-slate-300"></div> Team
              </div>
            </div>
          </nav>

          {/* Credits & Plan Section */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
             <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700">Credits Available</span>
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mb-2">{credits}</div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                   <div 
                     className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-500" 
                     style={{ width: `${percentage}%` }}
                   ></div>
                </div>

                <button 
                  onClick={onOpenPricing}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus size={12} /> Add Credits
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 lg:hidden p-4 flex items-center justify-between">
          <div className="font-bold text-sky-600 text-xl tracking-tighter">Mapx</div>
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
