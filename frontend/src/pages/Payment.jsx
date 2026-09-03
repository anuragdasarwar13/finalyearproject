import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [utr, setUtr] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.post(`/payments/bookings/${bookingId}/initiate`)
      .then((res) => setPayment(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not start payment"));
  }, [bookingId]);

  const confirm = async (e) => {
    e.preventDefault();
    if (!utr.trim()) {
      setError("Please enter a valid UPI Transaction / UTR number.");
      return;
    }

    setConfirming(true);
    setError("");
    try {
      // Send both keys so backend DTO correctly populates utrNumber
      await api.post(`/payments/${payment.paymentId}/confirm`, {
        utrNumber: utr.trim(),
        upiTransactionId: utr.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Confirmation failed");
    } finally {
      setConfirming(false);
    }
  };

  if (error && !payment) return <p className="error-box">{error}</p>;
  if (!payment) return <p>Setting up payment...</p>;

  if (done) {
    return (
      <div className="card center" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <h2>✅ Payment recorded!</h2>
        <p className="muted">Thanks — your payment has been marked as paid.</p>
        <button className="btn" onClick={() => navigate("/my-bookings")}>Back to My Bookings</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Pay via UPI</h2>
      <p className="muted">Booking #{bookingId} • Ref: {payment.transactionRef || `BK-${bookingId}`}</p>
      <p style={{ fontSize: 28, fontWeight: 700 }}>₹{payment.amount}</p>
      <p className="muted">To: {payment.providerUpiVpa || payment.payeeVpa}</p>

      <div className="center" style={{ margin: "16px 0", textAlign: "center" }}>
        <img
          src={`data:image/png;base64,${payment.qrCodeBase64}`}
          alt="UPI QR Code"
          style={{ width: 220, height: 220, border: "1px solid #eee", borderRadius: 8 }}
        />
      </div>

      <a href={payment.upiIntentUrl}>
        <button className="btn" type="button" style={{ width: "100%", marginBottom: 12 }}>
          Open in UPI App (GPay / PhonePe / Paytm)
        </button>
      </a>

      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Scan the QR code above with any UPI app, or tap the button (on mobile). Once you've completed the payment,
        enter the UPI transaction ID (UTR number) shown in your app to confirm.
      </p>

      {error && <p className="error-box">{error}</p>}

      <form onSubmit={confirm}>
        <label>UPI Transaction ID (UTR)</label>
        <input
          className="input"
          value={utr}
          placeholder="e.g. 214763382984"
          onChange={(e) => setUtr(e.target.value)}
          required
        />
        <button className="btn" type="submit" disabled={confirming} style={{ width: "100%" }}>
          {confirming ? "Confirming..." : "I've paid — confirm"}
        </button>
      </form>
    </div>
  );
}