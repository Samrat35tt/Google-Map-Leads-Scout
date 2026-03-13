import React, { useState } from 'react';
import { Lead } from '../types';
import { generateOutreachSequence } from '../services/gemini';
import { Mail, MessageSquare, Calendar, Loader2, Copy, CheckCircle2 } from 'lucide-react';

interface OutreachGeneratorProps {
  lead: Lead;
  onUpdateLead: (updatedLead: Lead) => void;
}

export const OutreachGenerator: React.FC<OutreachGeneratorProps> = ({ lead, onUpdateLead }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sequenceType, setSequenceType] = useState<'one-time' | 'sequence'>('sequence');
  const [followUpCount, setFollowUpCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const sequence = await generateOutreachSequence(lead, followUpCount, sequenceType);
      onUpdateLead({
        ...lead,
        outreach: {
          ...sequence,
          followUpDays: sequenceType === 'sequence' ? followUpCount : undefined
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate outreach');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Personalized Outreach</h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <select 
              value={sequenceType} 
              onChange={(e) => setSequenceType(e.target.value as 'one-time' | 'sequence')}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="one-time">One-time</option>
              <option value="sequence">Sequence</option>
            </select>
          </div>
          {sequenceType === 'sequence' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <label htmlFor="followUpCount">Number of Follow-ups:</label>
              <input 
                type="number" 
                id="followUpCount"
                min="1" 
                max="30" 
                value={followUpCount} 
                onChange={(e) => setFollowUpCount(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : (lead.outreach ? 'Regenerate' : 'Generate Sequence')}
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!lead.outreach && !isGenerating && !error && (
          <div className="text-center py-8 text-gray-500">
            <p>Click "Generate Sequence" to create personalized emails and SMS for {lead.name}.</p>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-600">Analyzing lead and writing personalized outreach...</p>
          </div>
        )}

        {lead.outreach && !isGenerating && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               <p className="text-sm text-gray-500">
                 Generated for {lead.name} 
                 {lead.outreach.followUps ? ` • ${lead.outreach.followUps.length} follow-ups` : (lead.outreach.followUpDays ? ` • Follow-up set for ${lead.outreach.followUpDays} days` : ' • One-time outreach')}
               </p>
            </div>

            <div className={`grid grid-cols-1 ${(lead.outreach.followUps?.length || lead.outreach.followUpEmail) ? 'md:grid-cols-2' : ''} gap-6`}>
              {/* Initial Outreach */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                  Initial Outreach
                </h4>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                    <button onClick={() => copyToClipboard(lead.outreach!.email, 'email')} className="text-gray-400 hover:text-gray-600">
                      {copiedField === 'email' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.outreach.email}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3" /> SMS</span>
                    <button onClick={() => copyToClipboard(lead.outreach!.sms, 'sms')} className="text-gray-400 hover:text-gray-600">
                      {copiedField === 'sms' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.outreach.sms}</p>
                </div>
              </div>

              {/* Follow-up Outreach */}
              {lead.outreach.followUps && lead.outreach.followUps.length > 0 ? (
                lead.outreach.followUps.map((fu, idx) => (
                  <div key={idx} className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 2}</span>
                      Follow-up {idx + 1}
                    </h4>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                        <button onClick={() => copyToClipboard(fu.email, `fu-email-${idx}`)} className="text-gray-400 hover:text-gray-600">
                          {copiedField === `fu-email-${idx}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{fu.email}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3" /> SMS</span>
                        <button onClick={() => copyToClipboard(fu.sms, `fu-sms-${idx}`)} className="text-gray-400 hover:text-gray-600">
                          {copiedField === `fu-sms-${idx}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{fu.sms}</p>
                    </div>
                  </div>
                ))
              ) : (
                lead.outreach.followUpEmail && lead.outreach.followUpSms && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                      Follow-up (Legacy)
                    </h4>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                        <button onClick={() => copyToClipboard(lead.outreach!.followUpEmail || '', 'followUpEmail')} className="text-gray-400 hover:text-gray-600">
                          {copiedField === 'followUpEmail' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.outreach.followUpEmail}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3" /> SMS</span>
                        <button onClick={() => copyToClipboard(lead.outreach!.followUpSms || '', 'followUpSms')} className="text-gray-400 hover:text-gray-600">
                          {copiedField === 'followUpSms' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.outreach.followUpSms}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
