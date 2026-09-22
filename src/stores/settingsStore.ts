import { createStore } from './createStore';
import type { ModelProfile, UserPreferences, AIConfiguration, ThemeMode, FontSizeOption, ChatDensity, BubbleStyle, TextDirection, ArabicFontOption } from '../types';
import { DEFAULT_PREFERENCES, DEFAULT_AI_CONFIG, DEFAULT_PERSONAS, DEFAULT_MODEL_PROFILES } from '../constants/defaults';
import { ensureDefaults, reconcileProfiles, removeProfile, setDefaultProfile } from '../services/ai/modelProfiles';

interface SettingsState {
  preferences: UserPreferences;
  aiConfig: AIConfiguration;
  /** CHAT-006 model profiles; swap-in point for GET /api/models. */
  profiles: ModelProfile[];
  isSettingsOpen: boolean;
  activeSettingsTab: 'appearance' | 'model' | 'personas' | 'api';

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: FontSizeOption) => void;
  setChatDensity: (density: ChatDensity) => void;
  setBubbleStyle: (style: BubbleStyle) => void;
  setTextDirection: (direction: TextDirection) => void;
  setArabicFont: (font: ArabicFontOption) => void;
  setPreferences: (partial: Partial<UserPreferences>) => void;

  addProfile: (profile: Omit<ModelProfile, 'id'>) => string;
  updateProfile: (id: string, patch: Partial<Omit<ModelProfile, 'id'>>) => void;
  removeProfile: (id: string) => void;
  setDefaultProfile: (id: string) => void;
  setPersona: (personaId: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemPrompt: (prompt: string) => void;
  setAIConfig: (partial: Partial<AIConfiguration>) => void;

  openSettings: (tab?: 'appearance' | 'model' | 'personas' | 'api') => void;
  closeSettings: () => void;
  resetToDefaults: () => void;
}

// Preferences are applied to <html> (theme, font scale, accent, Arabic font, direction) in one
// place: the effects in App.tsx. Setters here only update state.
export const useSettingsStore = createStore<SettingsState>((set) => ({
  preferences: DEFAULT_PREFERENCES,
  aiConfig: DEFAULT_AI_CONFIG,
  profiles: DEFAULT_MODEL_PROFILES,
  isSettingsOpen: false,
  activeSettingsTab: 'appearance',

  setTheme: (theme) => {
    set((state) => ({
      preferences: { ...state.preferences, theme },
    }));
  },

  setAccentColor: (color) => {
    set((state) => ({
      preferences: { ...state.preferences, customAccentColor: color },
    }));
  },

  setFontSize: (fontSize) => {
    set((state) => ({
      preferences: { ...state.preferences, fontSize },
    }));
  },

  setChatDensity: (chatDensity) => {
    set((state) => ({
      preferences: { ...state.preferences, chatDensity },
    }));
  },

  setBubbleStyle: (bubbleStyle) => {
    set((state) => ({
      preferences: { ...state.preferences, bubbleStyle },
    }));
  },

  setTextDirection: (textDirection) => {
    set((state) => ({
      preferences: { ...state.preferences, textDirection },
    }));
  },

  setArabicFont: (arabicFont) => {
    set((state) => ({
      preferences: { ...state.preferences, arabicFont },
    }));
  },

  setPreferences: (partial) => {
    set((state) => ({
      preferences: { ...state.preferences, ...partial },
    }));
  },

  addProfile: (profile) => {
    const id = `profile-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
    set((state) => ({ profiles: ensureDefaults([...state.profiles, { ...profile, id }]) }));
    return id;
  },

  updateProfile: (id, patch) => {
    set((state) => ({ profiles: ensureDefaults(state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p))) }));
  },

  removeProfile: (id) => {
    set((state) => ({ profiles: removeProfile(state.profiles, id) }));
  },

  setDefaultProfile: (id) => {
    set((state) => ({ profiles: setDefaultProfile(state.profiles, id) }));
  },

  setPersona: (personaId) => {
    const persona = DEFAULT_PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      set((state) => ({
        aiConfig: {
          ...state.aiConfig,
          activePersonaId: personaId,
          systemPrompt: persona.systemPrompt,
          temperature: persona.temperature,
        },
      }));
    }
  },

  setTemperature: (temperature) => {
    set((state) => ({
      aiConfig: { ...state.aiConfig, temperature },
    }));
  },

  setMaxTokens: (maxTokens) => {
    set((state) => ({
      aiConfig: { ...state.aiConfig, maxTokens },
    }));
  },

  setSystemPrompt: (systemPrompt) => {
    set((state) => ({
      aiConfig: { ...state.aiConfig, systemPrompt },
    }));
  },

  setAIConfig: (partial) => {
    set((state) => ({
      aiConfig: { ...state.aiConfig, ...partial },
    }));
  },

  openSettings: (tab = 'appearance') => {
    set({ isSettingsOpen: true, activeSettingsTab: tab });
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  resetToDefaults: () => {
    // Profiles are admin configuration, not a personal preference, so they are kept.
    set({
      preferences: DEFAULT_PREFERENCES,
      aiConfig: DEFAULT_AI_CONFIG,
    });
  },
}), 'egsa_ai_settings', {
  // The API key never goes to localStorage (NFR-SEC): it lives in sessionStorage, so it survives
  // reloads in this tab and is gone when the browser session ends. The real fix is the gateway
  // holding credentials server-side (INT-004); this just stops the key persisting on shared PCs.
  partialize: (state) => ({ ...state, aiConfig: { ...state.aiConfig, apiKey: '' } }),
  // One-time move of a key saved by older builds from localStorage into sessionStorage.
  rehydrate: (loaded) => {
    const apiKey = readSessionApiKey() || loaded.aiConfig.apiKey || '';
    return {
      ...loaded,
      aiConfig: { ...loaded.aiConfig, apiKey },
      profiles: reconcileProfiles(loaded.profiles, DEFAULT_MODEL_PROFILES),
    };
  },
});

const SESSION_API_KEY = 'egsa_ai_api_key';

function readSessionApiKey(): string {
  try {
    return sessionStorage.getItem(SESSION_API_KEY) || '';
  } catch {
    return '';
  }
}

let lastSessionKey = useSettingsStore.getState().aiConfig.apiKey || '';
const writeSessionApiKey = (apiKey: string) => {
  try {
    if (apiKey) sessionStorage.setItem(SESSION_API_KEY, apiKey);
    else sessionStorage.removeItem(SESSION_API_KEY);
  } catch {
    // Storage blocked (private mode): the key just lasts until reload.
  }
};
writeSessionApiKey(lastSessionKey);
// Strip a legacy key out of localStorage right away instead of waiting for the next settings change.
useSettingsStore.setState({});
useSettingsStore.subscribe(() => {
  const apiKey = useSettingsStore.getState().aiConfig.apiKey || '';
  if (apiKey !== lastSessionKey) {
    lastSessionKey = apiKey;
    writeSessionApiKey(apiKey);
  }
});
