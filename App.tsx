
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LeadTable from './components/LeadTable';
import ScriptGenerator from './components/ScriptGenerator';
import LeadResearchModal from './components/LeadResearchModal';
import PricingModal from './components/PricingModal';
import { Lead, SearchState, GroundingChunk, LeadAnalysis, PricingPlan } from './types';
import { searchLeadsWithGemini, getPostalCodesForCountry, analyzeLeadWithGemini } from './services/gemini';
import { Search, ExternalLink, AlertTriangle, Map, Navigation, Zap, CheckCircle2 } from 'lucide-react';

const COMMON_INDUSTRIES = [
  "Accounting Firms", "Architects", "Auto Repair Shops", "Barbershops", "Beauty Salons",
  "Bookkeepers", "Business Consultants", "Car Dealerships", "Catering Services",
  "Chiropractors", "Cleaning Services", "Coffee Shops", "Construction Companies",
  "Criminal Defense Lawyers", "Daycare Centers", "Dentists", "Digital Marketing Agencies",
  "E-commerce Brands", "Electricians", "Event Planners", "Family Law Attorneys",
  "Financial Advisors", "Florists", "Graphic Designers", "Gyms & Fitness Centers",
  "Hotels", "HVAC Contractors", "Insurance Agencies", "Interior Designers",
  "IT Support Services", "Landscapers", "Law Firms", "Medical Spas", "Mortgage Brokers",
  "Moving Companies", "Orthodontists", "Painters", "Personal Injury Lawyers",
  "Pest Control Services", "Pet Groomers", "Photographers", "Physiotherapists",
  "Plumbers", "Psychologists", "Real Estate Agents", "Restaurants", "Retail Stores",
  "Roofers", "SEO Agencies", "Software Companies", "Solar Installers", "Veterinarians",
  "Video Production Companies", "Web Design Agencies", "Wedding Planners", "Yoga Studios"
];

// Usage Costs
const COST_SEARCH = 10;
const COST_RESEARCH = 15;
// Script cost is handled in ScriptGenerator

const App = () => {
  const [searchParams, setSearchParams] = useState<SearchState>({
    industry: '',
    country: '',
    postalCode: '',
    radius: '10'
  });
  
  const [credits, setCredits] = useState(50); // Default Starter Balance
  const [showPricing, setShowPricing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
  const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Research Cache (Maps leadId to its analysis including grounding)
  const [researchCache, setResearchCache] = useState<Record<string, LeadAnalysis & { groundingChunks?: any[] }>>({});

  // Modals
  const [selectedScriptLead, setSelectedScriptLead] = useState<Lead | null>(null);
  const [selectedResearchLead, setSelectedResearchLead] = useState<Lead | null>(null);
  const [researchData, setResearchData] = useState<(LeadAnalysis & { groundingChunks?: any[] }) | null>(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);

  useEffect(() => {
    // Check for payment success from Stripe Redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
       const planId = params.get('plan');
       if (planId === 'growth') setCredits(prev => prev + 500);
       if (planId === 'agency') setCredits(prev => prev + 2500);
       
       setPaymentSuccess(true);
       // Clean URL
       window.history.replaceState({}, '', window.location.pathname);
       setTimeout(() => setPaymentSuccess(false), 5000);
    }
  }, []);

  useEffect(() => {
    const fetchCodes = async () => {
      if (searchParams.country.length > 2) {
        setIsLoadingPostalCodes(true);
        try {
          const codes = await getPostalCodesForCountry(searchParams.country);
          setPostalCodeOptions(codes);
          if (codes.length > 0) {
            setSearchParams(prev => ({ ...prev, postalCode: codes[0] }));
          }
        } catch (e) {
          console.error("Failed to load postal codes");
        } finally {
          setIsLoadingPostalCodes(false);
        }
      } else {
        setPostalCodeOptions([]);
      }
    };
    const timeoutId = setTimeout(fetchCodes, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchParams.country]);

  // Credit Consumption Helper
  const consumeCredits = (amount: number): boolean => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      return true;
    } else {
      setShowPricing(true);
      return false;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.industry || !searchParams.postalCode) return;

    if (!consumeCredits(COST_SEARCH)) return;

    setIsLoading(true);
    setError(null);
    setLeads([]);
    setGroundingSources([]);
    try {
      const { leads: fetchedLeads, groundingChunks } = await searchLeadsWithGemini(
        searchParams.industry, 
        searchParams.country,
        searchParams.postalCode
      );
      setLeads(fetchedLeads);
      setGroundingSources(groundingChunks);
    } catch (err) {
      setError("Search failed. Ensure your Gemini API Key is valid.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearch = async (lead: Lead) => {
    if (researchCache[lead.id]) {
        setSelectedResearchLead(lead);
        setResearchData(researchCache[lead.id]);
        return;
    }

    if (!consumeCredits(COST_RESEARCH)) return;

    setSelectedResearchLead(lead);
    setResearchData(null);
    setIsResearchLoading(true);
    try {
        const data = await analyzeLeadWithGemini(lead);
        setResearchData(data);
        setResearchCache(prev => ({ ...prev, [lead.id]: data }));
    } catch (e) {
        console.error("Research failed", e);
    } finally {
        setIsResearchLoading(false);
    }
  };

  const handleUpgrade = (plan: PricingPlan) => {
    // This function is now mostly for the 'starter' reset or fallback simulation
    setCredits(prev => prev + plan.credits);
    setShowPricing(false);
  };

  return (
    <Layout credits={credits} onOpenPricing={() => setShowPricing(true)}>
      <div className="space-y-6">
        
        {/* Payment Success Toast */}
        {paymentSuccess && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
             <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-2xl border border-emerald-100 flex items-center gap-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                   <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <div>
                   <h4 className="font-black text-sm uppercase tracking-widest">Payment Successful</h4>
                   <p className="text-xs font-medium">Your credits have been securely added.</p>
                </div>
             </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Map<span className="text-sky-600">x</span></h1>
            <p className="text-slate-500 font-medium">Strategic B2B Lead Mining & ROI-Based Outreach.</p>
          </div>
          {leads.length > 0 && (
            <button 
              onClick={() => {}} // CSV Logic
              className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-200"
            >
              Export CSV
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-sky-100/50 border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <form onSubmit={handleSearch} className="flex flex-col gap-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Industry</label>
                <input
                  type="text"
                  list="industry-list"
                  placeholder="e.g. HVAC Contractors"
                  value={searchParams.industry}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 outline-none transition-all font-medium"
                />
                <datalist id="industry-list">
                  {COMMON_INDUSTRIES.map(i => <option key={i} value={i} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Country</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. USA"
                    value={searchParams.country}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, country: e.target.value, postalCode: '' }))}
                    className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 outline-none transition-all font-medium"
                  />
                  <Map className="absolute left-4 top-3.5 text-sky-400" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commercial Area / Zip</label>
                <select
                  value={searchParams.postalCode}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-sky-50 focus:border-sky-500 outline-none transition-all font-medium bg-white appearance-none cursor-pointer"
                  disabled={!searchParams.country || isLoadingPostalCodes}
                >
                  <option value="">{isLoadingPostalCodes ? "Scouting Zip Codes..." : "Select Target Area"}</option>
                  {postalCodeOptions.map(code => <option key={code} value={code}>{code}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !searchParams.postalCode}
                className="w-full md:w-auto px-10 py-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-xl shadow-sky-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 group"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                LAUNCH DISCOVERY <span className="text-sky-200 bg-sky-800/20 px-1.5 py-0.5 rounded text-[10px] font-bold">-{COST_SEARCH} Credits</span>
              </button>
            </div>
          </form>
        </div>

        {groundingSources.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Navigation size={12} /> Real-time Grounding Sources
            </h3>
            <div className="flex flex-wrap gap-2">
              {groundingSources.map((chunk, i) => {
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
          </div>
        )}

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 font-bold text-sm flex items-center gap-2"><AlertTriangle size={18}/> {error}</div>}

        <LeadTable 
          leads={leads} 
          isLoading={isLoading} 
          onGenerateScript={setSelectedScriptLead}
          onResearch={handleResearch}
        />

        {selectedScriptLead && (
          <ScriptGenerator 
            lead={selectedScriptLead} 
            analysis={researchCache[selectedScriptLead.id]} 
            onClose={() => setSelectedScriptLead(null)} 
            credits={credits}
            onConsumeCredits={consumeCredits}
          />
        )}

        {selectedResearchLead && (
           <LeadResearchModal
              lead={selectedResearchLead}
              analysis={researchData}
              isLoading={isResearchLoading}
              onClose={() => setSelectedResearchLead(null)}
           />
        )}

        {showPricing && (
           <PricingModal 
             onClose={() => setShowPricing(false)} 
             onUpgrade={handleUpgrade}
           />
        )}
      </div>
    </Layout>
  );
};

export default App;
