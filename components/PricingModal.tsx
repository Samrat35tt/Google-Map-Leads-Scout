import React, { useState } from 'react';
import { X, Check, Zap, Loader2, Star } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { PricingPlan } from '../types';

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
    if (plan.id === 'starter') {
      onUpgrade(plan);
      return;
    }

    if (!plan.stripePriceId || plan.stripePriceId.includes('REPLACE_WITH_REAL_ID')) {
      alert(`SETUP REQUIRED:\n\nPlease open 'components/PricingModal.tsx' and replace '${plan.stripePriceId}' with a valid Stripe Price ID.`);
      return;
    }

    setLoadingPlanId(plan.id);
    setError(null);

    try {
      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);

      if (!stripe) {
        throw new Error("Stripe failed to initialize.");
      }

      if (STRIPE_PUBLIC_KEY.includes('placeholder')) {
         console.warn("Using Simulation Mode");
         await new Promise(resolve => setTimeout(resolve, 1500));
         onUpgrade(plan); 
         return;
      }

      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const baseUrl = `${origin}${pathname}`;
      
      if (!baseUrl.startsWith('http')) {
        throw new Error(`Invalid base URL protocol: ${baseUrl}. Stripe requires http:// or https://`);
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: plan.stripePriceId, quantity: 1 }],
        mode: 'payment',
        successUrl: `${baseUrl}?payment=success&plan=${plan.id}`,
        cancelUrl: baseUrl,
      });

      if (error) {
        setError(error.message || "Payment failed");
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message || "Connection failed. See console for details.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000000]/40 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f0f9ff] rounded-[28px] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#e0f2fe]">
        
        <div className="p-8 text-center bg-white border-b border-[#e0f2fe]">
          <div className="flex justify-end">
             <button onClick={onClose} className="p-2 hover:bg-[#f0f9ff] rounded-full transition-colors">
               <X size={24} className="text-[#444746]" />
             </button>
          </div>
          <h2 className="text-3xl font-normal text-[#1f1f1f] mb-3">Add more credits</h2>
          <p className="text-[#444746] max-w-lg mx-auto">Choose a plan that fits your scouting needs.</p>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {error && (
             <div className="mb-6 p-4 bg-[#fce8e6] text-[#b3261e] rounded-xl text-sm font-medium flex items-center gap-2">
                <X size={16} /> {error}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-[24px] p-8 border transition-all duration-300 flex flex-col ${plan.isPopular ? 'border-[#0ea5e9] shadow-md z-10' : 'border-[#e0f2fe] hover:border-[#0ea5e9]/50 hover:shadow-sm'}`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0ea5e9] text-white px-4 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1 whitespace-nowrap">
                    <Star size={12} fill="white" /> Recommended
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-[#1f1f1f]">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-normal text-[#1f1f1f]">{plan.price}</span>
                    <span className="text-[#444746] text-sm">/mo</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[#0284c7] font-medium text-sm bg-[#e0f2fe] px-3 py-1.5 rounded-lg w-fit">
                    <Zap size={14} className="fill-[#0284c7]" />
                    {plan.credits.toLocaleString()} Credits
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-[#444746]">
                      <Check size={16} className="text-[#0ea5e9]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleCheckout(plan)}
                  disabled={!!loadingPlanId}
                  className={`w-full py-2.5 rounded-full font-medium text-sm transition-all shadow-sm active:shadow-none flex items-center justify-center gap-2 ${plan.isPopular ? 'bg-[#0ea5e9] text-white hover:bg-[#0ea5e9]/90' : 'bg-white border border-[#747775] text-[#0ea5e9] hover:bg-[#f0f9ff]'} ${loadingPlanId && loadingPlanId !== plan.id ? 'opacity-50' : ''}`}
                >
                  {loadingPlanId === plan.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    plan.id === 'starter' ? 'Current Plan' : `Select Plan`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;