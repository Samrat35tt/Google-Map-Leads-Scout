import React, { useState } from 'react';
import { Lead } from '../types';
import { Search, MapPin, Hash, Users, ExternalLink, BookmarkPlus, Check, AlertCircle, Facebook, Instagram, Twitter } from 'lucide-react';
import { searchSocialMediaLeads } from '../services/apify';

interface SocialScraperProps {
  platform: 'facebook' | 'instagram' | 'twitter';
  onSaveContact: (lead: Lead) => void;
  savedContactIds: string[];
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const SocialScraper: React.FC<SocialScraperProps> = ({ platform, onSaveContact, savedContactIds, credits, onConsumeCredits }) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  const config = {
    facebook: {
      color: 'bg-[#1877F2]',
      lightColor: 'bg-[#1877F2]/10',
      textColor: 'text-[#1877F2]',
      hoverColor: 'hover:bg-[#1877F2]',
      icon: Facebook,
      title: 'Facebook Pages Scout',
      desc: 'Find business pages and public profiles.',
      placeholder: 'e.g. Plumbers, Real Estate Agents'
    },
    instagram: {
      color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      lightColor: 'bg-[#dc2743]/10',
      textColor: 'text-[#dc2743]',
      hoverColor: 'hover:opacity-90',
      icon: Instagram,
      title: 'Instagram Influencer Scout',
      desc: 'Find profiles via bio keywords & hashtags.',
      placeholder: 'e.g. #fitnesscoach, "Interior Design"'
    },
    twitter: {
      color: 'bg-black',
      lightColor: 'bg-black/10',
      textColor: 'text-black',
      hoverColor: 'hover:bg-gray-800',
      icon: Twitter,
      title: 'X (Twitter) Bio Scout',
      desc: 'Find professionals discussing specific topics.',
      placeholder: 'e.g. "SaaS Founder", "Crypto"'
    }
  }[platform];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !location) return;

    if (!onConsumeCredits(15)) return; 

    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const leads = await searchSocialMediaLeads(platform, keyword, location);
      
      if (leads.length === 0) {
          setError("No results found. Try broader keywords.");
      } else {
          setResults(leads);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-2">
         <div className="flex items-center gap-3">
             <div className={`p-3 rounded-2xl ${config.lightColor} ${config.textColor}`}>
                <Icon size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">{config.title}</h1>
                <p className="text-[#444746]">{config.desc}</p>
             </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-[#e0f2fe]">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
           <div className="md:col-span-5 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">
                  {platform === 'instagram' ? 'Hashtag / Keyword' : 'Niche / Keyword'}
               </label>
               <div className="relative">
                 {platform === 'instagram' ? <Hash className="absolute left-4 top-3.5 text-[#444746]" size={18} /> : <Users className="absolute left-4 top-3.5 text-[#444746]" size={18} />}
                 <input
                   type="text"
                   placeholder={config.placeholder}
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={keyword}
                   onChange={(e) => setKeyword(e.target.value)}
                 />
               </div>
           </div>

           <div className="md:col-span-5 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Location</label>
               <div className="relative">
                 <MapPin className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                 <input
                   type="text"
                   placeholder="e.g. Miami, FL"
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={location}
                   onChange={(e) => setLocation(e.target.value)}
                 />
               </div>
           </div>

           <div className="md:col-span-2 flex items-end">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white h-[52px] rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md ${config.color} ${config.hoverColor}`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={18} /> Scout
                    </>
                  )}
                </button>
           </div>
        </form>
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
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Name / Page</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#444746] tracking-wide">Details</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[#444746] tracking-wide">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-[#e0f2fe]">
                        {results.map((lead) => {
                            const isSaved = savedContactIds.includes(lead.id);
                            
                            return (
                               <tr key={lead.id} className="hover:bg-[#f0f9ff] transition-colors">
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                           <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm ${config.color}`}>
                                               {lead.name.charAt(0)}
                                           </div>
                                           <div>
                                               <div className="font-medium text-[#1f1f1f]">{lead.name}</div>
                                               <a href={lead.socials?.[platform]} target="_blank" rel="noreferrer" className={`text-xs flex items-center gap-1 hover:underline ${config.textColor}`}>
                                                   <Icon size={10} /> View Profile
                                               </a>
                                           </div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className="font-medium text-[#1f1f1f]">{lead.category}</div>
                                       <div className="text-sm text-[#444746] flex items-center gap-1">
                                          <MapPin size={12} /> {lead.address}
                                       </div>
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

export default SocialScraper;