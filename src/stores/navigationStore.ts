import { createStore } from './createStore';

export type AppView = 'chat' | 'knowledge';

interface NavigationState {
  activeView: AppView;
  setView: (view: AppView) => void;
}

// Two top-level pages, addressed by URL hash (#/chat, #/knowledge) so they can be linked and
// Back/Forward work without a router dependency. The hash is the persistence — no persistKey.
const viewFromHash = (): AppView => (window.location.hash === '#/knowledge' ? 'knowledge' : 'chat');

export const useNavigationStore = createStore<NavigationState>((set) => ({
  activeView: viewFromHash(),

  setView: (view) => {
    if (window.location.hash !== `#/${view}`) {
      window.location.hash = `/${view}`;
    }
    set({ activeView: view });
  },
}));

window.addEventListener('hashchange', () => {
  useNavigationStore.setState({ activeView: viewFromHash() });
});
