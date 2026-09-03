import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProviderDetails from "./pages/ProviderDetails.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import ProviderDashboard from "./pages/ProviderDashboard.jsx";
import Payment from "./pages/Payment.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Providers only get their dashboard - search/booking pages are customer-only.
function CustomerOnly({ children }) {
  const { user } = useAuth();
  if (user && user.role === "PROVIDER") return <Navigate to="/provider-dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<CustomerOnly><Home /></CustomerOnly>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/providers/:id" element={<CustomerOnly><ProviderDetails /></CustomerOnly>} />
          <Route
            path="/my-bookings"
            element={
              <Protected>
                <MyBookings />
              </Protected>
            }
          />
          <Route
            path="/provider-dashboard"
            element={
              <Protected>
                <ProviderDashboard />
              </Protected>
            }
          />
          <Route
            path="/payment/:bookingId"
            element={
              <Protected>
                <Payment />
              </Protected>
            }
          />
        </Routes>
      </div>
    </>
  );
}
