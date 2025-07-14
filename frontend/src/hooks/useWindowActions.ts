// src/hooks/useWindowActions.ts
import { useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const currentAppWindow = getCurrentWindow();

/**
 * Custom hook for window control actions
 *
 * Provides optimized callbacks for:
 * - Window minimize
 * - Window maximize/restore toggle
 * - Window close
 */
export const useWindowActions = () => {
  const minimize = useCallback(async () => {
    try {
      await currentAppWindow.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }, []);

  const toggleMaximize = useCallback(async () => {
    try {
      const isMaximized = await currentAppWindow.isMaximized();
      if (isMaximized) {
        await currentAppWindow.unmaximize();
      } else {
        await currentAppWindow.maximize();
      }
    } catch (error) {
      console.error('Failed to toggle maximize:', error);
    }
  }, []);

  const close = useCallback(async () => {
    try {
      await currentAppWindow.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }, []);

  return { minimize, toggleMaximize, close };
};
