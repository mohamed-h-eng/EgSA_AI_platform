import { useSyncExternalStore } from 'react';

type Listener = () => void;

export type StateCreator<T> = (
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T
) => T;

export interface StoreApi<T> {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener) => () => void;
}

export type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<T>(creator: StateCreator<T>, persistKey?: string): UseStore<T> {
  let state: T;
  const listeners = new Set<Listener>();

  const getState = () => state;

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextPartial = typeof partial === 'function' ? (partial as (state: T) => Partial<T>)(state) : partial;
    if (nextPartial !== state) {
      state = { ...state, ...nextPartial };
      if (persistKey) {
        try {
          localStorage.setItem(persistKey, JSON.stringify(state));
        } catch (e) {
          console.warn(`Failed to persist store [${persistKey}] to localStorage`, e);
        }
      }
      listeners.forEach((listener) => listener());
    }
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  // Initialize state, checking localStorage if persistKey provided
  const initialCreatedState = creator(setState, getState);
  if (persistKey) {
    try {
      const saved = localStorage.getItem(persistKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: any = { ...initialCreatedState };
        for (const key of Object.keys(parsed)) {
          const defaultVal = (initialCreatedState as any)[key];
          const savedVal = parsed[key];
          if (
            defaultVal &&
            typeof defaultVal === 'object' &&
            !Array.isArray(defaultVal) &&
            savedVal &&
            typeof savedVal === 'object' &&
            !Array.isArray(savedVal)
          ) {
            merged[key] = { ...defaultVal, ...savedVal };
          } else {
            merged[key] = savedVal;
          }
        }
        state = merged;
      } else {
        state = initialCreatedState;
      }
    } catch {
      state = initialCreatedState;
    }
  } else {
    state = initialCreatedState;
  }

  const useStore = ((selector?: (s: T) => any) => {
    return useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : state),
      () => (selector ? selector(state) : state)
    );
  }) as UseStore<T>;

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
