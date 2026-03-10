# MLops_Capstone - Google Cloud Deployment Guide

This guide walks you through deploying your PawMind app to Google Cloud Compute Engine.

---

## **BEFORE YOU START - Checklist**

- [ ] You have a Google Cloud account (with billing enabled)
- [ ] You have a GitHub account with your MLops_Capstone repository
- [ ] You have SSH key setup on your machine
- [ ] You know your YouTube API key and Groq API key

---

## **PART 1: LOCAL PREPARATION (On Your Computer)**

### **Step 1: Build Frontend for Production**

```bash
cd MLops_Capstone

# Install dependencies
npm install

# Build for production (creates dist/ folder)
npm run build

# Verify build was successful
ls -la dist/
```

### **Step 2: Create Production Environment File**

```bash
cd backend

# Copy the production template
cp .env.production.template .env.production

# Edit the file with your actual values
nano .env.production
```

**Fill in these values:**
```
SECRET_KEY=generate-a-random-32-character-string
DB_PASSWORD=choose-a-strong-database-password
GROQ_API_KEY=your-actual-groq-api-key
CORS_ORIGINS=http://YOUR_FUTURE_VM_IP,http://YOUR_FUTURE_VM_IP:8000
```

⚠️ **DO NOT commit .env.production to GitHub** (it has secrets!)

```bash
# Make sure it's in .gitignore
echo ".env.production" >> ../.gitignore
```

### **Step 3: Push to GitHub**

```bash
cd ..

git add .
git commit -m "add: production configuration and build files"
git push origin main
```

---

## **PART 2: GOOGLE CLOUD SETUP**

### **Step 1: Create Google Cloud Project**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a Project** (top left)
3. Click **NEW PROJECT**
4. Name: `pawmind-capstone`
5. Click **CREATE**
6. Wait 30 seconds for project creation

### **Step 2: Enable Required APIs**

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - ✅ Compute Engine API
   - ✅ Cloud Logging API

### **Step 3: Create Firewall Rules**

1. Go to **VPC Network** → **Firewall**
2. Click **+ CREATE FIREWALL RULE**

**Rule 1 - Web Traffic:**
- Name: `pawmind-allow-web-api`
- Direction: `Ingress`
- Source IPv4 ranges: `0.0.0.0/0`
- Protocol: `TCP` with ports `80, 443, 8000`
- Click **CREATE**

**Rule 2 - SSH:**
- Name: `pawmind-allow-ssh`
- Direction: `Ingress`
- Source IPv4 ranges: `0.0.0.0/0` (or your IP for security)
- Protocol: `TCP` port `22`
- Click **CREATE**

### **Step 4: Create Compute Engine Instance**

1. Go to **Compute Engine** → **VM instances**
2. Click **+ CREATE INSTANCE**
3. Configure:
   - **Name:** `pawmind-server`
   - **Region:** `us-central1` (choose close to you)
   - **Zone:** `us-central1-a`
   - **Machine type:** `e2-medium` (2 vCPU, 4GB RAM)
   - **Boot disk:**
     - Click **Change**
     - OS: `Ubuntu`
     - Version: `Ubuntu 22.04 LTS`
     - Boot disk size: `30 GB`
     - Click **SELECT**
4. Click **CREATE**

⏱️ **Wait 1-2 minutes for instance to start**

### **Step 5: Get Your VM Public IP**

1. Go to **Compute Engine** → **VM instances**
2. Find your instance
3. Copy the **External IP** (e.g., `35.123.45.67`)
4. **Update your .env.production CORS_ORIGINS with this IP**

---

## **PART 3: DEPLOY TO VM (SSH into your instance)**

### **Step 1: SSH into Your VM**

In Google Cloud Console:
1. Click your instance name
2. Click the **SSH** button (it opens in browser terminal)

OR from your computer:
```bash
gcloud compute ssh pawmind-server --zone=us-central1-a
```

### **Step 2: Install Prerequisites**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose git curl

# Add yourself to docker group (no more sudo needed)
sudo usermod -aG docker $USER

# Activate new group
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### **Step 3: Clone Your Repository**

```bash
# Clone your repo
git clone https://github.com/YOUR_GITHUB_USERNAME/MLops_Capstone.git
cd MLops_Capstone/backend

# Verify files are there
ls -la
```

### **Step 4: Upload .env.production**

**Option A: Using SCP (from your computer terminal):**
```bash
scp /path/to/your/.env.production YOUR_EXTERNAL_IP:~/MLops_Capstone/backend/

# SSH back in
gcloud compute ssh pawmind-server --zone=us-central1-a
cd MLops_Capstone/backend
```

**Option B: Create it manually on VM:**
```bash
nano .env.production
# Copy-paste your environment variables
# Press Ctrl+X, then Y, then Enter to save
```

### **Step 5: Start Docker Containers**

```bash
# Make sure you're in the backend directory
cd ~/MLops_Capstone/backend

# Start containers with production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check if running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

✅ **Wait 30 seconds for API to start**

### **Step 6: Verify Deployment**

```bash
# Check API is responding
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

---

## **PART 4: ACCESS YOUR APP**

### **From Your Browser:**

**API Documentation:**
```
http://YOUR_EXTERNAL_IP:8000/docs
```

**Frontend:** (currently on port 8000 via FastAPI static files)
```
http://YOUR_EXTERNAL_IP:8000
```

**Test the connection:**
1. Open http://YOUR_EXTERNAL_IP:8000 in browser
2. You should see your PawMind app
3. Try signing up or making an API call

---

## **TROUBLESHOOTING**

### **Docker containers won't start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Common issues:
# - Port already in use: docker ps, docker kill <container>
# - Permissions: sudo docker-compose -f docker-compose.prod.yml up -d
```

### **Can't reach VM from browser:**
```bash
# Verify firewall rules were created
gcloud compute firewall-rules list

# Verify instance is running
gcloud compute instances list

# SSH and check if ports are listening
gcloud compute ssh pawmind-server
netstat -tlnp | grep -E ':(80|443|8000|5432)'
```

### **Database connection error:**
```bash
# Check if db container is healthy
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs db
```

### **API not responding:**
```bash
# Check API logs
docker-compose -f docker-compose.prod.yml logs api

# Restart API
docker-compose -f docker-compose.prod.yml restart api
```

---

## **OPTIONAL: Set Up HTTPS (Let's Encrypt)**

For production with a domain name:

```bash
# SSH into VM
gcloud compute ssh pawmind-server

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates stored at: /etc/letsencrypt/live/yourdomain.com/
```

---

## **CLEANUP: Stop Containers (if needed)**

```bash
cd ~/MLops_Capstone/backend

# Stop containers
docker-compose -f docker-compose.prod.yml down

# Stop and remove data
docker-compose -f docker-compose.prod.yml down -v
```

---

## **KEY FILES CREATED FOR DEPLOYMENT**

```
MLops_Capstone/
├── backend/
│   ├── .env.production              (⚠️ Keep secret, don't commit)
│   ├── docker-compose.prod.yml      (✅ Production setup)
│   ├── Dockerfile                   (✅ Already exists)
│   └── requirements.txt             (✅ Already exists)
├── vite.config.js                   (✅ Updated for production)
├── dist/                            (✅ Built frontend)
└── DEPLOYMENT_GUIDE.md              (📖 This file)
```

---

## **MONITORING & MAINTENANCE**

### **Check system resources:**
```bash
# CPU and memory usage
top

# Disk space
df -h

# Docker containers
docker ps
```

### **Regular backups:**
```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres pawmind > backup.sql

# Copy to your computer via SCP
scp YOUR_EXTERNAL_IP:~/MLops_Capstone/backend/backup.sql ./
```

---

## **WHAT'S RUNNING ON YOUR VM**

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL DB | 5432 `:127.0.0.1` | 🐳 Docker |
| FastAPI Backend | 8000 | 🐳 Docker |
| Frontend (React) | Served via 8000 | 🐳 Docker |

---

## **ESTIMATED COSTS**

| Service | Cost/Month |
|---------|-----------|
| Compute Engine (e2-medium) | ~$30 |
| Storage (30GB disk) | ~$1 |
| **Total** | **~$31/month** |

---

## **NEXT STEPS FOR PRODUCTION**

- [ ] Add Nginx reverse proxy for better performance
- [ ] Set up Cloud SQL instead of Docker PostgreSQL
- [ ] Add monitoring with Google Cloud Logging
- [ ] Set up auto-scaling policies
- [ ] Add SSL certificates
- [ ] Configure backup strategies

---

**Questions? Issues?** Check Google Cloud docs or your VS Code terminal for error messages.
