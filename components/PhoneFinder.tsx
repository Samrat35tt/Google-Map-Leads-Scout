
import React, { useState } from 'react';
import { Lead } from '../types';
import { Phone, Search, Building, User, Mail, Linkedin, BookmarkPlus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { findDirectDial } from '../services/enrichment';
import { getLLMSettings } from '../services/settingsStore';

interface PhoneFinderProps {
  onSaveContact: (lead: Lead) => void;
  savedContactIds: string[];
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const PhoneFinder: React.FC<PhoneFinderProps> = ({ onSaveContact, savedContactIds, credits, onConsumeCredits }) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Partial<Lead> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain) return;

    if (!onConsumeCredits(10)) return; // Cost 10 credits

    setIsLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(false);

    try {
      const data = await findDirectDial(name, domain, '');
      
      if (data) {
          setResult(data);
      } else {
          setError("No direct match found in Apollo database for this person.");
      }
    } catch (err: any) {
      setError(err.message || "Search failed.");
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  const isSaved = result && result.id && savedContactIds.includes(result.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-2">
         <div className="flex items-center gap-3">
             <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 border border-teal-100">
                <Phone size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">Direct Dials</h1>
                <p className="text-[#444746]">Find mobile numbers and verified emails for decision makers.</p>
             </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-[#e0f2fe]">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
           <div className="md:col-span-5 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Person Name</label>
               <div className="relative">
                 <User className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                 <input
                   type="text"
                   placeholder="e.g. Elon Musk"
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                 />
               </div>
           </div>

           <div className="md:col-span-5 space-y-1.5">
               <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Company Domain</label>
               <div className="relative">
                 <Building className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                 <input
                   type="text"
                   placeholder="e.g. tesla.com"
                   className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                   value={domain}
                   onChange={(e) => setDomain(e.target.value)}
                 />
               </div>
           </div>

           <div className="md:col-span-2 flex items-end">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1f1f1f] text-white h-[52px] rounded-xl font-medium hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={18} /> Find
                    </>
                  )}
                </button>
           </div>
        </form>
        <p className="text-[10px] text-[#444746] mt-3 bg-[#f0f9ff] p-2 rounded-lg mx-auto w-fit">
           Powered by Apollo.io • 10 Credits per search
        </p>
      </div>

      {error && (
         <div className="p-4 bg-[#fce8e6] text-[#b3261e] rounded-2xl flex items-center gap-3 border border-[#f9dedc]">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
         </div>
      )}

      {result && (
        <div className="bg-white rounded-[24px] border border-[#e0f2fe] p-8 shadow-md flex flex-col md:flex-row items-center gap-8 animate-in zoom-in duration-300">
           <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-3xl border border-teal-100">
              {result.name?.charAt(0)}
           </div>
           
           <div className="flex-1 space-y-4">
               <div>
                  <h3 className="text-2xl font-bold text-[#1f1f1f]">{result.name}</h3>
                  <p className="text-[#0ea5e9] font-medium">{result.category} at {domain}</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${result.phone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#444746]">Mobile Number</div>
                      <div className={`font-mono text-lg ${result.phone ? 'text-[#1f1f1f]' : 'text-gray-400'}`}>
                         {result.phone || 'Not Available'}
                      </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${result.email ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#444746]">Verified Email</div>
                      <div className={`font-mono text-lg truncate ${result.email ? 'text-[#1f1f1f]' : 'text-gray-400'}`}>
                         {result.email || 'Not Available'}
                      </div>
                  </div>
               </div>

               {result.socials?.linkedin && (
                  <a href={result.socials.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#0077b5] hover:underline">
                      <Linkedin size={16} /> View LinkedIn Profile
                  </a>
               )}
           </div>

           <div>
              <button 
                  onClick={() => onSaveContact(result as Lead)}
                  disabled={!!isSaved}
                  className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-sm transition-all ${isSaved ? 'bg-green-100 text-[#188038]' : 'bg-[#1f1f1f] text-white hover:bg-black'}`}
              >
                  {isSaved ? <Check size={18} /> : <BookmarkPlus size={18} />}
                  {isSaved ? 'Saved to Contacts' : 'Save Contact'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PhoneFinder;
