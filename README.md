# Power-loom-production-monitoring-app

# Power Loom Production Monitoring App

A full-stack web application for real-time monitoring and management of power loom machines in a textile production environment.

---

## Features

- **Role-based access** — Separate dashboards for Admin and Weaver roles
- **Live machine monitoring** — Track loom status (running/stopped), production output (meters), and energy consumption (kWh)
- **Shift management** — Admin can schedule Morning, Evening, and Night shifts and assign weavers to specific looms
- **Weaver dashboard** — Weavers can start/stop their assigned loom only during their active shift window
- **Production reset** — Admin can reset sensor data per machine
- **JWT-based authentication** — Secure login with token-based session management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Auth | JWT |
| Deployment | Vercel (frontend) |

---

## Project Structure

```
├── frontend/        # React app (Vite)
│   └── src/
│       ├── components/
│       │   ├── Admin/       # Admin dashboard, machine cards, modals
│       │   ├── Weaver/      # Weaver dashboard
│       │   └── Auth/        # Login page
│       └── services/        # API call handlers
│
└── backend/         # Express server
    ├── models/      # Mongoose schemas (Loom, User, Shift, SensorData)
    ├── routes/      # REST API routes
    ├── middleware/  # JWT auth middleware
    └── cron/        # Scheduled shift summary jobs
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_secret
# PORT=5000
node index.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/looms` | Get all looms with sensor data (Admin) |
| POST | `/api/looms/:id/start` | Start a loom (Weaver, shift-validated) |
| POST | `/api/looms/:id/stop` | Stop a loom |
| POST | `/api/looms/:id/reset` | Reset production data (Admin) |
| GET | `/api/shifts` | Get shift schedule |
| POST | `/api/shifts` | Create a shift assignment (Admin) |

---
