import React, { useState, useEffect } from 'react';
import { Meeting, AppUser } from '../types';
import { Video, Plus, FileText, Play, CheckCircle2, Search, FileAudio, Bot, FileSignature } from 'lucide-react';
import { generateMeetingProposal } from '../services/gemini';

interface MeetingIntelligenceProps {
  user: AppUser;
}

export default function MeetingIntelligence({ user }: MeetingIntelligenceProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(false);
  }, [user]);

  const handleGenerateProposal = async (meeting: Meeting) => {
    if (!meeting.transcript || !meeting.summary) return;
    
    setIsGeneratingProposal(true);
    try {
      const proposal = await generateMeetingProposal(meeting.transcript, meeting.summary);
      
      const updatedMeeting = {
        ...meeting,
        proposal,
        updatedAt: new Date().toISOString()
      };
      
      setMeetings(prev => prev.map(m => m.id === meeting.id ? updatedMeeting : m));
      setSelectedMeeting(updatedMeeting);
    } catch (error) {
      console.error("Failed to generate proposal", error);
      alert("Failed to generate proposal. Please try again.");
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleIntegrateFireflies = async () => {
    if (!user) return;
    alert("Fireflies integration would open OAuth flow here. For now, we'll simulate fetching a new meeting.");
    try {
      const newMeeting: Meeting = {
        id: `meeting-${Date.now()}`,
        title: 'Product Demo with Globex',
        date: new Date().toISOString(),
        provider: 'fireflies',
        status: 'completed',
        summary: 'Demoed the new features. They were very interested in the automation capabilities. Need to send a proposal covering the enterprise tier.',
        transcript: 'Sales: So here is the new automation builder.\nClient: Wow, that looks really easy to use. Can it handle multi-step workflows?\nSales: Yes, absolutely. You can chain as many actions as you need.\nClient: That is exactly what we need. What does the pricing look like for that?\nSales: It is included in our Enterprise tier. I can put together a proposal for you.\nClient: Please do.',
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setMeetings(prev => [newMeeting, ...prev]);
    } catch (error) {
      console.error("Failed to add meeting", error);
    }
  };

  const handleIntegrateFathom = async () => {
    if (!user) return;
    alert("Fathom integration would open OAuth flow here. For now, we'll simulate fetching a new meeting.");
    try {
      const newMeeting: Meeting = {
        id: `meeting-${Date.now()}`,
        title: 'Sync with Initech',
        date: new Date().toISOString(),
        provider: 'fathom',
        status: 'completed',
        summary: 'Discussed Q3 goals. They are looking to increase outbound volume by 50%.',
        transcript: 'Manager: We really need to hit our numbers this quarter.\nRep: I agree. I think if we increase our cold email volume we can get there.\nManager: Okay, let\'s aim for a 50% increase in outreach.',
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setMeetings(prev => [newMeeting, ...prev]);
    } catch (error) {
      console.error("Failed to add meeting", error);
    }
  };

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-2xl text-purple-700">
            <Video size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-normal text-[#1f1f1f]">Meeting Intelligence</h1>
            <p className="text-[#444746]">Analyze meeting recordings and automatically generate client proposals.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleIntegrateFireflies} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
            <img src="https://fireflies.ai/favicon.ico" alt="Fireflies" className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
            Integrate Fireflies
          </button>
          <button onClick={handleIntegrateFathom} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
            <img src="https://fathom.video/favicon.ico" alt="Fathom" className="w-4 h-4" onError={(e) => e.currentTarget.style.display = 'none'} />
            Integrate Fathom
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search meetings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-3">
            {filteredMeetings.map(meeting => (
              <div 
                key={meeting.id} 
                onClick={() => setSelectedMeeting(meeting)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedMeeting?.id === meeting.id ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-white border-slate-200 hover:border-purple-200 hover:shadow-sm'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{meeting.title}</h3>
                  {meeting.status === 'completed' ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-md">{meeting.provider}</span>
                  <span>•</span>
                  <span>{new Date(meeting.date).toLocaleDateString()}</span>
                </div>
                {meeting.summary && (
                  <p className="text-xs text-slate-600 line-clamp-2">{meeting.summary}</p>
                )}
              </div>
            ))}
            {filteredMeetings.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                No meetings found. Integrate a provider to sync recordings.
              </div>
            )}
          </div>
        </div>

        {/* Meeting Details / Proposal Area */}
        <div className="lg:col-span-2">
          {selectedMeeting ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedMeeting.title}</h2>
                  <p className="text-sm text-slate-500">{new Date(selectedMeeting.date).toLocaleString()}</p>
                </div>
                {!selectedMeeting.proposal && selectedMeeting.status === 'completed' && (
                  <button 
                    onClick={() => handleGenerateProposal(selectedMeeting)}
                    disabled={isGeneratingProposal}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-md disabled:opacity-50"
                  >
                    {isGeneratingProposal ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                    ) : (
                      <><Bot size={18} /> Generate Proposal</>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedMeeting.proposal ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileSignature className="text-purple-600" /> Generated Proposal
                      </h3>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMeeting.proposal!);
                          alert("Copied to clipboard!");
                        }}
                        className="text-sm text-purple-600 font-medium hover:underline"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                      {selectedMeeting.proposal.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.replace('# ', '')}</h1>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.replace('## ', '')}</h2>;
                        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
                        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1">{line.substring(2)}</li>;
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" /> AI Summary
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed">
                        {selectedMeeting.summary || "No summary available."}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileAudio size={16} className="text-slate-400" /> Transcript Snippet
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm font-mono whitespace-pre-wrap leading-relaxed h-64 overflow-y-auto">
                        {selectedMeeting.transcript || "No transcript available."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[calc(100vh-200px)] min-h-[600px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Video size={32} className="text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Select a Meeting</h2>
              <p className="text-slate-500 max-w-md">
                Choose a meeting from the list to view its transcript, AI summary, and generate a tailored business proposal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
