import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import "leaflet/dist/leaflet.css";

// Custom icons for Customer Home and Moving Provider
const customerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const riderIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Auto-center map between Rider and Customer
function MapRecenter({ riderPos, customerPos }) {
  const map = useMap();
  useEffect(() => {
    if (riderPos && customerPos) {
      const bounds = L.latLngBounds([riderPos, customerPos]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [riderPos, customerPos, map]);
  return null;
}

export default function LiveTrackingMap({ bookingId, customerLat, customerLng, initialProviderLat, initialProviderLng, isProvider }) {
  const [riderPos, setRiderPos] = useState([initialProviderLat || 20.7241, initialProviderLng || 78.5752]);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const stompClientRef = useRef(null);

  const customerPos = [customerLat || 20.7241, customerLng || 78.5752];

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws-tracking");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        // Customer subscribes to provider coordinates
        client.subscribe(`/topic/tracking/${bookingId}`, (msg) => {
          const data = JSON.parse(msg.body);
          if (data.latitude && data.longitude) {
            setRiderPos([data.latitude, data.longitude]);
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    // If logged in as Provider, stream actual GPS position via watchPosition
    let watchId = null;
    if (isProvider && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setRiderPos([lat, lng]);

          if (client.connected) {
            client.publish({
              destination: "/app/send-location",
              body: JSON.stringify({
                bookingId: Number(bookingId),
                latitude: lat,
                longitude: lng,
                heading: pos.coords.heading || 0,
              }),
            });
          }
        },
        (err) => console.error("GPS stream error:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (client) client.deactivate();
    };
  }, [bookingId, isProvider]);

  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h3 style={{ margin: 0, color: "#111827" }}>Live Route Tracking</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
            {isProvider ? "📡 Broadcasting your GPS location..." : "🛵 Service partner is on the way"}
          </p>
        </div>
        <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600" }}>
          LIVE
        </span>
      </div>

      <div style={{ height: "350px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
        <MapContainer center={customerPos} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Customer House Marker */}
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>🏠 Your Location</Popup>
          </Marker>

          {/* Provider Moving Marker */}
          <Marker position={riderPos} icon={riderIcon}>
            <Popup>🛵 Service Partner</Popup>
          </Marker>

          {/* Connecting Line */}
          <Polyline positions={[riderPos, customerPos]} color="#2563eb" dashArray="6, 8" weight={4} />

          <MapRecenter riderPos={riderPos} customerPos={customerPos} />
        </MapContainer>
      </div>
    </div>
  );
}