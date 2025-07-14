// src/hooks/useWindowState.ts
import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const currentAppWindow = getCurrentWindow();

/**
 * Custom hook for managing window state
 *
 * Provides:
 * - Current maximized state
 * - Automatic state updates on window resize
 * - Proper cleanup of event listeners
 */
export const useWindowState = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const initializeWindowState = async () => {
      try {
        // Set initial state
        setIsMaximized(await currentAppWindow.isMaximized());

        // Listen for window resize events
        removeListener = await currentAppWindow.listen('tauri://resize', async () => {
          setIsMaximized(await currentAppWindow.isMaximized());
        });
      } catch (error) {
        console.error('Failed to initialize window state:', error);
      }
    };

    initializeWindowState();

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, []);

  return { isMaximized };
};
