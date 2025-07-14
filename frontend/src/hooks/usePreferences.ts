// src/hooks/usePreferences.ts
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface PreferencesState {
  [key: string]: any;
}

interface UsePreferencesReturn {
  preferences: PreferencesState;
  loading: boolean;
  error: string | null;
  savePreference: (key: string, value: any) => Promise<void>;
  saveAllPreferences: (preferences: PreferencesState) => Promise<void>;
  getPreference: (key: string) => Promise<any>;
  deletePreference: (key: string) => Promise<void>;
  getAllPreferences: () => Promise<PreferencesState>;
  clearAllPreferences: () => Promise<void>;
  hasPreference: (key: string) => Promise<boolean>;
  saveVocabularyProgress: (currentIndex: number, totalCards: number, directoryPath: string) => Promise<void>;
  getVocabularyProgress: () => Promise<any>;
  refreshPreferences: () => Promise<void>;
}

export const usePreferences = (): UsePreferencesReturn => {
  const [preferences, setPreferences] = useState<PreferencesState>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all preferences from backend
   */
  const loadAllPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allPrefs = await invoke<PreferencesState>('get_all_preferences');
      setPreferences(allPrefs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save a single preference
   */
  const savePreference = useCallback(async (key: string, value: any) => {
    try {
      setError(null);

      await invoke('save_preference', { key, value });

      // Update local state
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to save preference:', err);
      throw err;
    }
  }, []);

  /**
   * Save all preferences at once (for bulk operations)
   */
  const saveAllPreferences = useCallback(async (newPreferences: PreferencesState) => {
    try {
      setError(null);

      await invoke('save_all_preferences', { preferences: newPreferences });

      // Update local state
      setPreferences(newPreferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to save all preferences:', err);
      throw err;
    }
  }, []);

  /**
   * Get a specific preference
   */
  const getPreference = useCallback(async (key: string) => {
    try {
      setError(null);

      const value = await invoke('get_preference', { key });
      return value;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to get preference:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a preference
   */
  const deletePreference = useCallback(async (key: string) => {
    try {
      setError(null);

      await invoke('delete_preference', { key });

      // Update local state
      setPreferences(prev => {
        const newPrefs = { ...prev };
        delete newPrefs[key];
        return newPrefs;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to delete preference:', err);
      throw err;
    }
  }, []);

  /**
   * Get all preferences
   */
  const getAllPreferences = useCallback(async () => {
    try {
      setError(null);

      const allPrefs = await invoke<PreferencesState>('get_all_preferences');
      setPreferences(allPrefs);
      return allPrefs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to get all preferences:', err);
      throw err;
    }
  }, []);

  /**
   * Clear all preferences
   */
  const clearAllPreferences = useCallback(async () => {
    try {
      setError(null);

      await invoke('clear_all_preferences');

      // Update local state
      setPreferences({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to clear all preferences:', err);
      throw err;
    }
  }, []);

  /**
   * Check if preference exists
   */
  const hasPreference = useCallback(async (key: string) => {
    try {
      setError(null);

      const exists = await invoke<boolean>('has_preference', { key });
      return exists;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to check preference:', err);
      throw err;
    }
  }, []);

  /**
   * Save vocabulary progress
   */
  const saveVocabularyProgress = useCallback(async (currentIndex: number, totalCards: number, directoryPath: string) => {
    try {
      setError(null);

      await invoke('save_vocabulary_progress', {
        currentIndex,
        totalCards,
        directoryPath
      });

      // Update local state
      const progressData = {
        currentIndex,
        totalCards,
        directoryPath,
        lastUpdated: new Date().toISOString()
      };

      setPreferences(prev => ({
        ...prev,
        vocabulary_progress: progressData
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to save vocabulary progress:', err);
      throw err;
    }
  }, []);

  /**
   * Get vocabulary progress
   */
  const getVocabularyProgress = useCallback(async () => {
    try {
      setError(null);

      const progress = await invoke('get_vocabulary_progress');
      return progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to get vocabulary progress:', err);
      throw err;
    }
  }, []);

  /**
   * Refresh preferences from backend
   */
  const refreshPreferences = useCallback(async () => {
    await loadAllPreferences();
  }, [loadAllPreferences]);

  /**
   * Setup event listeners and load initial preferences
   */
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Listen for preferences loaded event
        await listen('preferences-loaded', (event) => {
          const loadedPreferences = event.payload as PreferencesState;
          setPreferences(loadedPreferences);
          setLoading(false);
        });

        // Listen for user data loaded event
        await listen('user-data-loaded', (event) => {
          const userData = event.payload;
          console.log('User data received from backend:', userData);

          if (userData && typeof userData === 'object') {
            setPreferences(prev => ({
              ...prev,
              'user-data': userData
            }));
          }
        });

        // Listen for preference update events
        await listen('preference-updated', (event) => {
          const { key, value } = event.payload as { key: string; value: any };
          setPreferences(prev => ({
            ...prev,
            [key]: value
          }));
        });

        // Listen for preferences cleared event
        await listen('preferences-cleared', () => {
          setPreferences({});
        });

      } catch (err) {
        console.error('Failed to setup event listeners:', err);
      }
    };

    setupEventListeners();

    // Load preferences on component mount
    loadAllPreferences();
  }, [loadAllPreferences]);

  return {
    preferences,
    loading,
    error,
    savePreference,
    saveAllPreferences,
    getPreference,
    deletePreference,
    getAllPreferences,
    clearAllPreferences,
    hasPreference,
    saveVocabularyProgress,
    getVocabularyProgress,
    refreshPreferences
  };
};
