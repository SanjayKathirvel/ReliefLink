# 🚨 ReliefLink: Real-Time Disaster Relief & Resource Coordination Platform

ReliefLink is an emergency response management system designed for disaster scenarios (floods, earthquakes, hurricanes, industrial hazards). It bridges citizens in peril, frontline volunteer rescue teams, and government incident command centers through real-time situational awareness and resource allocation.

---

## ⚡ Quickstart Guide (Run in 2 Minutes)

```bash
# 1. Install dependencies (Node.js v20+ or v22 LTS required)
npm install

# 2. Copy the environment configuration
cp .env.example .env

# 3. Launch full-stack platform (Backend + Frontend + Real-Time Engine)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> 📖 **For complete A to Z VS Code setup instructions and deployment to Cloud Run/Docker/Render, please refer to [`SETUP_AND_DEPLOY.md`](./SETUP_AND_DEPLOY.md).**

---

## 🌟 Core Architecture & Capabilities

### 1. Multi-Role Emergency Operations
- **Citizen Portal**: Fast GPS-assisted emergency reporting with evidence upload, offline coordinates fallback, and real-time mission status tracking.
- **Volunteer Field Operations**: Real-time distress feed with atomic concurrent-claim protection, progressive status updates (Claimed ➔ En Route ➔ Arrived ➔ Resolved), and live responder GPS pinging.
- **Government Incident Command**: Multi-agency metrics, live interactive Leaflet tactical map, emergency broadcast transmitter, hazard and evacuation zone defining, and shelter capacity tracking.
- **System Administration**: Spatial duplicate candidate reviews, user access management, and immutable audit logs.

### 2. Dual-Engine PostgreSQL Database
- **Development**: Embedded PGlite engine with persistent storage under `./data/pgdata`, automated relational migrations, and initial seed data. Zero configuration required!
- **Production**: Seamless connection to external PostgreSQL (Cloud SQL, Neon, Supabase, AWS RDS) via standard `DATABASE_URL`.

### 3. Concurrency Protection & Security
- Atomic SQL updates (`UPDATE distress_requests SET ... WHERE status = 'OPEN'`) ensure two volunteers cannot claim the same emergency simultaneously.
- Atomic resource deductions (`UPDATE resources SET available_quantity = available_quantity - $1 WHERE available_quantity >= $1`) prevent overselling critical inventory during disasters.
- Centralized audit service logging every critical state modification.
- JWT authentication with bcrypt password hashing.

---

## 📋 Default Pre-Seeded Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Citizen** | `citizen@relieflink.org` | `Citizen@123` |
| **Volunteer** | `volunteer@relieflink.org` | `Vol@123` |
| **Government** | `gov@relieflink.org` | `Gov@123` |
| **Admin** | `admin@relieflink.org` | `Admin@123` |
