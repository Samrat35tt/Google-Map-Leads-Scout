import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LeadTable from './components/LeadTable';
import ScriptGenerator from './components/ScriptGenerator';
import LeadResearchModal from './components/LeadResearchModal';
import { Lead, SearchState, GroundingChunk, LeadAnalysis } from './types';
import { searchLeadsWithGemini, getPostalCodesForCountry, analyzeLeadWithGemini } from './services/gemini';
import { Search, Download, ExternalLink, AlertTriangle, Map, Navigation } from 'lucide-react';

const COMMON_INDUSTRIES = [
  "Accounting Firms",
  "Architects",
  "Auto Repair Shops",
  "Barbershops",
  "Beauty Salons",
  "Bookkeepers",
  "Business Consultants",
  "Car Dealerships",
  "Catering Services",
  "Chiropractors",
  "Cleaning Services",
  "Coffee Shops",
  "Construction Companies",
  "Criminal Defense Lawyers",
  "Daycare Centers",
  "Dentists",
  "Digital Marketing Agencies",
  "E-commerce Brands",
  "Electricians",
  "Event Planners",
  "Family Law Attorneys",
  "Financial Advisors",
  "Florists",
  "Graphic Designers",
  "Gyms & Fitness Centers",
  "Hotels",
  "HVAC Contractors",
  "Insurance Agencies",
  "Interior Designers",
  "IT Support Services",
  "Landscapers",
  "Law Firms",
  "Medical Spas",
  "Mortgage Brokers",
  "Moving Companies",
  "Orthodontists",
  "Painters",
  "Personal Injury Lawyers",
  "Pest Control Services",
  "Pet Groomers",
  "Photographers",
  "Physiotherapists",
  "Plumbers",
  "Psychologists",
  "Real Estate Agents",
  "Restaurants",
  "Retail Stores",
  "Roofers",
  "SEO Agencies",
  "Software Companies",
  "Solar Installers",
  "Veterinarians",
  "Video Production Companies",
  "Web Design Agencies",
  "Wedding Planners",
  "Yoga Studios"
];

const App = () => {
  const [searchParams, setSearchParams] = useState<SearchState>({
    industry: '',
    country: '',
    postalCode: '',
    radius: '10'
  });
  
  const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
  const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [selectedScriptLead, setSelectedScriptLead] = useState<Lead | null>(null);
  const [selectedResearchLead, setSelectedResearchLead] = useState<Lead | null>(null);
  const [researchData, setResearchData] = useState<LeadAnalysis | null>(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);

  // Effect to debounce fetch postal codes when country changes
  useEffect(() => {
    const fetchCodes = async () => {
      if (searchParams.country.length > 2) {
        setIsLoadingPostalCodes(true);
        try {
          const codes = await getPostalCodesForCountry(searchParams.country);
          setPostalCodeOptions(codes);
          // Auto select first if available
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

    const timeoutId = setTimeout(fetchCodes, 1000); // 1s debounce
    return () => clearTimeout(timeoutId);
  }, [searchParams.country]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.industry || !searchParams.postalCode) return;

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
      setError("Failed to fetch leads. Please verify your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearch = async (lead: Lead) => {
    setSelectedResearchLead(lead);
    setResearchData(null);
    setIsResearchLoading(true);
    try {
        const data = await analyzeLeadWithGemini(lead);
        setResearchData(data);
    } catch (e) {
        console.error("Research failed", e);
    } finally {
        setIsResearchLoading(false);
    }
  };

  const handleExport = () => {
    if (leads.length === 0) return;
    
    const headers = ['Business Name', 'Category', 'Address', 'Email', 'Phone', 'Website', 'Rating'];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => [
        `"${l.name}"`, 
        `"${l.category}"`, 
        `"${l.address}"`, 
        `"${l.email || ''}"`,
        `"${l.phone || ''}"`, 
        `"${l.website || ''}"`, 
        l.rating || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${searchParams.industry}_${searchParams.postalCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lead Discovery</h1>
            <p className="text-slate-500">Find compliant B2B leads by Country and Pin Code.</p>
          </div>
          <div className="flex items-center gap-2">
            {leads.length > 0 && (
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Industry */}
              <div className="flex-1">
                <label htmlFor="industry" className="block text-sm font-bold text-slate-900 mb-1">Industry / Niche</label>
                <div className="relative">
                  <input
                    type="text"
                    id="industry"
                    list="industry-list"
                    placeholder="e.g. Dentists"
                    value={searchParams.industry}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                    required
                    autoComplete="off"
                  />
                  <datalist id="industry-list">
                    {COMMON_INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Country */}
              <div className="flex-1 relative">
                <label htmlFor="country" className="block text-sm font-bold text-slate-900 mb-1">Country</label>
                <div className="relative">
                  <input
                    type="text"
                    id="country"
                    placeholder="Type Country Name (e.g., India)"
                    value={searchParams.country}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, country: e.target.value, postalCode: '' }))} // Reset postal code on country change
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                    required
                    autoComplete="off"
                  />
                  <Map className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>

              {/* Postal Code Dropdown */}
              <div className="flex-1 relative">
                <label htmlFor="postalCode" className="block text-sm font-bold text-slate-900 mb-1">Pin Code / Area</label>
                <div className="relative">
                   <select
                    id="postalCode"
                    value={searchParams.postalCode}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400 text-slate-900"
                    required
                    disabled={!searchParams.country || isLoadingPostalCodes}
                  >
                    <option value="">
                      {isLoadingPostalCodes 
                        ? "Loading Pin Codes..." 
                        : postalCodeOptions.length === 0 
                          ? (searchParams.country ? "No codes found (Try different spelling)" : "Select Country First") 
                          : "Select Pin Code"
                      }
                    </option>
                    {postalCodeOptions.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <Navigation className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  {isLoadingPostalCodes && (
                    <div className="absolute right-3 top-3 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading || !searchParams.postalCode}
                className="w-full md:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                Find Leads in Area
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
             <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
             <div>
               <h3 className="text-sm font-medium text-red-800">Error</h3>
               <p className="text-sm text-red-700 mt-1">{error}</p>
             </div>
          </div>
        )}

        {/* Results */}
        <LeadTable 
          leads={leads} 
          isLoading={isLoading} 
          onGenerateScript={(lead) => setSelectedScriptLead(lead)}
          onResearch={handleResearch}
        />

        {/* Grounding Sources / Attribution */}
        {groundingSources.length > 0 && (
          <div className="mt-4 p-4 bg-slate-100 rounded-lg text-xs text-slate-500">
             <div className="flex items-center gap-2 mb-2 font-medium text-slate-600">
                <img src="https://www.gstatic.com/images/branding/product/1x/maps_round_2020_48dp.png" alt="Google Maps" className="w-4 h-4" />
                Verified Data Sources (Google Maps)
             </div>
             <div className="flex flex-wrap gap-2">
               {groundingSources.map((chunk, idx) => (
                 chunk.web?.uri ? (
                   <a 
                     key={idx} 
                     href={chunk.web.uri} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center gap-1 hover:text-indigo-600 hover:underline bg-white px-2 py-1 rounded border border-slate-200"
                   >
                     <ExternalLink size={10} />
                     {chunk.web.title || "Source Link"}
                   </a>
                 ) : null
               ))}
             </div>
             <p className="mt-2 italic opacity-75">
               Compliance Note: This data is retrieved via Google Maps Public Data. Emails are inferred or extracted from linked websites where available publicly.
             </p>
          </div>
        )}

        {/* Script Modal */}
        {selectedScriptLead && (
          <ScriptGenerator 
            lead={selectedScriptLead} 
            onClose={() => setSelectedScriptLead(null)} 
          />
        )}

        {/* Research Modal */}
        {selectedResearchLead && (
           <LeadResearchModal
              lead={selectedResearchLead}
              analysis={researchData}
              isLoading={isResearchLoading}
              onClose={() => setSelectedResearchLead(null)}
           />
        )}
      </div>
    </Layout>
  );
};

export default App;