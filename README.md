# 🚦 TrafficGuard — Traffic & Accident Management System

TrafficGuard is a premium, state-of-the-art Government-to-Citizen (G2C) and Government-to-Government (G2G) dispatch and analytics platform. Built to facilitate real-time accident reporting, hazard logging, and intelligent queue management across India, the system connects everyday citizens directly with local traffic dispatch officers.

Featuring **role-based dashboards**, **interactive geospatial mapping**, **Nominatim geocoding analytics**, and **AI-powered incident severity prediction**, TrafficGuard aims to significantly reduce response times and make Indian roads safer.

---

## 🚀 Key Features

### 1. Geospatial Map & Coordinates Center
* **Bounds-Locked Mapping**: A premium dark-mode styled Leaflet map centered precisely on India (`[[6.5, 68.0], [35.7, 97.5]]`) with `maxBoundsViscosity` enabled to keep focuses locked on national roads.
* **Geocoding & Location Picker**: Report modals feature an interactive map with search-by-city capabilities, a draggable location marker, and real-time reverse geocoding via the OpenStreetMap Nominatim API.

### 2. "Report Similar" Rapid Duplication Shortcut
* Citizens can copy and duplicate incident markers on the map or row items in the recent reports table with a single click.
* The system automatically populates all coordinates, category details, and addresses inside the report modal, programmatically flying the Leaflet viewport to the target location for visual confirmation.

### 3. Complete Role-Based Access Control (RBAC)
* Fully isolated dashboards and frontend route guards separating **System Admins**, **Traffic Officers**, and **Public Citizens**.
* Secure backend middleware (`CheckRole.php`) verifying roles using Sanctum tokens and Spatie Laravel Permission.

### 4. Real-Time Tracking & Event Broadcasting
* **UUID Tracking**: Every incident generates a secure, unique tracking UUID. Citizens can track progress logs and dispatch updates dynamically using their UUID without exposing private reporter data.
* **Real-time Map Updates**: Employs Laravel Reverb and WebSockets to instantly broadcast new incidents across dashboard views.

### 5. AI Groq Integration
* Automated severity estimation for user reports based on description length and keywords.
* Actionable AI suggestions (e.g. "Divert oncoming traffic", "Dispatch medical units") generated dynamically upon report creation.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Libraries / Frameworks |
|---|---|---|
| **Frontend** | React 18, Vite | React-Leaflet, TailwindCSS, Axios, Lucide Icons, Zustand |
| **Backend** | Laravel 11 | Laravel Sanctum, Spatie Permission, Laravel Reverb, Groq SDK |
| **Database** | SQLite / MySQL | Eloquent ORM, Database Seeders & Factories |

---

## 💻 Local Installation Guide

### Prerequisites
* PHP >= 8.2 & Composer
* Node.js >= 18 & npm

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/aryansingh0059/TrafficGuard.git
cd TrafficGuard
```

---

### Step 2: Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   composer install
   ```

2. Copy the environment configuration and generate the application key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Setup your database connection in `.env`. (If using SQLite, simply create an empty database file):
   ```bash
   touch database/database.sqlite
   ```

4. Configure your AI model and Admin Secret Key inside `.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ADMIN_SECRET_KEY=TAMS@Admin2025!
   ```

5. Run migrations and seed the database with major Indian cities and users:
   ```bash
   php artisan migrate --seed
   ```

6. Start the Laravel server and real-time Reverb WebSocket server:
   ```bash
   php artisan serve
   # In a separate terminal
   php artisan reverb:start
   ```

---

### Step 3: Frontend Setup
1. Navigate to the frontend directory and install npm packages:
   ```bash
   cd ../frontend
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```

---

## 🔐 Credentials for Testing

| Role | Email | Password | Admin Secret Key (Registration) |
|---|---|---|---|
| **System Admin** | `admin@traffic.com` | `password` | `TAMS@Admin2025!` |
| **Public Citizen** | `user1@traffic.com` | `password` | *None required* |
| **Traffic Officer** | `officer1@traffic.com` | `password` | *None required* |

---

## 📂 Repository Structure
```text
TrafficGuard/
├── backend/                  # Laravel 11 API Server
│   ├── app/                  # Controllers, Middlewares, Observers, and Services
│   ├── database/             # Migrations, Seeders, and Mock Factories
│   ├── routes/               # API endpoint routing
│   └── tests/                # Feature and AI Unit tests
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/       # Geospatial, forms, toast, and skeleton elements
│   │   ├── pages/            # Role dashboards (Admin/Citizen/Unauthorized)
│   │   ├── services/         # Axios API connection handlers
│   │   └── store/            # Auth state management via Zustand
│   └── tailwind.config.js
└── .gitignore                # Root gitignore rules
```

---

## 📜 Support & Licensing
Developed officially for the Government of India Traffic & Accident Management System. For technical issues, please contact **[support@traffic.gov.in](mailto:support@traffic.gov.in)**.
