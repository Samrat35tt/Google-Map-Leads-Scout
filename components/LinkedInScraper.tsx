
import React, { useState } from 'react';
import { Lead, LinkedInProfileDetails } from '../types';
import { Linkedin, Search, MapPin, Briefcase, Building, ExternalLink, BookmarkPlus, Check, Sparkles, AlertCircle, Eye, Loader2, Shield } from 'lucide-react';
import { searchLinkedInLeadsWithApify } from '../services/apify';
import { enrichLinkedInProfile } from '../services/gemini';
import LinkedInProfileModal from './LinkedInProfileModal';

interface LinkedInScraperProps {
  onSaveContact: (lead: Lead) => void;
  savedContactIds: string[];
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const COMMON_INDUSTRIES = [
  "Software Development",
  "Information Technology",
  "Marketing & Advertising",
  "Financial Services",
  "Real Estate",
  "Healthcare",
  "Construction",
  "Retail",
  "Education Management",
  "Manufacturing",
  "Management Consulting",
  "Legal Services",
  "E-learning",
  "Internet",
  "Telecommunications",
  "Hospitality",
  "Staffing and Recruiting",
  "Insurance",
  "Banking",
  "Design"
];

const LinkedInScraper: React.FC<LinkedInScraperProps> = ({ onSaveContact, savedContactIds, credits, onConsumeCredits }) => {
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [safeMode, setSafeMode] = useState(true);

  // Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState<Lead | null>(null);
  const [profileDetails, setProfileDetails] = useState<LinkedInProfileDetails | null>(null);
  const [isEnriching, setIsEnriching] = useState<string | null>(null); // ID of lead being enriched

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !location) return;

    if (!onConsumeCredits(15)) return; // Cost 15 credits

    setIsLoading(true);
    setError(null);
    setResults([]);
    
    // Artificial Delay for Safe Mode
    if (safeMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    try {
      // Using the real Apify service
      const leads = await searchLinkedInLeadsWithApify(role, location, industry);
      
      if (leads.length === 0) {
          setError("No profiles found. Try broadening your search terms.");
      } else {
          setResults(leads);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to LinkedIn Scraper. Please check your configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = async (lead: Lead) => {
    if (profileDetails && selectedProfile?.id === lead.id) {
       // Already loaded
       setSelectedProfile(lead);
       return;
    }

    if (!onConsumeCredits(20)) return; // Cost for deep enrichment

    setIsEnriching(lead.id);
    try {
       const details = await enrichLinkedInProfile(lead);
       setProfileDetails(details);
       setSelectedProfile(lead);
    } catch (e: any) {
       alert(`Failed to enrich profile: ${e.message}`);
    } finally {
       setIsEnriching(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-2">
         <div className="flex items-center gap-3">
             <div className="p-3 bg-[#0077b5]/10 rounded-2xl text-[#0077b5]">
                <Linkedin size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">LinkedIn Scout</h1>
                <p className="text-[#444746]">Find decision makers via Apify & Enrich via Gemini.</p>
             </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-[#e0f2fe]">
        
        {/* Safe Mode Toggle */}
        <div className="flex justify-end mb-4">
            <div 
                onClick={() => setSafeMode(!safeMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${safeMode ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                title={safeMode ? "Slows down requests to prevent bans" : "High speed, higher risk"}
            >
                <Shield size={12} />
                {safeMode ? 'Safe Mode: On (Recommended)' : 'Safe Mode: Off'}
            </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
           <div className="md:col-span-4 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Job Title</label>
               <div className="relative">
                 <Briefcase className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                 <input
                   type="text"
                   placeholder="e.g. CEO, Marketing Director"
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={role}
                   onChange={(e) => setRole(e.target.value)}
                 />
               </div>
           </div>

           <div className="md:col-span-3 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Location</label>
               <div className="relative">
                 <MapPin className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                 <input
                   type="text"
                   placeholder="e.g. San Francisco, London"
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={location}
                   onChange={(e) => setLocation(e.target.value)}
                 />
               </div>
           </div>

           <div className="md:col-span-3 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Industry (Optional)</label>
               <div className="relative">
                 <Building className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                 <input
                   type="text"
                   list="linkedin-industries"
                   placeholder="e.g. SaaS, Healthcare"
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={industry}
                   onChange={(e) => setIndustry(e.target.value)}
                 />
                 <datalist id="linkedin-industries">
                    {COMMON_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} />
                    ))}
                 </datalist>
               </div>
           </div>

           <div className="md:col-span-2 flex items-end">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0077b5] text-white h-[52px] rounded-xl font-medium hover:bg-[#006097] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={18} /> Find Leads
                    </>
                  )}
                </button>
           </div>
        </form>
        {safeMode && (
            <p className="text-center text-[10px] text-[#444746] mt-3 bg-[#f0f9ff] p-2 rounded-lg mx-auto w-fit">
                <Shield size={10} className="inline mr-1" />
                Scraping limited to 10 profiles per batch to protect your IP reputation.
            </p>
        )}
      </div>
      
      {error && (
         <div className="p-4 bg-[#fce8e6] text-[#b3261e] rounded-2xl flex items-center gap-3 border border-[#f9dedc]">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
         </div>
      )}

      {results.length > 0 && (
         <div className="bg-white rounded-[24px] border border-[#e0f2fe] overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-[#e0f2fe]">
                     <thead className="bg-white">
                         <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Professional</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Company & Role</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Contact</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[#444746] tracking-wide">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-[#e0f2fe]">
                        {results.map((lead) => {
                            const isSaved = savedContactIds.includes(lead.id);
                            const companyName = lead.address?.split('•')[0] || 'Unknown';
                            
                            return (
                               <tr key={lead.id} className="hover:bg-[#f0f9ff] transition-colors">
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full bg-[#0077b5] text-white flex items-center justify-center font-bold text-sm">
                                               {lead.name.charAt(0)}
                                           </div>
                                           <div>
                                               <div className="font-medium text-[#1f1f1f]">{lead.name}</div>
                                               {lead.socials?.linkedin && (
                                                   <a href={lead.socials.linkedin} target="_blank" rel="noreferrer" className="text-xs text-[#0077b5] flex items-center gap-1 hover:underline">
                                                       <Linkedin size={10} /> LinkedIn Profile
                                                   </a>
                                               )}
                                           </div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="font-medium text-[#1f1f1f]">{lead.category}</div>
                                       <div className="text-sm text-[#444746] flex items-center gap-1">
                                          <Building size={12} /> {companyName}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       {lead.email ? (
                                           <div className="text-sm text-[#444746]">{lead.email}</div>
                                       ) : (
                                           <span className="text-xs text-amber-600 italic">Email not found</span>
                                       )}
                                       {lead.website && (
                                           <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-xs text-[#0ea5e9] hover:underline flex items-center gap-1 mt-1">
                                               <ExternalLink size={10} /> Company Site
                                           </a>
                                       )}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       <div className="flex justify-end gap-2">
                                          <button 
                                             onClick={() => handleViewProfile(lead)}
                                             className="flex items-center gap-2 px-4 py-2 bg-[#f0f9ff] text-[#0077b5] rounded-full text-xs font-medium hover:bg-[#e0f2fe] transition-colors border border-transparent hover:border-[#0077b5]/20"
                                          >
                                              {isEnriching === lead.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                                              {isEnriching === lead.id ? 'Analyzing...' : 'Deep Dive'}
                                          </button>

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
                                       </div>
                                   </td>
                               </tr>
                            );
                        })}
                     </tbody>
                 </table>
             </div>
         </div>
      )}

      {selectedProfile && profileDetails && (
         <LinkedInProfileModal 
            lead={selectedProfile}
            details={profileDetails}
            onClose={() => setSelectedProfile(null)}
            credits={credits}
            onConsumeCredits={onConsumeCredits}
         />
      )}
    </div>
  );
};

export default LinkedInScraper;
