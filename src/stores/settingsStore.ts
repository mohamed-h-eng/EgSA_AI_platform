import { createStore } from './createStore';
import type { UserPreferences, AIConfiguration, ThemeMode, FontSizeOption, ChatDensity, BubbleStyle } from '../types';
import { DEFAULT_PREFERENCES, DEFAULT_AI_CONFIG, DEFAULT_PERSONAS } from '../constants/defaults';

interface SettingsState {
  preferences: UserPreferences;
  aiConfig: AIConfiguration;
  isSettingsOpen: boolean;
  activeSettingsTab: 'appearance' | 'model' | 'personas' | 'api';

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: FontSizeOption) => void;
  setChatDensity: (density: ChatDensity) => void;
  setBubbleStyle: (style: BubbleStyle) => void;
  setPreferences: (partial: Partial<UserPreferences>) => void;

  setModel: (modelId: string) => void;
  setPersona: (personaId: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemPrompt: (prompt: string) => void;
  setAIConfig: (partial: Partial<AIConfiguration>) => void;

  openSettings: (tab?: 'appearance' | 'model' | 'personas' | 'api') => void;
  closeSettings: () => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = createStore<SettingsState>((set) => ({
  preferences: DEFAULT_PREFERENCES,
  aiConfig: DEFAULT_AI_CONFIG,
  isSettingsOpen: false,
  activeSettingsTab: 'appearance',

  setTheme: (theme) => {
    set((state) => ({
      preferences: { ...state.preferences, theme },
    }));
    document.documentElement.setAttribute('data-theme', theme);
  },

  setAccentColor: (color) => {
    set((state) => ({
      preferences: { ...state.preferences, customAccentColor: color },
    }));
    document.documentElement.style.setProperty('--accent-primary', color);
  },

  setFontSize: (fontSize) => {
    set((state) => ({
      preferences: { ...state.preferences, fontSize },
    }));
    const sizeMap = { sm: '14px', md: '15px', lg: '17px' };
    document.documentElement.style.setProperty('--chat-font-size', sizeMap[fontSize]);
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

  setPreferences: (partial) => {
    set((state) => ({
      preferences: { ...state.preferences, ...partial },
    }));
  },

  setModel: (activeModelId) => {
    set((state) => ({
      aiConfig: { ...state.aiConfig, activeModelId },
    }));
  },

  setPersona: (personaId) => {
    const persona = DEFAULT_PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      set((state) => ({
        aiConfig: {
          ...state.aiConfig,
          activePersonaId: personaId,
          activeModelId: persona.defaultModelId,
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
    set({
      preferences: DEFAULT_PREFERENCES,
      aiConfig: DEFAULT_AI_CONFIG,
    });
    document.documentElement.setAttribute('data-theme', DEFAULT_PREFERENCES.theme);
    document.documentElement.style.removeProperty('--accent-primary');
    document.documentElement.style.removeProperty('--chat-font-size');
  },
}), 'egsa_ai_settings');
