// src/components/navigation/MenuList.tsx
import React, { useRef, useCallback } from 'react';
import { MenuItem } from './MenuItem';
import { SubMenuRenderer } from './SubMenuRenderer';
import { MenuItemType, DirectoryEntryInfo } from '../../../types/navigation';

// Configuration for menu items - easily extendable
const MENU_CONFIGURATION = [
  { id: 'File' as const, label: 'File', hasSubmenu: true },
  { id: 'Edit' as const, label: 'Edit', hasSubmenu: true },
  { id: 'View' as const, label: 'View', hasSubmenu: true },
  { id: 'Tools' as const, label: 'Tools', hasSubmenu: true },
  { id: 'Profile' as const, label: 'Profile', hasSubmenu: false },
  { id: 'Help' as const, label: 'Help', hasSubmenu: false }
] as const;

interface MenuListProps {
  activeMenuType: MenuItemType | null;
  onItemClick: (menuType: MenuItemType) => void;
  onItemHover: (menuType: MenuItemType) => void;
  onMenuLeave: () => void;
  onDirectoryEntriesSelected: (entries: DirectoryEntryInfo[], path?: string) => void;
  onPreferencesClick: () => Promise<void>;
}

/**
 * MenuList Component
 *
 * Renders the main navigation menu with the following features:
 * - Dynamic menu item rendering based on configuration
 * - Submenu management and positioning
 * - Hover and click interactions
 * - Accessible keyboard navigation support
 */
export const MenuList: React.FC<MenuListProps> = ({
  activeMenuType,
  onItemClick,
  onItemHover,
  onMenuLeave,
  onDirectoryEntriesSelected,
  onPreferencesClick
}) => {
  const menuTimeoutRef = useRef<number | null>(null);

  const handleMenuMouseLeave = useCallback(() => {
    // Usar timeout para permitir transição suave para o submenu
    menuTimeoutRef.current = setTimeout(() => {
      onMenuLeave();
    }, 150);
  }, [onMenuLeave]);

  const handleMenuMouseEnter = useCallback(() => {
    // Cancelar timeout se o mouse voltar para o menu
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  }, []);

  const handleSubmenuMouseEnter = useCallback(() => {
    // Cancelar timeout quando o mouse entra no submenu
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  }, []);

  return (
    <ul className="flex list-none" role="menubar">
      {MENU_CONFIGURATION.map((menuConfig) => (
        <li key={menuConfig.id} className="relative">
          <MenuItem
            menuType={menuConfig.id}
            label={menuConfig.label}
            isActive={activeMenuType === menuConfig.id}
            onClick={onItemClick}
            onHover={onItemHover}
            onLeave={handleMenuMouseLeave}
            onEnter={handleMenuMouseEnter}
            hasSubmenu={menuConfig.hasSubmenu}
          />

          {/* Render submenu when active */}
          {activeMenuType === menuConfig.id && menuConfig.hasSubmenu && (
            <div
              className="absolute left-0 top-0 z-50"
              onMouseEnter={handleSubmenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
            >
              <SubMenuRenderer
                menuType={menuConfig.id}
                onMenuLeave={onMenuLeave}
                onDirectoryEntriesSelected={onDirectoryEntriesSelected}
                onPreferencesClick={onPreferencesClick}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};
