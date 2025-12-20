
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, ScriptOptions, LeadAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  try {
    // Basic Text Tasks: Use gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 30 major commercial postal codes for "${country}" as "Code - Area". Return JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return extractJson(response.text) || [];
  } catch (error) {
    return [];
  }
};

export const searchLeadsWithGemini = async (industry: string, country: string, postalCode: string): Promise<{ leads: Lead[], groundingChunks: any[] }> => {
  const specificLocation = `${postalCode}, ${country}`;

  const executeSearch = async (useMaps: boolean) => {
    // Maps grounding and Search grounding combined
    const tools = useMaps ? [{ googleMaps: {}, googleSearch: {} }] : [{ googleSearch: {} }];
    const prompt = `
      Find 10 real local businesses in "${industry}" near "${specificLocation}".
      Use Google Maps to verify their physical location and GMB status.
      
      For each, return a JSON array:
      {
        "name": "string",
        "address": "string",
        "phone": "string",
        "website": "url",
        "email": "email",
        "socials": { "facebook": "url", "instagram": "url", "linkedin": "url", "twitter": "url", "youtube": "url" },
        "rating": number,
        "reviewCount": number,
        "category": "string"
      }
      ONLY return valid JSON. Ensure data is authentic.
    `;

    // Rule: Maps grounding is only supported in Gemini 2.5 series models.
    const model = useMaps ? "gemini-2.5-flash-lite-latest" : "gemini-3-pro-preview";
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { tools },
    });

    const parsedData = extractJson(response.text);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (!Array.isArray(parsedData)) throw new Error("Invalid data");

    const leads: Lead[] = parsedData.map((item: any, index: number) => ({
      id: `lead-${Date.now()}-${index}`,
      ...item,
      reviewCount: item.reviewCount || 0,
    }));

    return { leads, groundingChunks };
  };

  try {
    return await executeSearch(true);
  } catch (error) {
    return await executeSearch(false);
  }
};

export const analyzeLeadWithGemini = async (lead: Lead): Promise<LeadAnalysis & { groundingChunks?: any[] }> => {
  try {
    const prompt = `
      Act as a Lead Research Specialist. Perform a high-integrity audit for: ${lead.name} (${lead.category}) at ${lead.address}.
      
      CRITICAL TASKS:
      1. Use Google Search to find REAL reviews from the last 6 months.
      2. Identify specific "Consumer Friction" (e.g., "They never answer the phone," "Website is broken on mobile").
      3. Logic check: If they are a ${lead.category}, how much foot traffic/revenue are they missing by having a ${lead.rating || 'non-existent'} star rating?
      
      Return JSON:
      {
        "overview": "Professional summary of their market status.",
        "gmbHealth": { "isOptimized": boolean, "ratingConsistency": "string", "reviewFrequency": "string" },
        "digitalPresence": { "websiteStatus": "Strong"|"Average"|"Weak"|"None", "socialActivity": "High"|"Moderate"|"Low", "seoHealth": "Detailed comment" },
        "reputation": { "sentiment": "Positive"|"Neutral"|"Negative", "keyComplaints": ["actual customer pain points"], "keyPraises": ["actual customer wins"], "reviewSummary": "Detailed summary of recent feedback" },
        "marketingGaps": ["Missed opportunities like Google Messaging, Local Service Ads, etc."],
        "painPoints": ["The 3 biggest things hurting their bottom line right now"],
        "roiPotential": { "estimatedIncrease": "e.g. 22% Revenue Lift", "logic": "Scientific breakdown of how marketing fixes result in this gain" },
        "suggestedServices": ["SEO", "GMB Management", "Reputation Repair", "Web Design"]
      }
    `;

    // Complex reasoning task: use gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const analysis = extractJson(response.text);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return analysis ? { ...analysis, groundingChunks } : null as any;
  } catch (error) {
    throw error;
  }
};

export const generateLeadScript = async (lead: Lead, options: ScriptOptions): Promise<string> => {
  try {
    const analysisInfo = options.analysis ? `
      DEEP RESEARCH DATA (USE THIS!):
      - Pain Points: ${options.analysis.painPoints.join(', ')}
      - ROI Potential: ${options.analysis.roiPotential.estimatedIncrease}
      - Reputation Issue: ${options.analysis.reputation.reviewSummary}
      - Marketing Gaps: ${options.analysis.marketingGaps.join(', ')}
    ` : "General GMB data: " + (lead.rating ? `${lead.rating} stars` : "No rating");

    const prompt = `
      Act as a World-Class B2B Growth Consultant (Consultative, Helpful, High-Status).
      Target: ${lead.name}. Method: ${options.type}. Tone: ${options.tone}.

      ${analysisInfo}

      STRATEGIC RULES:
      1. NO GENERIC OPENINGS. Do not start with "I hope this finds you well" or "My name is...". 
      2. PATTERN INTERRUPT: Start with an observation or a high-value question.
      3. ROI FOCUS: Quantify the cost of inaction. Use the "Projected Increase" from research.
      4. HUMANIZED: Speak like a local professional. Use questions to engage their curiosity.
      5. THE ASK: A low-friction, consultative call to action.

      Example hook for poor GMB: "I was looking at ${lead.name}'s local profile and noticed a few recent reviews that might be invisible to you, but they're definitely visible to your competitors."
    `;

    // Complex reasoning/coding task: use gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { 
          thinkingConfig: { thinkingBudget: 24576 } 
      }
    });

    return response.text || "Failed to generate script.";
  } catch (error) {
    return "Error generating script.";
  }
};
