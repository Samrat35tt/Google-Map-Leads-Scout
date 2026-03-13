
import React, { useState } from 'react';
import { Lead } from '../types';
import { Phone, Globe, MapPin, Star, FileText, Mail, Eye, ExternalLink, BookmarkPlus, Check, ShieldCheck, AlertCircle, Database, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onGenerateScript: (lead: Lead) => void;
  onResearch: (lead: Lead) => void;
  onSaveContact?: (lead: Lead) => void;
  savedContactIds?: string[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

const LeadTable: React.FC<LeadTableProps> = React.memo(({ leads, onGenerateScript, onResearch, onSaveContact, savedContactIds = [], isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const formatUrl = (url: string | null) => {
    if (!url) return null;
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    return formatted;
  };

  const getSourceIcon = (source?: string) => {
      switch(source) {
          case 'apollo': return <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[8px] font-bold" title="Sourced from Apollo">A</div>;
          case 'hunter': return <div className="w-4 h-4 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-[8px] font-bold" title="Sourced from Hunter">H</div>;
          case 'ai_inferred': return <div className="w-4 h-4 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-[8px] font-bold" title="Inferred by AI (Risky)">AI</div>;
          default: return <div title="Unknown Source"><Database size={12} className="text-gray-400" /></div>;
      }
  };

  if (isLoading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center gap-3">
         <div className="w-10 h-10 border-4 border-[#e0f2fe] border-t-[#0ea5e9] rounded-full animate-spin"></div>
         <p className="text-sm text-[#444746] font-medium">Loading results...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-[24px] border border-[#e0f2fe]">
        <div className="w-16 h-16 bg-[#f0f9ff] rounded-full flex items-center justify-center mx-auto mb-4">
           <MapPin className="h-8 w-8 text-[#444746]" />
        </div>
        <h3 className="text-lg font-medium text-[#1f1f1f]">No leads found yet</h3>
        <p className="text-[#444746] mt-1 text-sm">Select an industry and area above to start scouting.</p>
      </div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(leads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLeads = leads.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  return (
    <div className="bg-white rounded-[24px] border border-[#e0f2fe] overflow-hidden shadow-sm animate-in fade-in duration-500">
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e0f2fe]">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Business</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Reputation</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Contact Data</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[#444746] tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e0f2fe]">
            {currentLeads.map((lead) => {
              const websiteUrl = formatUrl(lead.website);
              const isSaved = savedContactIds.includes(lead.id);

              return (
                <tr key={lead.id} className="hover:bg-[#f0f9ff] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center text-sm font-bold shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#1f1f1f]">{lead.name}</span>
                        <span className="text-xs text-[#444746]">{lead.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#1f1f1f]">{lead.rating || '-'}</span>
                      <Star size={14} className={lead.rating ? "fill-[#FBBC05] text-[#FBBC05]" : "text-[#e3e3e3]"} />
                      <span className="text-xs text-[#444746]">({lead.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                        {lead.email ? (
                            <div className="flex items-center gap-2">
                                {lead.emailStatus === 'verified' ? (
                                    <div title="Verified Email"><ShieldCheck size={14} className="text-green-600" /></div>
                                ) : lead.emailStatus === 'risky' ? (
                                    <div title="Risky/Catch-all"><AlertCircle size={14} className="text-amber-500" /></div>
                                ) : (
                                    <Mail size={14} className="text-[#444746]" />
                                )}
                                <span className={`text-xs ${lead.emailStatus === 'verified' ? 'text-green-700 font-medium' : 'text-[#444746]'}`}>{lead.email}</span>
                                {getSourceIcon(lead.emailSource)}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-[#444746] opacity-60">
                                <Mail size={14} /> No Email Found
                            </div>
                        )}

                        {websiteUrl && (
                          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#0ea5e9] hover:underline">
                            <Globe size={12} /> Website
                          </a>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onSaveContact && (
                        <button
                          onClick={() => !isSaved && onSaveContact(lead)}
                          disabled={isSaved}
                          className={`p-2 rounded-full transition-colors ${
                            isSaved 
                            ? 'text-[#188038] bg-green-50' 
                            : 'text-[#444746] hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10'
                          }`}
                          title={isSaved ? "Saved to Contacts" : "Save to Contacts"}
                        >
                          {isSaved ? <Check size={18} /> : <BookmarkPlus size={18} />}
                        </button>
                      )}
                      <button 
                        onClick={() => onResearch(lead)} 
                        className="p-2 text-[#444746] hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10 rounded-full transition-colors" 
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => onGenerateScript(lead)} 
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#e0f2fe] text-[#0284c7] text-xs font-medium rounded-full hover:shadow-md transition-all"
                      >
                        <FileText size={14} /> Pitch
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
          {currentLeads.map((lead) => {
              const websiteUrl = formatUrl(lead.website);
              const isSaved = savedContactIds.includes(lead.id);
              
              return (
                  <div key={lead.id} className="p-4 border-b border-[#e0f2fe] hover:bg-[#f0f9ff]">
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center text-sm font-bold shrink-0">
                                  {lead.name.charAt(0)}
                              </div>
                              <div>
                                  <h4 className="font-medium text-[#1f1f1f] text-sm">{lead.name}</h4>
                                  <span className="text-xs text-[#444746]">{lead.category}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-1 bg-[#f0f9ff] px-2 py-1 rounded text-xs">
                              <span className="font-bold text-[#1f1f1f]">{lead.rating || '-'}</span>
                              <Star size={10} className="fill-[#FBBC05] text-[#FBBC05]" />
                          </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                          {lead.email && (
                              <div className="flex items-center gap-2 text-xs text-[#444746]">
                                  <Mail size={12} /> {lead.email}
                              </div>
                          )}
                          {websiteUrl && (
                              <a href={websiteUrl} className="flex items-center gap-2 text-xs text-[#0ea5e9]">
                                  <Globe size={12} /> Visit Website
                              </a>
                          )}
                      </div>

                      <div className="flex gap-2">
                          <button 
                            onClick={() => onGenerateScript(lead)} 
                            className="flex-1 py-2 bg-[#e0f2fe] text-[#0284c7] text-xs font-medium rounded-lg text-center"
                          >
                            Generate Pitch
                          </button>
                          <button 
                            onClick={() => onResearch(lead)} 
                            className="p-2 border border-[#e0f2fe] rounded-lg text-[#444746]"
                          >
                            <Eye size={16} />
                          </button>
                          {onSaveContact && (
                            <button
                              onClick={() => !isSaved && onSaveContact(lead)}
                              disabled={isSaved}
                              className={`p-2 rounded-lg border ${
                                isSaved ? 'bg-green-50 text-green-700 border-green-100' : 'border-[#e0f2fe] text-[#444746]'
                              }`}
                            >
                              {isSaved ? <Check size={16} /> : <BookmarkPlus size={16} />}
                            </button>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {/* Pagination Controls */}
      {leads.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-[#e0f2fe] bg-[#f8fafc] flex justify-between items-center">
              <span className="text-xs text-[#444746]">
                  Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-[#e0f2fe] rounded-lg text-[#444746] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f0f9ff]"
                  >
                      <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-[#e0f2fe] rounded-lg text-[#444746] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f0f9ff]"
                  >
                      <ChevronRight size={16} />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
});

export default LeadTable;
