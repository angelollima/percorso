// src/components/navigation/ApplicationLogo.tsx
import React from 'react';
import { Route } from 'lucide-react';

interface ApplicationLogoProps {
  onNavigateHome: () => void;
}

/**
 * ApplicationLogo Component
 *
 * Displays the application logo with navigation functionality:
 * - Clickable logo that navigates to home page
 * - Accessible with proper ARIA labels
 * - Consistent styling with hover effects
 * - Keyboard navigation support
 */
export const ApplicationLogo: React.FC<ApplicationLogoProps> = ({ onNavigateHome }) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNavigateHome();
    }
  };

  return (
    <div
      className="
        mr-2 cursor-pointer p-1 rounded-sm
        transition-colors duration-150 ease-in-out
        hover:bg-[#3e3e3e]
        focus:outline-none
      "
      onClick={onNavigateHome}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Navigate to home page"
      title="Go to home page"
    >
      <Route size={20} color="white" />
    </div>
  );
};
