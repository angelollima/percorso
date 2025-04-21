// src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import FileSubmenu from './FileSubmenu';
import EditSubmenu from './EditSubmenu';
import ViewSubmenu from './ViewSubmenu';
import { DirEntryInfo } from '../types';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

interface NavbarProps {
  onEntriesSelected: (entries: DirEntryInfo[]) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onEntriesSelected }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Monitora mudança de estado (maximizado ou não)
  useEffect(() => {
    const unlisten = appWindow.listen('tauri://resize', async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
    // inicializa
    (async () => setIsMaximized(await appWindow.isMaximized()))();
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const handleMouseLeave = () => {
    setActiveMenu(null);
  };

  const onMinimize = () => {
    appWindow.minimize();
  };

  const onMaximizeToggle = async () => {
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
    setIsMaximized(!isMaximized);
  };

  const onClose = () => {
    appWindow.close();
  };

  return (
    <div
      className="flex justify-between items-center bg-[#2d2d2d] h-8 pl-2 border-b border-[#444] relative"
      data-tauri-drag-region
    >
      {/* menu principal */}
      <div className="flex items-center">
        {/* Ícone do GitHub */}
        <div className="mr-4">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
            <path
              fillRule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53
                 5.47 7.59.4.07.55-.17.55-.38
                 0-.19-.01-.82-.01-1.49
                 -2.01.37-2.53-.49-2.69-.94
                 -.09-.23-.48-.94-.82-1.13
                 -.28-.15-.68-.52-.01-.53
                 .63-.01 1.08.58 1.23.82
                 .72 1.21 1.87.87 2.33.66
                 .07-.52.28-.87.51-1.07
                 -1.78-.2-3.64-.89-3.64-3.95
                 0-.87.31-1.59.82-2.15
                 -.08-.2-.36-1.02.08-2.12
                 0 0 .67-.21 2.2.82
                 .64-.18 1.32-.27 2-.27
                 .68 0 1.36.09 2 .27
                 1.53-1.04 2.2-.82 2.2-.82
                 .44 1.1.16 1.92.08 2.12
                 .51.56.82 1.27.82 2.15
                 0 3.07-1.87 3.75-3.65 3.95
                 .29.25.54.73.54 1.48
                 0 1.07-.01 1.93-.01 2.2
                 0 .21.15.46.55.38
                 A8.013 8.013 0 0016 8
                 c0-4.42-3.58-8-8-8"
            />
          </svg>
        </div>
        <ul className="flex list-none">
          {['File', 'Edit', 'View'].map((menu) => (
            <li
              key={menu}
              className={`px-2 text-sm cursor-pointer h-8 flex items-center ${
                activeMenu === menu
                  ? 'bg-[#383838] text-white'
                  : 'text-gray-300 hover:bg-[#383838] hover:text-white'
              }`}
              onClick={() =>
                setActiveMenu(activeMenu === menu ? null : menu)
              }
              onMouseEnter={() => setActiveMenu(menu)}
            >
              {menu}
              {menu === 'File' && activeMenu === 'File' && (
                <FileSubmenu
                  onMouseLeave={handleMouseLeave}
                  onEntriesSelected={onEntriesSelected}
                />
              )}
              {menu === 'Edit' && activeMenu === 'Edit' && (
                <EditSubmenu onMouseLeave={handleMouseLeave} />
              )}
              {menu === 'View' && activeMenu === 'View' && (
                <ViewSubmenu onMouseLeave={handleMouseLeave} />
              )}
            </li>
          ))}
          <li className="px-2 text-sm cursor-pointer h-8 flex items-center text-gray-300 hover:bg-[#383838] hover:text-white">
            Help
          </li>
        </ul>
      </div>

      {/* botões estilo VS Code (sem drag region) */}
      <div className="flex space-x-1" data-tauri-drag-region={false}>
        {/* Minimizar */}
        <button
          onClick={onMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#3e3e3e] rounded-sm"
        >
          <svg width="10" height="10" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>

        {/* Maximizar / Restaurar */}
        <button
          onClick={onMaximizeToggle}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#3e3e3e] rounded-sm"
        >
          {isMaximized ? (
            // ícone de “restaurar”
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="1" y="3" width="6" height="6" />
              <path d="M3 3H9V9" />
            </svg>
          ) : (
            // ícone de “maximizar”
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="1" y="1" width="8" height="8" />
            </svg>
          )}
        </button>

        {/* Fechar */}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#e81123] rounded-sm"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M1 1L9 9M9 1L1 9" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
