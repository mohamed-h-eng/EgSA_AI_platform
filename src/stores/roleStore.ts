import { createStore } from './createStore';

interface RoleState {
  isAdmin: boolean;
  toggleAdmin: () => void;
}

// ADM-001 demo control: "Admin View" vs "User View", shared by the Administration modal and
// Settings → Models. Client-side only, so it gates UI, not data. Real roles come from backend auth.
export const useRoleStore = createStore<RoleState>(
  (set) => ({
    isAdmin: true,
    toggleAdmin: () => set((s) => ({ isAdmin: !s.isAdmin })),
  }),
  'egsa_ai_role'
);
