// src/components/Navbar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Maximize2, Minimize2, X, Route } from 'lucide-react';
import FileSubmenu from './FileSubmenu';
import EditSubmenu from './EditSubmenu';
import ViewSubmenu from './ViewSubmenu';
import { DirectoryEntryInfo } from '../../types';
import { getCurrentWindow } from '@tauri-apps/api/window';

// Get current window reference once to avoid repeated calls
const currentAppWindow = getCurrentWindow();

// Define props interface for the Navbar component
interface NavigationBarProps {
  onDirectoryEntriesSelected: (entries: DirectoryEntryInfo[], folderPath?: string) => void;
  selectedDirectoryPath?: string;
}

// Available menu items - extracted to prevent recreation on each render
const AVAILABLE_MENU_ITEMS = ['File', 'Edit', 'View'] as const;
type MenuItemType = typeof AVAILABLE_MENU_ITEMS[number];

const NavigationBar: React.FC<NavigationBarProps> = ({
  onDirectoryEntriesSelected,
  selectedDirectoryPath
}) => {
  // State to control which menu is currently active (null = none)
  const [activeMenuType, setActiveMenuType] = useState<MenuItemType | null>(null);
  // State to control whether the window is maximized
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);

  // Effect to monitor window state changes (maximized/restored)
  useEffect(() => {
    let removeWindowListener: (() => void) | null = null;

    const setupWindowStateListener = async () => {
      // Setup listener for resize events
      removeWindowListener = await currentAppWindow.listen('tauri://resize', async () => {
        setIsWindowMaximized(await currentAppWindow.isMaximized());
      });

      // Initialize current window state
      setIsWindowMaximized(await currentAppWindow.isMaximized());
    };

    setupWindowStateListener();

    // Cleanup: remove listener when component unmounts
    return () => {
      if (removeWindowListener) {
        removeWindowListener();
      }
    };
  }, []);

  // Optimized callback to close menus when mouse leaves the area
  const handleMenuMouseLeave = useCallback(() => {
    setActiveMenuType(null);
  }, []);

  // Window control button handlers
  const handleWindowMinimize = useCallback(() => {
    currentAppWindow.minimize();
  }, []);

  const handleWindowMaximizeToggle = useCallback(async () => {
    if (isWindowMaximized) {
      await currentAppWindow.unmaximize();
    } else {
      await currentAppWindow.maximize();
    }
    // Update local state immediately for better user experience
    setIsWindowMaximized(!isWindowMaximized);
  }, [isWindowMaximized]);

  const handleWindowClose = useCallback(() => {
    currentAppWindow.close();
  }, []);

  // Optimized handler for menu item clicks
  const handleMenuItemClick = useCallback((menuType: MenuItemType) => {
    setActiveMenuType(currentActiveMenu => currentActiveMenu === menuType ? null : menuType);
  }, []);

  // Optimized handler for menu item hover
  const handleMenuItemHover = useCallback((menuType: MenuItemType) => {
    setActiveMenuType(menuType);
  }, []);

  // Extract folder name from full path
  const extractFolderNameFromPath = useCallback((fullPath: string): string => {
    if (!fullPath) return '';
    return fullPath.split(/[/\\]/).pop() || '';
  }, []);

  // Render appropriate submenu based on active menu
  const renderActiveSubmenu = (menuType: MenuItemType) => {
    switch (menuType) {
      case 'File':
        return (
          <FileSubmenu
            onMouseLeave={handleMenuMouseLeave}
            onDirectoryEntriesSelected={onDirectoryEntriesSelected}
          />
        );
      case 'Edit':
        return <EditSubmenu onMouseLeave={handleMenuMouseLeave} />;
      case 'View':
        return <ViewSubmenu onMouseLeave={handleMenuMouseLeave} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="flex justify-between items-center bg-[#2d2d2d] h-8 pl-2 border-b border-[#444] relative"
      data-tauri-drag-region // Allows dragging the window by this area
    >
      {/* Left section: Logo, main menu, and folder name */}
      <div className="flex items-center">
        {/* Application logo */}
        <div className="mr-4">
          <Route size={20} color="white" />
        </div>

        {/* Main menu items list */}
        <ul className="flex list-none">
          {AVAILABLE_MENU_ITEMS.map((menuItem) => (
            <li
              key={menuItem}
              className={`px-2 text-sm cursor-pointer h-8 flex items-center ${
                activeMenuType === menuItem
                  ? 'bg-[#383838] text-white' // Active menu styling
                  : 'text-gray-300 hover:bg-[#383838] hover:text-white' // Inactive menu styling
              }`}
              onClick={() => handleMenuItemClick(menuItem)}
              onMouseEnter={() => handleMenuItemHover(menuItem)}
            >
              {menuItem}
              {/* Render submenu if this menu is active */}
              {activeMenuType === menuItem && renderActiveSubmenu(menuItem)}
            </li>
          ))}

          {/* Help menu (no submenu implemented yet) */}
          <li className="px-2 text-sm cursor-pointer h-8 flex items-center text-gray-300 hover:bg-[#383838] hover:text-white">
            Help
          </li>
        </ul>

        {/* Selected folder name display (VS Code style) */}
        {selectedDirectoryPath && (
          <div className="absolute left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-300 pointer-events-none select-none">
            {extractFolderNameFromPath(selectedDirectoryPath)}
          </div>
        )}
      </div>

      {/* Right section: Window control buttons (VS Code style) */}
      <div className="flex space-x-1" data-tauri-drag-region={false}>
        {/* Minimize button */}
        <button
          onClick={handleWindowMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#3e3e3e] rounded-sm transition-colors"
          aria-label="Minimize window"
        >
          <Minus size={14} />
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={handleWindowMaximizeToggle}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#3e3e3e] rounded-sm transition-colors"
          aria-label={isWindowMaximized ? "Restore window" : "Maximize window"}
        >
          {isWindowMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Close button */}
        <button
          onClick={handleWindowClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-[#e81123] rounded-sm transition-colors"
          aria-label="Close window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default NavigationBar;
