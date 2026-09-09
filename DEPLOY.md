# CareerLens AI — Production Deployment Guide

> **Comprehensive deployment manual for CareerLens AI**, covering Docker Compose, Linux Virtual Machines (AWS EC2 / DigitalOcean), Cloud PaaS (Render, Vercel, Supabase), and Campus Intranet / Air-Gapped University deployments.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Environment Variables Reference](#2-environment-variables-reference)
3. [Deployment Strategy 1: Docker Compose (Recommended)](#3-deployment-strategy-1-docker-compose-recommended)
4. [Deployment Strategy 2: Linux Production VM (Ubuntu / AWS EC2 / DigitalOcean)](#4-deployment-strategy-2-linux-production-vm-ubuntu--aws-ec2--digitalocean)
5. [Deployment Strategy 3: Cloud PaaS (Render + Vercel + Neon/Supabase)](#5-deployment-strategy-3-cloud-paas-render--vercel--neonsupabase)
6. [Deployment Strategy 4: Campus Intranet / On-Premise University Deployment](#6-deployment-strategy-4-campus-intranet--on-premise-university-deployment)
7. [Database Setup & Automated Backups](#7-database-setup--automated-backups)
8. [Production Health Checks & Verification](#8-production-health-checks--verification)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. Architecture Overview

CareerLens AI consists of two decoupled tiers orchestrated via reverse proxy:

```
                  ┌─────────────────────────────────────────┐
                  │          End User Client Browser        │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / HTTPS (Port 80 / 443 / 3000)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Nginx Web Server / Proxy        │
                  │  - Serves static React 19 SPA (dist/)   │
                  │  - Routes /api/* to FastAPI backend     │
                  │  - Enforces 25MB resume upload limits   │
                  └────────────┬───────────────┬────────────┘
                               │               │
                 / (SPA routes)│               │ /api/* (REST requests)
                               ▼               ▼
                   [React 19 / Vite SPA]    [FastAPI / Uvicorn (Port 8000)]
                                               │
                                               ├─► Scikit-Learn Match Engine
                                               ├─► EEOC 80% Fairness Engine
                                               ├─► PyPDF / OCR Resume Parser
                                               ├─► SMTP OTP Dispatcher
                                               │
                                               ▼
                                      [Database Persistence]
                                  SQLite (Dev) / PostgreSQL (Prod)
```

---

## 2. Environment Variables Reference

Create a `.env` file in the project root (or configure variables in your hosting provider's dashboard). Refer to `.env.example` as a template:

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | **Yes** | `sqlite:///./careerlens.db` | SQLAlchemy connection string (`postgresql://user:pass@host:5432/dbname` or SQLite) |
| `SECRET_KEY` | **Yes** | `careerlens-enterprise-secret-key-2026-sha256` | Cryptographic secret for session and token generation |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins (e.g. `https://careerlens.yourcollege.edu`) |
| `VITE_API_URL` | No | `/api` | Frontend API target (baked during `npm run build` or Docker build) |
| `SMTP_SERVER` | No | `smtp.gmail.com` | SMTP host for sending live 6-digit OTP verification codes |
| `SMTP_PORT` | No | `587` | SMTP port (typically `587` for TLS or `465` for SSL) |
| `SMTP_USERNAME` | No | *Empty* | Email account username (e.g. `placements@college.edu`) |
| `SMTP_PASSWORD` | No | *Empty* | App-specific password (use 16-char Gmail App Password, not main password) |
| `SMTP_FROM` | No | `CareerLens Security <noreply@careerlens.ai>` | Sender header displayed in candidate email inboxes |
| `SMTP_USE_TLS` | No | `true` | Enable STARTTLS connection encryption (`true`/`false`) |
| `GROQ_API_KEY` | No | *Empty* | Groq API Key for ultra-low latency LLM chatbot acceleration |
| `GEMINI_API_KEY` | No | *Empty* | Google Gemini API Key for copilot fallback |
| `OPENAI_API_KEY` | No | *Empty* | OpenAI API Key for GPT-4o integration |

> [!NOTE]
> If SMTP credentials are empty, CareerLens operates in **Console OTP Mode**: OTPs are printed directly to the server terminal and an instant one-click autofill notification appears in the UI.

---

## 3. Deployment Strategy 1: Docker Compose (Recommended)

Docker Compose provides a single-command deployment with production Nginx, FastAPI backend, and automatic database seeding.

### Step 1: Clone Repository & Create `.env`
```bash
git clone https://github.com/your-org/careerlens.git
cd careerlens
cp .env.example .env
```

Edit `.env` to configure your custom `SECRET_KEY` and optional SMTP credentials.

### Step 2: Build & Start Containers
```bash
docker compose up -d --build
```

### Step 3: Verify Running Services
```bash
docker compose ps
```
You should see:
- `careerlens-backend` running on port `8000`
- `careerlens-frontend` running on port `3000` (Nginx serving React SPA and proxying `/api` to backend)

### Step 4: Access the Application
- **Frontend Application**: `http://localhost:3000` (or `http://<SERVER_IP>:3000`)
- **Backend Swagger Docs**: `http://localhost:8000/docs` (or `http://<SERVER_IP>:3000/docs`)
- **Health Check**: `http://localhost:3000/api/system/stats`

### Step 5: (Optional) Docker Compose with PostgreSQL
For high-concurrency production setups, use a dedicated PostgreSQL container by launching `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: careerlens-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: careerlens_user
      POSTGRES_PASSWORD: StrongProductionPassword2026!
      POSTGRES_DB: careerlens_db
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: careerlens-backend
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://careerlens_user:StrongProductionPassword2026!@postgres:5432/careerlens_db
      - CORS_ORIGINS=*
      - SECRET_KEY=${SECRET_KEY}
      - SMTP_SERVER=${SMTP_SERVER}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    ports:
      - "8000:8000"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_API_URL=/api
    container_name: careerlens-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pg_data:
```
Run with:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 4. Deployment Strategy 2: Linux Production VM (Ubuntu / AWS EC2 / DigitalOcean)

For deployments directly onto an Ubuntu 22.04 / 24.04 LTS server with Systemd, Nginx, and free Let's Encrypt SSL.

### Step 1: Install System Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx git curl certbot python3-certbot-nginx

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Clone & Setup Backend
```bash
sudo mkdir -p /var/www/careerlens
sudo chown -R $USER:$USER /var/www/careerlens
cd /var/www/careerlens
git clone <YOUR_REPO_URL> .

# Setup Python virtual environment
cd /var/www/careerlens/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Seed initial demographic, placement drive, and student data
python seed_data.py
```

### Step 3: Configure Backend Systemd Service
Create `/etc/systemd/system/careerlens-backend.service`:
```ini
[Unit]
Description=CareerLens AI FastAPI Backend Daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/careerlens/backend
Environment="PATH=/var/www/careerlens/backend/venv/bin"
EnvironmentFile=/var/www/careerlens/.env
ExecStart=/var/www/careerlens/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4

Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable careerlens-backend
sudo systemctl start careerlens-backend
sudo systemctl status careerlens-backend
```

### Step 4: Build Frontend SPA
```bash
cd /var/www/careerlens/frontend
npm install
# VITE_API_URL=/api proxies requests seamlessly through Nginx
VITE_API_URL=/api npm run build
```
The compiled production bundle will reside at `/var/www/careerlens/frontend/dist`.

### Step 5: Configure Production Nginx
Create `/etc/nginx/sites-available/careerlens`:
```nginx
server {
    listen 80;
    server_name careerlens.yourdomain.com; # Replace with your domain or server IP

    client_max_body_size 25M;

    # Frontend SPA
    location / {
        root /var/www/careerlens/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
    }

    # Swagger Documentation
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host $host;
    }
}
```

Enable site and test configuration:
```bash
sudo ln -s /etc/nginx/sites-available/careerlens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Enable Free HTTPS / SSL with Let's Encrypt
```bash
sudo certbot --nginx -d careerlens.yourdomain.com
```
Certbot will automatically update the Nginx configuration to enforce HTTPS on port 443 with automatic renewal.

---

## 5. Deployment Strategy 3: Cloud PaaS (Render + Vercel + Neon/Supabase)

For zero-infrastructure hosting using managed cloud services.

### A. Managed Database (Neon or Supabase)
1. Sign up at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) (free tiers available).
2. Create a new PostgreSQL database.
3. Copy your pooled connection URI, for example:
   ```
   postgresql://username:password@ep-sample-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### B. Backend on Render.com
CareerLens includes a ready-to-deploy [`render.yaml`](file:///c:/Users/aadhi/Desktop/CARRERLENS/render.yaml):
1. Push your code to GitHub.
2. Link your GitHub repository in [Render.com](https://render.com).
3. Create a new **Web Service**:
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt && python seed_data.py`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In the **Environment Variables** tab, add:
   - `DATABASE_URL`: *(Your Neon/Supabase connection string)*
   - `CORS_ORIGINS`: `*` (or your frontend Vercel URL)
   - `SECRET_KEY`: `your-secure-random-key`
   - *(Optional)* `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
5. Click **Deploy**. Render will allocate a URL such as `https://careerlens-backend.onrender.com`.

### C. Frontend on Vercel or Netlify
1. Log in to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. Configure the build parameters:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variable:
   - `VITE_API_URL`: `https://careerlens-backend.onrender.com/api`
5. Click **Deploy**. Your frontend is live with automatic global CDN caching and SSL.

---

## 6. Deployment Strategy 4: Campus Intranet / On-Premise University Deployment

Ideal for colleges, universities, and training institutes conducting campus placement drives on isolated internal LANs.

### Advantages of Campus On-Premise Mode:
- **100% Data Sovereignty**: Student CGPA, resumes, phone numbers, and placement records never leave campus servers.
- **Air-Gapped / Offline Operation**: Built-in rule-based career intelligence and XAI explanations function without external internet connectivity.
- **Zero Cloud Costs**: Runs entirely on existing departmental lab machines or university servers.

### Windows Server / College Lab Deployment:
1. Ensure Python 3.11+ and Node.js 20+ are installed.
2. In the project root, open PowerShell as Administrator and run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\start_local.ps1
   ```
3. **Allow Inbound Firewall Access** (to allow students and recruiters to connect from their laptops across the college Wi-Fi/LAN):
   ```powershell
   New-NetFirewallRule -DisplayName "CareerLens Frontend" -Direction Inbound -LocalPort 5173,3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "CareerLens Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```
4. Find your machine's campus IP address:
   ```powershell
   ipconfig
   ```
   *(e.g., `192.168.1.120` or `10.10.4.55`)*
5. Share the URL with students and interviewers:
   - **Portal**: `http://192.168.1.120:5173` (or port `3000` if running via Docker)

---

## 7. Database Setup & Automated Backups

### Initial Database Seeding
The backend includes a comprehensive seed script that provisions:
- 60+ localized Indian student profiles across departments (CSE, IT, ECE, EEE, MECH, CIVIL)
- 3 placement drives (Fintech Corp, NeuralAI Labs, CloudScale Systems) with deliberate statistical bias for testing
- 140+ real candidate applications
- 29 ground-truth logged interview outcomes with 4 sequential retraining cycles

To re-seed or reset the database at any time:
```bash
cd backend
python seed_data.py
```

### Backing Up SQLite Database
For SQLite deployments, backup the single file with timestamping:
```bash
# Linux cron backup (runs daily at 2:00 AM)
0 2 * * * cp /var/www/careerlens/backend/careerlens.db /var/backups/careerlens_$(date +\%Y\%m\%d).db
```

### Backing Up PostgreSQL Database
```bash
# Dump
pg_dump -U careerlens_user -h localhost -d careerlens_db > careerlens_backup_$(date +\%Y\%m\%d).sql

# Restore
psql -U careerlens_user -h localhost -d careerlens_db < careerlens_backup_20260909.sql
```

---

## 8. Production Health Checks & Verification

After deployment, perform this smoke test checklist to verify operational health:

| Test Item | Verification Command / URL | Expected Result |
|---|---|---|
| **Backend Health** | `curl http://localhost:8000/` | HTTP 200 with JSON: `{"message": "VIPCARE AI Backend API is online"}` |
| **System Diagnostics** | `curl http://localhost:8000/api/system/stats` | JSON object containing counts of students, drives, and feedback accuracy |
| **Interactive Docs** | Open `/docs` in browser | Interactive FastAPI Swagger documentation UI loads cleanly |
| **Database Connection** | `curl http://localhost:8000/api/system/database-info` | `{"is_healthy": true, "dialect": "..."}` |
| **Automated Test Suite** | `python backend/test_system.py` | All 13 unit and integration tests pass (`OK`) |
| **Resume Upload** | Upload PDF or JPG on Student Dashboard | File saved, preview rendered in modal, ATS score updated |
| **Fairness Engine** | Recruiter Dashboard -> "Fairness & Bias Audit" | EEOC 80% Rule disparity calculations displayed |
| **Model Retraining** | Recruiter Dashboard -> "Trigger Model Retrain" | Logistic regression retrains and increments model cycle |

---

## 9. Troubleshooting & FAQ

### Q1: "API Network Error" in browser after deployment
- **Cause**: The frontend was built with `http://localhost:8000/api` hardcoded, but users are accessing it from a remote domain or IP.
- **Fix**: When using Nginx reverse proxy (Docker or Linux VM), build the frontend with `VITE_API_URL=/api`. If deploying frontend and backend to separate domains (e.g. Vercel + Render), set `VITE_API_URL=https://your-backend.onrender.com/api`.

### Q2: "413 Request Entity Too Large" when uploading resume PDFs
- **Cause**: Nginx default upload limit is 1MB, which is exceeded by multi-page PDFs or image scans.
- **Fix**: Add `client_max_body_size 25M;` to your Nginx `server` or `http` block and reload Nginx (`sudo nginx -s reload`).

### Q3: "database is locked" error in SQLite
- **Cause**: SQLite does not support high-frequency concurrent writes when multiple recruiters log decisions simultaneously.
- **Fix**: Switch to PostgreSQL by updating `DATABASE_URL` in your `.env`:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/careerlens
  ```

### Q4: Gmail SMTP OTP says "Authentication Failed"
- **Cause**: Standard Google account passwords cannot be used directly with SMTP due to 2FA requirements.
- **Fix**:
  1. Go to Google Account Settings -> **Security** -> Enable **2-Step Verification**.
  2. Search for **App Passwords** -> Create an app named "CareerLens".
  3. Paste the generated 16-character password into `SMTP_PASSWORD` in your `.env`.

### Q5: How do I change the default port from 3000 to 80 in Docker?
- In `docker-compose.yml`, change the frontend ports mapping from `"3000:80"` to `"80:80"`.
