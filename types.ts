
export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek';
export type DataProvider = 'apollo' | 'hunter' | 'proxycurl' | 'none';

export interface CompanyProfile {
  companyName: string;
  description: string;
  services: string;
  valueProposition: string;
  targetAudience: string;
}

export interface LLMSettings {
  activeProvider: LLMProvider;
  activeDataProvider: DataProvider; // Primary source for email enrichment
  
  // NOTE: API Keys are now managed on the backend/env level to reduce friction.
  apiKeys: {
    gemini?: string;
    openai?: string;
    anthropic?: string;
    deepseek?: string;
    apollo?: string;
    hunter?: string;
    zerobounce?: string;
    apify?: string;
  };
  models: {
    openai: string; // e.g. gpt-4o
    anthropic: string; // e.g. claude-3-opus
    deepseek: string; // e.g. deepseek-chat
  };
  companyProfile?: CompanyProfile;
}

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  plan: 'free' | 'growth' | 'agency';
  isAdmin?: boolean;
  credits?: number; // Optional for admin view
  created_at?: string;
  suspended?: boolean; // New field for account suspension
  complianceAccepted?: boolean; // Track compliance agreement
  settings?: LLMSettings;
}

export interface Lead {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null; 
  emailStatus?: 'verified' | 'risky' | 'invalid' | 'unknown'; // New field for verification
  emailSource?: 'apollo' | 'hunter' | 'manual' | 'ai_inferred'; // Track where data came from
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
  // Automation Status fields
  workflowStatus?: 'idle' | 'active' | 'completed' | 'failed';
  currentStepId?: string;
  // CRM Fields
  pipelineStage?: 'New Lead' | 'Contacted' | 'Interested' | 'Meeting Booked' | 'Closed' | 'Lost';
  // Generated Outreach
  outreach?: {
    email: string;
    sms: string;
    followUpEmail?: string;
    followUpSms?: string;
    followUpDays?: number;
    followUps?: { email: string; sms: string }[];
  };
}

export interface LinkedInProfileDetails {
  summary: string;
  emailGuess: string | null;
  emailConfidence: 'High' | 'Medium' | 'Low';
  currentJob: {
    title: string;
    company: string;
    description: string;
  };
  recentActivity: {
    postContent: string;
    date: string;
    topics: string[];
  }[];
  interests: string[];
  hobbies: string[];
  communicationStyle: string;
  iceBreakers: string[];
}

export interface LeadAnalysis {
  overview: string;
  techStack: string[]; // New field
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

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'url' | 'file';
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  provider: 'fireflies' | 'fathom' | 'manual';
  status: 'analyzing' | 'completed' | 'failed';
  summary?: string;
  transcript?: string;
  proposal?: string;
  leadId?: string;
}

export interface ScriptOptions {
  type: 'cold_call' | 'cold_email' | 'whatsapp';
  tone: 'professional' | 'casual' | 'urgent';
  analysis?: LeadAnalysis; // Link research data to script generation
  profileData?: LinkedInProfileDetails; // Link profile data to script
  knowledgeContext?: string; // Link knowledge base to script
}

export interface SearchState {
  industry: string;
  country: string;
  city: string;
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

export interface SearchLog {
  id: string;
  industry: string;
  country: string;
  location: string;
  date: string;
  resultsCount: number;
}

// --- Inbox Types (New) ---

export interface Message {
  id: string;
  sender: 'user' | 'lead';
  content: string;
  timestamp: string;
  channel: 'email' | 'sms' | 'linkedin';
}

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: 'email' | 'sms' | 'linkedin';
  messages: Message[];
}

// --- Task Management Types ---
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
  leadId?: string; // Optional link to a lead
  createdAt: string;
  updatedAt: string;
}

// --- Workflow Automation Types ---

export type NodeType = 
  | 'trigger' 
  | 'email' 
  | 'sms' 
  | 'delay' 
  | 'condition'
  | 'linkedin_connect'
  | 'linkedin_message'
  | 'manual_task'
  | 'update_stage'
  | 'webhook'
  | 'wait_reply'
  | 'ai_draft'
  | 'notification'
  | 'score_lead';

export interface WorkflowStep {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  icon?: string;
  config: {
    subject?: string;
    body?: string;
    delayTime?: number;
    delayUnit?: 'minutes' | 'hours' | 'days';
    condition?: string;
    // Extended Configuration
    linkedinMessage?: string;
    taskDescription?: string;
    pipelineStage?: string;
    webhookUrl?: string;
    timeoutDays?: number;
    promptContext?: string;
    notificationChannel?: 'slack' | 'email' | 'in-app';
    scoreDelta?: number;
  };
}

export interface WorkflowSettings {
  emailProvider: 'gmail' | 'sendgrid' | 'smtp';
  senderEmail: string;
  senderName: string;
  // SMS Settings
  smsProvider: 'twilio' | 'phone';
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber: string;
  // Deliverability Settings
  inboxRotation?: boolean;
  dailyLimitPerInbox?: number;
  warmupEnabled?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  steps: WorkflowStep[];
  leads: Lead[];
  settings: WorkflowSettings;
  logs: string[];
}

// --- Meta Ads Analysis Types ---

export interface CompetitorAd {
  advertiser: string;
  copy: string;
  headline: string;
  cta: string;
  imageUrl?: string;
  link?: string;
}

export interface MetaAdInput {
  creative: {
    type: 'image' | 'video';
    url: string; 
    format: 'feed' | 'reels' | 'stories';
    aspect_ratio: '1:1' | '4:5' | '9:16';
    duration_seconds: number | null;
    imageBase64?: string; // Optional for direct upload analysis
  };
  copy: {
    primary_text: string;
    headline: string;
    description: string | null;
    cta: string;
  };
  campaign: {
    objective: 'leads' | 'sales' | 'traffic' | 'awareness';
    industry: string;
    audience_type: 'broad' | 'interest' | 'lookalike' | 'unknown';
    region: string | null;
  };
  competitorContext?: CompetitorAd[]; // Real ads fetched from Apify
}

export interface MetaAdAnalysis {
  overall_score: number;
  summary: string;
  creative_analysis: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  copy_analysis: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  platform_fit: {
    score: number;
    fatigue_risk: 'low' | 'medium' | 'high';
  };
  performance_prediction: {
    ctr: 'low' | 'medium' | 'high';
    engagement: 'low' | 'medium' | 'high';
    conversion_potential: 'low' | 'medium' | 'high';
    cpm_efficiency: 'low' | 'medium' | 'high';
  };
  benchmark_comparison: string;
  optimization_suggestions: {
    priority: number;
    suggestion: string;
  }[];
  final_verdict: 'launch' | 'optimize_before_launch' | 'rework_creative';
  groundingChunks?: GroundingChunk[]; // Source links found during research
}
