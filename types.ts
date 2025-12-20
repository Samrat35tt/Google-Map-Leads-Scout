
export interface Lead {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null; 
  website: string | null;
  socials?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
  category: string;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl?: string;
}

export interface LeadAnalysis {
  overview: string;
  gmbHealth: {
    isOptimized: boolean;
    ratingConsistency: string;
    reviewFrequency: string;
  };
  digitalPresence: {
    websiteStatus: 'Strong' | 'Average' | 'Weak' | 'None';
    socialActivity: 'High' | 'Moderate' | 'Low';
    seoHealth: string;
  };
  reputation: {
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    keyComplaints: string[];
    keyPraises: string[];
    reviewSummary: string;
  };
  marketingGaps: string[];
  painPoints: string[];
  roiPotential: {
    estimatedIncrease: string;
    logic: string;
  };
  suggestedServices: string[];
}

export interface ScriptOptions {
  type: 'cold_call' | 'cold_email' | 'whatsapp';
  tone: 'professional' | 'casual' | 'urgent';
  analysis?: LeadAnalysis; // Link research data to script generation
}

export interface SearchState {
  industry: string;
  country: string;
  postalCode: string;
  radius: string;
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string; placeId?: string };
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  credits: number;
  features: string[];
  isPopular?: boolean;
  stripePriceId?: string; // ID from Stripe Dashboard (e.g., price_12345...)
}
