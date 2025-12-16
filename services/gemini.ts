import { GoogleGenAI, Type } from "@google/genai";
import { Lead, ScriptOptions, LeadAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to parse JSON from markdown code blocks or raw JSON
const extractJson = (text: string): any => {
  if (!text) return null;

  try {
    // 1. Try strict parsing first in case it's pure JSON
    return JSON.parse(text);
  } catch (e) {
    // Not pure JSON, proceed to extraction
  }

  try {
    // 2. Extract content from markdown code blocks if present
    let content = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) {
      content = match[1];
    }

    // 3. Find the outer-most array brackets OR object brackets
    const arrayStart = content.indexOf('[');
    const arrayEnd = content.lastIndexOf(']');
    const objectStart = content.indexOf('{');
    const objectEnd = content.lastIndexOf('}');

    // Determine if it looks more like an array or an object
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
  try {
    const prompt = `
      List 30 major commercial and business-heavy postal codes (or pin codes) for "${country}".
      Format each entry strictly as: "PostalCode - City/Area Name" (e.g., "10001 - New York, NY" or "110001 - Connaught Place, New Delhi").
      
      CRITICAL RULES:
      1. REAL DATA ONLY. Do not use "00000" or placeholders.
      2. If the country has alphanumeric codes (like UK/Canada), use the outward code or first part.
      3. Focus on major economic hubs and cities.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text || "[]";
    const data = extractJson(text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching postal codes:", error);
    return [];
  }
};

export const searchLeadsWithGemini = async (industry: string, country: string, postalCode: string): Promise<{ leads: Lead[], groundingChunks: any[] }> => {
  const specificLocation = `${postalCode}, ${country}`;

  // Internal helper to run the search with specified tools
  const executeSearch = async (useMaps: boolean) => {
    const methodInstruction = useMaps 
        ? "1. Use **Google Maps** to identify real businesses in this specific area.\n2. Use **Google Search** to find contact details and social profiles."
        : "Use **Google Search** to identify real businesses in this area and find their contact details.";

    const tools = useMaps 
        ? [{ googleMaps: {}, googleSearch: {} }] 
        : [{ googleSearch: {} }];

    const prompt = `
      Find 10 real local businesses in the "${industry}" category located specifically in or near: "${specificLocation}".
      
      Method:
      ${methodInstruction}
      
      For each business, find:
      - Official Website
      - Public Email
      - **Social Media Profiles** (Facebook, Instagram, LinkedIn, Twitter/X, YouTube)
      
      Output Requirements:
      Return ONLY a JSON array of objects inside a markdown code block. Do NOT include any text before or after the JSON.
      
      Object Schema:
      - name: string (Business Name)
      - address: string (Full Address)
      - phone: string | null
      - website: string | null (Official domain only)
      - email: string | null (Public contact email)
      - socials: { facebook?: string, instagram?: string, linkedin?: string, twitter?: string, youtube?: string }
      - rating: number | null
      - category: string
      
      Quality Control:
      - Do not invent emails or social links. Only return what is found via search.
      - Ensure 'website' looks like a valid URL.
      - Aim for exactly 10 high-quality results.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools },
    });

    const text = response.text || "";
    const parsedData = extractJson(text);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (!Array.isArray(parsedData)) {
       console.warn("Invalid or empty JSON data received:", text);
       if (!parsedData) throw new Error("Failed to parse JSON data");
       return { leads: [], groundingChunks: [] };
    }

    const leads: Lead[] = parsedData.map((item: any, index: number) => ({
        id: `lead-${Date.now()}-${index}`,
        name: item.name || "Unknown Business",
        address: item.address || "No address provided",
        phone: item.phone || null,
        email: item.email || null,
        website: item.website || null,
        socials: item.socials || {},
        category: item.category || industry,
        rating: item.rating || null,
      }));

    return { leads, groundingChunks };
  };

  try {
    return await executeSearch(true);
  } catch (error: any) {
    if (error.message?.includes('500') || error.status === 500 || error.message?.includes('Internal error') || error.message?.includes('JSON')) {
      console.warn("Primary search failed (Maps/JSON error), falling back to Google Search...", error);
      try {
        return await executeSearch(false);
      } catch (fallbackError) {
        console.error("Fallback search failed:", fallbackError);
        throw fallbackError;
      }
    }
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

export const analyzeLeadWithGemini = async (lead: Lead): Promise<LeadAnalysis> => {
  try {
    const prompt = `
      Act as a senior B2B Marketing Analyst. Perform a deep-dive audit on this business:
      
      Name: ${lead.name}
      Location: ${lead.address}
      Website: ${lead.website || "Not available (check if they need one)"}
      Category: ${lead.category}

      Task:
      Use Google Search to find their recent reviews, online presence, competitors, and potential issues.
      
      Return a STRICT JSON object (no markdown, no extra text) with this structure:
      {
        "overview": "2-3 sentences describing the business vibe and market position.",
        "digitalPresence": {
          "websiteStatus": "Strong" | "Average" | "Weak" | "None",
          "socialActivity": "High" | "Moderate" | "Low",
          "seoHealth": "Brief comment on SEO (e.g., 'Ranking for local keywords' or 'Invisible online')"
        },
        "reputation": {
          "sentiment": "Positive" | "Neutral" | "Negative",
          "keyComplaints": ["complaint 1", "complaint 2"],
          "keyPraises": ["praise 1", "praise 2"]
        },
        "marketingGaps": ["gap 1 (e.g. No Facebook Pixel)", "gap 2 (e.g. Bad mobile view)", "gap 3"],
        "suggestedServices": ["service 1", "service 2", "service 3"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "{}";
    const data = extractJson(text);

    if (!data || !data.overview) {
       throw new Error("Failed to parse analysis data");
    }

    return data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback object so the UI doesn't crash
    return {
      overview: "Could not generate detailed analysis at this time.",
      digitalPresence: { websiteStatus: 'Average', socialActivity: 'Low', seoHealth: 'Unknown' },
      reputation: { sentiment: 'Neutral', keyComplaints: [], keyPraises: [] },
      marketingGaps: ["Could not determine specific gaps."],
      suggestedServices: ["General Consultation"]
    };
  }
};

export const generateLeadScript = async (lead: Lead, options: ScriptOptions): Promise<string> => {
  try {
    const prompt = `
      You are an expert sales copywriter. Create a ${options.tone} ${options.type} script for a lead with the following details:
      
      Business Name: ${lead.name}
      Industry: ${lead.category}
      Location: ${lead.address}
      Website: ${lead.website || "Not available"}
      Email: ${lead.email || "Not available"}
      
      The goal is to offer B2B services relevant to their industry.
      Keep it concise, persuasive, and compliant with anti-spam best practices.
      Format the output with clear sections (Subject Line if email, Opening, Value Prop, CTA).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Failed to generate script.";
  } catch (error) {
    console.error("Gemini Script Error:", error);
    return "Error generating script. Please try again.";
  }
};