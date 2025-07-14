// src/components/navigation/SubMenuRenderer.tsx
import React from 'react';
import File from '../submenus/File';
import Edit from '../submenus/Edit';
import View from '../submenus/View';
import Tools from '../submenus/Tools';
import { MenuItemType, DirectoryEntryInfo } from '../../../types/navigation';

interface SubMenuRendererProps {
  menuType: MenuItemType;
  onMenuLeave: () => void;
  onDirectoryEntriesSelected: (entries: DirectoryEntryInfo[], path?: string) => void;
  onPreferencesClick: () => Promise<void>;
}

/**
 * SubMenuRenderer Component
 *
 * Centralized submenu rendering logic that:
 * - Maps menu types to their corresponding submenu components
 * - Provides consistent prop passing to all submenus
 * - Maintains single responsibility for submenu instantiation
 * - Enables easy addition of new menu types
 */
export const SubMenuRenderer: React.FC<SubMenuRendererProps> = ({
  menuType,
  onMenuLeave,
  onDirectoryEntriesSelected,
  onPreferencesClick
}) => {
  const submenuComponents = {
    File: () => (
      <File
        onMouseLeave={onMenuLeave}
        onDirectoryEntriesSelected={onDirectoryEntriesSelected}
      />
    ),
    Edit: () => (
      <Edit onMouseLeave={onMenuLeave} />
    ),
    View: () => (
      <View onMouseLeave={onMenuLeave} />
    ),
    Tools: () => (
      <Tools
        onMouseLeave={onMenuLeave}
        onPreferencesClick={onPreferencesClick}
      />
    )
  };

  const SubmenuComponent = submenuComponents[menuType as keyof typeof submenuComponents];

  return SubmenuComponent ? <SubmenuComponent /> : null;
};
