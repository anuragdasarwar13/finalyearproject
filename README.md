# Local Service Finder — Final Year Project

A location-based marketplace where customers find service providers (electricians,
plumbers, cleaners, etc.) within a chosen radius (default **5 km**), view their
availability, book them, and pay via **UPI**.

**Stack:** Java 17 + Spring Boot 3 (backend) · MySQL (database) · React + Vite (frontend)

---

## 1. Features implemented

- **Auth:** Register/login as `CUSTOMER` or `PROVIDER`, JWT-based sessions, BCrypt password hashing.
- **Radius search:** Haversine-formula SQL query finds providers within N km of the
  customer's coordinates (from browser geolocation), filterable by category, sorted by distance.
- **Availability:** Providers set weekly recurring time slots and an online/offline toggle;
  customers see this before booking.
- **Booking workflow:** Customer requests a booking → provider Accepts/Rejects → provider
  marks Completed; either side can Cancel. Status machine enforced server-side.
- **UPI Payments:** Once a booking is `CONFIRMED`, the customer opens a payment screen that
  generates a real `upi://pay?...` deep link (opens GPay/PhonePe/Paytm/BHIM on mobile) and a
  scannable QR code (via ZXing) encoding the same request, with the provider's UPI VPA and
  amount pre-filled. Customer confirms after paying by entering the UPI transaction ID (UTR).
- **Role-based dashboards:** Customer "My Bookings" page, Provider "Dashboard" (accept/reject/complete
  bookings, manage availability).

## 2. Important note about the UPI integration

This project implements the **real UPI deep-link/QR standard** used by all UPI apps, so
you can genuinely test it with your own phone. However, it does **not** connect to NPCI
or a bank — there's no way to *programmatically* verify a payment succeeded without a
licensed Payment Service Provider (Razorpay, PayU, Cashfree, PhonePe PG, etc.), which
requires KYC/merchant onboarding and isn't feasible for a student project. That's why
confirmation is: customer pays in their UPI app → app shows a UTR number → customer types
it in → we mark the payment `SUCCESS`.

**For your project report/viva**, you can honestly describe this as: *"A UPI-compliant
payment intent and QR generator with a manual confirmation flow, architected so the
manual-confirmation step is a drop-in replacement for a PSP webhook in production."*
If your evaluators want a "live" gateway demo, integrating **Razorpay's test mode** on
top of this `PaymentService` is a natural next step (their test mode needs no real bank
account) — happy to help you add that if you want to take it further.

## 3. Project structure

```
local-service-finder/
├── backend/     # Spring Boot 3 REST API
└── frontend/    # React + Vite SPA
```

## 4. Backend setup

**Prerequisites:** JDK 17+, Maven, MySQL 8 running locally.

```bash
cd backend
```

1. Create the database (or let it auto-create — see below):
   ```sql
   CREATE DATABASE local_service_finder;
   ```
2. Edit `src/main/resources/application.properties` with your MySQL username/password
   (defaults to `root`/`root`). `createDatabaseIfNotExist=true` is already set, so step 1
   is optional if your MySQL user has CREATE DATABASE privileges.
3. Run it:
   ```bash
   mvn spring-boot:run
   ```
   Hibernate (`ddl-auto=update`) will create all tables automatically on first run, and
   `DataSeeder` will insert 10 default service categories (Electrician, Plumber, etc.).
4. API runs at `http://localhost:8080`. Health check: `GET http://localhost:8080/api/categories`.

> **Note:** This sandbox couldn't reach Maven Central to compile-test the code (no internet
> access to it here), so please run `mvn spring-boot:run` locally as your first step and
> let me know if you hit any compile errors — happy to fix immediately.

### Key backend endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register customer or provider |
| POST | `/api/auth/login` | public | Login, returns JWT |
| GET | `/api/categories` | public | List service categories |
| GET | `/api/providers/search?lat=&lng=&radiusKm=&categoryId=` | public | Radius search |
| GET | `/api/providers/{id}` | public | Provider profile |
| GET | `/api/providers/{id}/availability` | public | Provider's weekly slots |
| POST | `/api/providers/me/availability` | provider | Add a weekly slot |
| PATCH | `/api/providers/me/availability-toggle?available=` | provider | Go online/offline |
| POST | `/api/bookings` | customer | Create a booking |
| PATCH | `/api/bookings/{id}/status` | customer/provider | Update booking status |
| GET | `/api/bookings/my` | customer | My bookings |
| GET | `/api/bookings/received` | provider | Bookings received |
| POST | `/api/payments/bookings/{bookingId}/initiate` | customer | Get UPI intent + QR |
| POST | `/api/payments/{paymentId}/confirm` | customer | Confirm payment with UTR |

## 5. Frontend setup

**Prerequisites:** Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` and expects the backend at `http://localhost:8080`
(hardcoded in `src/api/axios.js` — change it there if you deploy elsewhere).

## 6. Trying it out end-to-end

1. Start MySQL, then the backend, then the frontend.
2. Register 2-3 **PROVIDER** accounts with coordinates near each other (use "Use my current
   location" or pick nearby lat/lng, e.g. around Pune: `18.5204, 73.8567`, `18.5300, 73.8500`).
3. Register a **CUSTOMER** account.
4. On the Home page, allow location access (or type coordinates), pick a radius, and search —
   you'll see the providers within range, sorted by distance.
5. Book a provider, then log in as that provider (`provider-dashboard`) to Accept it.
6. Back on the customer's "My Bookings" page, click **Pay via UPI** — scan the QR with a UPI
   app or enter a UTR manually to complete the demo flow.

## 7. Natural next steps if you want to extend it further

- Reviews/ratings after a completed booking (schema already has `rating`/`totalReviews` fields).
- Real-time provider location updates / map view (Google Maps or Leaflet on the frontend).
- Push/email notifications on booking status changes.
- Swap the manual UPI confirmation for a real Razorpay/PayU test-mode webhook.
- Provider document/ID verification for trust & safety.
- Pagination and full-text search filters for the provider list.

I'm happy to help build any of these next, or to fix compile issues once you run it locally.
