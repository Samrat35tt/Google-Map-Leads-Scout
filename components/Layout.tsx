
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Users, Menu, X, Zap, Plus, LogOut, LayoutGrid, ShieldCheck, GitMerge, BookUser, Linkedin, Facebook, Instagram, Twitter, Share2, Settings, MessageSquare, Phone, Activity, CheckSquare, Book, Video } from 'lucide-react';
import { AppUser } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  credits: number;
  user: AppUser | null;
  onOpenPricing: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

const SalesOxeLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 bg-gradient-to-br from-[#0f172a] to-[#334155] rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50">
      <Zap size={18} className="text-white fill-white" />
    </div>
    <span className="font-brand tracking-tight text-2xl font-bold text-[#0f172a]">
      Sales<span className="text-[#3b82f6]">Oxe</span>
    </span>
  </div>
);

const NavItem = ({ icon: Icon, label, path, active, onClick, badge }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group ${
      active 
      ? 'bg-[#eff6ff] text-[#1d4ed8] shadow-sm shadow-blue-100' 
      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
    }`}
  >
    <Icon size={18} className={`transition-colors ${active ? 'text-[#3b82f6]' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span className="flex-1 text-left">{label}</span>
    {badge && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{badge}</span>}
  </button>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 pt-6 pb-2">
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, credits, user, onOpenPricing, onLogout, onOpenAdmin }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleNav = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex bg-[#f1f5f9] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[280px] bg-[#f8fafc] border-r border-slate-200 transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:translate-x-0 lg:static flex flex-col
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Logo Header */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => handleNav('/')}>
            <SalesOxeLogo />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
           <div className="px-3 mb-6">
             <button onClick={onOpenPricing} className="w-full flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-slate-300/50 transition-all hover:translate-y-[-1px]">
                <Plus size={16} /> New Campaign
             </button>
           </div>

          <NavItem icon={LayoutGrid} label="Dashboard" active={location.pathname === '/'} onClick={() => handleNav('/')} />
          <NavItem icon={Users} label="Lead Scout" active={isActive('/search')} onClick={() => handleNav('/search')} />
          <NavItem icon={Phone} label="Direct Dials" active={isActive('/phone-finder')} onClick={() => handleNav('/phone-finder')} />

          <SectionHeader title="Intelligence" />
          <NavItem icon={Book} label="Knowledge Base" active={isActive('/knowledge-base')} onClick={() => handleNav('/knowledge-base')} />
          <NavItem icon={Video} label="Meeting Intelligence" active={isActive('/meetings')} onClick={() => handleNav('/meetings')} />
          <NavItem icon={Activity} label="Ad Simulator" active={isActive('/ad-simulator')} onClick={() => handleNav('/ad-simulator')} />
          <NavItem icon={Share2} label="Multi-Channel" active={isActive('/social-bulk')} onClick={() => handleNav('/social-bulk')} />

          <SectionHeader title="Channels" />
          <NavItem icon={Linkedin} label="LinkedIn" active={isActive('/linkedin')} onClick={() => handleNav('/linkedin')} />
          <NavItem icon={Facebook} label="Facebook" active={isActive('/facebook')} onClick={() => handleNav('/facebook')} />
          <NavItem icon={Instagram} label="Instagram" active={isActive('/instagram')} onClick={() => handleNav('/instagram')} />
          <NavItem icon={Twitter} label="X (Twitter)" active={isActive('/twitter')} onClick={() => handleNav('/twitter')} />

          <SectionHeader title="Workflows" />
          <NavItem icon={MessageSquare} label="Unified Inbox" active={isActive('/inbox')} onClick={() => handleNav('/inbox')} />
          <NavItem icon={BookUser} label="Contacts" active={isActive('/contacts')} onClick={() => handleNav('/contacts')} />
          <NavItem icon={CheckSquare} label="Tasks" active={isActive('/tasks')} onClick={() => handleNav('/tasks')} />
          <NavItem icon={GitMerge} label="Automations" active={isActive('/automations')} onClick={() => handleNav('/automations')} />

          <SectionHeader title="System" />
          <NavItem icon={Settings} label="Settings" active={isActive('/settings')} onClick={() => handleNav('/settings')} />
          
          {user?.isAdmin && (
             <button 
              onClick={onOpenAdmin}
              className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
             >
               <ShieldCheck size={18} />
               <span>Admin Console</span>
             </button>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 mb-3">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[11px] font-bold text-slate-500 uppercase">Credits</span>
                 <span className="text-xs font-bold text-[#0f172a]">{credits.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                   style={{ width: `${Math.min((credits / 500) * 100, 100)}%` }}
                 ></div>
              </div>
              <button onClick={onOpenPricing} className="mt-2 text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                 Upgrade Plan
              </button>
           </div>

           {user && (
             <div className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors group" onClick={onLogout}>
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                   {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                   <span className="text-xs font-bold text-slate-800 truncate">{user.email.split('@')[0]}</span>
                   <span className="text-[10px] text-slate-500 capitalize">{user.plan} Tier</span>
                </div>
                <LogOut size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
             </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 lg:hidden p-4 flex items-center justify-between sticky top-0 z-20">
          <SalesOxeLogo />
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto bg-[#f1f5f9] p-4 lg:p-8">
           <div className="max-w-[1400px] mx-auto h-full flex flex-col">
              {children}
              
              <footer className="mt-auto pt-12 pb-4 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-400">
                  <div className="flex gap-4">
                     <span>&copy; {new Date().getFullYear()} SalesOxe Inc.</span>
                     <a href="#" className="hover:text-slate-600">Privacy</a>
                     <a href="#" className="hover:text-slate-600">Terms</a>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 md:mt-0">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     <span>System Operational</span>
                  </div>
              </footer>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
