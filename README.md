# RideNow 🚕
### A Real-Time Ride-Sharing Web Application
**Web Technologies Course — Part 2 Project**

Built with: **HTML5 · CSS3 · JavaScript (ES6+) · React.js · Supabase**

---

## 📋 Project Overview

RideNow is a simplified Uber-like ride-sharing platform that demonstrates real-time web application architecture using a modern academic tech stack. It supports three user roles — **Rider**, **Driver**, and **Admin** — and implements the full ride lifecycle from request to completion with live WebSocket-based updates.

---

## ✨ Features

### Rider
- ✅ Register and login with email/password
- ✅ Select pickup and destination from simulated city locations
- ✅ View fare estimate before booking
- ✅ Request a ride — notified to all online drivers instantly via Supabase Realtime
- ✅ Watch driver approach on simulated interactive map (live location updates)
- ✅ Real-time ride status: Searching → Matched → In Progress → Completed
- ✅ Rate driver after trip completion (1–5 stars + comment)
- ✅ Full trip history with fare, route, and status

### Driver
- ✅ Register with vehicle details (Make, Model, Plate, Color)
- ✅ Account approval flow (admin must approve before going online)
- ✅ Toggle online/offline availability
- ✅ Receive ride requests in real time via Supabase Realtime
- ✅ Accept rides (race-condition protected via Postgres UPDATE)
- ✅ Start ride and broadcast live GPS location every 5 seconds
- ✅ Complete trip — atomically updates ride + creates earnings record
- ✅ Earnings dashboard with per-trip breakdown and totals

### Admin
- ✅ Platform overview with live stats (total rides, active drivers, pending approvals)
- ✅ Driver approval queue — approve pending driver accounts
- ✅ All rides table with status filtering
- ✅ User management with suspend capability

---

## 🏗️ Architecture

```
Browser (React SPA)
       │
       ▼
Supabase JS Client SDK
       │
       ├── Auth (JWT)          → Login / Register / Session
       ├── PostgREST REST API  → CRUD on all tables
       ├── Realtime (WebSocket) → Live ride + location updates
       └── Storage             → Driver profile photos (optional)
              │
              ▼
       PostgreSQL Database
       ├── users
       ├── drivers
       ├── rides
       ├── locations
       ├── earnings
       └── ratings
```

---

## 🗄️ Database Schema

| Table       | Purpose                                      |
|-------------|----------------------------------------------|
| `users`     | Extends auth.users with role + profile data  |
| `drivers`   | Vehicle details, approval status, availability |
| `rides`     | Core ride entity with status enum + coordinates |
| `locations` | High-frequency driver GPS stream             |
| `earnings`  | Per-trip financial records (80% of fare)     |
| `ratings`   | Post-trip 1–5 star ratings                   |

All tables have **Row Level Security (RLS)** enabled with fine-grained policies.

---

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) account

---

### Step 1 — Clone & Install

```bash
git clone <your-repo-url>
cd ridenow
npm install
```

---

### Step 2 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to you
3. Note your **Project URL** and **anon/public key** (Settings → API)

---

### Step 3 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

### Step 4 — Run Database Schema

1. In Supabase Dashboard → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase_schema.sql`
3. Click **Run**

This creates all 6 tables, RLS policies, the `complete_ride` stored function, and the auth trigger.

---

### Step 5 — Enable Realtime

In Supabase Dashboard → **Database** → **Replication**:
- Enable Realtime for: `rides`, `locations`

Or run in SQL Editor:
```sql
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.locations;
```

---

### Step 6 — Create Demo Users (Optional)

In Supabase Dashboard → **Authentication** → **Users** → **Invite user**, or use SQL:

```sql
-- After running the schema, create demo accounts via the app's Register page
-- Or seed manually:

-- 1. Create users via Supabase Auth (Dashboard → Auth → Users → Add user)
--    rider@demo.com / demo1234  → role: rider
--    driver@demo.com / demo1234 → role: driver
--    admin@demo.com / demo1234  → role: admin

-- 2. Then manually update roles in public.users if trigger doesn't fire:
UPDATE public.users SET role = 'admin' WHERE email = 'admin@demo.com';
UPDATE public.users SET role = 'driver' WHERE email = 'driver@demo.com';
```

---

### Step 7 — Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Step 8 — Test the Full Flow

1. **Register** as a Rider → book a ride
2. **Open a second browser tab** → Register as a Driver → get approved as Admin → go online
3. Watch the ride request appear **instantly** on the driver's screen (Realtime!)
4. Accept the ride → start → complete
5. Check the Rider's dashboard for status updates throughout

---

## 📁 Project Structure

```
ridenow/
├── public/
│   └── favicon.svg
├── src/
│   ├── context/
│   │   └── AuthContext.jsx         ← Session + profile management
│   ├── services/
│   │   └── supabase.js             ← ALL Supabase calls centralised here
│   ├── hooks/
│   │   └── index.js                ← useRideStatus, useDriverLocation, usePendingRides
│   ├── components/
│   │   └── shared/
│   │       └── index.jsx           ← Navbar, ProtectedRoute, Toast, EmptyState
│   ├── pages/
│   │   ├── LandingPage.jsx         ← Public marketing page
│   │   ├── AuthPages.jsx           ← Login + Register (with role selection)
│   │   ├── RiderDashboard.jsx      ← Ride request, map, status, trip history
│   │   ├── DriverDashboard.jsx     ← Pending rides, active ride, location, earnings
│   │   └── AdminPanel.jsx          ← Overview, driver approval, rides, users
│   ├── styles/
│   │   └── global.css              ← Full design system (tokens, components)
│   ├── App.jsx                     ← Router + role-based route guards
│   └── main.jsx                    ← React entry point
├── supabase_schema.sql             ← Complete DB schema + RLS + functions
├── .env.example                    ← Environment variable template
├── vite.config.js
├── package.json
└── index.html
```

---

## 🔒 Security

- **Row Level Security** on all 6 tables — no unprotected data access
- **JWT authentication** via Supabase Auth — tokens auto-refreshed
- **Role-based routing** — riders/drivers/admins see only their own screens
- **Atomic trip completion** via Postgres stored function — no partial write states
- **Race condition protection** — ride acceptance uses `UPDATE ... WHERE status = 'requested'`

---

## ⚡ Performance

- Vite build with tree-shaking and code splitting
- CSS custom properties for zero-runtime theming
- Realtime subscriptions instead of polling (eliminates unnecessary API calls)
- Database indexes on all high-read columns (rider_id, driver_id, status, recorded_at)
- Geolocation debounced to 5-second intervals

---

## ♿ Accessibility

- Semantic HTML throughout (`<nav>`, `<main>`, `<form>`, `<label>`)
- All interactive elements keyboard-focusable
- Color contrast ratios meet WCAG 2.1 AA (4.5:1 minimum)
- `aria-label` on icon-only buttons
- Loading states announced via status updates
- No content conveyed by color alone

---

## 🧪 Testing

```bash
# Run unit tests (Jest + React Testing Library)
npm test

# Run Lighthouse audit
# Open Chrome DevTools → Lighthouse → Generate Report

# Test RLS policies
# In Supabase SQL Editor → set local role to a specific user and attempt cross-user queries
```

---

## 📦 Build for Production

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or any static host
```

**Vercel deployment:**
```bash
npm install -g vercel
vercel --prod
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project settings
```

---

## 🔧 Tech Stack

| Layer      | Technology              | Version  |
|------------|-------------------------|----------|
| Frontend   | React (functional + hooks) | ^18.2  |
| Router     | React Router DOM        | ^6.21    |
| Build tool | Vite                    | ^5.0     |
| Backend    | Supabase (Postgres + Auth + Realtime) | ^2.39 |
| Fonts      | Syne + DM Sans (Google Fonts) | —    |
| Deployment | Vercel / Netlify (recommended) | —   |

---

## 📚 References

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [React Router v6](https://reactrouter.com)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Vite Documentation](https://vitejs.dev)

---

## 📄 License

Academic project — Web Technologies Course, 2024–2025.
