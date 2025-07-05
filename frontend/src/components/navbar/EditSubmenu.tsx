import React from 'react';

interface EditSubmenuProps {
  onMouseLeave: () => void;
}

const EditSubmenu: React.FC<EditSubmenuProps> = ({ onMouseLeave }) => {
  const submenuItems = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y' },
    { divider: true },
    { label: 'Cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', shortcut: 'Ctrl+V' },
    { divider: true },
    { label: 'Find', shortcut: 'Ctrl+F' },
    { label: 'Replace', shortcut: 'Ctrl+H' },
    { divider: true },
    { label: 'Find in Files', shortcut: 'Ctrl+Shift+F' },
    { label: 'Replace in Files', shortcut: 'Ctrl+Shift+H' },
    { divider: true },
    { label: 'Toggle Line Comment', shortcut: 'Ctrl+;' },
    { label: 'Toggle Block Comment', shortcut: 'Shift+Alt+A' },
    { label: 'Emmet: Expand Abbreviation', shortcut: 'Tab' }
  ];

  return (
    <div
      className="absolute top-8 left-20 bg-[#2d2d2d] border border-[#444] min-w-52 z-10 shadow-lg"
      onMouseLeave={onMouseLeave}
    >
      {submenuItems.map((item, index) => (
        item.divider ? (
          <div key={`divider-${index}`} className="h-px bg-[#444]"></div>
        ) : (
          <div
            key={item.label}
            className="py-1 px-4 m-1 text-sm text-gray-300 flex justify-between items-center hover:bg-[#383838] hover:text-white hover:rounded-md cursor-pointer"
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-gray-500 text-xs ml-4">{item.shortcut}</span>}
          </div>
        )
      ))}
    </div>
  );
};

export default EditSubmenu;
