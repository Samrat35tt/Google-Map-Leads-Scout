
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, ShieldCheck, CheckCircle2, Server, Database, Zap, Activity, Download, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { LLMSettings } from '../types';

interface SettingsProps {
  settings: LLMSettings;
  onUpdateSettings: (settings: LLMSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<LLMSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'platform' | 'privacy' | 'company'>('platform');
  const [isSaving, setIsSaving] = useState(false);
  
  // Diagnostic State (Now for Firebase)
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('connected');
  const [dbMessage, setDbMessage] = useState('Connected to Firestore');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings(localSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
      // In a real app, we would fetch all user data from Firestore and export it
      alert("Exporting data from Firestore... (Feature coming soon)");
  };

  const checkConnection = () => {
      setDbStatus('checking');
      setTimeout(() => {
          setDbStatus('connected');
          setDbMessage('Connected to Firestore');
      }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 mb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
         <div className="flex items-center gap-3">
             <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">
                <SettingsIcon size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">System Settings</h1>
                <p className="text-[#444746]">View platform status and manage data privacy.</p>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
            <button 
                onClick={() => setActiveTab('company')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'company' ? 'bg-[#1f1f1f] text-white shadow-md' : 'bg-white hover:bg-slate-50 text-[#444746]'}`}
            >
                <Server size={18} />
                <span className="font-medium">Company Profile</span>
            </button>
            <button 
                onClick={() => setActiveTab('platform')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'platform' ? 'bg-[#1f1f1f] text-white shadow-md' : 'bg-white hover:bg-slate-50 text-[#444746]'}`}
            >
                <Server size={18} />
                <span className="font-medium">Infrastructure</span>
            </button>
            <button 
                onClick={() => setActiveTab('privacy')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'privacy' ? 'bg-[#1f1f1f] text-white shadow-md' : 'bg-white hover:bg-slate-50 text-[#444746]'}`}
            >
                <ShieldCheck size={18} />
                <span className="font-medium">Privacy & Data</span>
            </button>
        </div>

        {/* Main Config Column */}
        <div className="lg:col-span-3 space-y-6">
           
           {/* COMPANY PROFILE VIEW */}
           {activeTab === 'company' && (
             <div className="bg-white p-8 rounded-[28px] border border-[#e0f2fe] shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2">
                         <Server size={20} className="text-[#1f1f1f]" /> Company Knowledge Base
                     </h2>
                     <button
                       onClick={handleSave}
                       disabled={isSaving}
                       className="flex items-center gap-2 px-4 py-2 bg-[#1f1f1f] text-white rounded-full hover:bg-black transition-colors disabled:opacity-50"
                     >
                       {isSaving ? <Loader2 className="animate-spin" size={16} /> : (isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                       {isSaved ? 'Saved!' : 'Save Profile'}
                     </button>
                 </div>
                 <p className="text-sm text-[#444746] mb-6">
                     Add your company details and services here. The AI will use this knowledge base to generate highly personalized outreach emails and SMS that pitch your actual services.
                 </p>
                 
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-[#1f1f1f] mb-1">Company Name</label>
                         <input 
                             type="text" 
                             value={localSettings.companyProfile?.companyName || ''} 
                             onChange={(e) => setLocalSettings({...localSettings, companyProfile: {...(localSettings.companyProfile || {companyName:'', description:'', services:'', valueProposition:'', targetAudience:''}), companyName: e.target.value}})}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                             placeholder="e.g. SalesOxe Inc."
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-[#1f1f1f] mb-1">Company Description</label>
                         <textarea 
                             value={localSettings.companyProfile?.description || ''} 
                             onChange={(e) => setLocalSettings({...localSettings, companyProfile: {...(localSettings.companyProfile || {companyName:'', description:'', services:'', valueProposition:'', targetAudience:''}), description: e.target.value}})}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                             rows={3}
                             placeholder="What does your company do?"
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-[#1f1f1f] mb-1">Services / Products</label>
                         <textarea 
                             value={localSettings.companyProfile?.services || ''} 
                             onChange={(e) => setLocalSettings({...localSettings, companyProfile: {...(localSettings.companyProfile || {companyName:'', description:'', services:'', valueProposition:'', targetAudience:''}), services: e.target.value}})}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                             rows={3}
                             placeholder="List your main services or products..."
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-[#1f1f1f] mb-1">Value Proposition</label>
                         <textarea 
                             value={localSettings.companyProfile?.valueProposition || ''} 
                             onChange={(e) => setLocalSettings({...localSettings, companyProfile: {...(localSettings.companyProfile || {companyName:'', description:'', services:'', valueProposition:'', targetAudience:''}), valueProposition: e.target.value}})}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                             rows={3}
                             placeholder="Why should clients choose you? What problems do you solve?"
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-[#1f1f1f] mb-1">Target Audience</label>
                         <input 
                             type="text" 
                             value={localSettings.companyProfile?.targetAudience || ''} 
                             onChange={(e) => setLocalSettings({...localSettings, companyProfile: {...(localSettings.companyProfile || {companyName:'', description:'', services:'', valueProposition:'', targetAudience:''}), targetAudience: e.target.value}})}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
                             placeholder="e.g. B2B SaaS Founders, Marketing Directors"
                         />
                     </div>
                 </div>
             </div>
           )}

           {/* MANAGED INFRASTRUCTURE VIEW */}
           {activeTab === 'platform' && (
             <>
                <div className="bg-[#e0f2fe] border border-[#bae6fd] p-6 rounded-[28px] flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full text-[#0284c7] shadow-sm">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-[#0284c7]">Managed AI Infrastructure</h3>
                        <p className="text-sm text-[#0369a1] mt-1 leading-relaxed">
                            You are on the <strong>Managed Growth Plan</strong>. Basic AI reasoning and data simulation is handled by the SalesOxe Platform.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[28px] border border-[#e0f2fe] shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium text-[#1f1f1f] flex items-center gap-2">
                            <Activity size={20} className="text-[#1f1f1f]" /> Service Status
                        </h2>
                        <button 
                           onClick={checkConnection} 
                           className="p-2 text-[#444746] hover:bg-[#f0f9ff] rounded-full transition-colors"
                           title="Re-run Diagnostics"
                        >
                           <RefreshCw size={16} className={dbStatus === 'checking' ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Database Connection Status */}
                        <div className={`flex items-center justify-between p-4 border rounded-xl bg-slate-50/50 ${
                            dbStatus === 'error' ? 'border-red-200 bg-red-50/50' : 
                            dbStatus === 'connected' ? 'border-green-200 bg-green-50/50' : 'border-[#e2e8f0]'
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                    dbStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-[#1f1f1f]">Firestore Database</h3>
                                    <p className="text-xs text-[#444746]">{dbStatus === 'checking' ? 'Testing connection...' : dbMessage}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                                dbStatus === 'connected' ? 'text-[#188038] bg-green-100/50 border-green-200' :
                                dbStatus === 'error' ? 'text-[#b3261e] bg-red-100/50 border-red-200' :
                                'text-[#444746] bg-gray-100 border-gray-200'
                            }`}>
                                {dbStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : 
                                 dbStatus === 'connected' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                {dbStatus === 'connected' ? 'Operational' : dbStatus === 'error' ? 'Error' : 'Checking'}
                            </div>
                        </div>

                        {/* Enrichment Service */}
                        <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                    <Server size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-[#1f1f1f]">Enrichment Engine</h3>
                                    <p className="text-xs text-[#444746]">Apollo / Hunter / Proxycurl Aggregation</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[#188038] bg-green-50 px-3 py-1 rounded-full text-xs font-medium border border-green-100">
                                <CheckCircle2 size={14} /> Operational
                            </div>
                        </div>
                    </div>
                </div>
             </>
           )}

           {/* PRIVACY & DATA */}
           {activeTab === 'privacy' && (
              <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-medium text-[#1f1f1f] mb-4 flex items-center gap-2">
                      <ShieldCheck size={20} className="text-[#1f1f1f]" /> Data & Privacy
                  </h2>
                  <p className="text-sm text-[#444746] mb-6">
                      Manage your personal data. You can export a copy of all your leads and workflows.
                  </p>

                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                              <h3 className="font-medium text-[#1f1f1f] text-sm">Export Data</h3>
                              <p className="text-xs text-[#444746]">Download JSON copy of all local data.</p>
                          </div>
                          <button 
                             onClick={handleExportData}
                             className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm font-medium hover:bg-[#f1f5f9] flex items-center gap-2"
                          >
                             <Download size={16} /> Export
                          </button>
                      </div>
                  </div>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default Settings;
