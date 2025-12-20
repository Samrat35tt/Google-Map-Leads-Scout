
import React from 'react';
import { Lead } from '../types';
import { Phone, Globe, MapPin, Star, FileText, Mail, Facebook, Linkedin, Instagram, Twitter, Youtube, Eye, MessageSquare, ExternalLink } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onGenerateScript: (lead: Lead) => void;
  onResearch: (lead: Lead) => void;
  isLoading: boolean;
}

const LeadTable: React.FC<LeadTableProps> = ({ leads, onGenerateScript, onResearch, isLoading }) => {
  const formatUrl = (url: string | null) => {
    if (!url) return null;
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    return formatted;
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
          <p className="text-slate-500 animate-pulse font-medium">Mapx is scanning GMB profiles...</p>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
        <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900">No leads found yet</h3>
        <p className="text-slate-500 mt-1">Select an industry and area to start scouting.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Business</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">GMB Stats</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Contact & Socials</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {leads.map((lead) => {
              const websiteUrl = formatUrl(lead.website);
              return (
                <tr key={lead.id} className="hover:bg-sky-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{lead.name}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                        <MapPin size={10} className="shrink-0" /> {lead.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-400">
                           <Star size={12} fill="currentColor" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{lead.rating || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <MessageSquare size={10} /> {lead.reviewCount || 0} Reviews
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-0.5">
                        {lead.email && (
                          <div className="flex items-center gap-2 text-xs text-sky-600 font-bold">
                            <Mail size={12} /> {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                            <Phone size={12} /> {lead.phone}
                          </div>
                        )}
                      </div>

                      {websiteUrl && (
                        <a 
                          href={websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 hover:text-sky-800 underline decoration-sky-200"
                        >
                          <Globe size={12} />
                          Visit Website
                        </a>
                      )}

                      {/* Social Icons Row */}
                      {lead.socials && Object.keys(lead.socials).length > 0 && (
                        <div className="flex items-center gap-2.5 mt-1">
                          {lead.socials.facebook && (
                            <a href={formatUrl(lead.socials.facebook)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-sky-600 transition-colors">
                              <Facebook size={14} />
                            </a>
                          )}
                          {lead.socials.instagram && (
                            <a href={formatUrl(lead.socials.instagram)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-sky-600 transition-colors">
                              <Instagram size={14} />
                            </a>
                          )}
                          {lead.socials.linkedin && (
                            <a href={formatUrl(lead.socials.linkedin)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-sky-600 transition-colors">
                              <Linkedin size={14} />
                            </a>
                          )}
                          {lead.socials.twitter && (
                            <a href={formatUrl(lead.socials.twitter)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-sky-600 transition-colors">
                              <Twitter size={14} />
                            </a>
                          )}
                          {lead.socials.youtube && (
                            <a href={formatUrl(lead.socials.youtube)!} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-sky-600 transition-colors">
                              <Youtube size={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onResearch(lead)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Deep Audit">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => onGenerateScript(lead)} className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white text-xs font-black rounded-lg hover:bg-sky-700 transition-all shadow-md active:scale-95 uppercase tracking-widest">
                        <FileText size={14} /> Script
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;
