import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const showBackButton = ["/signup", "/login", "/forgot-password", "/about"].includes(location.pathname);

  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center relative">
      {/* Left side: Back button + Logo */}
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <Link
            to="/"
            className="flex items-center px-4 py-1 border border-white rounded-full 
                       text-white hover:bg-white hover:text-blue-900 transition"
          >
            ← Back
          </Link>
        )}
        <span className="font-bold text-lg">Capstone Hub</span>
      </div>

      {/* Right side: Links (always visible) */}
      <div className="space-x-6">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/login" className="hover:text-gray-300">Login</Link>
        <Link to="/about" className="hover:text-gray-300">About</Link>
        <Link
          to="/signup"
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md transition"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
