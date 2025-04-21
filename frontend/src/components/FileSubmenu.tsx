// src/components/FileSubmenu.tsx
import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { DirEntryInfo, SubmenuItem } from '../types';

interface FileSubmenuProps {
  onMouseLeave: () => void;
  onEntriesSelected: (entries: DirEntryInfo[]) => void;
}

const FileSubmenu: React.FC<FileSubmenuProps> = ({
  onMouseLeave,
  onEntriesSelected,
}) => {
  const handleOpenFolder = async () => {
    try {
      const folder = await open({
        multiple: false,
        directory: true,
      });
      if (typeof folder === 'string') {
        const entries = await invoke<DirEntryInfo[]>('list_dir', {
          path: folder,
        });
        onEntriesSelected(entries);
      }
    } catch (error) {
      console.error('Erro ao listar diretório:', error);
    }
  };

  const submenuItems: SubmenuItem[] = [
    { label: 'Open folder', shortcut: 'Ctrl+N', action: handleOpenFolder },
    { label: 'Add local repository...', shortcut: 'Ctrl+O' },
    { label: 'Clone repository...', shortcut: 'Ctrl+Shift+O' },
    { divider: true },
    { label: 'Options...', shortcut: 'Ctrl+,' },
    { divider: true },
    { label: 'Exit', shortcut: 'Alt+F4' },
  ];

  return (
    <div
      className="absolute top-8 left-11 bg-[#2d2d2d] border border-[#444] min-w-52 z-10 shadow-lg"
      onMouseLeave={onMouseLeave}
    >
      {submenuItems.map((item, index) => {
        // Se for divider, renderiza a linha e sai
        if ('divider' in item && item.divider) {
          return <div key={`divider-${index}`} className="h-px bg-[#444]" />;
        }

        // Aqui TS já infere que item é ActionItem
        return (
          <div
            key={'label' in item ? item.label : `divider-${index}`}
            onClick={'action' in item ? item.action : undefined}
            className="py-1 px-4 m-1 text-sm text-gray-300 flex justify-between items-center hover:bg-[#383838] hover:text-white hover:rounded-md cursor-pointer"
          >
            <span>{'label' in item ? item.label : ''}</span>
            {'shortcut' in item && item.shortcut && (
              <span className="text-gray-500 text-xs ml-4">
                {item.shortcut}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileSubmenu;
