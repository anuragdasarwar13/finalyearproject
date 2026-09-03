import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <Link to={user?.role === "PROVIDER" ? "/provider-dashboard" : "/"} className="brand">🔧 Local Service Finder</Link>
      <div>
        {/* Providers don't browse/search other providers - they only manage their own dashboard */}
        {(!user || user.role === "CUSTOMER") && <Link to="/">Search</Link>}
        {user && user.role === "CUSTOMER" && <Link to="/my-bookings">My Bookings</Link>}
        {user && user.role === "PROVIDER" && <Link to="/provider-dashboard">Dashboard</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              logout();
              navigate("/");
            }}
          >
            Logout ({user.fullName})
          </a>
        )}
      </div>
    </div>
  );
}
