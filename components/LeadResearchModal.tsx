
import React from 'react';
import { Lead, LeadAnalysis } from '../types';
import { X, Globe, ThumbsUp, ThumbsDown, AlertCircle, Sparkles, Search, TrendingUp, MessageCircle, Lightbulb, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, Navigation, Cpu } from 'lucide-react';

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
    <div className="fixed inset-0 bg-[#000000]/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#f0f9ff] rounded-[28px] shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#e0f2fe]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#e0f2fe] flex justify-between items-center bg-white">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-[#e0f2fe] rounded-full flex items-center justify-center text-[#0ea5e9]">
              <Search size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-normal text-[#1f1f1f]">{lead.name}</h2>
              <div className="flex items-center gap-2 text-sm text-[#444746] mt-0.5">
                 <span className="font-medium bg-[#f0f9ff] px-2 py-0.5 rounded text-xs">{lead.category}</span>
                 <span>•</span>
                 <span>{lead.address}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f0f9ff] rounded-full transition-colors text-[#444746]">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 min-h-[400px]">
               <div className="relative">
                 <div className="w-16 h-16 border-4 border-[#e0f2fe] border-t-[#0ea5e9] rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={20} className="text-[#0ea5e9]" />
                 </div>
               </div>
               <p className="text-[#1f1f1f] font-medium text-lg">Analyzing digital footprint...</p>
               <p className="text-[#444746] text-sm">Reviewing GMB, social signals, and tech stack</p>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Executive Summary */}
                <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-[#0ea5e9]" size={20} />
                    <h3 className="text-sm font-medium text-[#1f1f1f]">Executive Summary</h3>
                  </div>
                  <p className="text-[#444746] leading-relaxed text-base">{analysis.overview}</p>
                </section>

                {/* Tech Stack Detection */}
                <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="text-[#0ea5e9]" size={20} />
                    <h3 className="text-sm font-medium text-[#1f1f1f]">Technology Stack</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.techStack && analysis.techStack.length > 0 ? (
                      analysis.techStack.map((tech, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#f0f9ff] border border-[#e0f2fe] text-[#0284c7] rounded-lg text-xs font-medium flex items-center gap-1">
                           {tech}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-[#444746] italic">No specific technologies detected.</p>
                    )}
                  </div>
                </section>

                {/* GMB Review Summary */}
                <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                   <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="text-[#0ea5e9]" size={20} />
                    <h3 className="text-sm font-medium text-[#1f1f1f]">Sentiment Audit</h3>
                  </div>
                  <div className="bg-[#f0f9ff] p-5 rounded-2xl mb-6 text-[#1f1f1f] text-sm leading-relaxed relative">
                    <span className="absolute top-4 left-4 text-[#0ea5e9] text-2xl font-serif">"</span>
                    <p className="pl-6">{analysis.reputation.reviewSummary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs font-bold text-[#188038] uppercase tracking-wider mb-3 block">Positives</span>
                      <div className="space-y-2">
                        {analysis.reputation.keyPraises.map((p, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[#444746]">
                            <ThumbsUp size={14} className="text-[#188038] mt-1 shrink-0" /> {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#b3261e] uppercase tracking-wider mb-3 block">Complaints</span>
                      <div className="space-y-2">
                        {analysis.reputation.keyComplaints.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[#444746]">
                            <ThumbsDown size={14} className="text-[#b3261e] mt-1 shrink-0" /> {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Pain Point Detection */}
                <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="text-[#b3261e]" size={20} />
                    <h3 className="text-sm font-medium text-[#1f1f1f]">Detected Friction</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {analysis.painPoints.map((pain, i) => (
                      <div key={i} className="px-4 py-2 bg-[#fce8e6] rounded-full border border-[#f9dedc] text-sm font-medium text-[#b3261e] flex items-center gap-2">
                        {pain}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Grounding Sources */}
                {analysis.groundingChunks && analysis.groundingChunks.length > 0 && (
                  <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Navigation className="text-[#0ea5e9]" size={20} />
                      <h3 className="text-sm font-medium text-[#1f1f1f]">Verified Sources</h3>
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
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#c4c7c5] hover:bg-[#f0f9ff] rounded-lg text-xs font-medium text-[#0ea5e9] transition-colors"
                          >
                            <ExternalLink size={12} />
                            {source.title || 'Source'}
                          </a>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                
                {/* ROI Potential */}
                <section className="bg-[#0ea5e9] text-white p-8 rounded-[24px] shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={100} />
                  </div>
                  <h3 className="text-xs font-bold text-[#e0f2fe] uppercase tracking-wider mb-2">Estimated Growth</h3>
                  <div className="text-5xl font-normal mb-4">{analysis.roiPotential.estimatedIncrease}</div>
                  <p className="text-sm text-[#f0f9ff] leading-relaxed opacity-90">{analysis.roiPotential.logic}</p>
                </section>

                {/* Connect & Verify Section */}
                <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                   <h3 className="text-xs font-bold text-[#444746] uppercase tracking-wider mb-4">Contact Info</h3>
                   <div className="space-y-2">
                      {lead.website && (
                        <a href={formatUrl(lead.website)!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f0f9ff] transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0ea5e9]">
                                <Globe size={16} />
                            </div>
                            <span className="text-sm font-medium text-[#1f1f1f]">Website</span>
                          </div>
                          <ExternalLink size={14} className="text-[#e3e3e3] group-hover:text-[#0ea5e9]" />
                        </a>
                      )}
                      
                      {lead.socials && Object.entries(lead.socials).map(([platform, url]) => (
                        url && (
                          <a key={platform} href={formatUrl(url as string)!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f0f9ff] transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f0f9ff] flex items-center justify-center text-[#444746]">
                                {platform === 'facebook' && <Facebook size={16} />}
                                {platform === 'instagram' && <Instagram size={16} />}
                                {platform === 'linkedin' && <Linkedin size={16} />}
                                {platform === 'twitter' && <Twitter size={16} />}
                                {platform === 'youtube' && <Youtube size={16} />}
                              </div>
                              <span className="text-sm font-medium text-[#1f1f1f] capitalize">{platform}</span>
                            </div>
                            <ExternalLink size={14} className="text-[#e3e3e3] group-hover:text-[#0ea5e9]" />
                          </a>
                        )
                      ))}
                   </div>
                </section>

                {/* Channel Health */}
                <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                   <h3 className="text-xs font-bold text-[#444746] uppercase tracking-wider mb-4">Health Check</h3>
                   <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-[#1f1f1f] mb-2">
                          <span>Web Status</span>
                          <span className={analysis.digitalPresence.websiteStatus === 'Strong' ? 'text-[#188038]' : 'text-[#ea8600]'}>{analysis.digitalPresence.websiteStatus}</span>
                        </div>
                        <div className="h-2 bg-[#f0f9ff] rounded-full overflow-hidden">
                          <div className={`h-full ${analysis.digitalPresence.websiteStatus === 'Strong' ? 'w-full bg-[#188038]' : 'w-1/2 bg-[#ea8600]'}`}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm font-medium text-[#1f1f1f] mb-2">
                          <span>SEO</span>
                        </div>
                        <p className="text-xs text-[#444746] bg-[#f0f9ff] p-3 rounded-lg">{analysis.digitalPresence.seoHealth}</p>
                      </div>
                   </div>
                </section>

                {/* Recommendation */}
                <section className="bg-[#e0f2fe] p-6 rounded-[24px] text-[#0284c7]">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={20} className="text-[#0284c7]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Opportunity</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedServices.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-white/60 rounded-full text-xs font-bold">{s}</span>
                    ))}
                  </div>
                </section>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#e0f2fe] bg-white flex justify-end">
          <button onClick={onClose} className="px-8 py-2.5 bg-[#1f1f1f] text-white text-sm font-medium rounded-full hover:shadow-md transition-all">
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadResearchModal;
