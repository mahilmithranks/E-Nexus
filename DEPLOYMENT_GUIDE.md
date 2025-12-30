# 🚀 E-Nexus Vercel Deployment Guide

This guide will help you deploy the Workshop Management System to **Vercel**.

> ⚠️ **IMPORTANT REQUIREMENTS**
> Since Vercel is "serverless", your local files and database won't work there. You MUST use:
> 1.  **MongoDB Atlas** (Cloud Database) instead of `localhost:27017`.
> 2.  **Cloudinary** (Cloud Storage) for all photos (no local uploads).

---

## 📦 Step 1: Push Code to GitHub

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

## 🎉 Done!

Your system is now live on the internet! 
- **Frontend**: `https://e-nexus-frontend.vercel.app`
- **Backend API**: `https://e-nexus-backend.vercel.app`
