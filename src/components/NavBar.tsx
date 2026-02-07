import { Link, useLocation } from "react-router-dom";

interface NavBarProps {
  username: string;
  onLogout: () => void;
}

export function NavBar({ username, onLogout }: NavBarProps) {
  const location = useLocation();

  function navLink(to: string, label: string) {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          active
            ? "bg-gray-900 text-white"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <span className="text-white font-bold text-lg">Aftok</span>
            {navLink("/overview", "Overview")}
            {navLink("/timeline", "Timeline")}
            {navLink("/billing", "Billing")}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm">{username}</span>
            <button
              onClick={onLogout}
              className="text-gray-300 hover:text-white text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
