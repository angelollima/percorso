// src/components/navigation/FolderDisplay.tsx
import React from 'react';

interface FolderDisplayProps {
  currentPath: string;
}

/**
 * FolderDisplay Component
 *
 * Shows the current folder/path in the center of the navigation bar:
 * - VS Code-style centered display
 * - Non-interactive (display only)
 * - Responsive text handling
 * - Semantic HTML structure
 */
export const FolderDisplay: React.FC<FolderDisplayProps> = ({ currentPath }) => {
  return (
    <div
      className="
        absolute left-1/2 transform -translate-x-1/2
        text-sm font-medium text-gray-300
        pointer-events-none select-none
        max-w-xs truncate
      "
      role="status"
      aria-label={`Current path: ${currentPath}`}
    >
      <span className="block truncate">{currentPath}</span>
    </div>
  );
};
