// src/hooks/usePreferencesWindow.ts
import { useCallback } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Custom hook for managing preferences window
 *
 * Handles:
 * - Opening preferences window
 * - Checking for existing window instance
 * - Focusing existing window if present
 * - Creating new window with proper configuration
 */
export const usePreferencesWindow = () => {
  const openPreferencesWindow = useCallback(async () => {
    try {
      // Check if preferences window already exists
      let existingWindow;
      try {
        existingWindow = await WebviewWindow.getByLabel('preferences');
      } catch (e) {
        existingWindow = null;
      }

      // Focus existing window if found
      if (existingWindow) {
        await existingWindow.setFocus();
        return;
      }

      // Create new preferences window
      const preferencesWindow = new WebviewWindow('preferences', {
        url: 'index.html#/preferences',
        title: 'Preferences',
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        resizable: true,
        maximizable: false,
        decorations: false,
        center: true,
        alwaysOnTop: false,
        skipTaskbar: false,
        titleBarStyle: 'overlay',
      });

      // Handle window creation errors
      preferencesWindow.once('tauri://error', (error) => {
        console.error('Failed to create preferences window:', error);
      });

    } catch (error) {
      console.error('Failed to open preferences window:', error);
    }
  }, []);

  return { openPreferencesWindow };
};
