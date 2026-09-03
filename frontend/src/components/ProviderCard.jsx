import { Link } from "react-router-dom";

export default function ProviderCard({ provider }) {
  return (
    <div className="card">
      <h3>{provider.fullName}</h3>
      <p className="muted">{provider.category}</p>
      <p>{provider.bio}</p>
      <p>
        <strong>₹{provider.hourlyRate}/hr</strong> &nbsp;•&nbsp; ⭐{" "}
        {provider.rating?.toFixed(1) ?? "New"} ({provider.totalReviews} reviews)
      </p>
      <p className="muted">📍 {provider.address} — {provider.distanceKm} km away</p>
      <Link to={`/providers/${provider.providerId}`}>
        <button className="btn">View & Book</button>
      </Link>
    </div>
  );
}
