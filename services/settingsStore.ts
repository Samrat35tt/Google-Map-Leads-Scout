
import { LLMSettings } from '../types';

// Default Settings
export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  activeProvider: 'gemini',
  activeDataProvider: 'apollo',
  apiKeys: {
    gemini: '',
    openai: '',
    anthropic: '',
    deepseek: '',
    apollo: 'lmPEKhCqBUHmllC0oaf_Ww', // Hardcoded Enterprise Key
    hunter: '',
    zerobounce: '',
    apify: ''
  },
  models: {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20240620',
    deepseek: 'deepseek-chat'
  },
  companyProfile: {
    companyName: '',
    description: '',
    services: '',
    valueProposition: '',
    targetAudience: ''
  }
};

// Helper to get settings from local storage
export const getLLMSettings = (): LLMSettings => {
  try {
    const stored = localStorage.getItem('mapx_llm_settings');
    if (!stored) return DEFAULT_LLM_SETTINGS;
    
    const parsed = JSON.parse(stored);
    // Ensure the hardcoded key persists even if user has saved other settings previously
    if (!parsed.apiKeys?.apollo) {
        if (!parsed.apiKeys) parsed.apiKeys = {};
        parsed.apiKeys.apollo = DEFAULT_LLM_SETTINGS.apiKeys.apollo;
    }
    
    return { ...DEFAULT_LLM_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Failed to load settings:", e);
    return DEFAULT_LLM_SETTINGS;
  }
};

// Helper to save settings
export const saveLLMSettings = (settings: LLMSettings) => {
  try {
    localStorage.setItem('mapx_llm_settings', JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};
