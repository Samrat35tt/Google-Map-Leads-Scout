
import React from 'react';
import { Lead, LeadAnalysis } from '../types';
import { X, Globe, ThumbsUp, ThumbsDown, AlertCircle, Sparkles, Search, TrendingUp, MessageCircle, Lightbulb, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, Navigation } from 'lucide-react';

interface LeadResearchModalProps {
  lead: Lead;
  analysis: (LeadAnalysis & { groundingChunks?: any[] }) | null;
  isLoading: boolean;
  onClose: () => void;
}

const LeadResearchModal: React.FC<LeadResearchModalProps> = ({ lead, analysis, isLoading, onClose }) => {
  const formatUrl = (url: string | null) => {
    if (!url) return null;
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    return formatted;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
              <Search size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lead.name}</h2>
              <p className="text-xs text-sky-500 font-bold uppercase tracking-widest">{lead.address}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sky-50 rounded-full transition-colors">
            <X size={24} className="text-slate-400 hover:text-sky-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
               <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-slate-600 font-bold animate-pulse uppercase tracking-widest text-[10px]">Mapx is auditing sentiment & ROI data...</p>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Executive Summary */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-sky-500" size={20} />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Market Position</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{analysis.overview}</p>
                </section>

                {/* GMB Review Summary */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                   <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="text-sky-500" size={20} />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mapx Sentiment Audit</h3>
                  </div>
                  <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 mb-6 italic text-slate-700 text-sm font-medium border-l-4 border-l-sky-500">
                    "{analysis.reputation.reviewSummary}"
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Core Wins</span>
                      {analysis.reputation.keyPraises.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                          <ThumbsUp size={12} className="text-emerald-500 mt-0.5 shrink-0" /> {p}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Critical Friction</span>
                      {analysis.reputation.keyComplaints.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                          <ThumbsDown size={12} className="text-rose-500 mt-0.5 shrink-0" /> {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Pain Point Detection */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="text-rose-500" size={20} />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Vulnerability Score</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.painPoints.map((pain, i) => (
                      <div key={i} className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] font-bold text-rose-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                        {pain}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Grounding Sources */}
                {analysis.groundingChunks && analysis.groundingChunks.length > 0 && (
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-4">
                      <Navigation className="text-sky-500" size={20} />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Evidence Sources</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.groundingChunks.map((chunk, i) => {
                        const source = chunk.web || chunk.maps;
                        if (!source) return null;
                        return (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-sky-600 transition-all"
                          >
                            <ExternalLink size={10} />
                            {source.title || 'Source'}
                          </a>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                
                {/* ROI Potential */}
                <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-sky-200/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={80} />
                  </div>
                  <h3 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2">Growth Lift</h3>
                  <div className="text-5xl font-black mb-4 tracking-tighter">{analysis.roiPotential.estimatedIncrease}</div>
                  <p className="text-[11px] text-sky-100/70 leading-relaxed font-medium">{analysis.roiPotential.logic}</p>
                </section>

                {/* Connect & Verify Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Connect & Verify</h3>
                   <div className="space-y-3">
                      {lead.website && (
                        <a href={formatUrl(lead.website)!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-300 transition-all group">
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-sky-600" />
                            <span className="text-[11px] font-bold text-slate-700">Official Website</span>
                          </div>
                          <ExternalLink size={12} className="text-slate-300 group-hover:text-sky-500" />
                        </a>
                      )}
                      
                      {lead.socials && Object.entries(lead.socials).map(([platform, url]) => (
                        url && (
                          <a key={platform} href={formatUrl(url as string)!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-300 transition-all group">
                            <div className="flex items-center gap-2">
                              {platform === 'facebook' && <Facebook size={14} className="text-[#1877F2]" />}
                              {platform === 'instagram' && <Instagram size={14} className="text-[#E4405F]" />}
                              {platform === 'linkedin' && <Linkedin size={14} className="text-[#0A66C2]" />}
                              {platform === 'twitter' && <Twitter size={14} className="text-[#1DA1F2]" />}
                              {platform === 'youtube' && <Youtube size={14} className="text-[#FF0000]" />}
                              <span className="text-[11px] font-bold text-slate-700 capitalize">{platform}</span>
                            </div>
                            <ExternalLink size={12} className="text-slate-300 group-hover:text-sky-500" />
                          </a>
                        )
                      ))}
                   </div>
                </section>

                {/* Channel Health */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Channel Health</h3>
                   <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                          <span>Web Presence</span>
                          <span className={analysis.digitalPresence.websiteStatus === 'Strong' ? 'text-emerald-600' : 'text-amber-500'}>{analysis.digitalPresence.websiteStatus}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${analysis.digitalPresence.websiteStatus === 'Strong' ? 'w-full bg-emerald-500' : 'w-1/2 bg-amber-500'}`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                          <span>SEO Visibility</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium italic">{analysis.digitalPresence.seoHealth}</p>
                      </div>
                   </div>
                </section>

                {/* Recommendation */}
                <section className="bg-sky-600 p-6 rounded-2xl text-white shadow-lg shadow-sky-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={18} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">Mapx Recommendation</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedServices.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-white/20 rounded text-[10px] font-black uppercase">{s}</span>
                    ))}
                  </div>
                </section>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 uppercase tracking-widest">
            CLOSE SCOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadResearchModal;
