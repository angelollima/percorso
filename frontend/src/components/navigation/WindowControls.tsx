// src/components/navigation/WindowControls.tsx
import React from 'react';
import { Minus, Maximize2, Minimize2, X } from 'lucide-react';
import { useWindowActions } from '../../hooks/useWindowActions';

interface WindowControlsProps {
  isMaximized: boolean;
}

/**
 * WindowControls Component
 *
 * Provides VS Code-style window control buttons:
 * - Minimize: Reduces window to taskbar
 * - Maximize/Restore: Toggles between maximized and normal states
 * - Close: Terminates the application
 *
 * Features:
 * - Accessible button labels
 * - Hover effects with smooth transitions
 * - Keyboard navigation support
 * - Visual feedback for different states
 */
export const WindowControls: React.FC<WindowControlsProps> = ({ isMaximized }) => {
  const { minimize, toggleMaximize, close } = useWindowActions();

  const controlButtons = [
    {
      action: minimize,
      icon: <Minus size={14} />,
      label: 'Minimize window',
      hoverClass: 'hover:bg-[#3e3e3e]'
    },
    {
      action: toggleMaximize,
      icon: isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />,
      label: isMaximized ? 'Restore window' : 'Maximize window',
      hoverClass: 'hover:bg-[#3e3e3e]'
    },
    {
      action: close,
      icon: <X size={14} />,
      label: 'Close window',
      hoverClass: 'hover:bg-[#e81123]'
    }
  ];

  return (
    <div className="flex space-x-1" data-tauri-drag-region={false}>
      {controlButtons.map((button, index) => (
        <button
          key={index}
          onClick={button.action}
          className={`
            w-8 h-8 flex items-center justify-center rounded-sm
            transition-colors duration-150 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
            ${button.hoverClass}
          `}
          aria-label={button.label}
          title={button.label}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
};
