import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function ProviderDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [slots, setSlots] = useState([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [notes, setNotes] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [jobLatLng, setJobLatLng] = useState(null);
  const [locBusy, setLocBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFetchError("");
    
    // Fetch provider details with error catching
    api.get(`/providers/${id}`)
      .then((res) => setProvider(res.data))
      .catch((err) => {
        console.error("Provider fetch error:", err);
        setFetchError(err.response?.data?.message || `Failed to load provider details (HTTP ${err.response?.status || "Network Error"})`);
      });

    // Fetch availability slots safely without breaking the main view if empty
    api.get(`/providers/${id}/availability`)
      .then((res) => setSlots(res.data || []))
      .catch((err) => {
        console.warn("Availability slots error or empty:", err);
        setSlots([]);
      });
  }, [id]);

  const bookNow = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "CUSTOMER") {
      setError("Only customer accounts can make bookings.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/bookings", {
        providerId: Number(id),
        scheduledAt,
        notes,
        estimatedHours: Number(estimatedHours),
        jobAddress: jobAddress || undefined,
        jobLatitude: jobLatLng?.lat,
        jobLongitude: jobLatLng?.lng,
      });
      setSuccess(`Booking request sent! Booking #${data.id} is pending provider confirmation.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  // If backend returns an error, render the message instead of hanging on Loading
  if (fetchError) {
    return (
      <div className="card">
        <h2>Unable to load provider</h2>
        <p className="error-box">{fetchError}</p>
        <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: 10 }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!provider) return <p>Loading...</p>;

  const estimatedAmount = (estimatedHours * provider.hourlyRate).toFixed(2);

  return (
    <div>
      <div className="card">
        <h2>{provider.user?.fullName || "Provider"}</h2>
        <p className="muted">{provider.category?.name}</p>
        <p>{provider.bio}</p>
        <p><strong>₹{provider.hourlyRate}/hr</strong> &nbsp;•&nbsp; ⭐ {provider.rating?.toFixed(1) ?? "New"}</p>
        <p className="muted">📍 {provider.address}</p>
        <p>
          {provider.available ? (
            <span className="badge badge-confirmed">Accepting bookings</span>
          ) : (
            <span className="badge badge-rejected">Not accepting bookings right now</span>
          )}
        </p>
      </div>

      {slots.length > 0 && (
        <div className="card">
          <h3>Weekly Availability</h3>
          {DAYS.filter((d) => slots.some((s) => s.dayOfWeek === d)).map((day) => (
            <p key={day} className="muted">
              <strong>{day}:</strong>{" "}
              {slots.filter((s) => s.dayOfWeek === day).map((s) => `${s.startTime}–${s.endTime}`).join(", ")}
            </p>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Book this provider</h3>
        {error && <p className="error-box">{error}</p>}
        {success && <p className="badge badge-confirmed" style={{ display: "block", padding: 10 }}>{success}</p>}
        {!success && (
          <form onSubmit={bookNow}>
            <label>Preferred date & time</label>
            <input
              className="input"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
            <label>Estimated hours needed</label>
            <input
              className="input"
              type="number"
              min="0.5"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              required
            />
            <label>Describe the job</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

            <label>Job location (where the provider should come to)</label>
            <input
              className="input"
              placeholder="e.g. Flat 302, Civil Lines, Wardha"
              value={jobAddress}
              onChange={(e) => setJobAddress(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginBottom: 12 }}
              disabled={locBusy}
              onClick={() => {
                if (!navigator.geolocation) return;
                setLocBusy(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setJobLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocBusy(false);
                  },
                  () => setLocBusy(false)
                );
              }}
            >
              📍 {jobLatLng ? "Location captured ✓" : locBusy ? "Detecting..." : "Use my current location"}
            </button>
            <p className="muted">
              Estimated total: <strong>₹{estimatedAmount}</strong> (final amount confirmed by provider)
            </p>
            <button className="btn" type="submit" disabled={loading || !provider.available}>
              {loading ? "Sending..." : "Request Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}