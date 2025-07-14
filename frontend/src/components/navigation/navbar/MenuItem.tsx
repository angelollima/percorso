// src/components/navigation/MenuItem.tsx
import React from 'react';
import { MenuItemType } from '../../../types/navigation';

interface MenuItemProps {
  menuType: MenuItemType;
  label: string;
  isActive: boolean;
  onClick: (menuType: MenuItemType) => void;
  onHover: (menuType: MenuItemType) => void;
  onLeave: () => void;
  onEnter: () => void;
  hasSubmenu: boolean;
}

/**
 * MenuItem Component
 *
 * A reusable menu item component that handles:
 * - Visual states (active, hover, default)
 * - Keyboard accessibility
 * - Mouse interactions
 * - Consistent styling across all menu items
 */
export const MenuItem: React.FC<MenuItemProps> = ({
  menuType,
  label,
  isActive,
  onClick,
  onHover,
  onLeave,
  onEnter,
  hasSubmenu
}) => {
  const handleClick = () => onClick(menuType);
  const handleMouseEnter = () => {
    onHover(menuType);
    onEnter();
  };
  const handleMouseLeave = () => {
    onLeave();
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(menuType);
    }
  };

  return (
    <button
      className={`
        relative px-2 text-sm cursor-pointer h-8 flex items-center
        transition-colors duration-150 ease-in-out
        ${isActive
          ? 'bg-[#383838] text-white'
          : 'text-gray-300 hover:bg-[#383838] hover:text-white'
        }
        focus:outline-none
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      role="menuitem"
      aria-haspopup={hasSubmenu}
      aria-expanded={hasSubmenu ? isActive : undefined}
      tabIndex={0}
    >
      {label}
    </button>
  );
};
