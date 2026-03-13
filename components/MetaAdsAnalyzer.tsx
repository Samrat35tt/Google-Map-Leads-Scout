
import React, { useState, useRef } from 'react';
import { MetaAdInput, MetaAdAnalysis } from '../types';
import { analyzeMetaAd } from '../services/gemini';
import { getCompetitorAds } from '../services/apify';
import { Zap, Upload, Layout, Type, Target, BarChart, AlertTriangle, CheckCircle2, RefreshCw, Layers, ArrowRight, Image as ImageIcon, Video, ExternalLink, Globe, Search } from 'lucide-react';

interface MetaAdsAnalyzerProps {
  credits: number;
  onConsumeCredits: (amount: number) => boolean;
}

const COST_ANALYSIS = 25;

const MetaAdsAnalyzer: React.FC<MetaAdsAnalyzerProps> = ({ credits, onConsumeCredits }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<MetaAdAnalysis | null>(null);
  
  // Form State
  const [input, setInput] = useState<MetaAdInput>({
    creative: {
      type: 'image',
      url: '',
      format: 'feed',
      aspect_ratio: '1:1',
      duration_seconds: null
    },
    copy: {
      primary_text: '',
      headline: '',
      description: '',
      cta: 'Learn More'
    },
    campaign: {
      objective: 'sales',
      industry: '',
      audience_type: 'interest',
      region: 'United States'
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setPreviewImage(base64);
        // Extract base64 raw data
        const rawBase64 = base64.split(',')[1];
        setInput(prev => ({
            ...prev,
            creative: {
                ...prev.creative,
                imageBase64: rawBase64,
                url: 'User Uploaded File'
            }
        }));
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!input.creative.url && !input.creative.imageBase64) {
        alert("Please provide a creative URL or upload an image.");
        return;
    }
    if (!input.copy.primary_text || !input.campaign.industry) {
        alert("Please fill in the primary text and industry.");
        return;
    }

    if (!onConsumeCredits(COST_ANALYSIS)) return;

    setIsLoading(true);
    setResult(null);

    try {
        // 1. Fetch real ads via Apify
        setStatusMessage('Scanning Meta Ads Library for competitors...');
        const competitorAds = await getCompetitorAds(input.campaign.industry, input.campaign.region || 'US');
        
        // 2. Analyze using Gemini with context
        setStatusMessage('Running predictive models against market data...');
        const analysisInput = { ...input, competitorContext: competitorAds };
        
        const data = await analyzeMetaAd(analysisInput);
        setResult(data);
        setActiveTab('results');
    } catch (e: any) {
        alert(e.message);
    } finally {
        setIsLoading(false);
        setStatusMessage('');
    }
  };

  // Helper for Score Color
  const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-[#188038]';
      if (score >= 5) return 'text-[#ea8600]';
      return 'text-[#b3261e]';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex flex-col gap-2">
         <div className="flex items-center gap-3">
             <div className="p-3 bg-gradient-to-tr from-[#0668E1] to-[#0080fb] rounded-2xl text-white shadow-md">
                <Layout size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-normal text-[#1f1f1f]">Ad Simulator</h1>
                <p className="text-[#444746]">Predict performance using real-time Meta Ads Library data.</p>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: INPUT FORM */}
          <div className={`lg:col-span-5 space-y-6 ${activeTab === 'results' ? 'hidden lg:block' : ''}`}>
              
              {/* Creative Section */}
              <div className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                  <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ImageIcon size={16} /> Creative Assets
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="flex gap-4">
                          <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${input.creative.type === 'image' ? 'border-[#0ea5e9] bg-[#f0f9ff] text-[#0ea5e9]' : 'border-transparent bg-gray-50 text-[#444746]'}`}>
                              <input type="radio" className="hidden" checked={input.creative.type === 'image'} onChange={() => setInput(p => ({...p, creative: {...p.creative, type: 'image'}}))} />
                              <ImageIcon size={20} />
                              <span className="text-xs font-medium">Image</span>
                          </label>
                          <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${input.creative.type === 'video' ? 'border-[#0ea5e9] bg-[#f0f9ff] text-[#0ea5e9]' : 'border-transparent bg-gray-50 text-[#444746]'}`}>
                              <input type="radio" className="hidden" checked={input.creative.type === 'video'} onChange={() => setInput(p => ({...p, creative: {...p.creative, type: 'video'}}))} />
                              <Video size={20} />
                              <span className="text-xs font-medium">Video</span>
                          </label>
                      </div>

                      {/* Upload / URL */}
                      <div className="space-y-2">
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Paste Image/Video URL"
                                className="flex-1 px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                                value={input.creative.url}
                                onChange={(e) => setInput(p => ({...p, creative: {...p.creative, url: e.target.value, imageBase64: undefined}}))}
                              />
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-2 bg-gray-100 rounded-lg text-[#444746] hover:bg-gray-200 transition-colors"
                                title="Upload Image"
                              >
                                  <Upload size={18} />
                              </button>
                          </div>
                          {previewImage && (
                              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[#e0f2fe]">
                                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                  <button onClick={() => {setPreviewImage(null); setInput(p => ({...p, creative: {...p.creative, imageBase64: undefined, url: ''}}))}} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black">
                                      <RefreshCw size={12} />
                                  </button>
                              </div>
                          )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-[#444746] mb-1 block">Placement</label>
                              <select 
                                value={input.creative.format}
                                onChange={(e) => setInput(p => ({...p, creative: {...p.creative, format: e.target.value as any}}))}
                                className="w-full px-3 py-2 bg-[#f0f9ff] rounded-lg text-sm outline-none"
                              >
                                  <option value="feed">Feed</option>
                                  <option value="stories">Stories</option>
                                  <option value="reels">Reels</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs text-[#444746] mb-1 block">Aspect Ratio</label>
                              <select 
                                value={input.creative.aspect_ratio}
                                onChange={(e) => setInput(p => ({...p, creative: {...p.creative, aspect_ratio: e.target.value as any}}))}
                                className="w-full px-3 py-2 bg-[#f0f9ff] rounded-lg text-sm outline-none"
                              >
                                  <option value="1:1">1:1 (Square)</option>
                                  <option value="4:5">4:5 (Portrait)</option>
                                  <option value="9:16">9:16 (Full)</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Copy Section */}
              <div className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                  <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Type size={16} /> Ad Copy
                  </h3>
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs text-[#444746]">Primary Text</label>
                          <textarea 
                             rows={3}
                             placeholder="The main text appearing above/below the creative..."
                             className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20 resize-none"
                             value={input.copy.primary_text}
                             onChange={(e) => setInput(p => ({...p, copy: {...p.copy, primary_text: e.target.value}}))}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-[#444746]">Headline</label>
                          <input 
                             type="text"
                             placeholder="Bold headline near CTA"
                             className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                             value={input.copy.headline}
                             onChange={(e) => setInput(p => ({...p, copy: {...p.copy, headline: e.target.value}}))}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs text-[#444746]">CTA Button</label>
                              <select 
                                value={input.copy.cta}
                                onChange={(e) => setInput(p => ({...p, copy: {...p.copy, cta: e.target.value}}))}
                                className="w-full px-3 py-2 bg-[#f0f9ff] rounded-lg text-sm outline-none"
                              >
                                  <option value="Learn More">Learn More</option>
                                  <option value="Shop Now">Shop Now</option>
                                  <option value="Sign Up">Sign Up</option>
                                  <option value="Book Now">Book Now</option>
                                  <option value="Apply Now">Apply Now</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Campaign Context */}
              <div className="bg-white p-6 rounded-[24px] border border-[#e0f2fe] shadow-sm">
                  <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Target size={16} /> Campaign Context
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs text-[#444746]">Industry / Niche</label>
                          <input 
                             type="text"
                             placeholder="e.g. SaaS, E-commerce Fashion, Local Dentist"
                             className="w-full px-4 py-2 bg-[#f0f9ff] rounded-lg text-sm border-none focus:ring-2 focus:ring-[#0ea5e9]/20"
                             value={input.campaign.industry}
                             onChange={(e) => setInput(p => ({...p, campaign: {...p.campaign, industry: e.target.value}}))}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs text-[#444746]">Objective</label>
                              <select 
                                value={input.campaign.objective}
                                onChange={(e) => setInput(p => ({...p, campaign: {...p.campaign, objective: e.target.value as any}}))}
                                className="w-full px-3 py-2 bg-[#f0f9ff] rounded-lg text-sm outline-none"
                              >
                                  <option value="sales">Sales</option>
                                  <option value="leads">Leads</option>
                                  <option value="traffic">Traffic</option>
                                  <option value="awareness">Awareness</option>
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs text-[#444746]">Target Audience</label>
                              <select 
                                value={input.campaign.audience_type}
                                onChange={(e) => setInput(p => ({...p, campaign: {...p.campaign, audience_type: e.target.value as any}}))}
                                className="w-full px-3 py-2 bg-[#f0f9ff] rounded-lg text-sm outline-none"
                              >
                                  <option value="broad">Broad</option>
                                  <option value="interest">Interest Stack</option>
                                  <option value="lookalike">Lookalike</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-4 bg-[#1f1f1f] text-white rounded-xl font-medium shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                  {isLoading ? <RefreshCw className="animate-spin" /> : <Zap size={20} />}
                  {isLoading ? statusMessage || 'Running Predictive Models...' : `Run Simulation (-${COST_ANALYSIS} Credits)`}
              </button>
          </div>

          {/* RIGHT PANEL: RESULTS */}
          <div className="lg:col-span-7 h-full">
              {result ? (
                  <div className="bg-white rounded-[32px] border border-[#e0f2fe] shadow-xl overflow-hidden h-full flex flex-col animate-in slide-in-from-right duration-500">
                      
                      {/* Header Results */}
                      <div className="bg-[#f8fafc] p-8 border-b border-[#e0f2fe] flex flex-col md:flex-row items-center gap-8">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                              <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path
                                  className="text-gray-200"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                />
                                <path
                                  className={getScoreColor(result.overall_score / 10)}
                                  strokeDasharray={`${result.overall_score}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center">
                                  <span className={`text-3xl font-bold ${getScoreColor(result.overall_score / 10)}`}>{result.overall_score}</span>
                                  <span className="text-[10px] text-[#444746] uppercase">Score</span>
                              </div>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                  <h2 className="text-2xl font-bold text-[#1f1f1f]">Performance Verdict</h2>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${
                                      result.final_verdict === 'launch' ? 'bg-[#188038]' : 
                                      result.final_verdict === 'optimize_before_launch' ? 'bg-[#ea8600]' : 'bg-[#b3261e]'
                                  }`}>
                                      {result.final_verdict.replace(/_/g, ' ')}
                                  </span>
                              </div>
                              <p className="text-[#444746] text-sm leading-relaxed">{result.summary}</p>
                          </div>
                      </div>

                      <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                          
                          {/* Sub Scores */}
                          <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 bg-[#f0f9ff] rounded-2xl border border-[#e0f2fe] text-center">
                                  <div className="text-sm font-bold text-[#0284c7] mb-1">Creative</div>
                                  <div className="text-2xl font-bold text-[#1f1f1f]">{result.creative_analysis.score}/10</div>
                              </div>
                              <div className="p-4 bg-[#f0f9ff] rounded-2xl border border-[#e0f2fe] text-center">
                                  <div className="text-sm font-bold text-[#0284c7] mb-1">Copywriting</div>
                                  <div className="text-2xl font-bold text-[#1f1f1f]">{result.copy_analysis.score}/10</div>
                              </div>
                              <div className="p-4 bg-[#f0f9ff] rounded-2xl border border-[#e0f2fe] text-center">
                                  <div className="text-sm font-bold text-[#0284c7] mb-1">Platform Fit</div>
                                  <div className="text-2xl font-bold text-[#1f1f1f]">{result.platform_fit.score}/10</div>
                              </div>
                          </div>

                          {/* Predictions Grid */}
                          <div>
                              <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <BarChart size={16} /> Predictive Metrics
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {Object.entries(result.performance_prediction).map(([key, val]) => (
                                      <div key={key} className="p-3 border rounded-xl flex flex-col items-center justify-center gap-2">
                                          <span className="text-xs font-medium text-[#444746] uppercase">{key.replace('_', ' ')}</span>
                                          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                              val === 'high' ? 'bg-green-100 text-green-700' :
                                              val === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-red-100 text-red-700'
                                          }`}>
                                              {val}
                                          </span>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* Suggestions */}
                          <div>
                              <h3 className="text-sm font-bold text-[#444746] uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Layers size={16} /> Optimization Steps
                              </h3>
                              <div className="space-y-3">
                                  {result.optimization_suggestions.map((opt, i) => (
                                      <div key={i} className="flex items-start gap-3 p-4 bg-white border border-[#e0f2fe] rounded-xl hover:shadow-sm transition-shadow">
                                          <div className="w-6 h-6 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                              {i + 1}
                                          </div>
                                          <div>
                                              <p className="text-sm font-medium text-[#1f1f1f]">{opt.suggestion}</p>
                                              <span className="text-[10px] text-[#444746] uppercase tracking-wider opacity-70">Priority {opt.priority}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {/* Benchmarks & Grounding */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                              <h4 className="text-xs font-bold text-[#444746] uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Globe size={14} /> Market Benchmark
                              </h4>
                              <p className="text-sm text-[#444746] italic mb-4">
                                  {result.benchmark_comparison}
                              </p>
                              
                              {result.groundingChunks && result.groundingChunks.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                      {result.groundingChunks.map((chunk, i) => {
                                          const source = chunk.web || chunk.maps;
                                          if (!source) return null;
                                          return (
                                              <a 
                                                  key={i} 
                                                  href={source.uri} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#c4c7c5] rounded text-[10px] text-[#0ea5e9] hover:underline"
                                              >
                                                  <ExternalLink size={10} />
                                                  {source.title || 'Competitor Ad Source'}
                                              </a>
                                          );
                                      })}
                                  </div>
                              )}
                          </div>

                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-[#f8fafc] rounded-[32px] border border-dashed border-[#e0f2fe] p-8 text-center opacity-60">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                          <Target size={32} className="text-[#444746]" />
                      </div>
                      <h3 className="text-xl font-medium text-[#1f1f1f]">Ready to Simulate</h3>
                      <p className="text-[#444746] max-w-sm mt-2">
                          Enter your creative and campaign details on the left. The AI will benchmark against live ad trends from Meta Library.
                      </p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default MetaAdsAnalyzer;
