import React from "react";
import { Home, BarChart3, MessageSquare, Settings, Menu } from "lucide-react";
import { useMobileInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { path: "/messages", icon: MessageSquare, label: "Messages", badge: 3 },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNavigation({
  currentPath,
  onNavigate,
  className,
}: MobileNavigationProps) {
  const { isMobile, hasNotch } = useMobileInfo();

  if (!isMobile) return null;

  return (
    <nav
      className={cn("mobile-nav", hasNotch && "safe-area-bottom", className)}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentPath === item.path;

        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={cn(
              "mobile-nav-item touch-target tap-highlight-none",
              "flex flex-col items-center justify-center gap-1",
              "min-h-[60px] min-w-[60px] px-2 py-1",
              "rounded-lg transition-all duration-200",
              "touch-action-manipulation select-none",
              isActive && "bg-primary-50 text-primary-600",
            )}
            aria-label={item.label}
          >
            <div className="relative flex items-center justify-center">
              <IconComponent
                className={cn(
                  "h-6 w-6 flex-shrink-0",
                  isActive ? "text-primary-600" : "text-gray-500",
                )}
              />
              {item.badge && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium text-center leading-tight",
                "max-w-[48px] truncate",
                isActive ? "text-primary-600" : "text-gray-500",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  onMenuClick,
  rightAction,
  className,
}: MobileHeaderProps) {
  const { isMobile, hasNotch } = useMobileInfo();

  if (!isMobile) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white border-b border-gray-200",
        hasNotch && "safe-area-top",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="touch-target tap-highlight-none p-2 -ml-2 rounded-lg hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>

        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg";
}

export function MobileCard({
  children,
  className,
  onClick,
  padding = "md",
}: MobileCardProps) {
  const { isMobile } = useMobileInfo();

  const paddingClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "mobile-card bg-white rounded-lg shadow-sm border border-gray-200",
        isMobile && paddingClasses[padding],
        onClick &&
          "cursor-pointer tap-highlight-none active:scale-98 transition-transform",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: MobileModalProps) {
  const { isMobile } = useMobileInfo();

  if (!isMobile || !isOpen) return null;

  return (
    <div className="mobile-modal">
      <div className="mobile-modal-header">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="touch-target tap-highlight-none p-2 -mr-2 rounded-lg hover:bg-gray-100"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>✕
        </button>
      </div>

      <div className="mobile-modal-content">{children}</div>

      {actions && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
          <div className="flex gap-3">{actions}</div>
        </div>
      )}
    </div>
  );
}

// Example usage component
export function MobileLayoutExample() {
  const [currentPath, setCurrentPath] = React.useState("/");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <MobileHeader
        title="Dashboard"
        onMenuClick={() => console.log("Menu clicked")}
        rightAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="touch-target tap-highlight-none px-3 py-1 bg-primary-600 text-white rounded-md text-sm font-medium"
          >
            Add
          </button>
        }
      />

      <main className="pb-20 px-4 py-4">
        <div className="space-y-4">
          <MobileCard onClick={() => console.log("Card clicked")}>
            <h3 className="mobile-widget-title">Lead Statistics</h3>
            <p className="mobile-widget-content">
              You have 24 new leads this week
            </p>
          </MobileCard>

          <MobileCard>
            <h3 className="mobile-widget-title">Recent Messages</h3>
            <p className="mobile-widget-content">
              3 unread messages waiting for response
            </p>
          </MobileCard>
        </div>
      </main>

      <MobileNavigation currentPath={currentPath} onNavigate={setCurrentPath} />

      <MobileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Lead"
        actions={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="touch-target flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="touch-target flex-1 px-4 py-2 bg-primary-600 text-white rounded-md font-medium"
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter lead name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </MobileModal>
    </div>
  );
}
