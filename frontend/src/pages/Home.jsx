import { useEffect, useState } from "react";
import api from "../api/axios";
import ProviderCard from "../components/ProviderCard.jsx";

export default function Home() {
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser. Enter coordinates manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError("Location permission denied. Enter coordinates manually below.")
    );
  };

  const search = async () => {
    if (!location) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get("/providers/search", {
        params: {
          lat: location.lat,
          lng: location.lng,
          radiusKm,
          categoryId: categoryId || undefined,
        },
      });
      setProviders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Find service providers near you</h1>
      <div className="card">
        {locError && <p className="error-box">{locError}</p>}

        {location ? (
          <p className="muted">
            📍 Using location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); detectLocation(); }}>refresh</a>
          </p>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Latitude"
              type="number"
              onChange={(e) =>
                setLocation((l) => ({ ...(l || { lng: 0 }), lat: parseFloat(e.target.value) }))
              }
            />
            <input
              className="input"
              placeholder="Longitude"
              type="number"
              onChange={(e) =>
                setLocation((l) => ({ ...(l || { lat: 0 }), lng: parseFloat(e.target.value) }))
              }
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label>Radius: {radiusKm} km</label>
            <input
              type="range"
              min="1"
              max="20"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            />
          </div>
          <button className="btn" onClick={search} disabled={!location || loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {searched && !loading && providers.length === 0 && (
        <p className="muted center">No providers found within {radiusKm} km. Try widening the radius.</p>
      )}

      <div className="grid">
        {providers.map((p) => (
          <ProviderCard key={p.providerId} provider={p} />
        ))}
      </div>
    </div>
  );
}
