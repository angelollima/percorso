// src/types/navigation.ts

/**
 * Core navigation types for the application
 */

// Directory entry information structure
export interface DirectoryEntryInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;
}

// Submenu item types
export interface SubmenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void | Promise<void>;
  divider?: boolean;
  disabled?: boolean;
}

// Available menu item types
export type MenuItemType = 'File' | 'Edit' | 'View' | 'Tools' | 'Profile' | 'Help';

// Props for the main navigation bar component
export interface NavigationBarProps {
  onDirectoryEntriesSelected: (entries: DirectoryEntryInfo[], path?: string) => void;
}

// Menu configuration structure
export interface MenuConfig {
  id: MenuItemType;
  label: string;
  hasSubmenu: boolean;
  isNavigational?: boolean;
}

// Window state interface
export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
}

// Menu handlers interface for better type safety
export interface MenuHandlers {
  onItemClick: (menuType: MenuItemType) => void;
  onItemHover: (menuType: MenuItemType) => void;
  onMenuLeave: () => void;
  onPreferencesClick: () => Promise<void>;
}
