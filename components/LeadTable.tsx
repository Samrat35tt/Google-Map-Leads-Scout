import React from 'react';
import { Lead } from '../types';
import { Phone, Globe, MapPin, Star, FileText, Mail, Facebook, Linkedin, Instagram, Twitter, Youtube, Eye } from 'lucide-react';

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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 animate-pulse">Scouting for leads, verifying emails, and finding social profiles...</p>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
        <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900">No leads found yet</h3>
        <p className="text-slate-500 mt-1">Start by searching for an industry and location above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Business</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Info</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {leads.map((lead) => {
              const websiteUrl = formatUrl(lead.website);
              return (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{lead.name}</span>
                      <span className="text-xs text-slate-500">{lead.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      {lead.email ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                          <Mail size={14} className="text-indigo-500" />
                          {lead.email}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic pl-6">No email found</span>
                      )}
                      
                      {lead.phone ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {lead.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic pl-6">No phone</span>
                      )}
                      
                      {websiteUrl ? (
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                          <Globe size={14} />
                          Visit Website
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic pl-6">No website</span>
                      )}

                      {/* Social Media Links */}
                      {lead.socials && Object.keys(lead.socials).length > 0 && (
                        <div className="flex items-center gap-3 mt-1 pl-6">
                          {lead.socials.facebook && (
                            <a href={formatUrl(lead.socials.facebook) || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors" title="Facebook">
                              <Facebook size={16} />
                            </a>
                          )}
                          {lead.socials.instagram && (
                            <a href={formatUrl(lead.socials.instagram) || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-colors" title="Instagram">
                              <Instagram size={16} />
                            </a>
                          )}
                          {lead.socials.linkedin && (
                            <a href={formatUrl(lead.socials.linkedin) || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                              <Linkedin size={16} />
                            </a>
                          )}
                          {lead.socials.twitter && (
                            <a href={formatUrl(lead.socials.twitter) || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1DA1F2] transition-colors" title="Twitter/X">
                              <Twitter size={16} />
                            </a>
                          )}
                          {lead.socials.youtube && (
                            <a href={formatUrl(lead.socials.youtube) || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#FF0000] transition-colors" title="YouTube">
                              <Youtube size={16} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{lead.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.rating ? (
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full w-fit">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-medium">{lead.rating}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onResearch(lead)}
                        className="text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 p-2 rounded-lg transition-colors shadow-sm"
                        title="Deep Dive Research"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onGenerateScript(lead)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <FileText size={14} />
                        Script
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