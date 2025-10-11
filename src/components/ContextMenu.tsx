import { Fragment, ReactNode } from "react";
import { Menu, Transition } from "@headlessui/react";

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  trigger: ReactNode;
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

export function ContextMenu({ items, trigger, position = 'bottom-start' }: ContextMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as="div" className="cursor-context-menu">
        {trigger}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={`absolute z-50 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
          position === 'bottom-start' ? 'left-0 mt-2' :
          position === 'bottom-end' ? 'right-0 mt-2' :
          position === 'top-start' ? 'left-0 bottom-full mb-2' :
          'right-0 bottom-full mb-2'
        }`}>
          <div className="py-1">
            {items.map((item, index) => (
              <Fragment key={index}>
                {item.divider && index > 0 && (
                  <div className="border-t border-gray-100 my-1" />
                )}
                <Menu.Item disabled={item.disabled}>
                  {({ active }) => (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!item.disabled) {
                          item.onClick();
                        }
                      }}
                      className={`${
                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                      } ${
                        item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        item.className || ''
                      } group flex w-full items-center px-4 py-2 text-sm transition-colors`}
                      disabled={item.disabled}
                    >
                      {item.icon && (
                        <span className="mr-3 flex-shrink-0">
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              </Fragment>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Hook for right-click context menu
import { useState, useEffect, useRef, useCallback } from "react";

interface Position {
  x: number;
  y: number;
}

interface UseRightClickMenuReturn {
  isVisible: boolean;
  position: Position;
  show: (event: React.MouseEvent) => void;
  hide: () => void;
}

export function useRightClickMenu(): UseRightClickMenuReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const show = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = event;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 192; // w-48 = 12rem = 192px
    const menuHeight = 200; // estimated height

    // Adjust position to keep menu in viewport
    const x = clientX + menuWidth > windowWidth ? clientX - menuWidth : clientX;
    const y = clientY + menuHeight > windowHeight ? clientY - menuHeight : clientY;

    setPosition({ x, y });
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hide();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hide();
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('contextmenu', hide);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', hide);
    };
  }, [isVisible, hide]);

  return { isVisible, position, show, hide };
}

// Right-click context menu component
interface RightClickMenuProps {
  items: ContextMenuItem[];
  children: ReactNode;
  className?: string;
}

export function RightClickMenu({ items, children, className = '' }: RightClickMenuProps) {
  const { isVisible, position, show, hide } = useRightClickMenu();

  return (
    <>
      <div
        onContextMenu={show}
        className={`${className}`}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="fixed inset-0 z-50"
          onClick={hide}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="absolute bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none w-48"
            style={{ left: position.x, top: position.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {items.map((item, index) => (
                <Fragment key={index}>
                  {item.divider && index > 0 && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!item.disabled) {
                        item.onClick();
                        hide();
                      }
                    }}
                    className={`${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    } ${
                      item.className || ''
                    } group flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors`}
                    disabled={item.disabled}
                  >
                    {item.icon && (
                      <span className="mr-3 flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}