
import React, { useState, useEffect } from 'react';
import { Lead, ScriptOptions, LeadAnalysis, KnowledgeDocument } from '../types';
import { generateScriptWithRouter } from '../services/llmRouter';
import { X, Copy, Check, Sparkles, Zap, RefreshCw, MessageSquare, Book } from 'lucide-react';

interface ScriptGeneratorProps {
  lead: Lead | null;
  analysis?: LeadAnalysis;
  onClose: () => void;
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
  knowledgeDocs: KnowledgeDocument[];
}

const COST_SCRIPT = 5;

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ lead, analysis, onClose, credits, onConsumeCredits, knowledgeDocs }) => {
  const [scriptType, setScriptType] = useState<ScriptOptions['type']>('cold_email');
  const [tone, setTone] = useState<ScriptOptions['tone']>('professional');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string>('');

  const handleGenerate = async () => {
    if (!lead) return;
    
    // Check credits before proceeding
    if (!onConsumeCredits(COST_SCRIPT)) {
      return; 
    }

    setIsGenerating(true);
    setGeneratedScript('');
    
    try {
       const selectedDoc = knowledgeDocs.find(d => d.id === selectedKnowledgeId);
       const knowledgeContext = selectedDoc ? selectedDoc.content : undefined;

       // Using the Router to support 3rd party LLMs
       const script = await generateScriptWithRouter(lead, { type: scriptType, tone, analysis, knowledgeContext });
       setGeneratedScript(script);
    } catch (e: any) {
       setGeneratedScript(`Error: ${e.message}`);
    } finally {
       setIsGenerating(false);
       setHasGenerated(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-[#000000]/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-[#e3e3e3]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#e0f2fe] flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-full flex items-center justify-center text-white shadow-sm">
               <Sparkles size={20} />
             </div>
             <div>
                <h2 className="text-xl font-medium text-[#1f1f1f]">Pitch Generator</h2>
                <p className="text-xs text-[#444746]">Drafting for <span className="font-bold">{lead.name}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f0f9ff] rounded-full transition-colors text-[#444746]">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Sidebar with Research Context */}
            <div className="w-full lg:w-80 bg-[#f0f9ff] border-r border-[#e0f2fe] p-6 space-y-6 overflow-y-auto hidden lg:block">
                <h3 className="text-xs font-medium text-[#444746] uppercase tracking-wider">Context & Insights</h3>
                {analysis ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-[#e0f2fe] shadow-sm">
                            <span className="text-xs font-bold text-[#0ea5e9] mb-2 block flex items-center gap-1">
                               <MessageSquare size={12} /> Pain Point
                            </span>
                            <p className="text-sm text-[#1f1f1f] font-medium leading-snug">{analysis.painPoints[0]}</p>
                        </div>
                        <div className="p-4 bg-[#e0f2fe] rounded-2xl border border-transparent">
                            <span className="text-xs font-bold text-[#0284c7] mb-2 block uppercase tracking-wider">Projected Lift</span>
                            <p className="text-3xl font-normal text-[#1f1f1f]">{analysis.roiPotential.estimatedIncrease}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-[#e0f2fe]">
                           <p className="text-xs text-[#444746] italic">AI is using this data to ground the pitch in reality, not fluff.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-[#fff8e1] rounded-2xl border border-[#ffe082]">
                        <p className="text-xs font-bold text-[#b06000] uppercase tracking-wider mb-1">No Audit Data</p>
                        <p className="text-sm text-[#444746]">Run a Deep Research audit first to unlock ROI-based personalization.</p>
                    </div>
                )}
            </div>

            {/* Main Script Pane */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-[#e0f2fe] flex flex-wrap items-center gap-3">
                      <div className="flex bg-[#f0f9ff] p-1 rounded-full border border-[#e0f2fe]">
                          {(['cold_email', 'cold_call', 'whatsapp'] as const).map(type => (
                              <button
                                  key={type}
                                  onClick={() => setScriptType(type)}
                                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${scriptType === type ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-[#444746] hover:text-[#1f1f1f]'}`}
                              >
                                  {type.replace('_', ' ')}
                              </button>
                          ))}
                      </div>
                      <div className="h-6 w-px bg-[#e0f2fe] mx-1"></div>
                      <select 
                          value={tone}
                          onChange={(e) => setTone(e.target.value as any)}
                          className="px-4 py-1.5 rounded-full bg-white border border-[#747775] text-xs font-medium text-[#1f1f1f] outline-none hover:bg-[#f0f9ff] focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors cursor-pointer"
                      >
                          <option value="professional">Professional Tone</option>
                          <option value="casual">Casual Tone</option>
                          <option value="urgent">Urgent Tone</option>
                      </select>
                      <div className="h-6 w-px bg-[#e0f2fe] mx-1"></div>
                      <select 
                          value={selectedKnowledgeId}
                          onChange={(e) => setSelectedKnowledgeId(e.target.value)}
                          className="px-4 py-1.5 rounded-full bg-white border border-[#747775] text-xs font-medium text-[#1f1f1f] outline-none hover:bg-[#f0f9ff] focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors cursor-pointer max-w-[200px] truncate"
                      >
                          <option value="">-- No Knowledge Base --</option>
                          {knowledgeDocs.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.title}</option>
                          ))}
                      </select>
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative flex flex-col">
                    {!hasGenerated && !isGenerating ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                          <div className="w-16 h-16 bg-[#f0f9ff] rounded-full flex items-center justify-center mb-4 text-[#444746]">
                            <Sparkles size={32} />
                          </div>
                          <p className="text-[#1f1f1f] font-medium text-lg">Draft your outreach</p>
                          <p className="text-[#444746] text-sm max-w-xs mt-2">Select a format and tone above, then click generate.</p>
                       </div>
                    ) : isGenerating ? (
                        <div className="space-y-6 max-w-2xl mx-auto w-full pt-12">
                            <div className="h-4 bg-gradient-to-r from-[#e0f2fe] via-[#f0f9ff] to-[#e0f2fe] rounded-full w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-[#e0f2fe] via-[#f0f9ff] to-[#e0f2fe] rounded-full w-full animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-[#e0f2fe] via-[#f0f9ff] to-[#e0f2fe] rounded-full w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-[#e0f2fe] via-[#f0f9ff] to-[#e0f2fe] rounded-full w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full">
                            <div className="prose prose-slate max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-[#1f1f1f] text-base leading-relaxed p-6 rounded-xl border border-transparent hover:border-[#e0f2fe] transition-colors">
                                    {generatedScript}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[#e0f2fe] bg-white flex justify-between items-center">
                   <div className="flex items-center gap-2 text-xs font-medium text-[#444746] bg-[#f0f9ff] px-3 py-1.5 rounded-full">
                      <Zap size={12} className={credits < 10 ? "text-[#b3261e]" : "text-[#0ea5e9]"} />
                      <span>{credits} Credits available</span>
                   </div>
                   <div className="flex gap-3">
                      {hasGenerated ? (
                         <>
                           <button onClick={handleGenerate} className="px-6 py-2.5 text-sm font-medium text-[#0ea5e9] hover:bg-[#f0f9ff] rounded-full transition-all flex items-center gap-2">
                               <RefreshCw size={16} />
                               Regenerate
                           </button>
                           <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#0ea5e9] text-white rounded-full hover:bg-[#0ea5e9]/90 transition-all shadow-sm active:shadow-none font-medium text-sm"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied' : 'Copy Text'}
                            </button>
                         </>
                      ) : (
                         <button 
                           onClick={handleGenerate}
                           className="flex items-center gap-2 px-8 py-3 bg-[#0ea5e9] text-white rounded-full hover:bg-[#0ea5e9]/90 transition-all shadow-sm active:shadow-none font-medium text-sm"
                         >
                            <Sparkles size={18} />
                            Generate Draft <span className="opacity-70 text-xs ml-1">(-{COST_SCRIPT})</span>
                         </button>
                      )}
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
