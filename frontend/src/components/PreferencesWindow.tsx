// src/components/PreferencesWindow.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Route, Minus, Maximize2, Minimize2, X, Save, RotateCcw } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePreferences } from '../hooks/usePreferences';

const currentWindow = getCurrentWindow();

const PreferencesWindow: React.FC = () => {
  const { preferences, loading, error, saveAllPreferences, refreshPreferences } = usePreferences();
  const [jsonContent, setJsonContent] = useState<string>('');
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Initialize window state and event listeners
   */
  useEffect(() => {
    const initializeWindow = async () => {
      try {
        setIsWindowMaximized(await currentWindow.isMaximized());

        const unlisten = await currentWindow.listen('tauri://resize', async () => {
          setIsWindowMaximized(await currentWindow.isMaximized());
        });

        return () => unlisten();
      } catch (err) {
        console.error('Failed to initialize window:', err);
      }
    };

    initializeWindow();
  }, []);

  /**
   * Update JSON content when preferences change
   */
  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
      const formattedJson = JSON.stringify(preferences, null, 2);
      setJsonContent(formattedJson);
      setHasUnsavedChanges(false);
      setJsonError(null);
    } else if (!loading) {
      setJsonContent('{}');
      setHasUnsavedChanges(false);
      setJsonError(null);
    }
  }, [preferences, loading]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }

      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jsonContent]);

  /**
   * Window control handlers
   */
  const handleWindowMinimize = useCallback(() => {
    currentWindow.minimize();
  }, []);

  const handleWindowMaximizeToggle = useCallback(async () => {
    try {
      if (isWindowMaximized) {
        await currentWindow.unmaximize();
      } else {
        await currentWindow.maximize();
      }
      setIsWindowMaximized(!isWindowMaximized);
    } catch (err) {
      console.error('Failed to toggle window maximize:', err);
    }
  }, [isWindowMaximized]);

  const handleWindowClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!shouldClose) return;
    }
    currentWindow.close();
  }, [hasUnsavedChanges]);

  /**
   * Handle JSON content changes
   */
  const handleJsonChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setJsonContent(newContent);
    setHasUnsavedChanges(true);

    // Validate JSON syntax
    try {
      JSON.parse(newContent);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax');
    }
  }, []);

  /**
   * Save preferences to backend
   */
  const handleSave = useCallback(async () => {
    if (isSaving || jsonError) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');

      // Parse and validate JSON
      const parsedPreferences = JSON.parse(jsonContent);

      // Save to backend
      await saveAllPreferences(parsedPreferences);

      setHasUnsavedChanges(false);
      setSaveStatus('saved');

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);

    } catch (err) {
      console.error('Failed to save preferences:', err);
      setSaveStatus('error');
      setJsonError(err instanceof Error ? err.message : 'Failed to save preferences');

      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [jsonContent, isSaving, jsonError, saveAllPreferences]);

  /**
   * Reset changes to last saved state
   */
  const handleReset = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldReset = window.confirm('Are you sure you want to discard all changes?');
      if (!shouldReset) return;
    }

    const formattedJson = JSON.stringify(preferences, null, 2);
    setJsonContent(formattedJson);
    setHasUnsavedChanges(false);
    setJsonError(null);
  }, [preferences, hasUnsavedChanges]);

  /**
   * Refresh preferences from backend
   */
  const handleRefresh = useCallback(async () => {
    try {
      await refreshPreferences();
    } catch (err) {
      console.error('Failed to refresh preferences:', err);
    }
  }, [refreshPreferences]);

  /**
   * Get status indicator color
   */
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving': return 'text-yellow-400';
      case 'saved': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved successfully';
      case 'error': return 'Save failed';
      default: return hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved';
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* Title Bar */}
      <div
        className="flex justify-between items-center bg-[#2d2d2d] h-8 pl-2 border-b border-[#444]"
        data-tauri-drag-region
      >
        {/* Left: App Icon and Title */}
        <div className="flex items-center space-x-2">
          <Route size={18} color="white" />
          <span className="text-sm text-gray-300 font-medium select-none">
            Preferences {hasUnsavedChanges && '• (Modified)'}
          </span>
        </div>

        {/* Right: Window Controls */}
        <div className="flex space-x-1" data-tauri-drag-region={false}>
          <button
            onClick={handleWindowMinimize}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#3e3e3e] rounded-sm transition-colors"
            aria-label="Minimize window"
          >
            <Minus size={14} />
          </button>

          <button
            onClick={handleWindowMaximizeToggle}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#3e3e3e] rounded-sm transition-colors"
            aria-label={isWindowMaximized ? 'Restore window' : 'Maximize window'}
          >
            {isWindowMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            onClick={handleWindowClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#e81123] rounded-sm transition-colors"
            aria-label="Close window"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-2 border-b border-[#444]">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !!jsonError || !hasUnsavedChanges}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            <span>Save (Ctrl+S)</span>
          </button>

          <button
            onClick={handleReset}
            disabled={!hasUnsavedChanges}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={14} />
            <span>Reset (Ctrl+Z)</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Error Display */}
      {(error || jsonError) && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 text-sm">
          <strong>Error:</strong> {error || jsonError}
        </div>
      )}

      {/* JSON Editor */}
      <div className="flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={jsonContent}
          onChange={handleJsonChange}
          className="flex-1 bg-[#1e1e1e] text-white font-mono text-sm p-4 resize-none outline-none border-none"
          placeholder="Loading preferences..."
          spellCheck={false}
          style={{
            tabSize: 2,
            lineHeight: '1.5',
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-1 border-t border-[#444] text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>JSON</span>
          <span>UTF-8</span>
          {jsonError && (
            <span className="text-red-400">
              Syntax Error
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span>Lines: {jsonContent.split('\n').length}</span>
          <span>Characters: {jsonContent.length}</span>
        </div>
      </div>
    </div>
  );
};

export default PreferencesWindow;
