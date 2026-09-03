import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    categoryId: "",
    bio: "",
    hourlyRate: "",
    address: "",
    upiVpa: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({
        ...f,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }));
    });
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.role === "PROVIDER") {
        payload.categoryId = Number(form.categoryId);
        payload.hourlyRate = Number(form.hourlyRate);
        payload.latitude = Number(form.latitude);
        payload.longitude = Number(form.longitude);
      } else {
        delete payload.categoryId;
        delete payload.hourlyRate;
        delete payload.latitude;
        delete payload.longitude;
        delete payload.address;
        delete payload.upiVpa;
        delete payload.bio;
      }
      const data = await register(payload);
      navigate(data.role === "PROVIDER" ? "/provider-dashboard" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2>Create an account</h2>
      {error && <p className="error-box">{error}</p>}
      <form onSubmit={submit}>
        <label>I am a...</label>
        <select value={form.role} onChange={update("role")}>
          <option value="CUSTOMER">Customer (looking for services)</option>
          <option value="PROVIDER">Service Provider</option>
        </select>

        <label>Full Name</label>
        <input className="input" value={form.fullName} onChange={update("fullName")} required />

        <label>Email</label>
        <input className="input" type="email" value={form.email} onChange={update("email")} required />

        <label>Phone</label>
        <input className="input" value={form.phone} onChange={update("phone")} required />

        <label>Password</label>
        <input className="input" type="password" value={form.password} onChange={update("password")} required minLength={6} />

        {form.role === "PROVIDER" && (
          <>
            <hr />
            <label>Service Category</label>
            <select value={form.categoryId} onChange={update("categoryId")} required>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label>Bio (describe your services)</label>
            <textarea rows={3} value={form.bio} onChange={update("bio")} />

            <label>Hourly Rate (₹)</label>
            <input className="input" type="number" value={form.hourlyRate} onChange={update("hourlyRate")} required />

            <label>Business Address</label>
            <input className="input" value={form.address} onChange={update("address")} required />

            <label>UPI ID (to receive payments, e.g. yourname@okhdfcbank)</label>
            <input className="input" value={form.upiVpa} onChange={update("upiVpa")} required />

            <label>Location</label>
            <button type="button" className="btn btn-outline" onClick={useMyLocation} style={{ marginBottom: 12 }}>
              📍 Use my current location
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="Latitude" type="number" value={form.latitude} onChange={update("latitude")} required />
              <input className="input" placeholder="Longitude" type="number" value={form.longitude} onChange={update("longitude")} required />
            </div>
          </>
        )}

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
