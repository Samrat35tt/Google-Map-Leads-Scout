import React, { useState, useEffect } from 'react';
import { Lead, ScriptOptions } from '../types';
import { generateLeadScript } from '../services/gemini';
import { X, Copy, Check, MessageSquare, Mail, Phone } from 'lucide-react';

interface ScriptGeneratorProps {
  lead: Lead | null;
  onClose: () => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ lead, onClose }) => {
  const [scriptType, setScriptType] = useState<ScriptOptions['type']>('cold_email');
  const [tone, setTone] = useState<ScriptOptions['tone']>('professional');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lead) {
      handleGenerate();
    }
  }, [lead, scriptType, tone]);

  const handleGenerate = async () => {
    if (!lead) return;
    setIsGenerating(true);
    setGeneratedScript(''); // Clear previous
    const script = await generateLeadScript(lead, { type: scriptType, tone });
    setGeneratedScript(script);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Outreach Generator</h2>
            <p className="text-sm text-slate-500 mt-1">Targeting: <span className="font-semibold text-slate-700">{lead.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setScriptType('cold_email')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${scriptType === 'cold_email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mail size={16} /> Email
            </button>
            <button
              onClick={() => setScriptType('cold_call')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${scriptType === 'cold_call' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Phone size={16} /> Call
            </button>
            <button
              onClick={() => setScriptType('whatsapp')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${scriptType === 'whatsapp' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare size={16} /> WhatsApp
            </button>
          </div>

          <select 
            value={tone}
            onChange={(e) => setTone(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="urgent">Urgent</option>
          </select>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white relative">
          {isGenerating ? (
             <div className="space-y-4 animate-pulse">
               <div className="h-4 bg-slate-100 rounded w-3/4"></div>
               <div className="h-4 bg-slate-100 rounded w-full"></div>
               <div className="h-4 bg-slate-100 rounded w-5/6"></div>
               <div className="h-4 bg-slate-100 rounded w-full"></div>
             </div>
          ) : (
            <div className="prose prose-sm prose-indigo max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-700 text-base leading-relaxed">
                {generatedScript}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;