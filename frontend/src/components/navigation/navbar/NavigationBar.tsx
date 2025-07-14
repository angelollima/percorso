// src/components/navigation/NavigationBar.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { MenuList } from './MenuList';
import { WindowControls } from '../WindowControls';
import { ApplicationLogo } from '../ApplicationLogo';
import { FolderDisplay } from '../FolderDisplay';
import { useWindowState } from '../../../hooks/useWindowState';
import { usePreferencesWindow } from '../../../hooks/usePreferencesWindow';
import { MenuItemType, NavigationBarProps } from '../../../types/navigation';

/**
 * NavigationBar Component
 *
 * A VS Code-style navigation bar that provides:
 * - Application logo and navigation
 * - Main menu system (File, Edit, View, Tools, Profile)
 * - Current folder display
 * - Window controls (minimize, maximize, close)
 *
 * This component follows a clear separation of concerns:
 * 1. State management (menu active state, window state)
 * 2. Event handling (menu interactions, window controls)
 * 3. Rendering logic (organized into specialized sub-components)
 */
const NavigationBar: React.FC<NavigationBarProps> = ({
  onDirectoryEntriesSelected
}) => {
  // ========================================
  // State Management
  // ========================================
  const [activeMenuType, setActiveMenuType] = useState<MenuItemType | null>(null);

  // ========================================
  // Custom Hooks for Complex Logic
  // ========================================
  const { isMaximized } = useWindowState();
  const { openPreferencesWindow } = usePreferencesWindow();
  const navigate = useNavigate();

  // ========================================
  // Event Handlers - Menu Interactions
  // ========================================
  const menuHandlers = {
    onItemClick: useCallback((menuType: MenuItemType) => {
      if (menuType === 'Profile') {
        navigate('/profile');
        setActiveMenuType(null);
        return;
      }

      setActiveMenuType(current =>
        current === menuType ? null : menuType
      );
    }, [navigate]),

    onItemHover: useCallback((menuType: MenuItemType) => {
      if (menuType !== 'Profile') {
        setActiveMenuType(menuType);
      }
    }, []),

    onMenuLeave: useCallback(() => {
      setActiveMenuType(null);
    }, []),

    onPreferencesClick: useCallback(async () => {
      await openPreferencesWindow();
      setActiveMenuType(null);
    }, [openPreferencesWindow])
  };

  // ========================================
  // Render Logic
  // ========================================
  return (
    <nav
      className="flex justify-between items-center bg-[#2d2d2d] h-8 pl-2 border-b border-[#444] relative"
      data-tauri-drag-region
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left Section: Brand and Navigation */}
      <div className="flex items-center">
        <ApplicationLogo onNavigateHome={() => navigate('/')} />

        <MenuList
          activeMenuType={activeMenuType}
          onItemClick={menuHandlers.onItemClick}
          onItemHover={menuHandlers.onItemHover}
          onMenuLeave={menuHandlers.onMenuLeave}
          onDirectoryEntriesSelected={onDirectoryEntriesSelected}
          onPreferencesClick={menuHandlers.onPreferencesClick}
        />

        <FolderDisplay currentPath="Percorso" />
      </div>

      {/* Right Section: Window Controls */}
      <WindowControls isMaximized={isMaximized} />
    </nav>
  );
};

export default NavigationBar;
