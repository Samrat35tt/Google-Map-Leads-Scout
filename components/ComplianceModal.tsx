
import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ComplianceModalProps {
  onAccept: () => void;
}

const ComplianceModal: React.FC<ComplianceModalProps> = ({ onAccept }) => {
  const [agreements, setAgreements] = useState({
    noSpam: false,
    consent: false,
    identity: false,
    optOut: false
  });

  const allChecked = Object.values(agreements).every(v => v);

  return (
    <div className="fixed inset-0 bg-[#000000]/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
      <div className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 border border-slate-200">
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={32} />
             </div>
             <h2 className="text-2xl font-bold text-[#1f1f1f]">Compliance & Ethics Check</h2>
             <p className="text-[#444746] mt-2 text-sm">
                SalesOxe is a powerful B2B tool. To prevent abuse and ensure high deliverability, you must agree to our usage standards before proceeding.
             </p>
          </div>

          <div className="space-y-4 bg-[#f8fafc] p-6 rounded-2xl border border-slate-100 mb-6">
             <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${agreements.noSpam ? 'bg-[#0ea5e9] border-[#0ea5e9]' : 'bg-white border-slate-300 group-hover:border-[#0ea5e9]'}`}>
                   {agreements.noSpam && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreements.noSpam}
                  onChange={e => setAgreements({...agreements, noSpam: e.target.checked})} 
                />
                <div className="text-sm text-[#444746]">
                   <strong>I will not spam.</strong> I verify that I have a legitimate business reason to contact these leads (B2B only).
                </div>
             </label>

             <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${agreements.consent ? 'bg-[#0ea5e9] border-[#0ea5e9]' : 'bg-white border-slate-300 group-hover:border-[#0ea5e9]'}`}>
                   {agreements.consent && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreements.consent}
                  onChange={e => setAgreements({...agreements, consent: e.target.checked})} 
                />
                <div className="text-sm text-[#444746]">
                   <strong>A2P 10DLC & GDPR.</strong> I understand I am responsible for complying with local regulations regarding cold outreach and data privacy.
                </div>
             </label>

             <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${agreements.identity ? 'bg-[#0ea5e9] border-[#0ea5e9]' : 'bg-white border-slate-300 group-hover:border-[#0ea5e9]'}`}>
                   {agreements.identity && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreements.identity}
                  onChange={e => setAgreements({...agreements, identity: e.target.checked})} 
                />
                <div className="text-sm text-[#444746]">
                   <strong>Truthful Identity.</strong> I will not impersonate others. My AI agents will disclose they are automated assistants if asked.
                </div>
             </label>

             <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${agreements.optOut ? 'bg-[#0ea5e9] border-[#0ea5e9]' : 'bg-white border-slate-300 group-hover:border-[#0ea5e9]'}`}>
                   {agreements.optOut && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreements.optOut}
                  onChange={e => setAgreements({...agreements, optOut: e.target.checked})} 
                />
                <div className="text-sm text-[#444746]">
                   <strong>Easy Opt-Out.</strong> All my communications will provide a clear way for recipients to unsubscribe or stop communication.
                </div>
             </label>
          </div>

          <button 
            onClick={onAccept}
            disabled={!allChecked}
            className="w-full py-3.5 bg-[#1f1f1f] text-white rounded-full font-bold text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
             I Agree & Continue
          </button>
          
          <div className="text-center mt-4 flex items-center justify-center gap-2 text-xs text-amber-600">
             <AlertTriangle size={12} />
             <span>Violation of these terms will result in immediate account suspension.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceModal;
