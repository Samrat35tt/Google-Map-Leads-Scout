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
  mapsUrl?: string;
}

export interface LeadAnalysis {
  overview: string;
  digitalPresence: {
    websiteStatus: 'Strong' | 'Average' | 'Weak' | 'None';
    socialActivity: 'High' | 'Moderate' | 'Low';
    seoHealth: string;
  };
  reputation: {
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    keyComplaints: string[];
    keyPraises: string[];
  };
  marketingGaps: string[];
  suggestedServices: string[];
}

export interface ScriptOptions {
  type: 'cold_call' | 'cold_email' | 'whatsapp';
  tone: 'professional' | 'casual' | 'urgent';
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