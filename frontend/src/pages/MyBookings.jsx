import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LiveTrackingMap from "../components/LiveTrackingMap";

const statusClass = {
  PENDING: "badge-pending",
  CONFIRMED: "badge-confirmed",
  REJECTED: "badge-rejected",
  COMPLETED: "badge-completed",
  CANCELLED: "badge-cancelled",
};

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [paidBookingIds, setPaidBookingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/my");
      const list = res.data || [];
      setBookings(list);

      // Check payment status for all completed bookings
      const paidSet = new Set();
      await Promise.all(
        list.map(async (b) => {
          if (b.payment?.status === "SUCCESS") {
            paidSet.add(b.id);
          } else {
            try {
              const pRes = await api.get(`/payments/bookings/${b.id}`);
              if (pRes.data && pRes.data.status === "SUCCESS") {
                paidSet.add(b.id);
              }
            } catch {
              // No payment record or not completed yet, ignore
            }
          }
        })
      );
      setPaidBookingIds(paidSet);
    } catch (err) {
      console.error("Failed to load bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    await api.patch(`/bookings/${id}/status`, { status: "CANCELLED" });
    load();
  };

  const toggleTracking = (id) => {
    setActiveTrackingId((prev) => (prev === id ? null : id));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>My Bookings</h1>
      {bookings.length === 0 && <p className="muted">You haven't made any bookings yet.</p>}
      {bookings.map((b) => {
        const isPaid = paidBookingIds.has(b.id) || b.payment?.status === "SUCCESS";
        const displayAmount = b.totalAmount || b.estimatedAmount;

        return (
          <div className="card" key={b.id}>
            <h3>{b.provider?.category?.name || "Service"} — {b.provider?.user?.fullName}</h3>
            <p className="muted">Scheduled: {new Date(b.scheduledAt).toLocaleString()}</p>
            {b.notes && <p>{b.notes}</p>}
            <p>
              <strong>Amount: ₹{displayAmount}</strong>
            </p>
            <span className={`badge ${statusClass[b.status]}`}>{b.status}</span>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {(b.status === "CONFIRMED" || b.status === "IN_PROGRESS") && (
                <button
                  className="btn"
                  style={{ backgroundColor: activeTrackingId === b.id ? "#4b5563" : "#2563eb" }}
                  onClick={() => toggleTracking(b.id)}
                >
                  {activeTrackingId === b.id ? "Hide Map" : "📍 Track Partner"}
                </button>
              )}

              {/* Show Paid badge if settled; else show Pay button */}
              {isPaid ? (
                <span
                  style={{
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    display: "inline-block",
                  }}
                >
                  ✓ Paid (₹{displayAmount})
                </span>
              ) : (
                (b.status === "CONFIRMED" || b.status === "IN_PROGRESS" || b.status === "COMPLETED") && (
                  <Link to={`/payment/${b.id}`}>
                    <button className="btn" style={{ backgroundColor: "#10b981" }}>
                      Pay via UPI (₹{displayAmount})
                    </button>
                  </Link>
                )
              )}

              {(b.status === "PENDING" || b.status === "CONFIRMED") && !isPaid && (
                <button className="btn btn-danger" onClick={() => cancel(b.id)}>
                  Cancel
                </button>
              )}
            </div>

            {activeTrackingId === b.id && (
              <div style={{ marginTop: 16 }}>
                <LiveTrackingMap
                  bookingId={b.id}
                  customerLat={b.jobLatitude || b.provider?.latitude}
                  customerLng={b.jobLongitude || b.provider?.longitude}
                  initialProviderLat={b.provider?.latitude}
                  initialProviderLng={b.provider?.longitude}
                  isProvider={false}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}