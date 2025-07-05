// src/components/FileSubmenu.tsx
import React, { useCallback, useMemo } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { DirectoryEntryInfo, SubmenuItem } from '../../types';

interface FileSubmenuProps {
  onMouseLeave: () => void;
  onDirectoryEntriesSelected: (entries: DirectoryEntryInfo[], selectedFolder: string) => void;
}

const FileSubmenu: React.FC<FileSubmenuProps> = ({
  onMouseLeave,
  onDirectoryEntriesSelected,
}) => {
  // Optimized handler for opening and processing a folder
  const handleOpenFolderAction = useCallback(async () => {
    try {
      // Open directory selection dialog
      const selectedFolderPath = await open({
        multiple: false,
        directory: true,
      });

      if (typeof selectedFolderPath === 'string') {
        // Invoke Rust command to list directory contents
        const directoryEntries = await invoke<DirectoryEntryInfo[]>('list_directory_contents', {
          directoryPath: selectedFolderPath,
        });

        // Send entries to parent component
        onDirectoryEntriesSelected(directoryEntries, selectedFolderPath);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  }, [onDirectoryEntriesSelected]);

  // Memoized submenu items definition to prevent recreation on each render
  const fileSubmenuItems: SubmenuItem[] = useMemo(() => [
    {
      label: 'Open folder',
      shortcut: 'Ctrl+N',
      action: handleOpenFolderAction
    },
    {
      label: 'Add local repository...',
      shortcut: 'Ctrl+O'
    },
    {
      label: 'Clone repository...',
      shortcut: 'Ctrl+Shift+O'
    },
    { divider: true }, // Visual separator
    {
      label: 'Options...',
      shortcut: 'Ctrl+,'
    },
    { divider: true },
    {
      label: 'Exit',
      shortcut: 'Alt+F4'
    },
  ], [handleOpenFolderAction]);

  // Optimized menu item renderer
  const renderSubmenuItem = useCallback((submenuItem: SubmenuItem, itemIndex: number) => {
    // Render visual divider
    if ('divider' in submenuItem && submenuItem.divider) {
      return <div key={`separator-${itemIndex}`} className="h-px bg-[#444]" />;
    }

    // Render interactive menu item
    return (
      <div
        key={'label' in submenuItem ? submenuItem.label : `menu-item-${itemIndex}`}
        onClick={'action' in submenuItem ? submenuItem.action : undefined}
        className="py-1 px-4 m-1 text-sm text-gray-300 flex justify-between items-center hover:bg-[#383838] hover:text-white hover:rounded-md cursor-pointer transition-colors"
      >
        {/* Menu item label */}
        <span>{'label' in submenuItem ? submenuItem.label : ''}</span>

        {/* Keyboard shortcut display */}
        {'shortcut' in submenuItem && submenuItem.shortcut && (
          <span className="text-gray-500 text-xs ml-4">
            {submenuItem.shortcut}
          </span>
        )}
      </div>
    );
  }, []);

  return (
    <div
      className="absolute top-8 left-11 bg-[#2d2d2d] border border-[#444] min-w-52 z-10 shadow-lg"
      onMouseLeave={onMouseLeave} // Close submenu when mouse leaves
    >
      {fileSubmenuItems.map(renderSubmenuItem)}
    </div>
  );
};

export default FileSubmenu;
