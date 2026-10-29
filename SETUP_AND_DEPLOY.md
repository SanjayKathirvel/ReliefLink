# 🚀 ReliefLink: Complete Setup, Execution & Deployment Manual
### Real-Time Disaster Relief & Resource Coordination Platform

---

## 📌 1. Prerequisites (What to Install on Your Computer)

Before running the project, ensure you have the following installed on your machine:

1. **Node.js (Latest Version: Node.js v20.x or v22.x LTS Recommended)**
   - Download and install from [nodejs.org](https://nodejs.org/).
   - Check your installed version in terminal:
     ```bash
     node -v
     npm -v
     ```
   - Must be `v20.0.0` or higher (fully tested and optimized for latest `v22+`).

2. **Visual Studio Code (VS Code)**
   - Download and install from [code.visualstudio.com](https://code.visualstudio.com/).

3. **Recommended VS Code Extensions (Optional but helpful)**:
   - **Tailwind CSS IntelliSense** (by Tailwind Labs)
   - **ESLint** (by Microsoft)
   - **Prettier - Code formatter** (by Prettier)

---

## 💻 2. Step-by-Step Setup in VS Code (A to Z)

### Step 2.1: Download & Extract the Project
1. Download the ZIP file from the application interface by clicking **"Download ZIP"** or navigating to `http://localhost:3000/api/project/download-zip`.
2. Extract the downloaded `relieflink-disaster-relief-platform.zip` into your desired projects folder (e.g. `~/Documents/relieflink` or `C:\projects\relieflink`).

### Step 2.2: Open in Visual Studio Code
- Open VS Code.
- Go to **File -> Open Folder...** (or on Mac: `Cmd + O`), and select the extracted `relieflink` directory.
- Alternatively, in your terminal run:
  ```bash
  cd path/to/relieflink
  code .
  ```

### Step 2.3: Open Integrated Terminal in VS Code
- Press ``Ctrl + ` `` (Windows/Linux) or ``Cmd + ` `` (Mac).
- Or click on the top menu: **Terminal -> New Terminal**.

---

## 📦 3. Install Dependencies

In the VS Code terminal, execute:

```bash
npm install
```

This installs all required server and client dependencies:
- **Core Runtime**: Express v4, Socket.IO, `@electric-sql/pglite`, `pg`, `bcryptjs`, `jsonwebtoken`, `zod`, `dotenv`, `cors`, `archiver`.
- **Frontend Engine**: React 19, TypeScript 5.8, Leaflet, Lucide Icons, Vite 6, Tailwind CSS v4.

---

## ⚙️ 4. Environment Configuration (`.env`)

The project comes with a documented `.env.example` template.

### Step 4.1: Create your `.env` file
In the VS Code terminal, run:
```bash
cp .env.example .env
```
*(On Windows PowerShell, use: `copy .env.example .env`)*

### Step 4.2: Choose Database Mode

The platform features a **Dual-Engine PostgreSQL Architecture**:

#### Option A: Zero-Config Embedded Database (Default & Recommended for local development)
- You **do not** need to install PostgreSQL server.
- Leave `DATABASE_URL` blank or commented out in `.env`.
- ReliefLink will automatically spin up an embedded PGlite instance with zero external dependencies, persistent data stored under `./data/pgdata`, and will automatically run schema migrations and seed default emergency accounts!

#### Option B: External PostgreSQL Database (For Cloud / Production Deployment)
- If you have an external PostgreSQL server (e.g. Neon, Supabase, Cloud SQL, AWS RDS, or local Postgres service), specify your connection string in `.env`:
  ```env
  DATABASE_URL=postgres://postgres:your_password@localhost:5432/relieflink
  ```
- ReliefLink will automatically connect using standard connection pooling and apply the migrations.

### Key Environment Variables Explained
```env
# Application Port
PORT=3000

# Environment mode
NODE_ENV=development

# JWT Secret for signing authenticated user sessions
JWT_SECRET=emergency-response-secure-jwt-key-2026-relieflink

# Auto-Escalation SLA (minutes unclaimed before priority escalation)
ESCALATION_TIMEOUT_MINUTES=15

# Optional external PostgreSQL connection string
DATABASE_URL=
```

---

## ▶️ 5. Running the Application

### Development Mode (Recommended for testing and coding)
In your VS Code terminal, run:

```bash
npm run dev
```

What happens:
1. Express backend boots with Socket.IO on port 3000.
2. PostgreSQL database adapter validates schema tables and seeds initial test data.
3. Background SLA escalation worker activates.
4. Vite dev server mounts in middleware mode.
5. Open your browser and navigate to:
   👉 **`http://localhost:3000`**

---

### Production Build & Deployment Mode
To compile the application for production hosting:

```bash
# 1. Build the production client bundle and server bundle
npm run build

# 2. Start the production server
npm run start
```

What this does:
- `npm run build` compiles the React frontend into static assets in `dist/` and bundles the TypeScript backend into `dist/server.js` using `esbuild`.
- `npm run start` launches Node.js on `dist/server.js` listening on port 3000.

---

## 🔑 6. Default Pre-Configured Test Accounts

Upon first launch, ReliefLink automatically provisions verified test accounts across all four operational tiers:

| Role | Email | Password | Access / Functionality |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@relieflink.org` | `Citizen@123` | Submit distress reports, live GPS pin, view responder timeline |
| **Volunteer** | `volunteer@relieflink.org` | `Vol@123` | Claim emergencies, update status (En Route/Arrived), ping GPS |
| **Government** | `gov@relieflink.org` | `Gov@123` | Real-time map, issue public emergency broadcasts, shelters |
| **Admin** | `admin@relieflink.org` | `Admin@123` | User access control, spatial duplicate reviews, audit logs |

*Note: You can also use the **"Create Account"** button on the sign-in page to register any new account.*

---

## 🌐 7. Cloud Deployment Guides

### Deploy to Cloud Run / Docker Container
A standard container deployment can be achieved with this simple `Dockerfile`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["npm", "run", "start"]
```

Build and run:
```bash
docker build -t relieflink .
docker run -p 3000:3000 relieflink
```

### Deploy to Render / Railway / Heroku
1. Connect your GitHub repository.
2. Build Command: `npm run build`
3. Start Command: `npm run start`
4. Set Environment Variables in dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-random-secure-secret`
   - `DATABASE_URL=your-cloud-postgres-url` (Optional: provision a PostgreSQL database addon)

---

## 🛠️ 8. Troubleshooting & FAQ

### Port 3000 is already in use
If another process is using port 3000:
- Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
- Mac/Linux: `lsof -i :3000` then `kill -9 <PID>`

### Geolocation Permission Denied in Browser
- When you click "Acquire My GPS" in the emergency form, modern browsers require HTTPS or `localhost` to access GPS.
- If GPS access is blocked in browser settings, you can use the **"Select on Map"** button to click and pin the exact location manually.

### Checking API Health
You can verify the backend and database status anytime by visiting:
👉 `http://localhost:3000/health`
Response:
```json
{
  "status": "HEALTHY",
  "platform": "ReliefLink Disaster Response Platform",
  "nodeVersion": "v22.x",
  "database": "CONNECTED"
}
```
