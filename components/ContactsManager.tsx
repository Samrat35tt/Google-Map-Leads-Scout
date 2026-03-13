
import React, { useState, useRef } from 'react';
import { Lead, Workflow } from '../types';
import { verifyEmailAddress } from '../services/verification';
import { findDirectDial } from '../services/enrichment';
import { getLLMSettings } from '../services/settingsStore';
import { OutreachGenerator } from './OutreachGenerator';
import { Search, UserPlus, Upload, Trash2, GitMerge, MoreHorizontal, Mail, Phone, MapPin, X, Check, Filter, LayoutList, Kanban, GripVertical, Download, ShieldCheck, Loader2, AlertCircle, Zap, Globe } from 'lucide-react';

interface ContactsManagerProps {
  contacts: Lead[];
  workflows: Workflow[];
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
  onAddContact: (contact: Lead) => void;
  onImportContacts: (contacts: Lead[]) => void;
  onDeleteContact: (id: string) => void;
  onAddToWorkflow: (workflowId: string, leadIds: string[]) => void;
}

const PIPELINE_STAGES: Lead['pipelineStage'][] = ['New Lead', 'Contacted', 'Interested', 'Meeting Booked', 'Closed', 'Lost'];

const ContactsManager: React.FC<ContactsManagerProps> = ({ 
  contacts, 
  workflows,
  credits,
  onConsumeCredits,
  onAddContact, 
  onImportContacts, 
  onDeleteContact,
  onAddToWorkflow
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showBulkOutreachModal, setShowBulkOutreachModal] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkGenerateProgress, setBulkGenerateProgress] = useState({ current: 0, total: 0 });
  const [bulkSequenceType, setBulkSequenceType] = useState<'one-time' | 'sequence'>('sequence');
  const [bulkFollowUpCount, setBulkFollowUpCount] = useState(3);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isEnrichingId, setIsEnrichingId] = useState<string | null>(null);
  const [selectedLeadForOutreach, setSelectedLeadForOutreach] = useState<Lead | null>(null);
  
  // CSV Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add State
  const [newContact, setNewContact] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: 'Manual Entry'
  });

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const updateStage = (lead: Lead, newStage: Lead['pipelineStage']) => {
      onAddContact({ ...lead, pipelineStage: newStage });
  };

  const handleBulkGenerateOutreach = async () => {
    const leadsToProcess = contacts.filter(c => selectedIds.has(c.id));
    if (leadsToProcess.length === 0) return;
    
    setIsBulkGenerating(true);
    setBulkGenerateProgress({ current: 0, total: leadsToProcess.length });
    
    // Import generateOutreachSequence dynamically or ensure it's imported at the top
    const { generateOutreachSequence } = await import('../services/gemini');
    
    let processed = 0;
    for (const lead of leadsToProcess) {
      try {
        const sequence = await generateOutreachSequence(lead, bulkFollowUpCount, bulkSequenceType);
        onAddContact({
          ...lead,
          outreach: {
            ...sequence,
            followUpDays: bulkSequenceType === 'sequence' ? bulkFollowUpCount : undefined
          }
        });
      } catch (err) {
        console.error("Failed to generate for lead", lead.id, err);
      }
      processed++;
      setBulkGenerateProgress({ current: processed, total: leadsToProcess.length });
    }
    
    setIsBulkGenerating(false);
    setShowBulkOutreachModal(false);
    setSelectedIds(new Set());
  };

  const handleVerifyEmail = async (e: React.MouseEvent, lead: Lead) => {
      e.stopPropagation();
      if (!lead.email) return;
      
      setVerifyingId(lead.id);
      try {
          const status = await verifyEmailAddress(lead.email);
          onAddContact({ ...lead, emailStatus: status });
      } catch(e) {
          console.error(e);
      } finally {
          setVerifyingId(null);
      }
  };

  const handleEnrichContact = async (e: React.MouseEvent, lead: Lead) => {
      e.stopPropagation();
      
      if (!lead.website) {
          alert("A website domain is required to find direct dials. Please edit the contact and add a website.");
          return;
      }

      if (!onConsumeCredits(10)) return;

      setIsEnrichingId(lead.id);
      try {
          // Use website hostname as domain
          let domain = lead.website;
          try {
             domain = new URL(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`).hostname;
          } catch (err) {}

          const data = await findDirectDial(lead.name, domain, '');
          
          if (data && (data.phone || data.email)) {
              // Merge data carefully
              const updatedLead = {
                  ...lead,
                  phone: data.phone || lead.phone, // Prefer new phone if found
                  email: lead.email || data.email, // Keep existing email if exists, else use new
                  emailStatus: data.emailStatus || lead.emailStatus,
                  emailSource: data.emailSource || lead.emailSource,
                  socials: { ...lead.socials, ...data.socials }
              };
              onAddContact(updatedLead);
              alert("Found contact info! Updated record.");
          } else {
              alert("No direct phone numbers found for this contact.");
          }
      } catch (err: any) {
          console.error("Enrichment failed:", err);
          alert("Failed to enrich contact.");
      } finally {
          setIsEnrichingId(null);
      }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact: Lead = {
      id: `manual-${Date.now()}`,
      name: newContact.name || 'Unknown',
      email: newContact.email || null,
      phone: newContact.phone || null,
      address: newContact.address || '',
      category: newContact.category || 'Manual Entry',
      rating: null,
      reviewCount: 0,
      website: newContact.website || null,
      pipelineStage: 'New Lead',
      emailStatus: 'unknown'
    };
    onAddContact(contact);
    setShowAddModal(false);
    setNewContact({ name: '', email: '', phone: '', address: '', category: 'Manual Entry' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const newContacts: Lead[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const contact: any = { id: `import-${Date.now()}-${i}`, rating: null, reviewCount: 0, pipelineStage: 'New Lead', emailStatus: 'unknown' };
        
        headers.forEach((header, index) => {
          if (values[index]) {
            if (header.includes('name')) contact.name = values[index];
            else if (header.includes('email')) contact.email = values[index];
            else if (header.includes('phone')) contact.phone = values[index];
            else if (header.includes('address') || header.includes('location')) contact.address = values[index];
            else if (header.includes('website')) contact.website = values[index];
            else if (header.includes('category') || header.includes('role')) contact.category = values[index];
          }
        });

        if (!contact.name) contact.name = 'Unknown';
        if (!contact.category) contact.category = 'Imported';
        
        newContacts.push(contact as Lead);
      }
      
      onImportContacts(newContacts);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (contacts.length === 0) {
      alert("No contacts to export.");
      return;
    }

    // Define CSV headers
    const headers = ['Name', 'Email', 'Email Status', 'Phone', 'Address', 'Category', 'Website', 'Pipeline Stage', 'LinkedIn URL'];
    
    // Map data to CSV rows
    const rows = contacts.map(c => [
      c.name,
      c.email || '',
      c.emailStatus || 'unknown',
      c.phone || '',
      c.address || '',
      c.category || '',
      c.website || '',
      c.pipelineStage || 'New Lead',
      c.socials?.linkedin || ''
    ]);

    // Construct CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mapx_contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeBulkEnrollment = () => {
      if (!selectedWorkflowId) return;
      onAddToWorkflow(selectedWorkflowId, Array.from(selectedIds));
      setShowWorkflowModal(false);
      setSelectedIds(new Set());
      alert(`Successfully added ${selectedIds.size} contacts to the campaign.`);
  };

  const getVerificationBadge = (status?: string) => {
      if (!status || status === 'unknown') return null;
      if (status === 'verified') return <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1 w-fit"><Check size={10} /> Valid</span>;
      if (status === 'risky') return <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 w-fit"><AlertCircle size={10} /> Risky</span>;
      if (status === 'invalid') return <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1 w-fit"><X size={10} /> Invalid</span>;
      return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-normal text-[#1f1f1f]">Contacts</h1>
             <p className="text-[#444746]">Manage your leads and organize outreach lists.</p>
          </div>
          <div className="flex gap-3">
             <input 
               type="file" 
               accept=".csv" 
               ref={fileInputRef}
               className="hidden"
               onChange={handleFileUpload}
             />
             <button 
               onClick={handleExportCSV}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c4c7c5] text-[#444746] rounded-full text-sm font-medium hover:bg-[#f0f9ff] transition-all"
             >
                <Download size={18} /> Export CSV
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c4c7c5] text-[#444746] rounded-full text-sm font-medium hover:bg-[#f0f9ff] transition-all"
             >
                <Upload size={18} /> Import CSV
             </button>
             <button 
               onClick={() => setShowAddModal(true)}
               className="flex items-center gap-2 px-4 py-2 bg-[#1f1f1f] text-white rounded-full text-sm font-medium hover:bg-black transition-all shadow-sm"
             >
                <UserPlus size={18} /> Add Contact
             </button>
          </div>
       </div>

       <div className="bg-white rounded-[24px] border border-[#e0f2fe] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-[#e0f2fe] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#f8fafc]">
             <div className="flex items-center gap-2 w-full md:w-auto">
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-2.5 text-[#444746]" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search contacts..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#e0f2fe] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all"
                    />
                 </div>
                 <div className="flex bg-white rounded-full border border-[#e0f2fe] p-1">
                     <button 
                       onClick={() => setViewMode('list')}
                       className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[#e0f2fe] text-[#0284c7]' : 'text-[#444746] hover:bg-[#f0f9ff]'}`}
                       title="List View"
                     >
                        <LayoutList size={18} />
                     </button>
                     <button 
                       onClick={() => setViewMode('board')}
                       className={`p-1.5 rounded-full transition-colors ${viewMode === 'board' ? 'bg-[#e0f2fe] text-[#0284c7]' : 'text-[#444746] hover:bg-[#f0f9ff]'}`}
                       title="Pipeline Board"
                     >
                        <Kanban size={18} />
                     </button>
                 </div>
             </div>
             
             {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 bg-[#e0f2fe] px-4 py-1.5 rounded-full animate-in fade-in">
                   <span className="text-sm font-medium text-[#0284c7]">{selectedIds.size} selected</span>
                   <div className="h-4 w-px bg-[#0284c7]/20 mx-2"></div>
                   <button 
                     onClick={() => setShowWorkflowModal(true)}
                     className="text-sm font-medium text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1"
                   >
                      <GitMerge size={14} /> Add to Automation
                   </button>
                   <button 
                     onClick={() => setShowBulkOutreachModal(true)}
                     className="text-sm font-medium text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 ml-2"
                   >
                      <Mail size={14} /> Bulk Outreach
                   </button>
                   <button 
                     onClick={() => {
                        const confirm = window.confirm("Are you sure you want to delete these contacts?");
                        if (confirm) {
                           selectedIds.forEach(id => onDeleteContact(id));
                           setSelectedIds(new Set());
                        }
                     }}
                     className="text-sm font-medium text-[#b3261e] hover:text-[#8c1d18] flex items-center gap-1 ml-2"
                   >
                      <Trash2 size={14} /> Delete
                   </button>
                </div>
             )}
          </div>

          {/* VIEW: LIST */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-x-auto">
               <table className="min-w-full divide-y divide-[#e0f2fe]">
                  <thead className="bg-white">
                     <tr>
                        <th className="px-6 py-4 text-left w-10">
                           <input 
                             type="checkbox" 
                             checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                             onChange={toggleAll}
                             className="rounded border-[#c4c7c5] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                           />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[#444746] uppercase tracking-wider">Stage</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-[#444746] uppercase tracking-wider">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0f2fe] bg-white">
                     {filteredContacts.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-24 text-center text-[#444746]">
                              <div className="flex flex-col items-center gap-3">
                                 <div className="w-16 h-16 bg-[#f0f9ff] rounded-full flex items-center justify-center">
                                    <UserPlus size={32} className="text-[#0ea5e9]" />
                                 </div>
                                 <p className="font-medium text-lg text-[#1f1f1f]">No contacts found</p>
                                 <p className="text-sm text-[#444746]">Add manually, import CSV, or save from search results.</p>
                              </div>
                           </td>
                        </tr>
                     ) : (
                        filteredContacts.map(contact => (
                           <tr key={contact.id} className={`hover:bg-[#f0f9ff] transition-colors ${selectedIds.has(contact.id) ? 'bg-[#f0f9ff]' : ''}`}>
                              <td className="px-6 py-4">
                                 <input 
                                   type="checkbox" 
                                   checked={selectedIds.has(contact.id)}
                                   onChange={() => toggleSelection(contact.id)}
                                   className="rounded border-[#c4c7c5] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                                 />
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-bold text-sm">
                                       {contact.name.charAt(0)}
                                    </div>
                                    <div>
                                       <div className="text-sm font-medium text-[#1f1f1f]">{contact.name}</div>
                                       {contact.website && (
                                           <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noreferrer" className="text-[10px] text-[#0ea5e9] hover:underline flex items-center gap-1">
                                               <Globe size={10} /> {new URL(contact.website.startsWith('http') ? contact.website : `https://${contact.website}`).hostname}
                                           </a>
                                       )}
                                       {!contact.website && <div className="text-[10px] text-[#444746]">No Website</div>}
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="space-y-1">
                                    {contact.email ? (
                                       <div className="flex flex-col gap-1 text-xs text-[#444746]">
                                          <div className="flex items-center gap-2">
                                             <Mail size={12} /> {contact.email}
                                          </div>
                                          <div className="flex items-center gap-2">
                                              {getVerificationBadge(contact.emailStatus)}
                                              {(!contact.emailStatus || contact.emailStatus === 'unknown') && (
                                                  <button 
                                                    onClick={(e) => handleVerifyEmail(e, contact)}
                                                    disabled={verifyingId === contact.id}
                                                    className="text-[10px] text-[#0ea5e9] hover:underline flex items-center gap-1"
                                                  >
                                                      {verifyingId === contact.id ? <Loader2 size={10} className="animate-spin" /> : <ShieldCheck size={10} />}
                                                      Verify
                                                  </button>
                                              )}
                                          </div>
                                       </div>
                                    ) : (
                                        <div className="text-xs text-[#444746] opacity-50">No Email</div>
                                    )}
                                    {contact.phone ? (
                                       <div className="flex items-center gap-2 text-xs text-[#444746]">
                                          <Phone size={12} /> {contact.phone}
                                       </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-[#444746] opacity-50">
                                            <Phone size={12} /> No Phone
                                        </div>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className="px-2.5 py-1 bg-[#f0f9ff] text-[#0284c7] rounded-full text-xs font-medium">
                                    {contact.category}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className="px-2.5 py-1 border border-[#e0f2fe] rounded-full text-xs font-medium text-[#444746]">
                                    {contact.pipelineStage || 'New Lead'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-2">
                                     {!contact.phone && contact.website && (
                                         <button 
                                            onClick={(e) => handleEnrichContact(e, contact)}
                                            disabled={isEnrichingId === contact.id}
                                            className="p-2 text-[#0ea5e9] hover:bg-[#f0f9ff] rounded-full transition-colors border border-transparent hover:border-[#e0f2fe]"
                                            title="Find Phone Number with Apollo (10 Credits)"
                                         >
                                            {isEnrichingId === contact.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                         </button>
                                     )}
                                     <button 
                                       onClick={() => onDeleteContact(contact.id)}
                                       className="p-2 text-[#444746] hover:text-[#b3261e] hover:bg-[#fce8e6] rounded-full transition-colors"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedLeadForOutreach(contact); }}
                                        className="p-2 text-[#0ea5e9] hover:bg-[#f0f9ff] rounded-full transition-colors border border-transparent hover:border-[#e0f2fe]"
                                        title="Generate Outreach"
                                     >
                                        <Mail size={16} />
                                     </button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
          )}

          {/* VIEW: BOARD (KANBAN) */}
          {viewMode === 'board' && (
             <div className="flex-1 overflow-x-auto p-6 bg-[#f8fafc]">
                <div className="flex gap-6 min-w-max h-full">
                   {PIPELINE_STAGES.map(stage => {
                      const leadsInStage = filteredContacts.filter(c => (c.pipelineStage || 'New Lead') === stage);
                      return (
                         <div key={stage} className="w-72 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#1f1f1f]">{stage}</span>
                                  <span className="text-xs text-[#444746] bg-[#e0f2fe] px-2 py-0.5 rounded-full">{leadsInStage.length}</span>
                               </div>
                            </div>
                            <div className="bg-[#f0f9ff]/50 rounded-2xl p-2 flex-1 border border-dashed border-[#e0f2fe] overflow-y-auto">
                               {leadsInStage.map(lead => (
                                  <div key={lead.id} className="bg-white p-3 rounded-xl shadow-sm border border-[#e0f2fe] mb-3 group hover:border-[#0ea5e9]/50 transition-all cursor-grab active:cursor-grabbing">
                                     <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-[#1f1f1f]">{lead.name}</div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedLeadForOutreach(lead); }} 
                                                className="text-[#e3e3e3] hover:text-[#0ea5e9] opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Generate Outreach"
                                            >
                                                <Mail size={14} />
                                            </button>
                                            <button onClick={() => onDeleteContact(lead.id)} className="text-[#e3e3e3] hover:text-[#b3261e] opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                     </div>
                                     <div className="text-xs text-[#444746] mb-3">{lead.category}</div>
                                     
                                     {/* Quick Move Buttons (Simulating drag n drop for now) */}
                                     <div className="flex justify-end gap-1 pt-2 border-t border-[#f0f9ff]">
                                        {stage !== 'New Lead' && (
                                           <button onClick={() => updateStage(lead, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) - 1])} className="text-[10px] bg-[#f0f9ff] px-2 py-1 rounded hover:bg-[#e0f2fe] text-[#444746]">
                                              ←
                                           </button>
                                        )}
                                        {stage !== 'Lost' && (
                                           <button onClick={() => updateStage(lead, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1])} className="text-[10px] bg-[#f0f9ff] px-2 py-1 rounded hover:bg-[#e0f2fe] text-[#444746]">
                                              →
                                           </button>
                                        )}
                                     </div>
                                  </div>
                               ))}
                               {leadsInStage.length === 0 && (
                                  <div className="h-24 flex items-center justify-center text-xs text-[#444746] opacity-50 italic">
                                     Empty
                                  </div>
                               )}
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          )}
       </div>

       {/* Add Manual Modal */}
       {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                <div className="p-6 border-b border-[#e0f2fe] flex justify-between items-center">
                   <h3 className="text-lg font-medium text-[#1f1f1f]">Add New Contact</h3>
                   <button onClick={() => setShowAddModal(false)}><X size={20} className="text-[#444746]" /></button>
                </div>
                <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-[#444746]">Full Name *</label>
                      <input 
                        required
                        className="w-full px-4 py-2 border border-[#c4c7c5] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                        value={newContact.name}
                        onChange={e => setNewContact({...newContact, name: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-[#444746]">Email</label>
                          <input 
                            type="email"
                            className="w-full px-4 py-2 border border-[#c4c7c5] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                            value={newContact.email || ''}
                            onChange={e => setNewContact({...newContact, email: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-[#444746]">Phone</label>
                          <input 
                            type="tel"
                            className="w-full px-4 py-2 border border-[#c4c7c5] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                            value={newContact.phone || ''}
                            onChange={e => setNewContact({...newContact, phone: e.target.value})}
                          />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-[#444746]">Website (Domain)</label>
                      <input 
                        className="w-full px-4 py-2 border border-[#c4c7c5] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                        value={newContact.website || ''}
                        onChange={e => setNewContact({...newContact, website: e.target.value})}
                        placeholder="e.g. company.com"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-[#444746]">Category</label>
                      <input 
                        className="w-full px-4 py-2 border border-[#c4c7c5] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                        value={newContact.category || ''}
                        onChange={e => setNewContact({...newContact, category: e.target.value})}
                        placeholder="e.g. Lead, Client, Partner"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-[#444746]">Address</label>
                      <input 
                        className="w-full px-4 py-2 border border-[#c4c7c5] rounded-lg text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                        value={newContact.address || ''}
                        onChange={e => setNewContact({...newContact, address: e.target.value})}
                      />
                   </div>
                   <div className="pt-4 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-2.5 text-sm font-medium text-[#444746] hover:bg-[#f0f9ff] rounded-full transition-colors"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-2.5 text-sm font-medium bg-[#1f1f1f] text-white rounded-full hover:bg-black transition-colors"
                      >
                         Save Contact
                      </button>
                   </div>
                </form>
             </div>
          </div>
       )}

       {/* Add to Workflow Modal */}
       {showWorkflowModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                 <div className="p-6 border-b border-[#e0f2fe] flex justify-between items-center">
                   <h3 className="text-lg font-medium text-[#1f1f1f]">Add to Automation</h3>
                   <button onClick={() => setShowWorkflowModal(false)}><X size={20} className="text-[#444746]" /></button>
                </div>
                <div className="p-6">
                   <p className="text-sm text-[#444746] mb-4">Select a campaign to enroll <strong>{selectedIds.size}</strong> contacts.</p>
                   
                   <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                      {workflows.length === 0 ? (
                         <div className="text-center py-8 bg-[#f8fafc] rounded-xl border border-dashed border-[#c4c7c5]">
                            <p className="text-sm text-[#444746]">No automations found.</p>
                            <p className="text-xs text-[#888]">Create a campaign in the Automations tab first.</p>
                         </div>
                      ) : (
                         workflows.map(wf => (
                            <div 
                              key={wf.id}
                              onClick={() => setSelectedWorkflowId(wf.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedWorkflowId === wf.id ? 'border-[#0ea5e9] bg-[#f0f9ff]' : 'border-[#e0f2fe] hover:border-[#0ea5e9]/50'}`}
                            >
                               <div>
                                  <div className="text-sm font-medium text-[#1f1f1f]">{wf.name}</div>
                                  <div className="text-xs text-[#444746]">{wf.leads.length} leads enrolled</div>
                               </div>
                               {selectedWorkflowId === wf.id && <Check size={16} className="text-[#0ea5e9]" />}
                            </div>
                         ))
                      )}
                   </div>

                   <button 
                     onClick={executeBulkEnrollment}
                     disabled={!selectedWorkflowId}
                     className="w-full py-2.5 bg-[#0ea5e9] text-white rounded-full font-medium text-sm hover:bg-[#0ea5e9]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      Enroll Contacts
                   </button>
                </div>
             </div>
          </div>
       )}

       {/* Bulk Outreach Modal */}
       {showBulkOutreachModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
             <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Generate Outreach</h2>
             <p className="text-sm text-gray-600 mb-4">Generate personalized emails and SMS for {selectedIds.size} selected leads.</p>
             
             <div className="space-y-4 mb-6">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                 <select 
                   value={bulkSequenceType}
                   onChange={(e) => setBulkSequenceType(e.target.value as 'one-time' | 'sequence')}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 >
                   <option value="one-time">One-time</option>
                   <option value="sequence">Sequence</option>
                 </select>
               </div>
               {bulkSequenceType === 'sequence' && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Number of Follow-ups</label>
                   <input 
                     type="number" 
                     min="1" max="30"
                     value={bulkFollowUpCount}
                     onChange={(e) => setBulkFollowUpCount(parseInt(e.target.value) || 1)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                   />
                 </div>
               )}
             </div>

             {isBulkGenerating ? (
               <div className="text-center py-4">
                 <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                 <p className="text-sm text-gray-600">Generating {bulkGenerateProgress.current} of {bulkGenerateProgress.total}...</p>
               </div>
             ) : (
               <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setShowBulkOutreachModal(false)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleBulkGenerateOutreach}
                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                 >
                   Start Generation
                 </button>
               </div>
             )}
           </div>
         </div>
       )}

       {/* Outreach Modal */}
       {selectedLeadForOutreach && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
               <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                   <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                       <h2 className="text-xl font-bold text-gray-900">Outreach Generator</h2>
                       <button onClick={() => setSelectedLeadForOutreach(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                           <X size={20} className="text-gray-500" />
                       </button>
                   </div>
                   <div className="p-6">
                       <OutreachGenerator 
                           lead={selectedLeadForOutreach} 
                           onUpdateLead={(updatedLead) => {
                               onAddContact(updatedLead);
                               setSelectedLeadForOutreach(updatedLead);
                           }} 
                       />
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default ContactsManager;
