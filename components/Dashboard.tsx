
import React, { useMemo } from 'react';
import { AppUser, SearchLog } from '../types';
import { Zap, TrendingUp, History, PieChart, Shield, ArrowUpRight, Search, LayoutGrid, Database, AlertCircle, CheckCircle2, Play } from 'lucide-react';

interface DashboardProps {
  user: AppUser;
  credits: number;
  history: SearchLog[];
  onNavigateSearch: () => void;
  onOpenPricing: () => void;
}

const Dashboard: React.FC<DashboardProps> = React.memo(({ user, credits, history, onNavigateSearch, onOpenPricing }) => {
  // --- Analytics Logic ---
  const stats = useMemo(() => {
    // 1. Top Industries
    const industryCounts: Record<string, number> = {};
    history.forEach(log => {
      const key = log.industry;
      industryCounts[key] = (industryCounts[key] || 0) + 1;
    });
    
    const topIndustries = Object.entries(industryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / history.length) * 100) || 0
      }));

    // 2. Total Leads Found (Estimate)
    const totalLeads = history.reduce((acc, curr) => acc + (curr.resultsCount || 0), 0);

    return { topIndustries, totalLeads };
  }, [history]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Welcome & Quick Start Banner (Only shows if no history) */}
      {history.length === 0 && (
         <div className="bg-gradient-to-r from-[#0f172a] to-[#334155] rounded-[28px] p-8 text-white relative overflow-hidden shadow-xl">
             <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform translate-x-12"></div>
             <div className="relative z-10">
                 <h1 className="text-2xl font-bold mb-2">Welcome to SalesOxe, {user.email.split('@')[0]}!</h1>
                 <p className="text-slate-300 max-w-xl mb-6">Your AI-powered sales operating system. Here is your quick start guide to finding your first high-value lead.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                         <div className="flex items-center gap-2 mb-2 font-medium text-white">
                             <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">1</div>
                             Find Leads
                         </div>
                         <p className="text-xs text-slate-300">Use <strong>Lead Search</strong> to scan Google Maps for local businesses in specific niches.</p>
                     </div>
                     <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                         <div className="flex items-center gap-2 mb-2 font-medium text-white">
                             <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">2</div>
                             Deep Audit
                         </div>
                         <p className="text-xs text-slate-300">Click the <strong className="text-white"><Search size={10} className="inline"/> Eye Icon</strong> on any lead to generate an AI ROI analysis.</p>
                     </div>
                     <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                         <div className="flex items-center gap-2 mb-2 font-medium text-white">
                             <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">3</div>
                             Outreach
                         </div>
                         <p className="text-xs text-slate-300">Generate a personalized cold email pitch grounded in the audit data.</p>
                     </div>
                 </div>

                 <button 
                    onClick={onNavigateSearch}
                    className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/20"
                 >
                     <Play size={18} fill="currentColor" /> Start First Scout
                 </button>
             </div>
         </div>
      )}

      {/* Header (Only show if history exists to avoid clutter) */}
      {history.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-normal text-[#1f1f1f]">Command Center</h1>
            <p className="text-[#444746] mt-1">Real-time overview of your scouting operations.</p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-2 bg-green-50 border-green-200 text-green-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Cloud Sync Active
                </span>
            </div>
        </div>
      )}

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Credits Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-6 text-white relative overflow-hidden shadow-lg group">
           <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                 <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Zap size={24} className="text-white" />
                 </div>
                 <button onClick={onOpenPricing} className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors shadow-sm">
                    Top Up
                 </button>
              </div>
              <div className="mt-6">
                 <span className="text-sm font-medium text-blue-100 uppercase tracking-wider">Available Credits</span>
                 <div className="text-5xl font-normal mt-1 mb-2">{credits.toLocaleString()}</div>
                 <p className="text-sm text-blue-100 opacity-80">
                    {user.plan === 'free' ? 'Starter Plan' : user.plan === 'growth' ? 'Growth Plan' : 'Agency Plan'}
                 </p>
              </div>
           </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white rounded-[28px] p-6 border border-[#e0f2fe] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-[#f0f9ff] rounded-xl text-[#0284c7]">
                  <Search size={20} />
               </div>
               <span className="font-medium text-[#1f1f1f]">Total Activity</span>
            </div>
            <div className="space-y-4">
               <div className="flex items-end justify-between">
                  <div>
                     <div className="text-3xl font-normal text-[#1f1f1f]">{history.length}</div>
                     <span className="text-xs text-[#444746]">Total Searches</span>
                  </div>
                  <div className="h-8 w-px bg-[#e0f2fe]"></div>
                  <div className="text-right">
                     <div className="text-3xl font-normal text-[#1f1f1f]">{stats.totalLeads.toLocaleString()}</div>
                     <span className="text-xs text-[#444746]">Leads Scouted</span>
                  </div>
               </div>
               <div className="w-full bg-[#f0f9ff] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
               </div>
            </div>
        </div>

        {/* Account Health / Prompt */}
        <div className="bg-gradient-to-br from-[#1f1f1f] to-[#444746] rounded-[28px] p-6 text-white shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#e0f2fe]" />
              <span className="font-medium text-[#f0f9ff]">Account Status</span>
           </div>
           <div className="mt-4">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></div>
                  <span className="text-lg font-medium">System Operational</span>
               </div>
               <p className="text-sm text-gray-400 leading-snug mb-4">
                  Database connected. Credits syncing.
               </p>
               <button onClick={onNavigateSearch} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Start new search <ArrowUpRight size={16} />
               </button>
           </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Top Industries Chart */}
         <div className="bg-white rounded-[28px] p-8 border border-[#e0f2fe] shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f0f9ff] rounded-xl text-[#0284c7]">
                     <PieChart size={20} />
                  </div>
                  <h3 className="font-medium text-[#1f1f1f]">Most Searched Industries</h3>
               </div>
            </div>

            <div className="space-y-5">
               {stats.topIndustries.length > 0 ? (
                  stats.topIndustries.map((ind, i) => (
                     <div key={i} className="group">
                        <div className="flex justify-between text-sm mb-2">
                           <span className="font-medium text-[#1f1f1f]">{ind.name}</span>
                           <span className="text-[#444746]">{ind.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#f0f9ff] h-3 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-1000 group-hover:bg-blue-600" 
                              style={{ width: `${ind.percentage}%` }}
                           ></div>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="text-center py-10 text-[#444746] text-sm bg-[#f0f9ff] rounded-2xl">
                     No analytics data available yet. Start searching!
                  </div>
               )}
            </div>
         </div>

         {/* Recent History List */}
         <div className="bg-white rounded-[28px] p-8 border border-[#e0f2fe] shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-[#f0f9ff] rounded-xl text-[#0284c7]">
                  <History size={20} />
               </div>
               <h3 className="font-medium text-[#1f1f1f]">Recent Activity</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 custom-scrollbar">
               {history.length > 0 ? (
                  [...history].reverse().slice(0, 8).map((log) => (
                     <div key={log.id} className="flex items-center justify-between p-3 hover:bg-[#f0f9ff] rounded-2xl transition-colors border border-transparent hover:border-[#e0f2fe] group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-[#f0f9ff] group-hover:bg-white text-[#0284c7] flex items-center justify-center font-bold text-sm border border-[#e0f2fe]">
                              {log.industry.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-medium text-[#1f1f1f]">{log.industry}</p>
                              <p className="text-xs text-[#444746]">{log.location}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-xs font-medium text-[#1f1f1f] bg-[#e0f2fe] px-2 py-0.5 rounded-full">{log.resultsCount} Leads</span>
                           <p className="text-[10px] text-[#444746] mt-1">{new Date(log.date).toLocaleDateString()}</p>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#444746] text-sm opacity-60">
                     <LayoutGrid size={32} className="mb-2" />
                     <p>Your search history will appear here.</p>
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
});

export default Dashboard;
