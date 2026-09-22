import { createStore } from './createStore';

interface UiState {
  isShortcutsOpen: boolean;
  /** Short confirmation shown after a keyboard action with no visible result (e.g. "Copied"). */
  toast: string | null;

  openShortcuts: () => void;
  closeShortcuts: () => void;
  showToast: (message: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

// Transient app-wide UI state (not persisted).
export const useUiStore = createStore<UiState>((set) => ({
  isShortcutsOpen: false,
  toast: null,

  openShortcuts: () => set({ isShortcutsOpen: true }),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 1800);
  },
}));
