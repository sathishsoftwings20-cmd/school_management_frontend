// src/components/user/UserDropdown.tsx
import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link } from "react-router-dom";
import authApi from "../../api/auth.api";
import { useNavigate } from "react-router-dom";
import type { User } from "../../api/user.api";
const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  function toggleDropdown() {
    setIsOpen((s) => !s);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Fetch current user
  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      try {
        const data = await authApi.getCurrentUser();
        if (cancelled) return;
        setUser(data); // data is User | null
      } catch (err) {
        console.error("Failed to fetch user info", err);
        if (!cancelled) setUser(null);
      }
    }
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await authApi.logout();
      navigate("/signin");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <img
            src={
              user?.avatar
                ? `${BACKEND_URL}/${user.avatar}`
                : "/images/default-avatar.png"
            }
            alt="User"
          />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">
          {user?.fullName ?? "Loading..."}
        </span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {user?.fullName ?? "Loading..."}
          </span>

          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {user?.email ?? "Loading..."}
          </span>
        </div>

        <Link
          to="/signin"
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 dark:hover:bg-white/5"
          onClick={handleLogout}
        >
          Sign out
        </Link>
      </Dropdown>
    </div>
  );
}
