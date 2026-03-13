
import React, { useState, useEffect } from 'react';
import { WorkflowStep, NodeType, Lead, WorkflowSettings, Workflow } from '../types';
import { 
  Zap, Mail, MessageSquare, Clock, Plus, Trash2, Save, X, Users, Settings, Play, Pause, ChevronRight, UserPlus, AlertCircle, Terminal, CheckCircle2, Lock, Search, MoreHorizontal, Copy, ArrowLeft,
  Linkedin, CheckSquare, BarChart, GitCommit, Webhook, PauseCircle, Bell, PenTool, Award, Send
} from 'lucide-react';

interface WorkflowBuilderProps {
  availableLeads: Lead[]; // Leads passed from the main App search
  savedContacts: Lead[]; // Leads passed from Contacts
  onNavigateToSearch?: () => void;
  workflows: Workflow[];
  onCreateWorkflow: (workflow: Workflow) => void;
  onUpdateWorkflow: (workflow: Workflow) => void;
  onDeleteWorkflow: (id: string) => void;
}

// Default initial state for a new workflow
const initialSettings: WorkflowSettings = {
  emailProvider: 'gmail',
  senderEmail: '',
  senderName: '',
  smsProvider: 'twilio',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: ''
};

const initialSteps: WorkflowStep[] = [
  { 
    id: 'trigger-1', 
    type: 'trigger', 
    title: 'New Lead Enrolled', 
    description: 'Start immediately when lead is added',
    config: {} 
  }
];

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ 
  availableLeads, 
  savedContacts,
  onNavigateToSearch,
  workflows,
  onCreateWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow
}) => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // Builder Local State (syncs to activeWorkflowId on change)
  const [activeTab, setActiveTab] = useState<'design' | 'leads' | 'settings' | 'logs'>('design');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  
  // Execution State (Simulated)
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentProcessingLead, setCurrentProcessingLead] = useState<string | null>(null);

  // Helper to get current workflow object
  const currentWorkflow = workflows.find(w => w.id === activeWorkflowId);

  // --- ACTIONS (LIST VIEW) ---

  const handleCreateNew = () => {
    const newWorkflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: `Untitled Campaign ${workflows.length + 1}`,
      isActive: false,
      steps: initialSteps,
      leads: [],
      settings: initialSettings,
      logs: []
    };
    onCreateWorkflow(newWorkflow);
    setActiveWorkflowId(newWorkflow.id);
    setViewMode('builder');
    setActiveTab('design');
  };

  const handleDuplicate = (e: React.MouseEvent, wf: Workflow) => {
    e.stopPropagation();
    const copy: Workflow = {
      ...wf,
      id: `wf-${Date.now()}`,
      name: `${wf.name} (Copy)`,
      isActive: false,
      leads: [] // Start with empty leads for copy
    };
    onCreateWorkflow(copy);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      onDeleteWorkflow(id);
    }
  };

  // --- ACTIONS (BUILDER VIEW) ---

  const updateCurrentWorkflow = (updates: Partial<Workflow>) => {
    if (!currentWorkflow) return;
    onUpdateWorkflow({ ...currentWorkflow, ...updates });
  };

  const handleAddStep = (type: NodeType) => {
    if (!currentWorkflow) return;
    
    let title = 'New Step';
    let description = 'Configure this step';
    
    switch(type) {
        case 'email': title = 'Send Email'; description = 'Send a personalized email'; break;
        case 'sms': title = 'Send SMS'; description = 'Send a text message'; break;
        case 'linkedin_connect': title = 'LinkedIn Connect'; description = 'Send connection request'; break;
        case 'linkedin_message': title = 'LinkedIn Message'; description = 'Send direct message'; break;
        case 'delay': title = 'Wait Delay'; description = 'Pause workflow'; break;
        case 'manual_task': title = 'Manual Task'; description = 'Create CRM task for human'; break;
        case 'update_stage': title = 'Update Pipeline'; description = 'Change lead stage'; break;
        case 'webhook': title = 'Webhook'; description = 'Send data to external API'; break;
        case 'wait_reply': title = 'Wait for Reply'; description = 'Pause until lead responds'; break;
        case 'ai_draft': title = 'AI Email Draft'; description = 'Generate draft for review'; break;
        case 'notification': title = 'Internal Notify'; description = 'Alert team via Slack/Email'; break;
        case 'score_lead': title = 'Lead Score'; description = 'Adjust lead score'; break;
        default: break;
    }

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      title,
      description,
      config: {
        delayTime: 1,
        delayUnit: 'days',
        subject: '',
        body: '',
        scoreDelta: 10
      }
    };
    updateCurrentWorkflow({ steps: [...currentWorkflow.steps, newStep] });
    setSelectedStepId(newStep.id);
    setIsSidebarOpen(true);
  };

  const handleDeleteStep = (id: string) => {
    if (!currentWorkflow) return;
    updateCurrentWorkflow({ steps: currentWorkflow.steps.filter(s => s.id !== id) });
    if (selectedStepId === id) {
      setSelectedStepId(null);
      setIsSidebarOpen(false);
    }
  };

  const handleUpdateStepConfig = (key: string, value: any) => {
    if (!currentWorkflow || !selectedStepId) return;
    const updatedSteps = currentWorkflow.steps.map(s => {
      if (s.id === selectedStepId) {
        return { ...s, config: { ...s.config, [key]: value } };
      }
      return s;
    });
    updateCurrentWorkflow({ steps: updatedSteps });
  };

  const toggleLeadEnrollment = (lead: Lead) => {
    if (!currentWorkflow) return;
    const exists = currentWorkflow.leads.find(l => l.id === lead.id);
    if (exists) {
      updateCurrentWorkflow({ leads: currentWorkflow.leads.filter(l => l.id !== lead.id) });
    } else {
      updateCurrentWorkflow({ leads: [...currentWorkflow.leads, { ...lead, workflowStatus: 'idle' }] });
    }
  };

  const importLeads = (source: 'search' | 'saved') => {
    if (!currentWorkflow) return;
    const sourceLeads = source === 'search' ? availableLeads : savedContacts;

    if (sourceLeads.length === 0) {
        alert(source === 'search' 
           ? "No leads found in Search results. Go to Lead Search first." 
           : "No saved contacts found. Save some leads first."
        );
        return;
    }

    const newLeads = sourceLeads.filter(sl => !currentWorkflow.leads.find(wl => wl.id === sl.id));
    
    if (newLeads.length === 0) {
        alert("All available contacts are already enrolled.");
        return;
    }

    const leadsWithStatus = newLeads.map(l => ({ ...l, workflowStatus: 'idle' } as Lead));
    updateCurrentWorkflow({ leads: [...currentWorkflow.leads, ...leadsWithStatus] });
  };

  // --- EXECUTION ENGINE (SIMULATION) ---
  const log = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const runCampaign = async () => {
    if (!currentWorkflow) return;

    // Check for empty leads and offer auto-import
    if (currentWorkflow.leads.length === 0) {
      if (availableLeads.length > 0) {
         if (window.confirm(`No leads enrolled.\n\nFound ${availableLeads.length} leads in search results. Import them and start?`)) {
             const leadsWithStatus = availableLeads.map(l => ({ ...l, workflowStatus: 'idle' } as Lead));
             updateCurrentWorkflow({ leads: leadsWithStatus });
             // Wait for state update simulation
             setTimeout(() => {
                 // Recursively call to start
                 const updatedWf = { ...currentWorkflow, leads: leadsWithStatus };
                 // Manually triggering start logic as state update might be slow
                 alert("Leads imported! Click Launch again to start.");
             }, 100);
             return;
         }
      } else if (savedContacts.length > 0) {
         if (window.confirm(`No leads enrolled.\n\nFound ${savedContacts.length} saved contacts. Import them and start?`)) {
             const leadsWithStatus = savedContacts.map(l => ({ ...l, workflowStatus: 'idle' } as Lead));
             updateCurrentWorkflow({ leads: leadsWithStatus });
             setTimeout(() => {
                 alert("Leads imported! Click Launch again to start.");
             }, 100);
             return;
         }
      } else {
         alert("No leads found! Please go to 'Lead Search' or 'Contacts' to find people to contact.");
         return;
      }
      return;
    }

    setIsRunning(true);
    setActiveTab('logs');
    setLogs([]);
    log("🚀 Campaign Started...");
    updateCurrentWorkflow({ isActive: true });

    // Process leads
    const leadsCopy = [...currentWorkflow.leads]; 
    
    for (let i = 0; i < leadsCopy.length; i++) {
      const lead = leadsCopy[i];
      if (!lead) continue;
      
      setCurrentProcessingLead(lead.id);
      log(`--- Processing: ${lead.name} ---`);
      
      leadsCopy[i] = { ...lead, workflowStatus: 'active' };
      updateCurrentWorkflow({ leads: [...leadsCopy] });

      for (const step of currentWorkflow.steps) {
         if (step.type === 'trigger') continue;
         await new Promise(r => setTimeout(r, 800)); // Sim delay

         switch (step.type) {
             case 'email': 
                log(`📧 [SIMULATION] Sending Email to ${lead.email || 'N/A'}`);
                log(`   Subject: ${step.config.subject || '(No Subject)'}`);
                break;
             case 'sms': 
                log(`📱 [SIMULATION] Sending SMS to ${lead.phone || 'N/A'}`); 
                break;
             case 'linkedin_connect': 
                log(`🔗 Sending LinkedIn Connection Request...`); 
                break;
             case 'linkedin_message': 
                log(`💬 Sending LinkedIn DM...`); 
                break;
             case 'delay': 
                log(`⏳ Waiting ${step.config.delayTime} ${step.config.delayUnit}...`); 
                break;
             case 'manual_task': 
                log(`📝 Created Task: ${step.config.taskDescription || 'Follow up'}`); 
                break;
             case 'update_stage': 
                log(`📊 Moved to Stage: ${step.config.pipelineStage || 'Next Stage'}`); 
                break;
             case 'webhook': 
                log(`🌐 Webhook triggered: ${step.config.webhookUrl || 'No URL'}`); 
                break;
             case 'wait_reply': 
                log(`🛑 Paused: Waiting for reply (Simulated: Reply Received)`); 
                break;
             case 'ai_draft': 
                log(`🤖 AI Draft Generated for review.`); 
                break;
             case 'notification': 
                log(`🔔 Notification sent to team.`); 
                break;
             case 'score_lead': 
                log(`📈 Lead Score updated by ${step.config.scoreDelta}`); 
                break;
         }
      }
      
      leadsCopy[i] = { ...lead, workflowStatus: 'completed' };
      updateCurrentWorkflow({ leads: [...leadsCopy] });
      log(`✅ Completed sequence for ${lead.name}`);
   }

    setIsRunning(false);
    setCurrentProcessingLead(null);
    updateCurrentWorkflow({ isActive: false });
    log("🎉 Campaign Finished");
  };

  // Helper for Node Colors
  const getNodeColor = (type: NodeType) => {
      if (['email', 'sms', 'linkedin_connect', 'linkedin_message'].includes(type)) return 'bg-blue-100 text-blue-600 border-blue-200';
      if (['delay', 'wait_reply', 'condition'].includes(type)) return 'bg-amber-100 text-amber-600 border-amber-200';
      if (['manual_task', 'update_stage', 'score_lead'].includes(type)) return 'bg-green-100 text-green-600 border-green-200';
      if (['webhook', 'ai_draft', 'notification'].includes(type)) return 'bg-purple-100 text-purple-600 border-purple-200';
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getNodeIcon = (type: NodeType) => {
      switch(type) {
          case 'trigger': return <Zap size={20} />;
          case 'email': return <Mail size={20} />;
          case 'sms': return <MessageSquare size={20} />;
          case 'linkedin_connect': 
          case 'linkedin_message': return <Linkedin size={20} />;
          case 'delay': return <Clock size={20} />;
          case 'manual_task': return <CheckSquare size={20} />;
          case 'update_stage': return <GitCommit size={20} />;
          case 'webhook': return <Webhook size={20} />;
          case 'wait_reply': return <PauseCircle size={20} />;
          case 'ai_draft': return <PenTool size={20} />;
          case 'notification': return <Bell size={20} />;
          case 'score_lead': return <BarChart size={20} />;
          default: return <Settings size={20} />;
      }
  };

  // --- RENDER: DASHBOARD VIEW ---
  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">Automations</h1>
                <p className="text-[#444746]">Manage your outreach campaigns.</p>
             </div>
             <button 
               onClick={handleCreateNew}
               className="bg-[#1f1f1f] text-white px-6 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-black transition-all shadow-md"
             >
                <Plus size={18} /> New Campaign
             </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map(wf => (
               <div 
                 key={wf.id}
                 onClick={() => { setActiveWorkflowId(wf.id); setViewMode('builder'); }}
                 className="bg-white rounded-[24px] border border-[#e0f2fe] p-6 cursor-pointer hover:shadow-md hover:border-[#0ea5e9]/50 transition-all group relative"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-xl ${wf.isActive ? 'bg-green-50 text-green-600' : 'bg-[#f0f9ff] text-[#0284c7]'}`}>
                        <Zap size={24} />
                     </div>
                     <div className="flex gap-1">
                        <button onClick={(e) => handleDuplicate(e, wf)} className="p-2 text-[#444746] hover:bg-[#f0f9ff] rounded-full transition-colors" title="Duplicate">
                           <Copy size={16} />
                        </button>
                        <button onClick={(e) => handleDelete(e, wf.id)} className="p-2 text-[#444746] hover:text-[#b3261e] hover:bg-[#fce8e6] rounded-full transition-colors" title="Delete">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-[#1f1f1f] mb-1 group-hover:text-[#0ea5e9] transition-colors truncate">{wf.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#444746] mb-6">
                      <span className={`w-2 h-2 rounded-full ${wf.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                      {wf.isActive ? 'Running' : 'Draft'}
                      <span>•</span>
                      {wf.steps.length} Steps
                  </div>

                  <div className="flex items-center justify-between text-sm pt-4 border-t border-[#f0f9ff]">
                     <div className="flex items-center gap-2 text-[#444746]">
                        <Users size={16} />
                        {wf.leads.length} Enrolled
                     </div>
                     <ChevronRight size={16} className="text-[#e3e3e3] group-hover:text-[#0ea5e9] transition-colors" />
                  </div>
               </div>
            ))}

            {/* Create New Card (Empty State) */}
            {workflows.length === 0 && (
               <div onClick={handleCreateNew} className="border-2 border-dashed border-[#e0f2fe] rounded-[24px] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f0f9ff] hover:border-[#0ea5e9] transition-all min-h-[200px]">
                   <div className="w-12 h-12 bg-[#f0f9ff] rounded-full flex items-center justify-center text-[#0284c7] mb-3">
                      <Plus size={24} />
                   </div>
                   <span className="font-medium text-[#1f1f1f]">Create your first campaign</span>
                   <p className="text-sm text-[#444746] mt-1">Automate emails, SMS, & calls</p>
               </div>
            )}
         </div>
      </div>
    );
  }

  // --- RENDER: BUILDER VIEW ---
  if (!currentWorkflow) return <div>Error: Campaign not found</div>;
  const selectedStep = currentWorkflow.steps.find(s => s.id === selectedStepId);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-[#e0f2fe] px-6 py-4 flex justify-between items-center rounded-t-[24px]">
        <div className="flex items-center gap-4">
           <button onClick={() => setViewMode('list')} className="p-2 hover:bg-[#f0f9ff] rounded-full text-[#444746]">
              <ArrowLeft size={20} />
           </button>
           <div>
              <input 
                value={currentWorkflow.name}
                onChange={(e) => updateCurrentWorkflow({ name: e.target.value })}
                className="text-xl font-medium text-[#1f1f1f] bg-transparent outline-none focus:underline decoration-dashed decoration-[#e3e3e3]"
              />
              <div className="flex items-center gap-2 text-xs text-[#444746] mt-1">
                 <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                 {isRunning ? 'Running...' : 'Draft Mode'}
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2 bg-[#f0f9ff] p-1 rounded-full border border-[#e0f2fe]">
           {['design', 'leads', 'settings', 'logs'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 capitalize ${activeTab === tab ? 'bg-white shadow-sm text-[#0ea5e9]' : 'text-[#444746] hover:text-[#1f1f1f]'}`}
             >
               {tab === 'design' && <Zap size={16} />}
               {tab === 'leads' && <Users size={16} />}
               {tab === 'settings' && <Settings size={16} />}
               {tab === 'logs' && <Terminal size={16} />}
               {tab}
             </button>
           ))}
        </div>

        <div>
          {isRunning ? (
            <button onClick={() => setIsRunning(false)} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 shadow-md">
               <Pause size={16} /> Stop
            </button>
          ) : (
            <button onClick={runCampaign} className="flex items-center gap-2 px-6 py-2.5 bg-[#1f1f1f] text-white rounded-full text-sm font-medium hover:bg-black shadow-md">
               <Play size={16} /> Launch
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden bg-[#f8fafc]">
        
        {/* TAB: DESIGN CANVAS */}
        {activeTab === 'design' && (
           <div className="flex-1 flex relative">
              <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
                  <div className="max-w-xl mx-auto pb-48">
                      {/* Timeline Line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#e0f2fe] -translate-x-1/2 z-0"></div>

                      {currentWorkflow.steps.map((step) => (
                        <div key={step.id} className="relative z-10 mb-8 group">
                            {/* Node Card */}
                            <div 
                              onClick={() => { setSelectedStepId(step.id); setIsSidebarOpen(true); }}
                              className={`
                                relative bg-white rounded-2xl p-4 border-2 cursor-pointer transition-all hover:shadow-md
                                ${selectedStepId === step.id ? 'border-[#0ea5e9] shadow-md ring-4 ring-[#0ea5e9]/10' : 'border-[#e0f2fe] hover:border-[#0ea5e9]/50'}
                                ${step.type === 'trigger' ? 'border-dashed border-[#0ea5e9] bg-[#f0f9ff]' : ''}
                              `}
                            >
                               <div className="flex items-start gap-4">
                                  <div className={`
                                     w-10 h-10 rounded-full flex items-center justify-center shrink-0 border
                                     ${getNodeColor(step.type)}
                                  `}>
                                      {getNodeIcon(step.type)}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between">
                                        <h3 className="font-medium text-[#1f1f1f]">{step.title}</h3>
                                        {step.type !== 'trigger' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }}
                                            className="text-[#444746] hover:text-[#b3261e] p-1 rounded hover:bg-red-50"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm text-[#444746] mt-1">
                                        {step.description}
                                      </p>
                                  </div>
                               </div>
                            </div>

                            {/* Add Button */}
                            <div className="flex justify-center mt-8 relative">
                                <div className="absolute top-0 bottom-0 w-0.5 bg-[#e0f2fe]"></div>
                                <div className="relative z-10 group/add">
                                   <button className="w-8 h-8 rounded-full bg-white border border-[#e0f2fe] text-[#444746] flex items-center justify-center hover:bg-[#0ea5e9] hover:text-white hover:border-[#0ea5e9] transition-all shadow-sm">
                                      <Plus size={16} />
                                   </button>
                                   
                                   {/* Expanded Menu */}
                                   <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-[#e0f2fe] p-3 w-64 hidden group-hover/add:block animate-in fade-in zoom-in duration-200 z-50 h-80 overflow-y-auto custom-scrollbar">
                                      
                                      <div className="mb-2">
                                          <div className="text-[10px] font-bold text-[#444746] uppercase tracking-wider px-2 py-1 mb-1">Communication</div>
                                          <button onClick={() => handleAddStep('email')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Mail size={14} className="text-blue-600" /> Send Email
                                          </button>
                                          <button onClick={() => handleAddStep('sms')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <MessageSquare size={14} className="text-green-600" /> Send SMS
                                          </button>
                                          <button onClick={() => handleAddStep('linkedin_connect')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Linkedin size={14} className="text-[#0077b5]" /> LI Connection
                                          </button>
                                          <button onClick={() => handleAddStep('linkedin_message')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Linkedin size={14} className="text-[#0077b5]" /> LI Message
                                          </button>
                                      </div>

                                      <div className="mb-2 border-t border-[#f0f9ff] pt-2">
                                          <div className="text-[10px] font-bold text-[#444746] uppercase tracking-wider px-2 py-1 mb-1">Flow Logic</div>
                                          <button onClick={() => handleAddStep('delay')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Clock size={14} className="text-amber-600" /> Wait Delay
                                          </button>
                                          <button onClick={() => handleAddStep('wait_reply')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <PauseCircle size={14} className="text-amber-600" /> Wait for Reply
                                          </button>
                                      </div>

                                      <div className="mb-2 border-t border-[#f0f9ff] pt-2">
                                          <div className="text-[10px] font-bold text-[#444746] uppercase tracking-wider px-2 py-1 mb-1">CRM & Ops</div>
                                          <button onClick={() => handleAddStep('manual_task')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <CheckSquare size={14} className="text-purple-600" /> Create Task
                                          </button>
                                          <button onClick={() => handleAddStep('score_lead')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Award size={14} className="text-yellow-600" /> Lead Score
                                          </button>
                                          <button onClick={() => handleAddStep('update_stage')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <GitCommit size={14} className="text-blue-600" /> Update Stage
                                          </button>
                                      </div>

                                      <div className="mb-2 border-t border-[#f0f9ff] pt-2">
                                          <div className="text-[10px] font-bold text-[#444746] uppercase tracking-wider px-2 py-1 mb-1">Advanced</div>
                                          <button onClick={() => handleAddStep('ai_draft')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <PenTool size={14} className="text-indigo-600" /> AI Draft
                                          </button>
                                          <button onClick={() => handleAddStep('webhook')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Webhook size={14} className="text-pink-600" /> Webhook
                                          </button>
                                          <button onClick={() => handleAddStep('notification')} className="w-full text-left px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f0f9ff] rounded-lg flex items-center gap-2">
                                            <Bell size={14} className="text-red-600" /> Internal Alert
                                          </button>
                                      </div>

                                   </div>
                                </div>
                            </div>
                        </div>
                      ))}
                  </div>
              </div>

              {/* Design Config Sidebar */}
              {isSidebarOpen && selectedStep && (
                 <div className="w-96 bg-white border-l border-[#e0f2fe] shadow-xl flex flex-col animate-in slide-in-from-right duration-300 z-40">
                    <div className="p-6 border-b border-[#e0f2fe] flex justify-between items-center bg-white">
                       <span className="font-medium text-[#1f1f1f] capitalize">{selectedStep.type.replace('_', ' ')} Config</span>
                       <button onClick={() => setIsSidebarOpen(false)} className="text-[#444746] hover:bg-[#f0f9ff] p-1 rounded">
                          <X size={20} />
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Step Name</label>
                          <input 
                            type="text" 
                            value={selectedStep.title}
                            onChange={(e) => {
                                const newSteps = currentWorkflow.steps.map(s => s.id === selectedStep.id ? { ...s, title: e.target.value } : s);
                                updateCurrentWorkflow({ steps: newSteps });
                            }}
                            className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                          />
                       </div>

                       {/* DYNAMIC FIELDS BASED ON TYPE */}
                       
                       {/* DELAY */}
                       {selectedStep.type === 'delay' && (
                          <div className="space-y-4">
                             <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Wait Duration</label>
                             <div className="flex gap-2">
                                <input 
                                  type="number" 
                                  value={selectedStep.config.delayTime}
                                  onChange={(e) => handleUpdateStepConfig('delayTime', e.target.value)}
                                  className="w-20 px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                />
                                <select 
                                   value={selectedStep.config.delayUnit}
                                   onChange={(e) => handleUpdateStepConfig('delayUnit', e.target.value)}
                                   className="flex-1 px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                >
                                   <option value="minutes">Minutes</option>
                                   <option value="hours">Hours</option>
                                   <option value="days">Days</option>
                                </select>
                             </div>
                          </div>
                       )}

                       {/* EMAIL / SMS */}
                       {(selectedStep.type === 'email' || selectedStep.type === 'sms') && (
                          <div className="space-y-4">
                             {selectedStep.type === 'email' && (
                               <div className="space-y-2">
                                  <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Subject Line</label>
                                  <input 
                                    type="text" 
                                    value={selectedStep.config.subject}
                                    onChange={(e) => handleUpdateStepConfig('subject', e.target.value)}
                                    className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                  />
                               </div>
                             )}
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Message Body</label>
                                <textarea 
                                   rows={8}
                                   value={selectedStep.config.body}
                                   onChange={(e) => handleUpdateStepConfig('body', e.target.value)}
                                   className="w-full px-4 py-3 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20 resize-none"
                                />
                             </div>
                             
                             {/* TEST EMAIL BUTTON */}
                             {selectedStep.type === 'email' && (
                                <div className="pt-2">
                                    <a 
                                      href={`mailto:test@example.com?subject=${encodeURIComponent(selectedStep.config.subject || '')}&body=${encodeURIComponent(selectedStep.config.body || '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-[#c4c7c5] text-[#444746] rounded-lg text-xs font-medium hover:bg-[#f0f9ff] hover:text-[#0ea5e9] transition-colors"
                                    >
                                        <Send size={14} /> Test Send (Open Email Client)
                                    </a>
                                    <p className="text-[10px] text-[#888] text-center mt-1">Verifies content formatting only.</p>
                                </div>
                             )}
                          </div>
                       )}

                       {/* LINKEDIN */}
                       {(selectedStep.type === 'linkedin_connect' || selectedStep.type === 'linkedin_message') && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Message Text</label>
                                <textarea 
                                   rows={6}
                                   value={selectedStep.config.linkedinMessage || ''}
                                   onChange={(e) => handleUpdateStepConfig('linkedinMessage', e.target.value)}
                                   className="w-full px-4 py-3 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20 resize-none"
                                   placeholder="Hi {FirstName}, I saw your profile..."
                                />
                             </div>
                          </div>
                       )}

                       {/* MANUAL TASK */}
                       {selectedStep.type === 'manual_task' && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Task Description</label>
                                <input 
                                  type="text" 
                                  value={selectedStep.config.taskDescription || ''}
                                  onChange={(e) => handleUpdateStepConfig('taskDescription', e.target.value)}
                                  className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                  placeholder="e.g. Research lead website"
                                />
                             </div>
                          </div>
                       )}

                       {/* WEBHOOK */}
                       {selectedStep.type === 'webhook' && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Webhook URL</label>
                                <input 
                                  type="text" 
                                  value={selectedStep.config.webhookUrl || ''}
                                  onChange={(e) => handleUpdateStepConfig('webhookUrl', e.target.value)}
                                  className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                  placeholder="https://hooks.zapier.com/..."
                                />
                             </div>
                          </div>
                       )}

                       {/* UPDATE STAGE */}
                       {selectedStep.type === 'update_stage' && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">New Pipeline Stage</label>
                                <select 
                                   value={selectedStep.config.pipelineStage || ''}
                                   onChange={(e) => handleUpdateStepConfig('pipelineStage', e.target.value)}
                                   className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                >
                                   <option value="">Select Stage</option>
                                   <option value="New Lead">New Lead</option>
                                   <option value="Contacted">Contacted</option>
                                   <option value="Interested">Interested</option>
                                   <option value="Meeting Booked">Meeting Booked</option>
                                   <option value="Closed">Closed</option>
                                </select>
                             </div>
                          </div>
                       )}

                       {/* SCORE LEAD */}
                       {selectedStep.type === 'score_lead' && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Score Adjustment</label>
                                <input 
                                  type="number" 
                                  value={selectedStep.config.scoreDelta || 0}
                                  onChange={(e) => handleUpdateStepConfig('scoreDelta', e.target.value)}
                                  className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                  placeholder="+10 or -5"
                                />
                                <p className="text-xs text-[#444746]">Positive to increase score, negative to decrease.</p>
                             </div>
                          </div>
                       )}

                       {/* AI DRAFT */}
                       {selectedStep.type === 'ai_draft' && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Drafting Instructions</label>
                                <textarea 
                                   rows={4}
                                   value={selectedStep.config.promptContext || ''}
                                   onChange={(e) => handleUpdateStepConfig('promptContext', e.target.value)}
                                   className="w-full px-4 py-3 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20 resize-none"
                                   placeholder="Mention their recent LinkedIn post..."
                                />
                             </div>
                          </div>
                       )}

                       {/* NOTIFICATION */}
                       {selectedStep.type === 'notification' && (
                          <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#444746] uppercase tracking-wider">Notification Channel</label>
                                <select 
                                   value={selectedStep.config.notificationChannel || 'email'}
                                   onChange={(e) => handleUpdateStepConfig('notificationChannel', e.target.value)}
                                   className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                >
                                   <option value="email">Email to Team</option>
                                   <option value="slack">Slack Alert</option>
                                   <option value="in-app">In-App Notification</option>
                                </select>
                             </div>
                          </div>
                       )}

                    </div>
                 </div>
              )}
           </div>
        )}

        {/* TAB: LEADS */}
        {activeTab === 'leads' && (
           <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto bg-white rounded-[24px] border border-[#e0f2fe] shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-[#e0f2fe] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                       <h3 className="text-lg font-medium text-[#1f1f1f]">Enrolled Leads</h3>
                       <p className="text-sm text-[#444746]">These contacts will receive the campaign messages.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => importLeads('saved')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#f0f9ff] text-[#0284c7] rounded-full text-sm font-medium hover:bg-[#e0f2fe]"
                        >
                            <UserPlus size={16} /> Import from Contacts
                        </button>
                        <button 
                            onClick={() => importLeads('search')}
                            className="flex items-center gap-2 px-4 py-2 bg-[#f0f9ff] text-[#0284c7] rounded-full text-sm font-medium hover:bg-[#e0f2fe]"
                        >
                            <Search size={16} /> Import from Search
                        </button>
                    </div>
                 </div>
                 
                 <table className="w-full">
                    <thead className="bg-[#f0f9ff]">
                       <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-[#444746] uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-[#444746] uppercase">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-[#444746] uppercase">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-[#444746] uppercase">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e0f2fe]">
                       {currentWorkflow.leads.length === 0 ? (
                          <tr>
                             <td colSpan={4} className="p-12 text-center text-[#444746]">
                                <p className="mb-4">No leads enrolled yet.</p>
                             </td>
                          </tr>
                       ) : (
                          currentWorkflow.leads.map(lead => (
                             <tr key={lead.id} className={currentProcessingLead === lead.id ? "bg-[#e0f2fe]/30" : ""}>
                                <td className="px-6 py-4 text-sm font-medium text-[#1f1f1f]">{lead.name}</td>
                                <td className="px-6 py-4 text-sm text-[#444746]">
                                   {lead.email || <span className="text-amber-600">No Email</span>}
                                   <div className="text-xs text-[#888]">{lead.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`
                                      px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                      ${lead.workflowStatus === 'completed' ? 'bg-green-100 text-green-700' : ''}
                                      ${lead.workflowStatus === 'active' ? 'bg-blue-100 text-blue-700 animate-pulse' : ''}
                                      ${lead.workflowStatus === 'idle' ? 'bg-gray-100 text-gray-600' : ''}
                                   `}>
                                      {lead.workflowStatus || 'Idle'}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <button 
                                      onClick={() => toggleLeadEnrollment(lead)}
                                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
           <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-8">
                 <div className="bg-white rounded-[24px] border border-[#e0f2fe] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                          <Mail size={24} />
                       </div>
                       <div>
                          <h3 className="text-lg font-medium text-[#1f1f1f]">Email Configuration</h3>
                          <p className="text-xs text-[#444746]">Connect Gmail or SendGrid to send emails.</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-[#444746] mb-1">Sender Name</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-[#e0f2fe] rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                            placeholder="e.g. John from Mapx"
                            value={currentWorkflow.settings.senderName}
                            onChange={(e) => updateCurrentWorkflow({ settings: {...currentWorkflow.settings, senderName: e.target.value} })}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-[#444746] mb-1">From Email Address</label>
                          <input 
                            type="email" 
                            className="w-full px-4 py-2 border border-[#e0f2fe] rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none"
                            placeholder="e.g. john@company.com"
                            value={currentWorkflow.settings.senderEmail}
                            onChange={(e) => updateCurrentWorkflow({ settings: {...currentWorkflow.settings, senderEmail: e.target.value} })}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-[24px] border border-[#e0f2fe] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                             <MessageSquare size={24} />
                          </div>
                          <div>
                             <h3 className="text-lg font-medium text-[#1f1f1f]">Twilio Configuration</h3>
                             <p className="text-xs text-[#444746]">Required for sending SMS messages.</p>
                          </div>
                       </div>
                       {currentWorkflow.settings.twilioAccountSid && currentWorkflow.settings.twilioAuthToken && (
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                               <CheckCircle2 size={12} /> Connected
                           </div>
                       )}
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-[#444746] mb-1">Account SID</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-[#e0f2fe] rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none font-mono text-sm"
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={currentWorkflow.settings.twilioAccountSid}
                            onChange={(e) => updateCurrentWorkflow({ settings: {...currentWorkflow.settings, twilioAccountSid: e.target.value} })}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-[#444746] mb-1">Auth Token</label>
                          <div className="relative">
                             <Lock size={14} className="absolute left-3 top-3 text-[#444746]" />
                             <input 
                               type="password" 
                               className="w-full pl-9 pr-4 py-2 border border-[#e0f2fe] rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none font-mono text-sm"
                               placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                               value={currentWorkflow.settings.twilioAuthToken}
                               onChange={(e) => updateCurrentWorkflow({ settings: {...currentWorkflow.settings, twilioAuthToken: e.target.value} })}
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-[#444746] mb-1">Twilio Phone Number</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-[#e0f2fe] rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none font-mono text-sm"
                            placeholder="+1 (555) 000-0000"
                            value={currentWorkflow.settings.twilioPhoneNumber}
                            onChange={(e) => updateCurrentWorkflow({ settings: {...currentWorkflow.settings, twilioPhoneNumber: e.target.value} })}
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* TAB: LOGS */}
        {activeTab === 'logs' && (
           <div className="flex-1 p-0 bg-[#1e1e1e] overflow-hidden flex flex-col font-mono text-sm">
              <div className="p-4 bg-[#252526] border-b border-[#333] flex justify-between items-center">
                 <span className="text-gray-300 flex items-center gap-2"><Terminal size={14} /> Execution Console</span>
                 <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {logs.length === 0 && <span className="text-gray-600 italic">Waiting for campaign to start...</span>}
                 {logs.map((log, i) => (
                    <div key={i} className={`
                       ${log.includes('❌') ? 'text-red-400' : ''}
                       ${log.includes('✅') ? 'text-green-400' : ''}
                       ${log.includes('⚠️') ? 'text-yellow-400' : ''}
                       ${log.includes('⏳') ? 'text-blue-400' : ''}
                       ${!log.match(/[❌✅⚠️⏳]/) ? 'text-gray-300' : ''}
                    `}>
                       {log}
                    </div>
                 ))}
                 <div className="h-4" />
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
