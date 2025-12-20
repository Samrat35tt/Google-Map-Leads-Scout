
import React, { useState } from 'react';
import { X, Check, Zap, Crown, ShieldCheck, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { PricingPlan } from '../types';

// ------------------------------------------------------------------
// CONFIGURATION: Stripe Publishable Key
// ------------------------------------------------------------------
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY || 'pk_test_51RteGfGtvmtZQLuqQHwExhyiCZr0i37bbb8XNLRaDpDzVjB4BYJz4xktahIU1sFNLjEZzyQJ6GI1rigMaq6gS50I0052MC2hGg';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: (plan: PricingPlan) => void;
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    credits: 50,
    features: [
      '50 Credits / mo',
      'Basic Lead Search',
      'Standard Support'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$49',
    credits: 500,
    features: [
      '500 Credits / mo',
      'Deep AI Audits',
      'Advanced Grounding',
      'Priority Support'
    ],
    isPopular: true,
    // Valid Price ID for the Growth Plan
    stripePriceId: 'price_1SgHSgGtvmtZQLuq4p3XglkV' 
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$149',
    credits: 2500,
    features: [
      '2,500 Credits / mo',
      'Unlimited CSV Exports',
      'White-label Reports',
      'API Access',
      '24/7 Dedicated Support'
    ],
    stripePriceId: 'price_REPLACE_WITH_REAL_ID_AGENCY'
  }
];

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onUpgrade }) => {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: PricingPlan) => {
    // 1. Handle Free Tier
    if (plan.id === 'starter') {
      onUpgrade(plan);
      return;
    }

    // 2. Validate Configuration
    if (!plan.stripePriceId || plan.stripePriceId.includes('REPLACE_WITH_REAL_ID')) {
      alert(`SETUP REQUIRED:\n\nPlease open 'components/PricingModal.tsx' and replace '${plan.stripePriceId}' with a valid Stripe Price ID (starts with 'price_...') from your Dashboard.`);
      return;
    }

    // 3. Check for Common Mistake: Using Product ID instead of Price ID
    if (plan.stripePriceId.startsWith('prod_')) {
      alert(`CONFIGURATION ERROR:\n\nYou are using a Product ID (${plan.stripePriceId}).\n\nStripe Checkout requires a PRICE ID (starts with 'price_').\n\n1. Go to Stripe Dashboard -> Products.\n2. Click your product.\n3. Scroll to 'Pricing' and copy the 'API ID' that starts with 'price_'.`);
      return;
    }

    setLoadingPlanId(plan.id);
    setError(null);

    try {
      // 4. Initialize Stripe
      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);

      if (!stripe) {
        throw new Error("Stripe failed to initialize. Check your publishable key.");
      }

      // Check for Simulation Mode (if placeholder key is used)
      if (STRIPE_PUBLIC_KEY.includes('placeholder')) {
         console.warn("Using Simulation Mode: No valid Stripe Key found.");
         await new Promise(resolve => setTimeout(resolve, 1500));
         onUpgrade(plan); 
         return;
      }

      // 5. Construct Absolute URL (Fixes "successUrl must start with http" error)
      // We explicitly combine protocol, host, and pathname to guarantee a valid URL string.
      const protocol = window.location.protocol; // e.g. "http:" or "https:"
      const host = window.location.host;         // e.g. "localhost:3000" or "myapp.com"
      const pathname = window.location.pathname; // e.g. "/" or "/app"
      
      const baseUrl = `${protocol}//${host}${pathname}`;

      // 6. Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: plan.stripePriceId, quantity: 1 }],
        mode: 'payment', // Change to 'subscription' if your Price is set to recurring
        successUrl: `${baseUrl}?payment=success&plan=${plan.id}`,
        cancelUrl: baseUrl,
      });

      if (error) {
        console.error(error);
        if (error.message?.includes('No such price')) {
           setError("Invalid Price ID. Please check your Stripe Dashboard.");
        } else {
           setError(error.message || "Payment failed");
        }
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError("Connection failed. See console for details.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <div className="flex justify-end">
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
               <X size={24} className="text-slate-400" />
             </button>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Upgrade your <span className="text-sky-600">Mapx</span> Arsenal</h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">Scale your outreach operations with commercial-grade power. Securely processed via Stripe.</p>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1">
          {error && (
             <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-2">
                <X size={16} /> {error}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 flex flex-col ${plan.isPopular ? 'border-sky-500 shadow-xl shadow-sky-200/50 scale-105 z-10' : 'border-slate-100 hover:border-sky-200 hover:shadow-lg'}`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                    <Crown size={12} /> Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-slate-400 font-medium">/mo</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sky-600 font-bold text-sm bg-sky-50 px-3 py-2 rounded-lg w-fit">
                    <Zap size={16} />
                    {plan.credits.toLocaleString()} Credits
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-emerald-600" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleCheckout(plan)}
                  disabled={!!loadingPlanId}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${plan.isPopular ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'} ${loadingPlanId && loadingPlanId !== plan.id ? 'opacity-50' : ''}`}
                >
                  {loadingPlanId === plan.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Redirecting...
                    </>
                  ) : (
                    plan.id === 'starter' ? 'Reset Free Tier' : `Secure Checkout`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-100 text-center flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest border-t border-slate-200">
          <ShieldCheck size={12} /> Encrypted Payment Processing by Stripe
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
