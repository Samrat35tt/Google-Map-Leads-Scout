
import { ScriptOptions, Lead } from '../types';
import { generateLeadScript as generateGeminiScript } from './gemini';
import { getLLMSettings } from './settingsStore';

// --- API Callers ---

const callBackendLLM = async (provider: string, model: string, systemPrompt: string, userPrompt: string) => {
  const response = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider,
      model,
      systemPrompt,
      userPrompt
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  return data.text || "";
};

// --- Unified Generator ---

export const generateScriptWithRouter = async (lead: Lead, options: ScriptOptions): Promise<string> => {
  const settings = getLLMSettings();
  const provider = settings.activeProvider;

  // 1. If Gemini, use the existing service (it handles Tools & Grounding best)
  if (provider === 'gemini') {
    return generateGeminiScript(lead, options);
  }

  // 2. Prepare Prompts for 3rd Party LLMs
  let analysisInfo = "";
  if (options.profileData) {
      analysisInfo = `
      LEAD CONTEXT (LinkedIn Data):
      - Role: ${options.profileData.currentJob.title} at ${options.profileData.currentJob.company}
      - Recent Topics: ${options.profileData.recentActivity.map(a => a.topics.join(', ')).join(' | ')}
      - Interests: ${options.profileData.interests.join(', ')}
      - Suggested Ice Breaker: ${options.profileData.iceBreakers[0]}
      `;
  } else if (options.analysis) {
      analysisInfo = `
      LEAD CONTEXT (Business Audit):
      - Pain Points: ${options.analysis.painPoints.join(', ')}
      - ROI Potential: ${options.analysis.roiPotential.estimatedIncrease}
      - Reputation Summary: ${options.analysis.reputation.reviewSummary}
      - Marketing Gaps: ${options.analysis.marketingGaps.join(', ')}
      `;
  } else {
      analysisInfo = `Lead Info: ${lead.name} (${lead.category}) in ${lead.address}. Rating: ${lead.rating || 'N/A'}.`;
  }

  const systemPrompt = `You are a World-Class B2B Sales Expert. Your goal is to write a high-conversion ${options.type} script.
  Tone: ${options.tone}.
  
  RULES:
  - Do NOT start with "I hope you are well".
  - Use a "Pattern Interrupt" hook based on the provided context.
  - Keep it concise and human.
  - End with a low-friction Call to Action (CTA).`;

  const userPrompt = `Write a script for this lead:\n${analysisInfo}`;

  // 3. Route to Provider
  try {
    switch (provider) {
      case 'openai':
      case 'deepseek':
      case 'anthropic':
        return await callBackendLLM(
          provider,
          settings.models[provider],
          systemPrompt,
          userPrompt
        );

      default:
        throw new Error("Unknown provider");
    }
  } catch (error: any) {
    console.error("LLM Router Error:", error);
    return `Generation Failed: ${error.message}. Please check your API Settings.`;
  }
};
