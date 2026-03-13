
import React, { useState } from 'react';
import { Lead } from '../types';
import { Share2, Search, Facebook, Instagram, Twitter, Linkedin, CheckCircle, AlertCircle, Loader2, BookmarkPlus, Check, Globe } from 'lucide-react';
import { findSocialHandles } from '../services/gemini';

interface SocialBulkScraperProps {
  onSaveContact: (lead: Lead) => void;
  savedContactIds: string[];
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const SocialBulkScraper: React.FC<SocialBulkScraperProps> = ({ onSaveContact, savedContactIds, credits, onConsumeCredits }) => {
  const [inputMode, setInputMode] = useState<'text' | 'csv'>('text');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const COST_PER_ENTITY = 5;

  const processBulk = async () => {
    let entities: { name: string, location: string }[] = [];

    if (inputMode === 'text') {
        const lines = inputText.split('\n').filter(l => l.trim().length > 0);
        entities = lines.map(line => {
            // Simple logic to split name and location (e.g. "Joe's Pizza, NYC")
            const parts = line.split(',');
            if (parts.length > 1) {
                const location = parts.pop()?.trim() || '';
                const name = parts.join(',').trim();
                return { name, location };
            } else {
                return { name: line.trim(), location: '' }; // Fallback
            }
        });
    }

    if (entities.length === 0) {
        alert("Please enter at least one business.");
        return;
    }

    const totalCost = entities.length * COST_PER_ENTITY;
    if (!onConsumeCredits(totalCost)) {
        alert(`Insufficient credits. You need ${totalCost} credits for this bulk operation.`);
        return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: entities.length });
    setResults([]);

    const newResults: Lead[] = [];

    // Process sequentially to manage rate limits and allow "stop" logic if we added it
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        try {
            const data = await findSocialHandles(entity.name, entity.location);
            
            const lead: Lead = {
                id: `social-bulk-${Date.now()}-${i}`,
                name: entity.name,
                address: entity.location,
                phone: null,
                email: null,
                website: data.website || null,
                category: data.category || 'Unknown', // Confidence level stored here temporarily
                socials: data.socials,
                rating: null,
                reviewCount: 0
            };
            
            newResults.push(lead);
            setResults(prev => [...prev, lead]);
        } catch (e) {
            console.error("Error processing " + entity.name, e);
        }
        setProgress({ current: i + 1, total: entities.length });
    }

    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
         <div className="flex items-center gap-3">
             <div className="p-3 bg-gradient-to-tr from-[#6366f1] to-[#a855f7] rounded-2xl text-white shadow-md">
                <Share2 size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">Multi-Channel Discovery</h1>
                <p className="text-[#444746]">Bulk find Facebook, Instagram, X, and LinkedIn profiles with one click.</p>
             </div>
         </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-[#e0f2fe]">
         <div className="flex gap-4 mb-4 border-b border-[#f0f9ff] pb-2">
            <button 
                onClick={() => setInputMode('text')} 
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${inputMode === 'text' ? 'border-[#0ea5e9] text-[#0ea5e9]' : 'border-transparent text-[#444746]'}`}
            >
                Manual Entry
            </button>
            <button 
                onClick={() => alert("CSV Upload coming soon. Use Manual Entry for now.")} 
                className={`text-sm font-medium pb-2 border-b-2 transition-colors border-transparent text-[#444746] opacity-50 cursor-not-allowed`}
            >
                Upload CSV
            </button>
         </div>

         <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider block mb-2">
                    Enter Business Names (One per line)
                </label>
                <p className="text-xs text-[#444746] mb-2">Format: "Business Name, City"</p>
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Joe's Pizza, New York\nTechStart Inc, San Francisco\nThe Coffee House, London`}
                    rows={6}
                    disabled={isProcessing}
                    className="w-full p-4 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f] font-mono text-sm"
                />
            </div>
            
            <div className="flex justify-end items-center gap-4">
                {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-[#0ea5e9] font-medium">
                        <Loader2 className="animate-spin" size={16} />
                        Processing {progress.current} / {progress.total}
                    </div>
                )}
                <button 
                    onClick={processBulk}
                    disabled={isProcessing || !inputText}
                    className="px-8 py-3 bg-[#1f1f1f] text-white rounded-full font-medium shadow-md hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Search size={18} /> Start Deep Research
                </button>
            </div>
         </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
         <div className="bg-white rounded-[24px] border border-[#e0f2fe] overflow-hidden shadow-sm">
             <div className="p-4 border-b border-[#e0f2fe] bg-[#f8fafc] flex justify-between items-center">
                <h3 className="font-medium text-[#1f1f1f]">Discovery Results</h3>
                <span className="text-xs text-[#444746]">Confidence Score based on data verification</span>
             </div>
             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-[#e0f2fe]">
                     <thead className="bg-white">
                         <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Business</th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-[#444746] tracking-wide">Facebook</th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-[#444746] tracking-wide">Instagram</th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-[#444746] tracking-wide">X (Twitter)</th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-[#444746] tracking-wide">LinkedIn</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[#444746] tracking-wide">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-[#e0f2fe]">
                        {results.map((lead) => {
                            const isSaved = savedContactIds.includes(lead.id);
                            const confidence = lead.category; // We stored confidence here

                            return (
                               <tr key={lead.id} className="hover:bg-[#f0f9ff] transition-colors">
                                   <td className="px-6 py-4">
                                       <div className="font-medium text-[#1f1f1f]">{lead.name}</div>
                                       <div className="text-xs text-[#444746]">{lead.address}</div>
                                       {lead.website && (
                                            <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-[#0ea5e9] hover:underline mt-1">
                                                <Globe size={10} /> Website
                                            </a>
                                       )}
                                       <div className={`text-[10px] mt-1 font-bold ${
                                           confidence === 'High' ? 'text-green-600' : 
                                           confidence === 'Medium' ? 'text-amber-600' : 'text-red-500'
                                       }`}>
                                           {confidence} Confidence
                                       </div>
                                   </td>
                                   
                                   {/* Social Columns */}
                                   <td className="px-6 py-4 text-center">
                                       {lead.socials?.facebook ? (
                                           <a href={lead.socials.facebook} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-blue-50 text-[#1877F2] rounded-full hover:bg-blue-100">
                                               <Facebook size={16} />
                                           </a>
                                       ) : <span className="text-gray-300">-</span>}
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       {lead.socials?.instagram ? (
                                           <a href={lead.socials.instagram} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-pink-50 text-[#dc2743] rounded-full hover:bg-pink-100">
                                               <Instagram size={16} />
                                           </a>
                                       ) : <span className="text-gray-300">-</span>}
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       {lead.socials?.twitter ? (
                                           <a href={lead.socials.twitter} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-gray-100 text-black rounded-full hover:bg-gray-200">
                                               <Twitter size={16} />
                                           </a>
                                       ) : <span className="text-gray-300">-</span>}
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       {lead.socials?.linkedin ? (
                                           <a href={lead.socials.linkedin} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-blue-50 text-[#0077b5] rounded-full hover:bg-blue-100">
                                               <Linkedin size={16} />
                                           </a>
                                       ) : <span className="text-gray-300">-</span>}
                                   </td>

                                   <td className="px-6 py-4 text-right">
                                       <button
                                          onClick={() => !isSaved && onSaveContact(lead)}
                                          disabled={isSaved}
                                          className={`p-2 rounded-full transition-colors ${
                                            isSaved 
                                            ? 'text-[#188038] bg-green-50' 
                                            : 'text-[#444746] hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10'
                                          }`}
                                       >
                                          {isSaved ? <Check size={18} /> : <BookmarkPlus size={18} />}
                                       </button>
                                   </td>
                               </tr>
                            );
                        })}
                     </tbody>
                 </table>
             </div>
         </div>
      )}
    </div>
  );
};

export default SocialBulkScraper;
