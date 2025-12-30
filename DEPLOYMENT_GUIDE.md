# 🚀 E-Nexus Deployment Guide

You have two options to deploy this system. Choose the one that fits your workshop best.

## ⚖️ Option 1 vs Option 2

| Feature | **Option 1: Vercel (Cloud)** | **Option 2: Local Network (Simpler)** |
| :--- | :--- | :--- |
| **Accessibility** | Accessible from anywhere (Internet) | Accessible only on Campus WiFi |
| **Database** | **MUST use MongoDB Atlas** (Cloud) | Uses **Local MongoDB** (on laptop) |
| **Setup** | Medium (Requires GitHub + Atlas) | Easy (Just run a command) |
| **Cost** | Free (Hobby Tier) | Free |
| **Best For** | Remote events, permanent access | **On-site workshops**, unstable internet |

---

## ☁️ Option 1: Vercel Deployment (Internet)

> ⚠️ **Requirement**: Vercel cannot see your local files. You **MUST** use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud DB).

### 📦 Step 1: Push Code to GitHub

Since you have the code ready locally, push it to a new GitHub repository:

1.  Log in to [GitHub](https://github.com) and create a **New Repository** (e.g., `e-nexus-workshop`).
2.  Run these commands in your project terminal:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/e-nexus-workshop.git
    git branch -M main
    git push -u origin main
    ```

---

## 🗄️ Step 2: Setup Cloud Database (MongoDB Atlas)

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a free **M0 Cluster**.
3.  Create a **Database User** (username/password).
4.  Go to **Network Access** -> Allow Access from Anywhere (`0.0.0.0/0`).
5.  Get your **Connection String**:
    - Looks like: `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/workshop?retryWrites=true&w=majority`
    - Save this for later!

---

## 🌐 Step 3: Deploy Frontend (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New** -> **Project**.
2.  Import your `e-nexus-workshop` repository.
3.  **Configure Project**:
    - **Framework Preset**: Vite
    - **Root Directory**: `frontend` (Click "Edit" next to Root Directory and select the `frontend` folder).
4.  **Environment Variables**:
    - `VITE_API_URL`: Set this to your **deployed backend URL** (see Step 4). For now, put a placeholder or wait to deploy backend first.
5.  Click **Deploy**.

---


---

## 🛠️ Vercel Configuration Reference (Copy-Paste)

If Vercel asks for "Build & Development Settings", use these:

| Setting | **Frontend (Select "Vite")** | **Backend (Select "Other")** |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | `Other` |
| **Build Command** | `npm run build` | `npm install` |
| **Output Directory** | `dist` | `.` (Leave empty or dot) |
| **Install Command** | `npm install` | `npm install` |

> **Note for Backend**: Since we added `vercel.json`, Vercel usually detects settings automatically. If it asks, use the values above.

---

## ⚙️ Step 4: Deploy Backend (Vercel or Render)

**Recommendation**: Use **Render.com** for the backend (it's easier for Express apps), or allow Vercel to handle it as serverless functions.

### Option A: Deploy Backend to Vercel (All-in-One)
1.  Go to Vercel -> **Add New** -> **Project**.
2.  Import the **SAME** repository again.
3.  **Root Directory**: `backend`.
4.  **Environment Variables**:
    - `MONGODB_URI`: Your Atlas Connection String (from Step 2).
    - `JWT_SECRET`: A secure random string.
    - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Your Cloudinary keys.
    - `ADMIN_REGISTER_NUMBER`: `99240041375`
    - `ADMIN_PASSWORD`: `19012007`
5.  Click **Deploy**.
6.  **Copy the URL** (e.g., `https://e-nexus-backend.vercel.app`).
7.  **Go back to Frontend Project**: Update `VITE_API_URL` to this backend URL + `/api` (e.g. `https://e-nexus-backend.vercel.app/api`).

---

## 🕒 Step 5: Setup Auto-Close Timer (Vercel Cron)

Since Vercel puts the server to sleep, the "Auto-Close" timer won't run automatically in the background. checking every minute.

1.  In your **Backend Project** on Vercel:
2.  Go to **Settings** -> **Cron Jobs**.
3.  Create a Cron Job:
    - **Path**: `/api/admin/cron/auto-close`
    - **Schedule**: `* * * * *` (Every minute)

*Alternatively, manually click "Close Attendance" in the Dashboard if you don't set this up.*

---

---

## � Option 2: Local Network Deployment (No Cloud)

Use this if you want to run the workshop on **your laptop** and have students connect via **WiFi**.

### 1. Find Your IP Address
- **Windows**: Open Terminal -> Type `ipconfig` -> Look for **IPv4 Address** (e.g., `192.168.1.15`).
- **Mac/Linux**: Type `ifconfig`.

### 2. Update Frontend Config
1.  Open `frontend/src/services/api.js` (or `.env`).
2.  Change `localhost` to your IP:
    ```javascript
    // Change this:
    const API_URL = 'http://localhost:5000/api';
    // To this (use YOUR IP):
    const API_URL = 'http://192.168.1.15:5000/api';
    ```

### 3. Run the Servers
Open two terminals:
1.  **Backend**: `cd backend && npm run dev` (Access: `http://192.168.1.15:5000`)
2.  **Frontend**: `cd frontend && npm run dev -- --host` (Access: `http://192.168.1.15:5173`)

### 4. Students Connect
Tell students to open `http://192.168.1.15:5173` on their laptops/phones.
They must be on the **same WiFi**.

---

## 🏆 Recommendation for 150+ Users

**Use Option 1 (Vercel/Cloud).**

**Why?**
1.  **Network Load**: 150 students connecting to one Local WiFi router will likely **crash the router**.
2.  **Flexibility**: With Cloud, students can use their own **4G/5G mobile data** if the WiFi is slow.
3.  **Reliability**: Vercel handles the traffic load better than a single laptop server.

**Only use Option 2 (Local)** if you have a **Professional Enterprise WiFi Access Point** and no internet access.

---

## 🎉 Done!

Your system is ready!
- **Option 1**: `https://e-nexus-frontend.vercel.app`
- **Option 2**: `http://YOUR_IP:5173`
