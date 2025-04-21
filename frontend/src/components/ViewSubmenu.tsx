import React, { useState } from 'react';

interface ViewSubmenuProps {
  onMouseLeave: () => void;
}

interface SubmenuItemProps {
  label: string;
  shortcut?: string;
  hasChild?: boolean;
  checked?: boolean;
  childItems?: Array<{
    label: string;
    divider?: boolean;
    shortcut?: string;
    checked?: boolean;
  }>;
}

const ViewSubmenu: React.FC<ViewSubmenuProps> = ({ onMouseLeave }) => {
  const [activeNestedMenu, setActiveNestedMenu] = useState<string | null>(null);

  const handleNestedMenuEnter = (label: string) => {
    setActiveNestedMenu(label);
  };

  const handleNestedMenuLeave = () => {
    setActiveNestedMenu(null);
  };

  const submenuItems: (SubmenuItemProps | { divider: boolean })[] = [
    { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' },
    { label: 'Open View...' },
    { divider: true },
    {
      label: 'Appearance',
      hasChild: true,
      childItems: [
        { label: 'Full Screen', shortcut: 'F11' },
        { label: 'Zen Mode', shortcut: 'Ctrl+K Z' },
        { label: 'Centered Layout' },
        { divider: true, label: '' },
        { label: 'Menu Bar', checked: true },
        { label: 'Primary Side Bar', checked: true, shortcut: 'Ctrl+B' },
        { label: 'Secondary Side Bar', shortcut: 'Ctrl+Alt+B' },
        { label: 'Status Bar', checked: true },
        { label: 'Panel', checked: true, shortcut: 'Ctrl+J' },
      ],
    },
    {
      label: 'Editor Layout',
      hasChild: true,
      childItems: [
        { label: 'Split Up' },
        { label: 'Split Down' },
        { label: 'Split Left' },
        { label: 'Split Right' },
      ],
    },
    { divider: true },
    { label: 'Zoom In', shortcut: 'Ctrl+=' },
    { label: 'Zoom Out', shortcut: 'Ctrl+-' },
    { label: 'Reset Zoom', shortcut: 'Ctrl+NumPad0' },
  ];

  const renderSubmenuItem = (item: SubmenuItemProps | { divider: boolean }, index: number) => {
    if ('divider' in item) {
      return <div key={`divider-${index}`} className="h-px bg-[#444]"></div>;
    }

    const submenuItem = item as SubmenuItemProps;

    return (
      <div
        key={submenuItem.label}
        className="relative"
        onMouseEnter={() => submenuItem.hasChild && handleNestedMenuEnter(submenuItem.label)}
        onMouseLeave={() => submenuItem.hasChild && handleNestedMenuLeave()}
      >
        <div
          className={`py-1 m-1 px-4 text-sm text-gray-300 flex justify-between items-center hover:bg-[#383838] hover:text-white hover:rounded-md cursor-pointer ${
            submenuItem.hasChild ? 'pr-8' : ''
          }`}
        >
          <div className="flex items-center">
            {submenuItem.checked && <span className="absolute left-2 text-gray-300">✓</span>}
            <span className={submenuItem.checked ? 'ml-3' : ''}>{submenuItem.label}</span>
          </div>
          <div className="flex items-center">
            {submenuItem.shortcut && (
              <span className="text-gray-500 text-xs ml-4">{submenuItem.shortcut}</span>
            )}
            {submenuItem.hasChild && <span className="absolute right-4 text-gray-500">›</span>}
          </div>
        </div>

        {submenuItem.hasChild && activeNestedMenu === submenuItem.label && (
          <div className="absolute top-0 left-[calc(100%)] bg-[#2d2d2d] border border-[#444] min-w-52 shadow-lg z-20">
            {submenuItem.childItems?.map((childItem, childIndex) =>
              'divider' in childItem ? (
                <div
                  key={`child-divider-${childIndex}`}
                  className="h-px bg-[#444]"
                ></div>
              ) : (
                <div
                  key={childItem.label}
                  className="py-1 px-4 m-1 text-sm text-gray-300 flex justify-between items-center hover:bg-[#383838] hover:text-white hover:rounded-md cursor-pointer relative"
                >
                  <div className="flex items-center">
                    {childItem.checked && (
                      <span className="absolute left-2 text-gray-300">✓</span>
                    )}
                    <span className={childItem.checked ? 'ml-3' : ''}>{childItem.label}</span>
                  </div>
                  {childItem.shortcut && (
                    <span className="text-gray-500 text-xs ml-4">{childItem.shortcut}</span>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute top-8 left-30 bg-[#2d2d2d] border border-[#444] min-w-52 z-10 shadow-lg max-h-96 overflow-visible"
      onMouseLeave={onMouseLeave}
    >
      {submenuItems.map((item, index) => renderSubmenuItem(item, index))}
    </div>
  );
};

export default ViewSubmenu;
