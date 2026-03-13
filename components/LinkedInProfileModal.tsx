
import React, { useState } from 'react';
import { Lead, LinkedInProfileDetails } from '../types';
import { generateLeadScript } from '../services/gemini';
import { X, User, Briefcase, Mail, Sparkles, Heart, MessageSquare, ExternalLink, Calendar, Hash, Copy, Check, RefreshCw, Send } from 'lucide-react';

interface LinkedInProfileModalProps {
  lead: Lead;
  details: LinkedInProfileDetails;
  onClose: () => void;
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const LinkedInProfileModal: React.FC<LinkedInProfileModalProps> = ({ lead, details, onClose, credits, onConsumeCredits }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'personal' | 'outreach'>('overview');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    if (details.emailGuess) {
      navigator.clipboard.writeText(details.emailGuess);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!onConsumeCredits(5)) return;
    setIsGenerating(true);
    const script = await generateLeadScript(lead, { 
        type: 'cold_email', 
        tone: 'professional', 
        profileData: details 
    });
    setGeneratedMessage(script);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-[#000000]/50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f0f9ff] rounded-[28px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-[#e0f2fe]">
        
        {/* Header Profile Card */}
        <div className="bg-white border-b border-[#e0f2fe] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0077b5] to-[#005885] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                 {lead.name.charAt(0)}
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-[#1f1f1f] flex items-center gap-2">
                    {lead.name}
                    {lead.socials?.linkedin && (
                       <a href={lead.socials.linkedin} target="_blank" rel="noreferrer" className="text-[#0077b5] hover:bg-[#f0f9ff] p-1 rounded-full">
                          <ExternalLink size={18} />
                       </a>
                    )}
                 </h2>
                 <p className="text-[#444746] font-medium">{details.currentJob.title} at <span className="text-[#0ea5e9]">{details.currentJob.company}</span></p>
                 <div className="flex items-center gap-2 mt-2">
                    {details.emailGuess ? (
                       <button onClick={handleCopyEmail} className="flex items-center gap-2 px-3 py-1 bg-green-50 text-[#188038] rounded-full text-xs font-medium hover:bg-green-100 transition-colors">
                          <Mail size={12} />
                          {details.emailGuess}
                          {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
                       </button>
                    ) : (
                       <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-2">
                          <Mail size={12} /> Email Not Found
                       </span>
                    )}
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Sparkles size={12} /> {details.communicationStyle} Style
                    </span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 hover:bg-[#f0f9ff] rounded-full text-[#444746]">
                 <X size={24} />
              </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white px-6 border-b border-[#e0f2fe] flex gap-6">
           {[
             { id: 'overview', label: 'Overview', icon: User },
             { id: 'posts', label: 'Recent Activity', icon: MessageSquare },
             { id: 'personal', label: 'Hobbies & Interests', icon: Heart },
             { id: 'outreach', label: 'Draft Outreach', icon: Send },
           ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#0ea5e9] text-[#0ea5e9]' : 'border-transparent text-[#444746] hover:text-[#1f1f1f]'}`}
              >
                 <tab.icon size={16} /> {tab.label}
              </button>
           ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
           
           {/* OVERVIEW TAB */}
           {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                       <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Briefcase size={16} /> Professional Summary
                       </h3>
                       <p className="text-[#1f1f1f] leading-relaxed">{details.summary}</p>
                    </section>

                    <section className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                       <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <User size={16} /> Current Role Details
                       </h3>
                       <div className="space-y-4">
                          <div>
                             <div className="text-lg font-medium text-[#1f1f1f]">{details.currentJob.title}</div>
                             <div className="text-sm text-[#0ea5e9]">{details.currentJob.company}</div>
                          </div>
                          <p className="text-sm text-[#444746] bg-[#f0f9ff] p-4 rounded-xl">
                             {details.currentJob.description}
                          </p>
                       </div>
                    </section>
                 </div>
                 
                 <div className="space-y-6">
                     <div className="bg-gradient-to-br from-[#0077b5] to-[#004165] p-6 rounded-[24px] text-white shadow-md">
                        <h3 className="text-xs font-bold opacity-80 uppercase tracking-wider mb-4">Ice Breakers</h3>
                        <ul className="space-y-3">
                           {details.iceBreakers.map((ice, i) => (
                              <li key={i} className="text-sm flex gap-2">
                                 <span className="text-[#0ea5e9]">✦</span> {ice}
                              </li>
                           ))}
                        </ul>
                     </div>
                 </div>
              </div>
           )}

           {/* POSTS TAB */}
           {activeTab === 'posts' && (
              <div className="max-w-3xl mx-auto space-y-6">
                 {details.recentActivity.length > 0 ? (
                    details.recentActivity.map((post, i) => (
                       <div key={i} className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                          <div className="flex items-center gap-2 mb-3 text-xs text-[#444746]">
                             <Calendar size={14} /> {post.date}
                             <span className="mx-2">•</span>
                             <div className="flex gap-2">
                                {post.topics.map(t => (
                                   <span key={t} className="bg-[#f0f9ff] text-[#0ea5e9] px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Hash size={10} /> {t}
                                   </span>
                                ))}
                             </div>
                          </div>
                          <p className="text-[#1f1f1f] text-base leading-relaxed italic">"{post.postContent}"</p>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-12 text-[#444746]">
                       <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                       <p>No recent public activity found to summarize.</p>
                    </div>
                 )}
              </div>
           )}

           {/* PERSONAL TAB */}
           {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                 <div className="bg-white p-8 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-6">
                       <Heart size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-[#1f1f1f] mb-4">Hobbies & Passions</h3>
                    <div className="flex flex-wrap gap-2">
                       {details.hobbies.length > 0 ? details.hobbies.map((h, i) => (
                          <span key={i} className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                             {h}
                          </span>
                       )) : <p className="text-sm text-[#444746]">No specific hobbies detected in public profile.</p>}
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6">
                       <Sparkles size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-[#1f1f1f] mb-4">Professional Interests</h3>
                    <div className="flex flex-wrap gap-2">
                       {details.interests.length > 0 ? details.interests.map((h, i) => (
                          <span key={i} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                             {h}
                          </span>
                       )) : <p className="text-sm text-[#444746]">No specific interests detected.</p>}
                    </div>
                 </div>
              </div>
           )}

           {/* OUTREACH TAB */}
           {activeTab === 'outreach' && (
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                 {!generatedMessage ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-[24px] border border-[#e0f2fe]">
                       <div className="w-16 h-16 bg-[#f0f9ff] rounded-full flex items-center justify-center mb-6 text-[#0ea5e9]">
                          <Send size={32} />
                       </div>
                       <h3 className="text-xl font-medium text-[#1f1f1f] mb-2">Generate Hyper-Personalized Pitch</h3>
                       <p className="text-[#444746] max-w-md mb-8">
                          Create a cold email that references their recent post about <strong>{details.recentActivity[0]?.topics[0] || 'their industry'}</strong> and mentions their interest in <strong>{details.interests[0] || 'their work'}</strong>.
                       </p>
                       <button 
                         onClick={handleGenerateOutreach}
                         disabled={isGenerating}
                         className="px-8 py-3 bg-[#1f1f1f] text-white rounded-full font-medium shadow-md hover:bg-black transition-all flex items-center gap-2"
                       >
                          {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                          {isGenerating ? 'Writing Draft...' : 'Generate Pitch (5 Credits)'}
                       </button>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col">
                       <div className="bg-white p-8 rounded-[24px] border border-[#e0f2fe] shadow-sm mb-4">
                          <pre className="whitespace-pre-wrap font-sans text-[#1f1f1f] text-base leading-relaxed">
                             {generatedMessage}
                          </pre>
                       </div>
                       <div className="flex justify-end gap-3">
                          <button onClick={() => setGeneratedMessage('')} className="px-6 py-2 text-[#444746] hover:bg-gray-100 rounded-full text-sm font-medium">
                             Discard
                          </button>
                          <button onClick={() => {navigator.clipboard.writeText(generatedMessage); alert('Copied!')}} className="px-6 py-2 bg-[#0ea5e9] text-white rounded-full text-sm font-medium hover:bg-[#0284c7] shadow-sm">
                             Copy Text
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LinkedInProfileModal;
