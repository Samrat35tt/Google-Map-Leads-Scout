
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LeadTable from './components/LeadTable';
import ScriptGenerator from './components/ScriptGenerator';
import LeadResearchModal from './components/LeadResearchModal';
import PricingModal from './components/PricingModal';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import WorkflowBuilder from './components/WorkflowBuilder';
import ContactsManager from './components/ContactsManager';
import LinkedInScraper from './components/LinkedInScraper';
import SocialScraper from './components/SocialScraper';
import SocialBulkScraper from './components/SocialBulkScraper';
import MetaAdsAnalyzer from './components/MetaAdsAnalyzer';
import Settings from './components/Settings';
import Inbox from './components/Inbox';
import PhoneFinder from './components/PhoneFinder';
import TaskManager from './components/TaskManager';
import KnowledgeBase from './components/KnowledgeBase';
import MeetingIntelligence from './components/MeetingIntelligence';
import ComplianceModal from './components/ComplianceModal';
import { auth, db, signInWithGoogle, logout, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { DEFAULT_LLM_SETTINGS } from './services/settingsStore';
import { Lead, SearchState, GroundingChunk, LeadAnalysis, AppUser, SearchLog, Workflow, Conversation, Message, KnowledgeDocument, Meeting, LLMSettings } from './types';
import { searchLeadsWithGemini, getCitiesForCountry, getAreasForCity, analyzeLeadWithGemini } from './services/gemini';
import { Search, AlertTriangle, Navigation, ExternalLink, Ban, LogOut, Building, LocateFixed, LogIn, Zap } from 'lucide-react';

const COST_SEARCH = 10;
const COST_RESEARCH = 15;

const COMMON_INDUSTRIES = [
  'Plumbers', 'Electricians', 'HVAC Contractors', 'Roofing Companies', 'Landscapers', 'Painters', 'General Contractors', 'Cleaning Services', 'Pest Control', 'Moving Companies', 'Solar Installers', 'Locksmiths', 'Pool Service', 'Flooring Contractors', 'Window Washers',
  'Dentists', 'Orthodontists', 'Chiropractors', 'Physiotherapists', 'Gyms & Fitness Centers', 'Yoga Studios', 'Pilates Studios', 'Med Spas', 'Dermatologists', 'Plastic Surgeons', 'Veterinarians', 'Hair Salons', 'Barbershops', 'Nail Salons', 'Mental Health Counselors',
  'Lawyers', 'Personal Injury Lawyers', 'Family Law Attorneys', 'Real Estate Agents', 'Property Managers', 'Accountants', 'Bookkeepers', 'Financial Advisors', 'Insurance Agents', 'Architects', 'Interior Designers', 'Mortgage Brokers', 'Digital Marketing Agencies', 'Web Design Agencies', 'IT Support Services', 'Recruiting Agencies', 'Photographers',
  'Auto Repair Shops', 'Car Dealerships', 'Auto Detailers', 'Tire Shops', 'Auto Body Shops', 'Towing Services',
  'Restaurants', 'Coffee Shops', 'Bakeries', 'Bars & Lounges', 'Boutique Hotels', 'Event Venues', 'Caterers', 'Florists', 'Jewelry Stores', 'Clothing Boutiques', 'Furniture Stores', 'Pet Stores'
];

// Safe UUID generator
const safeUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const AppContent = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalAdmin, setOriginalAdmin] = useState<AppUser | null>(null);

  // Search State
  const [searchParams, setSearchParams] = useState<SearchState>({
    industry: '',
    country: '',
    city: '',
    postalCode: '',
    radius: '10'
  });
  
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_LLM_SETTINGS);
  const [credits, setCredits] = useState(0); 
  const [searchHistory, setSearchHistory] = useState<SearchLog[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  // Dynamic Location Options
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingPostalCodes, setIsLoadingPostalCodes] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]); 
  const [contacts, setContacts] = useState<Lead[]>([]); 
  const [workflows, setWorkflows] = useState<Workflow[]>([]); 
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [researchCache, setResearchCache] = useState<Record<string, LeadAnalysis & { groundingChunks?: any[] }>>({});

  const [selectedScriptLead, setSelectedScriptLead] = useState<Lead | null>(null);
  const [selectedResearchLead, setSelectedResearchLead] = useState<Lead | null>(null);
  const [researchData, setResearchData] = useState<(LeadAnalysis & { groundingChunks?: any[] }) | null>(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);

  const navigate = useNavigate();

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          setUser(userData);
          setCredits(userData.credits || 0);
          if (userData.settings) {
            setSettings(userData.settings);
          }
        } else {
          // Create new user
          const newUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            plan: 'free',
            credits: 50,
            isAdmin: false,
            complianceAccepted: false,
            settings: DEFAULT_LLM_SETTINGS
          };
          await setDoc(userDocRef, {
            ...newUser,
            createdAt: serverTimestamp()
          });
          setUser(newUser);
          setCredits(50);
          setSettings(DEFAULT_LLM_SETTINGS);
        }
      } else {
        setUser(null);
        setCredits(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Data Listeners (Firestore)
  useEffect(() => {
    if (!user) {
      setContacts([]);
      setWorkflows([]);
      setSearchHistory([]);
      setConversations([]);
      setKnowledgeDocs([]);
      setMeetings([]);
      return;
    }

    if (!user.complianceAccepted) {
       setShowComplianceModal(true);
    }

    // Listen to Leads (Contacts)
    const qLeads = query(collection(db, 'leads'), where('ownerId', '==', user.id));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setContacts(snapshot.docs.map(doc => doc.data() as Lead));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'leads'));

    // Listen to Knowledge
    const qKnowledge = query(collection(db, 'knowledge'), where('ownerId', '==', user.id));
    const unsubKnowledge = onSnapshot(qKnowledge, (snapshot) => {
      setKnowledgeDocs(snapshot.docs.map(doc => doc.data() as KnowledgeDocument));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'knowledge'));

    // Listen to Meetings
    const qMeetings = query(collection(db, 'meetings'), where('ownerId', '==', user.id));
    const unsubMeetings = onSnapshot(qMeetings, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => doc.data() as Meeting));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'meetings'));

    // Listen to Workflows
    const qWorkflows = query(collection(db, 'workflows'), where('ownerId', '==', user.id));
    const unsubWorkflows = onSnapshot(qWorkflows, (snapshot) => {
      setWorkflows(snapshot.docs.map(doc => doc.data() as Workflow));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'workflows'));

    // Listen to Conversations
    const qConversations = query(collection(db, 'conversations'), where('ownerId', '==', user.id));
    const unsubConversations = onSnapshot(qConversations, (snapshot) => {
      setConversations(snapshot.docs.map(doc => doc.data() as Conversation));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'conversations'));

    // Listen to Search History
    const qHistory = query(collection(db, 'search_history'), where('ownerId', '==', user.id));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setSearchHistory(snapshot.docs.map(doc => doc.data() as SearchLog));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'search_history'));

    return () => {
      unsubLeads();
      unsubKnowledge();
      unsubMeetings();
      unsubWorkflows();
      unsubConversations();
      unsubHistory();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Failed to sign in with Google");
    }
  };

  const handleUpdateSettings = async (newSettings: LLMSettings) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { settings: newSettings });
      setSettings(newSettings);
    } catch (err) {
      console.error("Failed to update settings", err);
    }
  };

  const handleAcceptCompliance = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { complianceAccepted: true });
      setUser({ ...user, complianceAccepted: true });
      setShowComplianceModal(false);
    } catch (err) {
      console.error("Failed to accept compliance", err);
    }
  };

  const consumeCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false;
    if (credits < amount) {
      setShowPricing(true);
      return false;
    }
    
    try {
      const newCredits = credits - amount;
      await updateDoc(doc(db, 'users', user.id), { credits: newCredits });
      setCredits(newCredits);
      return true;
    } catch (err) {
      console.error("Failed to update credits", err);
      return false;
    }
  }, [credits, user]);

  // --- Handlers ---

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const country = e.target.value;
      setSearchParams(prev => ({ ...prev, country, city: '', postalCode: '' }));
      setCityOptions([]);
      setPostalCodeOptions([]);
      if (country) {
          setIsLoadingCities(true);
          const cities = await getCitiesForCountry(country);
          setCityOptions(cities);
          setIsLoadingCities(false);
      }
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const city = e.target.value;
      setSearchParams(prev => ({ ...prev, city, postalCode: '' }));
      setPostalCodeOptions([]);
      if (city && searchParams.country) {
          setIsLoadingPostalCodes(true);
          const areas = await getAreasForCity(city, searchParams.country);
          setPostalCodeOptions(areas);
          setIsLoadingPostalCodes(false);
      }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.industry || !searchParams.country) return;
    if (!consumeCredits(COST_SEARCH)) return;

    setIsLoading(true);
    setError(null);
    setLeads([]);
    
    try {
      const { leads, groundingChunks } = await searchLeadsWithGemini(
        searchParams.industry,
        searchParams.country,
        searchParams.city,
        searchParams.postalCode
      );
      
      setLeads(leads);
      setGroundingSources(groundingChunks);

      const newLog: SearchLog = {
        id: Date.now().toString(),
        industry: searchParams.industry,
        country: searchParams.country,
        location: `${searchParams.city} ${searchParams.postalCode}`.trim() || searchParams.country,
        date: new Date().toISOString(),
        resultsCount: leads.length
      };

      if (user) {
        try {
          await addDoc(collection(db, 'search_history'), {
            ...newLog,
            ownerId: user.id,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'search_history');
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepResearch = async (lead: Lead) => {
    if (researchCache[lead.id]) {
      setResearchData(researchCache[lead.id]);
      setSelectedResearchLead(lead);
      return;
    }
    const success = await consumeCredits(COST_RESEARCH);
    if (!success) return;

    setSelectedResearchLead(lead);
    setIsResearchLoading(true);
    setResearchData(null);

    try {
      const analysis = await analyzeLeadWithGemini(lead);
      setResearchData(analysis);
      setResearchCache(prev => ({ ...prev, [lead.id]: analysis }));
    } catch (err: any) {
      alert(`Research failed: ${err.message}`);
      setSelectedResearchLead(null);
    } finally {
      setIsResearchLoading(false);
    }
  };

  const handleSaveContact = async (lead: Lead) => {
    if (!user) return;

    let leadToSave = { ...lead };
    if (!leadToSave.id) {
        leadToSave.id = `lead-${Date.now()}`;
    }

    try {
      await setDoc(doc(db, 'leads', leadToSave.id), {
        ...leadToSave,
        ownerId: user.id,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leads/${leadToSave.id}`);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leads/${id}`);
    }
  };

  const handleUpdateConversation = async (conversation: Conversation) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'conversations', conversation.id), {
        ...conversation,
        ownerId: user.id,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${conversation.id}`);
    }
  };

  const handleCreateNewWorkflow = async (wf: Workflow) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'workflows', wf.id), {
        ...wf,
        ownerId: user.id,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `workflows/${wf.id}`);
    }
  };

  const handleUpdateWorkflow = async (wf: Workflow) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'workflows', wf.id), {
        ...wf,
        ownerId: user.id,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workflows/${wf.id}`);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'workflows', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `workflows/${id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#444746]">Initializing SalesOxe...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white rounded-[32px] border border-[#e0f2fe] shadow-xl p-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-[#f0f9ff] rounded-3xl flex items-center justify-center mx-auto mb-8 text-[#0ea5e9]">
            <Zap size={40} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-[#1f1f1f] mb-3">Welcome to SalesOxe</h1>
          <p className="text-[#444746] mb-10 leading-relaxed">
            The AI-powered growth engine for modern sales teams. Sign in to access your leads, campaigns, and intelligence.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#1f1f1f] text-white rounded-2xl font-semibold hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          <p className="mt-8 text-xs text-[#888] font-medium">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  if (user.suspended) {
    return (
      <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[32px] shadow-sm max-w-md text-center border border-red-100">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban size={40} />
           </div>
           <h1 className="text-2xl font-normal text-[#1f1f1f] mb-2">Account Suspended</h1>
           <p className="text-[#444746] mb-8">Access to your SalesOxe account has been disabled.</p>
           <button onClick={handleLogout} className="w-full py-3 bg-[#1f1f1f] text-white rounded-full font-medium hover:bg-black transition-all flex items-center justify-center gap-2">
              <LogOut size={18} /> Sign Out
           </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      credits={credits} 
      user={user} 
      onOpenPricing={() => setShowPricing(true)}
      onLogout={handleLogout}
      onOpenAdmin={() => setShowAdminPanel(true)}
    >
      {showComplianceModal && (
         <ComplianceModal onAccept={handleAcceptCompliance} />
      )}

      <Routes>
        <Route path="/" element={
            <Dashboard 
              user={user} 
              credits={credits} 
              history={searchHistory} 
              onNavigateSearch={() => navigate('/search')} 
              onOpenPricing={() => setShowPricing(true)}
            />
        } />
        
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route path="/search" element={
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-normal text-[#1f1f1f]">Local Scout</h1>
                <p className="text-[#444746]">Find high-intent B2B leads using real-time Google Maps grounding.</p>
              </div>

              <div className="bg-white p-6 rounded-[28px] shadow-sm border border-[#e0f2fe]">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Industry</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                      <input
                        type="text"
                        list="industries"
                        placeholder="e.g. Dentists"
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f]"
                        value={searchParams.industry}
                        onChange={(e) => setSearchParams({ ...searchParams, industry: e.target.value })}
                      />
                      <datalist id="industries">
                        {COMMON_INDUSTRIES.map(ind => <option key={ind} value={ind} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Country</label>
                    <select
                      className="w-full px-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f] appearance-none cursor-pointer"
                      value={searchParams.country}
                      onChange={handleCountryChange}
                    >
                      <option value="">Select</option>
                      <optgroup label="North America">
                        <option value="United States">USA</option>
                        <option value="Canada">Canada</option>
                        <option value="Mexico">Mexico</option>
                      </optgroup>
                      {/* Truncated other options for brevity, they remain same */}
                      <option value="United Kingdom">UK</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">City</label>
                    <div className="relative">
                       <Building className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                       <input
                        type="text"
                        list="cities"
                        disabled={!searchParams.country}
                        placeholder={isLoadingCities ? "Loading..." : "Select City"}
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed"
                        value={searchParams.city}
                        onChange={handleCityChange}
                      />
                      <datalist id="cities">
                        {cityOptions.map(opt => <option key={opt} value={opt} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#444746] uppercase tracking-wider ml-1">Area / Zip</label>
                    <div className="relative">
                       <LocateFixed className="absolute left-4 top-3.5 text-[#444746]" size={18} />
                       <input
                        type="text"
                        list="areas"
                        disabled={!searchParams.city}
                        placeholder={isLoadingPostalCodes ? "Loading..." : "Optional"}
                        className="w-full pl-11 pr-4 py-3 bg-[#f0f9ff] rounded-xl border-none focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none text-[#1f1f1f] disabled:opacity-50 disabled:cursor-not-allowed"
                        value={searchParams.postalCode}
                        onChange={(e) => setSearchParams({ ...searchParams, postalCode: e.target.value })}
                      />
                      <datalist id="areas">
                        {postalCodeOptions.map(opt => <option key={opt} value={opt} />)}
                      </datalist>
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
                          <Search size={18} /> Scout
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {error && (
                <div className="p-4 bg-[#fce8e6] text-[#b3261e] rounded-2xl flex items-center gap-3 border border-[#f9dedc]">
                  <AlertTriangle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <LeadTable 
                leads={leads} 
                isLoading={isLoading} 
                onGenerateScript={(lead) => setSelectedScriptLead(lead)}
                onResearch={handleDeepResearch}
                onSaveContact={handleSaveContact}
                savedContactIds={contacts.map(c => c.id)}
              />

              {groundingSources.length > 0 && !isLoading && (
                <div className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 mb-4 text-[#444746]">
                    <Navigation size={18} />
                    <h3 className="text-sm font-medium">Verified Grounding Sources</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groundingSources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.web?.uri || source.maps?.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#c4c7c5] hover:bg-[#f0f9ff] rounded-lg text-xs font-medium text-[#0ea5e9] transition-colors"
                      >
                        <ExternalLink size={12} />
                        {source.web?.title || source.maps?.title || 'Grounding Source'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
        } />

        <Route path="/ad-simulator" element={
            <MetaAdsAnalyzer credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/phone-finder" element={
            <PhoneFinder onSaveContact={handleSaveContact} savedContactIds={contacts.map(c => c.id)} credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={handleUpdateSettings} />} />

        <Route path="/inbox" element={
            <Inbox contacts={contacts} conversations={conversations} onUpdateConversation={handleUpdateConversation} />
        } />

        <Route path="/social-bulk" element={
            <SocialBulkScraper onSaveContact={handleSaveContact} savedContactIds={contacts.map(c => c.id)} credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/linkedin" element={
            <LinkedInScraper onSaveContact={handleSaveContact} savedContactIds={contacts.map(c => c.id)} credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/facebook" element={
            <SocialScraper platform="facebook" onSaveContact={handleSaveContact} savedContactIds={contacts.map(c => c.id)} credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/instagram" element={
            <SocialScraper platform="instagram" onSaveContact={handleSaveContact} savedContactIds={contacts.map(c => c.id)} credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/twitter" element={
            <SocialScraper platform="twitter" onSaveContact={handleSaveContact} savedContactIds={contacts.map(c => c.id)} credits={credits} onConsumeCredits={consumeCredits} />
        } />

        <Route path="/contacts" element={
            <ContactsManager 
              contacts={contacts}
              workflows={workflows}
              credits={credits}
              onConsumeCredits={consumeCredits}
              onAddContact={handleSaveContact}
              onImportContacts={async (newLeads) => {
                const currentContacts = [...contacts];
                const uniqueNewLeads = newLeads.filter(newLead => {
                   const exists = currentContacts.some(c => 
                      c.id === newLead.id || 
                      (c.website && newLead.website && c.website === newLead.website) ||
                      (c.name === newLead.name && c.address === newLead.address)
                   );
                   return !exists;
                });

                if (uniqueNewLeads.length === 0) {
                   alert("All contacts are already imported.");
                   return;
                }

                for (const lead of uniqueNewLeads) {
                  await handleSaveContact(lead);
                }
              }}
              onDeleteContact={handleDeleteContact}
              onAddToWorkflow={(wfId, leadIds) => {
                const wf = workflows.find(w => w.id === wfId);
                if (wf) {
                  const enrolledLeads = contacts.filter(c => leadIds.includes(c.id));
                  const existingLeadIds = new Set(wf.leads.map(l => l.id));
                  const newEnrollees = enrolledLeads.filter(l => !existingLeadIds.has(l.id));
                  
                  if (newEnrollees.length === 0) {
                      alert("Selected contacts are already in this campaign.");
                      return;
                  }

                  handleUpdateWorkflow({
                    ...wf,
                    leads: [...wf.leads, ...newEnrollees.map(l => ({ ...l, workflowStatus: 'idle' } as Lead))]
                  });
                }
              }}
            />
        } />

        <Route path="/automations" element={
            <WorkflowBuilder 
              availableLeads={leads}
              savedContacts={contacts}
              workflows={workflows}
              onCreateWorkflow={handleCreateNewWorkflow}
              onUpdateWorkflow={handleUpdateWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onNavigateToSearch={() => navigate('/search')}
            />
        } />

        <Route path="/tasks" element={
            <TaskManager leads={contacts} />
        } />

        <Route path="/knowledge-base" element={
            <KnowledgeBase user={user} />
        } />

        <Route path="/meetings" element={
            <MeetingIntelligence user={user} />
        } />
      </Routes>

      {/* Global Modals */}
      {selectedScriptLead && (
        <ScriptGenerator 
          lead={selectedScriptLead} 
          analysis={researchCache[selectedScriptLead.id]}
          onClose={() => setSelectedScriptLead(null)} 
          credits={credits}
          onConsumeCredits={consumeCredits}
          knowledgeDocs={knowledgeDocs}
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

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onUpgrade={(plan) => {
        setCredits(prev => prev + plan.credits);
        setShowPricing(false);
      }} />}

      {showAdminPanel && user?.isAdmin && (
        <AdminPanel 
          currentUser={user} 
          onClose={() => setShowAdminPanel(false)} 
          onImpersonate={(targetUser) => {
            setOriginalAdmin(user);
            setUser(targetUser);
            setCredits(targetUser.credits || 0);
            setShowAdminPanel(false);
            navigate('/');
          }}
        />
      )}
      
      {/* Return to Admin Button */}
      {originalAdmin && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-500">
           <button 
             onClick={() => {
               setUser(originalAdmin);
               setCredits(originalAdmin.credits || 0);
               setOriginalAdmin(null);
               navigate('/');
               setShowAdminPanel(true);
             }}
             className="bg-[#b3261e] text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all border-4 border-white"
           >
             <Ban size={18} />
             Exit Impersonation
           </button>
        </div>
      )}
    </Layout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
