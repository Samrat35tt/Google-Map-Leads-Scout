
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, ScriptOptions, LeadAnalysis, LinkedInProfileDetails, MetaAdInput, MetaAdAnalysis } from "../types";
import { enrichLeadData } from "./enrichment";
import { getLLMSettings } from "./settingsStore";

// Safe UUID generator that works in non-secure contexts
const safeUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Lazy initialization to prevent app crash on load if env is missing
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing in process.env");
    return new GoogleGenAI({ apiKey: 'MISSING_KEY' });
  }
  return new GoogleGenAI({ apiKey });
};

// ------------------------------------------------------------------
// 🛡️ COMMERCIAL GRADE ERROR HANDLING
// ------------------------------------------------------------------

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const msg = error?.message || '';
    // Retry on Rate Limits (429) or Server Overload (503)
    if (retries > 0 && (msg.includes('429') || msg.includes('503') || msg.includes('Quota') || msg.includes('Overloaded'))) {
      console.warn(`API Busy. Retrying in ${delay}ms... (${retries} attempts left)`);
      await wait(delay);
      return retryWithBackoff(operation, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}

const formatGeminiError = (error: any): string => {
  const msg = error?.message || error?.toString() || '';
  if (msg.includes('API_KEY_INVALID') || msg.includes('MISSING_KEY')) {
    return "API Key is missing or invalid. Please check your .env file.";
  }
  if (msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
    return "System busy (Quota Exceeded). We are automatically retrying, but please try again in a moment.";
  }
  if (msg.includes('403')) {
    return "Access Denied. Check API Key permissions.";
  }
  if (msg.includes('503') || msg.includes('Overloaded')) {
    return "AI Service is temporarily unavailable. Please try again shortly.";
  }
  if (msg.includes('SAFETY')) {
    return "Request blocked by safety filters. Please refine your query.";
  }
  if (msg.includes('candidate') || msg.includes('parse JSON') || msg.includes('Invalid data')) {
     return "Failed to interpret AI response. Please try a different industry or location.";
  }
  return "Unable to complete request. Please try again.";
};

const extractJson = (text: string): any => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {}

  try {
    let content = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) content = match[1];

    const arrayStart = content.indexOf('[');
    const arrayEnd = content.lastIndexOf(']');
    const objectStart = content.indexOf('{');
    const objectEnd = content.lastIndexOf('}');

    if (arrayStart !== -1 && arrayEnd !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
      return JSON.parse(content.substring(arrayStart, arrayEnd + 1));
    }
    if (objectStart !== -1 && objectEnd !== -1) {
      return JSON.parse(content.substring(objectStart, objectEnd + 1));
    }
    return null;
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response", e);
    return null;
  }
};

export const getPostalCodesForCountry = async (country: string): Promise<string[]> => {
  return getCitiesForCountry(country); 
};

export const getCitiesForCountry = async (country: string): Promise<string[]> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `List 50 major cities and commercial hubs for "${country}". Return JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return extractJson(response.text) || [];
    } catch (error) {
      console.warn("City fetch failed:", error);
      return [];
    }
  });
};

export const getAreasForCity = async (city: string, country: string): Promise<string[]> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `List 20 key neighborhoods, areas, or postal codes for "${city}, ${country}". Return JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return extractJson(response.text) || [];
    } catch (error) {
      console.warn("Area fetch failed:", error);
      return [];
    }
  });
};

export const searchLeadsWithGemini = async (industry: string, country: string, city: string, postalCode: string): Promise<{ leads: Lead[], groundingChunks: any[] }> => {
  const specificLocation = `${postalCode || ''} ${city}, ${country}`.trim();

  const executeSearch = async (useMaps: boolean) => {
    try {
        const ai = getAiClient();
        const tools = useMaps ? [{ googleMaps: {}, googleSearch: {} }] : [{ googleSearch: {} }];
        
        const prompt = `
          Find 10 real local businesses in "${industry}" in/near "${specificLocation}".
          Use Google Maps to verify their physical location and GMB status.
          
          CRITICAL: Do NOT guess emails. If an email is not explicitly visible on their official GMB listing, leave it null.
          We will use their Website Domain to find the verified email later.
          
          For each, return a JSON array:
          {
            "name": "string",
            "address": "string",
            "phone": "string",
            "website": "url",
            "email": "string or null", 
            "socials": { "facebook": "url", "instagram": "url", "linkedin": "url", "twitter": "url", "youtube": "url" },
            "rating": number,
            "reviewCount": number,
            "category": "string"
          }
          ONLY return valid JSON. Ensure data is authentic.
        `;

        const model = useMaps ? "gemini-2.5-flash-lite-latest" : "gemini-3-pro-preview";
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { tools },
        });

        const parsedData = extractJson(response.text);
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        if (!Array.isArray(parsedData)) throw new Error("Invalid data format from AI");

        // Enrichment Waterfall
        const enrichedLeads: Lead[] = await Promise.all(parsedData.map(async (item: any, index: number) => {
            const baseLead = {
                id: safeUUID(),
                ...item,
                reviewCount: item.reviewCount || 0,
                pipelineStage: 'New Lead' as const
            };

            if (baseLead.website && !baseLead.email) {
                const enrichmentData = await enrichLeadData(baseLead, '', 'apollo');
                return { ...baseLead, ...enrichmentData };
            }
            
            if (baseLead.email) {
                return { ...baseLead, emailStatus: 'risky', emailSource: 'ai_inferred' };
            }

            return baseLead;
        }));

        return { leads: enrichedLeads, groundingChunks };
    } catch (e) {
        throw e;
    }
  };

  return retryWithBackoff(async () => {
    try {
      return await executeSearch(true);
    } catch (error) {
      try {
          return await executeSearch(false);
      } catch (finalError) {
          throw new Error(formatGeminiError(finalError));
      }
    }
  });
};

export const findSocialHandles = async (businessName: string, location: string): Promise<Partial<Lead>> => {
    return retryWithBackoff(async () => {
      try {
          const ai = getAiClient();
          const prompt = `
            Task: Find the OFFICIAL social media profiles for the business "${businessName}" located in "${location}".
            
            Instructions:
            1. Search for Facebook, Instagram, Twitter (X), and LinkedIn pages.
            2. VERIFY the branding, location, and website link on the profiles to ensure they belong to the same entity.
            3. If a specific platform is not found or is inactive/unofficial, return null for that field.
            
            Return JSON:
            {
              "facebook": "url or null",
              "instagram": "url or null",
              "twitter": "url or null",
              "linkedin": "url or null",
              "website": "url or null",
              "confidence": "High" | "Medium" | "Low"
            }
          `;

          const response = await ai.models.generateContent({
              model: "gemini-3-pro-preview",
              contents: prompt,
              config: {
                  tools: [{ googleSearch: {} }],
                  responseMimeType: "application/json"
              }
          });

          const data = extractJson(response.text);
          if (!data) throw new Error("No data returned");

          return {
              name: businessName,
              address: location,
              website: data.website,
              socials: {
                  facebook: data.facebook,
                  instagram: data.instagram,
                  twitter: data.twitter,
                  linkedin: data.linkedin
              },
              category: data.confidence || 'Medium'
          };

      } catch (error) {
          console.error("Social lookup failed:", error);
          return { name: businessName, address: location, category: 'Failed' };
      }
    });
};

export const searchLinkedInLeadsWithGemini = async (role: string, location: string, industry: string): Promise<Lead[]> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const prompt = `
        Find 8 REAL professional profiles using Google Search.
        Query: site:linkedin.com/in/ "${role}" "${location}" ${industry || ""}

        Extract specific details from the search results to create a list of potential leads.
        
        Return a JSON array with these keys:
        {
          "name": "Full Name",
          "company": "Current Company Name",
          "role": "Job Title",
          "linkedinUrl": "The actual URL found (must start with https://)",
          "summary": "Brief bio/snippet",
          "email": "Best guess professional email (e.g. first.last@company.com) - inferred",
          "website": "Company website"
        }
        
        Strictly NO placeholders or fictional data. Only return profiles found via the search tool.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const parsedData = extractJson(response.text);
      if (!Array.isArray(parsedData)) throw new Error("Invalid format");

      return parsedData.map((item: any, index: number) => ({
        id: safeUUID(),
        name: item.name,
        address: `${item.company} • ${location}`, 
        phone: null,
        email: item.email,
        website: item.website,
        category: item.role, 
        socials: { linkedin: item.linkedinUrl },
        rating: null,
        reviewCount: 0,
        mapsUrl: null,
        pipelineStage: 'New Lead'
      }));
    } catch (error) {
      throw new Error(formatGeminiError(error));
    }
  });
};

export const enrichLinkedInProfile = async (lead: Lead): Promise<LinkedInProfileDetails & { groundingChunks?: any[] }> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const prompt = `
        Act as a Lead Enrichment Specialist. I need a DEEP DIVE into this LinkedIn Profile: ${lead.socials?.linkedin || lead.name + " " + lead.address}
        
        TASK 1: FIND EMAIL.
        Use Google Search to find the best possible business email address for this person at their current company.
        Look for patterns like "firstname.lastname@company.com" or verified email sources.
        
        TASK 2: RECENT ACTIVITY & POSTS.
        Search for "site:linkedin.com/in/ ${lead.name} posted" or similar queries to find recent content they shared.
        Summarize their last 3 posts or articles. What are they talking about?
        
        TASK 3: PERSONALITY & INTERESTS.
        Look for hobbies, volunteering, or interests mentioned in their public profile summary or posts.
        
        TASK 4: JOB DETAILS.
        Get the exact description of their current role.

        Return a JSON object:
        {
          "summary": "A detailed 2-3 sentence professional summary based on their profile.",
          "emailGuess": "best_guess@email.com or null",
          "emailConfidence": "High" | "Medium" | "Low",
          "currentJob": {
            "title": "Exact Title",
            "company": "Company Name",
            "description": "Summary of responsibilities"
          },
          "recentActivity": [
            {
              "postContent": "Summary of post...",
              "date": "Approx date (e.g. 2 weeks ago)",
              "topics": ["AI", "Sales", "Hiring"]
            }
          ],
          "interests": ["Topic 1", "Topic 2"],
          "hobbies": ["Hobby 1", "Hobby 2 (e.g. Running, Chess)"],
          "communicationStyle": "Direct | Academic | Casual | Visionary",
          "iceBreakers": ["3 specific conversation starters based on the data above"]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const data = extractJson(response.text);
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      if (!data) throw new Error("Failed to enrich profile data.");

      return { ...data, groundingChunks };

    } catch (error) {
      throw new Error(formatGeminiError(error));
    }
  });
};

export const analyzeLeadWithGemini = async (lead: Lead): Promise<LeadAnalysis & { groundingChunks?: any[] }> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const prompt = `
        Act as a Lead Research Specialist. Perform a high-integrity audit for: ${lead.name} (${lead.category}) at ${lead.address}.
        
        CRITICAL TASKS:
        1. Use Google Search to find REAL reviews from the last 6 months.
        2. Identify specific "Consumer Friction" (e.g., "They never answer the phone," "Website is broken on mobile").
        3. Logic check: If they are a ${lead.category}, how much foot traffic/revenue are they missing by having a ${lead.rating || 'non-existent'} star rating?
        4. TECH STACK DETECTION: Scan their website ("${lead.website || lead.name}") to identify what tools they use (e.g., WordPress, Shopify, React, Google Analytics, Facebook Pixel, Intercom).
        
        Return JSON:
        {
          "overview": "Professional summary of their market status.",
          "techStack": ["List", "Of", "Detected", "Technologies"],
          "gmbHealth": { "isOptimized": boolean, "ratingConsistency": "string", "reviewFrequency": "string" },
          "digitalPresence": { "websiteStatus": "Strong"|"Average"|"Weak"|"None", "socialActivity": "High"|"Moderate"|"Low", "seoHealth": "Detailed comment" },
          "reputation": { "sentiment": "Positive"|"Neutral"|"Negative", "keyComplaints": ["actual customer pain points"], "keyPraises": ["actual customer wins"], "reviewSummary": "Detailed summary of recent feedback" },
          "marketingGaps": ["Missed opportunities like Google Messaging, Local Service Ads, etc."],
          "painPoints": ["The 3 biggest things hurting their bottom line right now"],
          "roiPotential": { "estimatedIncrease": "e.g. 22% Revenue Lift", "logic": "Scientific breakdown of how marketing fixes result in this gain" },
          "suggestedServices": ["SEO", "GMB Management", "Reputation Repair", "Web Design"]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const analysis = extractJson(response.text);
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      if (!analysis) throw new Error("Failed to parse analysis data");

      return { ...analysis, groundingChunks };
    } catch (error) {
      throw new Error(formatGeminiError(error));
    }
  });
};

export const generateLeadScript = async (lead: Lead, options: ScriptOptions): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      let analysisInfo = "";
      
      if (options.profileData) {
          analysisInfo = `
          DEEP PROFILE CONTEXT (USE THIS!):
          - Current Role: ${options.profileData.currentJob.title} at ${options.profileData.currentJob.company}
          - Recent Topics: ${options.profileData.recentActivity.map(a => a.topics.join(', ')).join(' | ')}
          - Interests: ${options.profileData.interests.join(', ')}
          - Ice Breaker Idea: ${options.profileData.iceBreakers[0]}
          `;
      } else if (options.analysis) {
          analysisInfo = `
          DEEP RESEARCH DATA (USE THIS!):
          - Tech Stack: ${options.analysis.techStack ? options.analysis.techStack.join(', ') : 'Unknown'}
          - Pain Points: ${options.analysis.painPoints.join(', ')}
          - ROI Potential: ${options.analysis.roiPotential.estimatedIncrease}
          - Reputation Issue: ${options.analysis.reputation.reviewSummary}
          - Marketing Gaps: ${options.analysis.marketingGaps.join(', ')}
          `;
      } else {
          analysisInfo = "General data: " + (lead.rating ? `${lead.rating} stars` : "No rating");
      }

      let knowledgeInfo = "";
      if (options.knowledgeContext) {
        knowledgeInfo = `
        KNOWLEDGE BASE CONTEXT (CRITICAL):
        Use the following information to personalize the message and pitch:
        ${options.knowledgeContext}
        `;
      }

      const prompt = `
        Act as a World-Class B2B Growth Consultant (Consultative, Helpful, High-Status).
        Target: ${lead.name}. Method: ${options.type}. Tone: ${options.tone}.

        ${analysisInfo}
        ${knowledgeInfo}

        STRATEGIC RULES:
        1. NO GENERIC OPENINGS. Do not start with "I hope this finds you well" or "My name is...". 
        2. PATTERN INTERRUPT: Start with an observation or a high-value question related to their tech stack, recent posts, or business pain points.
        3. RELEVANCE: Connect their specific interests/problems to the solution.
        4. HUMANIZED: Speak like a local professional. Use questions to engage their curiosity.
        5. THE ASK: A low-friction, consultative call to action.

        Example hook: "I was reading your recent post about [Topic] and..."
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { 
            thinkingConfig: { thinkingBudget: 24576 } 
        }
      });

      return response.text || "Failed to generate script.";
    } catch (error) {
      return `Error generating script: ${formatGeminiError(error)}`;
    }
  });
};

export const generateMeetingProposal = async (transcript: string, summary: string): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const prompt = `
        Act as a Senior Account Executive. I am providing you with the transcript and summary of a recent client meeting.
        
        MEETING SUMMARY:
        ${summary}
        
        MEETING TRANSCRIPT / NOTES:
        ${transcript}

        TASK:
        Generate a highly professional, persuasive, and structured business proposal based on this meeting.
        
        FORMAT:
        Use Markdown. Include the following sections:
        1. Executive Summary (Brief recap of their current situation and goals)
        2. Key Challenges Identified (Bullet points of their pain points discussed)
        3. Proposed Solution (How our services directly address their challenges)
        4. Investment & Timeline (Estimated based on the scope discussed, use placeholders like [Amount] if not explicitly stated)
        5. Next Steps
        
        TONE:
        Confident, consultative, and tailored exactly to what was discussed in the meeting. Do not include generic fluff.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
      });

      return response.text || "Failed to generate proposal.";
    } catch (error) {
      throw new Error(`Error generating proposal: ${formatGeminiError(error)}`);
    }
  });
};

export const generateOutreachSequence = async (lead: Lead, followUpCount: number, sequenceType: 'one-time' | 'sequence' = 'sequence'): Promise<{ email: string, sms: string, followUpEmail?: string, followUpSms?: string, followUps?: {email: string, sms: string}[] }> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      const settings = getLLMSettings();
      const companyProfile = settings.companyProfile;
      
      let companyContext = '';
      if (companyProfile && companyProfile.companyName) {
        companyContext = `
        SENDER KNOWLEDGE BASE (YOUR COMPANY):
        - Company Name: ${companyProfile.companyName}
        - Description: ${companyProfile.description}
        - Services/Products: ${companyProfile.services}
        - Value Proposition: ${companyProfile.valueProposition}
        - Target Audience: ${companyProfile.targetAudience}
        
        CRITICAL: You are writing on behalf of this company. Pitch these services naturally in the outreach.
        `;
      }
      
      let prompt = `
        Act as a World-Class B2B Sales Expert.
        Target Lead: ${lead.name} (${lead.category}) located at ${lead.address}.
        Website: ${lead.website || 'Unknown'}
        
        ${companyContext}
        
        Your task is to write a highly personalized, high-converting outreach for this lead.
        
        REQUIREMENTS:
        1. "email": A personalized cold email. Do NOT start with "I hope this finds you well". Use a pattern interrupt based on their industry or location. Keep it concise.
        2. "sms": A short, punchy SMS message (under 160 characters) referencing the email.
      `;

      if (sequenceType === 'sequence') {
        prompt += `
        3. "followUps": Generate EXACTLY ${followUpCount} follow-up steps. Each step must have an "email" and an "sms".
        
        Return ONLY a JSON object with the exact following keys:
        {
          "email": "string",
          "sms": "string",
          "followUps": [
            {
              "email": "string",
              "sms": "string"
            }
          ] // MUST contain exactly ${followUpCount} items
        }
        `;
      } else {
        prompt += `
        Return ONLY a JSON object with the exact following keys:
        {
          "email": "string",
          "sms": "string"
        }
        `;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json"
        }
      });

      const data = extractJson(response.text);
      if (!data) throw new Error("Failed to parse outreach sequence.");
      
      if (sequenceType === 'sequence' && !data.followUps) {
         if (data.followUpEmail && data.followUpSms) {
             data.followUps = [{ email: data.followUpEmail, sms: data.followUpSms }];
         } else {
             data.followUps = [];
         }
      }
      
      return data;
    } catch (error) {
      throw new Error(formatGeminiError(error));
    }
  });
};

export const analyzeMetaAd = async (input: MetaAdInput): Promise<MetaAdAnalysis> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      
      // Prepare Competitor Context if available
      let competitorContextStr = "";
      if (input.competitorContext && input.competitorContext.length > 0) {
          competitorContextStr = `
          LIVE MARKET DATA (ADS LIBRARY SCRAPE):
          The following are REAL, ACTIVE ads currently running in this niche. Use them as the primary benchmark.
          
          ${input.competitorContext.map((ad, i) => `
            [AD EXAMPLE ${i+1}]
            Advertiser: ${ad.advertiser}
            Headline: ${ad.headline}
            Copy: ${ad.copy.substring(0, 300)}...
            CTA: ${ad.cta}
          `).join('\n')}
          
          INSTRUCTIONS: Compare the user's input creative against these real-world examples. Is the user's ad better or worse? Why?
          `;
      }

      const systemPrompt = `
SYSTEM ROLE
You are an Ad Performance Prediction Engine embedded inside a software platform.
Your responsibility is to analyze ad creatives and copy before launch and return structured performance predictions, scores, and actionable optimization recommendations.

You operate as a decision-support system, not a chatbot.
You do NOT guarantee results or claim access to Meta internal systems.
You ALWAYS use probabilistic and comparative reasoning and follow the output schema exactly.

CORE EVALUATION MODEL
1. Module 1: Creative Analysis (Visual)
2. Module 2: Copy Analysis (Language)
3. Module 3: Meta Platform Fit
4. Module 4: Performance Prediction

MARKET INTELLIGENCE (CRITICAL):
${competitorContextStr ? 'Use the provided LIVE MARKET DATA to benchmark.' : 'You MUST use Google Search to find "active facebook ads for [industry]" or "best [industry] ad examples 2024".'}

SCORING LOGIC
- Creative: 35%
- Copy: 30%
- Fit: 20%
- Conversion: 15%

OPTIMIZATION
Generate max 5 concrete, impact-ranked improvements.
`;

      const userPrompt = `
INPUT SCHEMA:
${JSON.stringify(input, null, 2)}

OUTPUT SCHEMA (STRICT JSON):
{
  "overall_score": number,
  "summary": "string",
  "creative_analysis": {
    "score": number,
    "strengths": [string],
    "weaknesses": [string]
  },
  "copy_analysis": {
    "score": number,
    "strengths": [string],
    "weaknesses": [string]
  },
  "platform_fit": {
    "score": number,
    "fatigue_risk": "low | medium | high"
  },
  "performance_prediction": {
    "ctr": "low | medium | high",
    "engagement": "low | medium | high",
    "conversion_potential": "low | medium | high",
    "cpm_efficiency": "low | medium | high"
  },
  "benchmark_comparison": "string (Mention specific trends found in search or provided context)",
  "optimization_suggestions": [
    { "priority": number, "suggestion": "string" }
  ],
  "final_verdict": "launch | optimize_before_launch | rework_creative"
}
`;

      let parts: any[] = [{ text: userPrompt }];

      // If we have a Base64 image, attach it for visual analysis
      if (input.creative.imageBase64) {
          parts.push({
              inlineData: {
                  mimeType: 'image/png', // Assume png/jpeg for simplicity in this context
                  data: input.creative.imageBase64
              }
          });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: parts }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const data = extractJson(response.text);
      if (!data) throw new Error("Failed to generate analysis.");
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      return { ...data, groundingChunks };

    } catch (error) {
      throw new Error(formatGeminiError(error));
    }
  });
};
