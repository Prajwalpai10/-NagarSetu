/**
 * NagarSetu Storage Service
 * Provides robust localStorage persistence with fallback and namespace isolation.
 */

const STORAGE_PREFIX = 'nagarsetu_';
const memoryStore = new Map<string, string>();

export const storageService = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(STORAGE_PREFIX + key);
        if (item !== null) {
          return JSON.parse(item) as T;
        }
      }
      if (memoryStore.has(STORAGE_PREFIX + key)) {
        return JSON.parse(memoryStore.get(STORAGE_PREFIX + key)!) as T;
      }
      return defaultValue;
    } catch (err) {
      console.warn(`[storageService] Error reading key "${key}":`, err);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      const serialized = JSON.stringify(value);
      memoryStore.set(STORAGE_PREFIX + key, serialized);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_PREFIX + key, serialized);
      }
      return true;
    } catch (err) {
      console.warn(`[storageService] Error writing key "${key}":`, err);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      memoryStore.delete(STORAGE_PREFIX + key);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_PREFIX + key);
      }
      return true;
    } catch (err) {
      console.warn(`[storageService] Error removing key "${key}":`, err);
      return false;
    }
  },

  clearAll: (): boolean => {
    try {
      memoryStore.clear();
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(window.localStorage)
          .filter(k => k.startsWith(STORAGE_PREFIX))
          .forEach(k => window.localStorage.removeItem(k));
      }
      return true;
    } catch (err) {
      console.warn('[storageService] Error clearing NagarSetu storage:', err);
      return false;
    }
  }
};
