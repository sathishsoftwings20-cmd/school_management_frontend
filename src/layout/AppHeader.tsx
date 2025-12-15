// src/layout/AppHeader.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // use react-router-dom
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { useAuth } from "../context/AuthContext";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => setApplicationMenuOpen((s) => !s);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // optional: ensure logout cleans state and navigates to signin
  const handleLogout = async () => {
    try {
      await logout(); // assume this clears token/user in context
      navigate("/signin");
    } catch (err) {
      // optionally show an error toast
      console.error("Logout failed", err);
      navigate("/signin");
    }
  };

  return (
    <header className="sticky top-0 z-[99999] bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between px-3 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            aria-label="Toggle sidebar"
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg lg:h-11 lg:w-11 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isMobileOpen ? (
              /* an example X icon */
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6.22 6.22L17.78 17.78"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M17.78 6.22L6.22 17.78"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              /* hamburger icon */
              <svg
                width="20"
                height="12"
                viewBox="0 0 20 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M0 1h20M0 6h20M0 11h20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          {/* mobile logo */}
          <Link to="/" className="lg:hidden">
            <img
              src="/images/logo/logo.svg"
              alt="Logo"
              className="h-8 dark:hidden"
            />
            <img
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              className="hidden h-8 dark:block"
            />
          </Link>

          {/* mobile app menu toggle */}
          <button
            onClick={toggleApplicationMenu}
            aria-expanded={isApplicationMenuOpen}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg lg:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {/* grid/dots icon
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M6 6h.01M10 6h.01M14 6h.01M6 10h.01M10 10h.01M14 10h.01M6 14h.01M10 14h.01M14 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg> */}
          </button>
        </div>

        {/* right side: theme, notifications, user area */}
        <div className="flex items-center gap-2">
          {/* <ThemeToggleButton /> */}
          {/* <NotificationDropdown /> */}

          {/* optional logout button visible separately (or put it inside UserDropdown) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Logout"
              >
                Logout
              </button>
            )} */}
            <UserDropdown />
          </div>

          {/* mobile/user area when collapsed */}
          <div className="lg:hidden">
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* mobile application menu area (toggleable) */}
      <div
        className={`${
          isApplicationMenuOpen ? "block" : "hidden"
        } lg:hidden border-t border-gray-100 dark:border-gray-800`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <ThemeToggleButton />
          <NotificationDropdown />
          {/* show logout for mobile as well */}
          {user && (
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
