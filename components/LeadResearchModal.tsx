import React from 'react';
import { Lead, LeadAnalysis } from '../types';
import { X, Globe, BarChart3, ThumbsUp, ThumbsDown, AlertCircle, Sparkles, Search } from 'lucide-react';

interface LeadResearchModalProps {
  lead: Lead;
  analysis: LeadAnalysis | null;
  isLoading: boolean;
  onClose: () => void;
}

const LeadResearchModal: React.FC<LeadResearchModalProps> = ({ lead, analysis, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-800">{lead.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Research Report
                </span>
            </div>
            <p className="text-sm text-slate-500">{lead.address}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 py-12">
               <div className="relative">
                 <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                 <Search className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-lg font-medium text-slate-900">Analyzing Digital Footprint</h3>
                 <p className="text-slate-500 text-sm max-w-xs mx-auto">Scanning website, reading recent reviews, and identifying marketing gaps...</p>
               </div>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Executive Summary */}
              <div className="col-span-1 md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-500" /> Executive Summary
                </h3>
                <p className="text-slate-700 leading-relaxed">{analysis.overview}</p>
              </div>

              {/* Digital Presence */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe size={14} className="text-blue-500" /> Digital Presence
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="text-slate-600 text-sm">Website Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            analysis.digitalPresence.websiteStatus === 'Strong' ? 'bg-green-100 text-green-700' :
                            analysis.digitalPresence.websiteStatus === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>{analysis.digitalPresence.websiteStatus}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="text-slate-600 text-sm">Social Activity</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            analysis.digitalPresence.socialActivity === 'High' ? 'bg-green-100 text-green-700' :
                            analysis.digitalPresence.socialActivity === 'Moderate' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>{analysis.digitalPresence.socialActivity}</span>
                    </div>
                    <div>
                        <span className="text-slate-600 text-sm block mb-1">SEO Health</span>
                        <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded">{analysis.digitalPresence.seoHealth}</p>
                    </div>
                </div>
              </div>

              {/* Reputation */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 size={14} className="text-purple-500" /> Reputation Audit
                </h3>
                <div className="mb-4">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                         analysis.reputation.sentiment === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                         analysis.reputation.sentiment === 'Negative' ? 'bg-red-50 text-red-700 border-red-200' :
                         'bg-gray-50 text-gray-700 border-gray-200'
                     }`}>
                        {analysis.reputation.sentiment === 'Positive' ? <ThumbsUp size={12}/> : <ThumbsDown size={12}/>}
                        {analysis.reputation.sentiment} Sentiment
                     </span>
                </div>
                
                <div className="space-y-3">
                    {analysis.reputation.keyComplaints.length > 0 && (
                        <div>
                            <span className="text-xs text-red-500 font-semibold uppercase">Key Complaints</span>
                            <ul className="mt-1 space-y-1">
                                {analysis.reputation.keyComplaints.map((c, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="mt-0.5 w-1 h-1 rounded-full bg-red-400 shrink-0"></span> {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {analysis.reputation.keyPraises.length > 0 && (
                        <div>
                            <span className="text-xs text-green-600 font-semibold uppercase">Key Praises</span>
                            <ul className="mt-1 space-y-1">
                                {analysis.reputation.keyPraises.map((p, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                        <span className="mt-0.5 w-1 h-1 rounded-full bg-green-400 shrink-0"></span> {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
              </div>

              {/* Marketing Gaps */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500" /> Detected Gaps
                </h3>
                <ul className="space-y-2">
                    {analysis.marketingGaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 p-2 bg-red-50/50 rounded-lg border border-red-100">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            {gap}
                        </li>
                    ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-indigo-600 p-5 rounded-xl border border-indigo-500 shadow-sm text-white">
                <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-white" /> Recommended Pitch
                </h3>
                <p className="text-sm text-indigo-100 mb-3">Based on our audit, pitch these services:</p>
                <div className="flex flex-wrap gap-2">
                    {analysis.suggestedServices.map((service, i) => (
                        <span key={i} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-medium">
                            {service}
                        </span>
                    ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                Close Report
            </button>
        </div>
      </div>
    </div>
  );
};

export default LeadResearchModal;