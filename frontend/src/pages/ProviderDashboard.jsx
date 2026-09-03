import { useEffect, useState } from "react";
import api from "../api/axios";
import LiveTrackingMap from "../components/LiveTrackingMap.jsx";

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [finalFees, setFinalFees] = useState({});
  const [sharingId, setSharingId] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    api.get("/bookings/received")
      .then((res) => {
        setBookings(res.data);
        setError("");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load bookings");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusUpdate = async (b, status) => {
    try {
      const payload = { status };
      const adjusted = finalFees[b.id];
      const effectiveAmount = adjusted && !isNaN(Number(adjusted)) && Number(adjusted) > 0
        ? Number(adjusted)
        : Number(b.totalAmount || b.estimatedAmount || 100);

      if (status === "COMPLETED") {
        // Send both keys so backend DTO picks whichever it binds to
        payload.finalAmount = effectiveAmount;
        payload.estimatedAmount = effectiveAmount;
        payload.amount = effectiveAmount;
      }

      await api.patch(`/bookings/${b.id}/status`, payload);
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to update status to ${status}`);
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2>Provider Bookings Dashboard</h2>
      {error && <p className="error-box">{error}</p>}
      {bookings.length === 0 ? (
        <p className="muted">No bookings received yet.</p>
      ) : (
        bookings.map((b) => (
          <div key={b.id} className="card" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Booking #{b.id}</h3>
              <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
            </div>
            <p><strong>Customer:</strong> {b.customer?.fullName} ({b.customer?.phone})</p>
            <p><strong>Scheduled At:</strong> {b.scheduledAt?.replace("T", " ")}</p>
            <p><strong>Estimated Hours:</strong> {b.estimatedHours} hrs</p>
            <p><strong>Current Total:</strong> ₹{b.totalAmount || b.estimatedAmount}</p>
            {b.notes && <p className="muted"><strong>Notes:</strong> {b.notes}</p>}
            {b.jobAddress && <p className="muted">📍 <strong>Job location:</strong> {b.jobAddress}</p>}

            <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {(b.status === "CONFIRMED" || b.status === "PENDING") && b.jobLatitude && b.jobLongitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.jobLatitude},${b.jobLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button type="button" className="btn btn-outline">🧭 Get Directions</button>
                </a>
              )}

              {b.status === "PENDING" && (
                <>
                  <button className="btn" onClick={() => handleStatusUpdate(b, "CONFIRMED")}>
                    Accept Booking
                  </button>
                  <button 
                    className="btn" 
                    style={{ background: "#dc2626" }} 
                    onClick={() => handleStatusUpdate(b, "REJECTED")}
                  >
                    Reject
                  </button>
                </>
              )}

              {b.status === "CONFIRMED" && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: sharingId === b.id ? "#4b5563" : "#2563eb" }}
                  onClick={() => setSharingId((prev) => (prev === b.id ? null : b.id))}
                >
                  {sharingId === b.id ? "Stop Sharing Location" : "📡 Share Live Location"}
                </button>
              )}

              {b.status === "CONFIRMED" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    placeholder={`Adjust Fee (₹${b.totalAmount || b.estimatedAmount})`}
                    className="input"
                    style={{ width: "180px", margin: 0 }}
                    value={finalFees[b.id] || ""}
                    onChange={(e) => setFinalFees({ ...finalFees, [b.id]: e.target.value })}
                  />
                  <button className="btn" onClick={() => handleStatusUpdate(b, "COMPLETED")}>
                    Complete & Update Bill
                  </button>
                </div>
              )}
            </div>

            {sharingId === b.id && (
              <div style={{ marginTop: 16 }}>
                <LiveTrackingMap
                  bookingId={b.id}
                  customerLat={b.jobLatitude || b.provider?.latitude}
                  customerLng={b.jobLongitude || b.provider?.longitude}
                  initialProviderLat={b.provider?.latitude}
                  initialProviderLng={b.provider?.longitude}
                  isProvider={true}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}