
import React, { useState } from 'react';
import { Lead, ScriptOptions, LeadAnalysis } from '../types';
import { generateLeadScript } from '../services/gemini';
import { X, Copy, Check, Sparkles, BrainCircuit, Zap, AlertCircle } from 'lucide-react';

interface ScriptGeneratorProps {
  lead: Lead | null;
  analysis?: LeadAnalysis;
  onClose: () => void;
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const COST_SCRIPT = 5;

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ lead, analysis, onClose, credits, onConsumeCredits }) => {
  const [scriptType, setScriptType] = useState<ScriptOptions['type']>('cold_email');
  const [tone, setTone] = useState<ScriptOptions['tone']>('professional');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Removed auto-generation on mount to prevent unwanted credit usage

  const handleGenerate = async () => {
    if (!lead) return;
    
    // Check credits before proceeding
    if (!onConsumeCredits(COST_SCRIPT)) {
      return; 
    }

    setIsGenerating(true);
    setGeneratedScript('');
    const script = await generateLeadScript(lead, { type: scriptType, tone, analysis });
    setGeneratedScript(script);
    setIsGenerating(false);
    setHasGenerated(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-xl">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-sky-50 to-white">
          <div className="flex gap-4">
             <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200">
               <BrainCircuit size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Mapx <span className="text-sky-600">Strategy Engine</span></h2>
                <p className="text-sm text-slate-500 font-medium">Crafting pitch for <span className="text-sky-600 font-bold">{lead.name}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sky-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Sidebar with Research Context */}
            <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-6 space-y-6 overflow-y-auto hidden lg:block">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy Context</h3>
                {analysis ? (
                    <div className="space-y-4">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-sky-500 uppercase block mb-1">Detected Pain</span>
                            <p className="text-xs font-bold text-slate-700 leading-tight">{analysis.painPoints[0]}</p>
                        </div>
                        <div className="p-3 bg-sky-600 rounded-xl text-white shadow-md">
                            <span className="text-[10px] font-black opacity-60 uppercase block mb-1">Projected ROI</span>
                            <p className="text-sm font-black">{analysis.roiPotential.estimatedIncrease}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Script generated using PAS framework + Mapx sentiment audit.</p>
                    </div>
                ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-700 uppercase">Audit Not Performed</p>
                        <p className="text-[10px] text-amber-600 mt-1">Perform a "Deep Audit" first to unlock ROI-based hyper-personalization.</p>
                    </div>
                )}
            </div>

            {/* Main Script Pane */}
            <div className="flex-1 flex flex-col bg-white">
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 justify-between">
                    <div className="flex gap-3">
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                          {(['cold_email', 'cold_call', 'whatsapp'] as const).map(type => (
                              <button
                                  key={type}
                                  onClick={() => setScriptType(type)}
                                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${scriptType === type ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                  {type.replace('_', ' ')}
                              </button>
                          ))}
                      </div>
                      <select 
                          value={tone}
                          onChange={(e) => setTone(e.target.value as any)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none hover:border-sky-300 transition-colors"
                      >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="urgent">Urgent</option>
                      </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative flex flex-col">
                    {!hasGenerated && !isGenerating ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                          <BrainCircuit size={48} className="text-slate-300 mb-4" />
                          <p className="text-slate-400 font-medium max-w-xs">Ready to generate a high-converting {scriptType.replace('_', ' ')} using Mapx AI.</p>
                       </div>
                    ) : isGenerating ? (
                        <div className="space-y-6">
                            <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse"></div>
                            <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-none">
                            <div className="flex items-center gap-2 mb-6 p-2 bg-sky-50 rounded-lg w-fit">
                                <Sparkles size={14} className="text-sky-600" />
                                <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Mapx Draft Ready</span>
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-slate-800 text-lg leading-relaxed font-medium">
                                {generatedScript}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                   <div className="text-xs font-medium text-slate-500">
                      Balance: <span className="font-bold text-slate-900">{credits} Credits</span>
                   </div>
                   <div className="flex gap-3">
                      {hasGenerated ? (
                         <>
                           <button onClick={handleGenerate} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-sky-600 hover:bg-sky-100 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2">
                               Regenerate <span className="text-[10px] opacity-60 bg-slate-200 px-1.5 py-0.5 rounded">-{COST_SCRIPT}</span>
                           </button>
                           <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-8 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all shadow-lg active:scale-95 font-black text-sm uppercase tracking-widest"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied' : 'Copy Pitch'}
                            </button>
                         </>
                      ) : (
                         <button 
                           onClick={handleGenerate}
                           className="flex items-center gap-2 px-8 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all shadow-lg active:scale-95 font-black text-sm uppercase tracking-widest group"
                         >
                            <Zap size={16} className="text-yellow-300 group-hover:text-yellow-200" />
                            Generate Pitch <span className="opacity-80 font-medium normal-case ml-1">({COST_SCRIPT} Credits)</span>
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
