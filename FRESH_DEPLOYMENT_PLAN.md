# 🚀 Master Deployment Plan (Fresh Start)

Follow this plan **exactly** in order. Do not skip any checking steps.

---

## 🛑 Phase 0: Final Code Push

Before anything, make sure your GitHub repo has the latest "clean" code.

1.  Open your local terminal in the project folder.
2.  Run these commands to verify everything is pushed:
    ```bash
    git status
    git add .
    git commit -m "Ready for fresh deployment"
    git push origin main
    ```
3.  Check your GitHub repo in the browser to ensure the latest commit is there.

---

## ⚙️ Phase 1: Deploy Backend (First)

We deploy the backend first because the frontend needs the Backend URL to know where to connect.

### 1.1 Create Project in Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New** -> **Project**.
3.  Import your repository: `E-Nexus` (or whatever you named it).
4.  **Edit Root Directory**:
    - Click "Edit" next to Root Directory.
    - Select `backend` folder.

### 1.2 Configure Build Settings (Backend)
Vercel might say "Framework Preset: Other". **This is correct.**

Use these **exact** settings:
- **Framework Preset**: `Other`
- **Build Command**: `npm install`
- **Output Directory**: `public` (We created this specifically for this)
- **Install Command**: `npm install`

### 1.3 Add Environment Variables (Backend)
Expand the "Environment Variables" section and add these:

| Key | Value |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://mahilmithranks2007_db_user:fdYLDN6zBZHZhO3L@cluster0.dheqjnh.mongodb.net/workshop?appName=Cluster0` |
| `JWT_SECRET` | `my-super-secret-key-12345` (or any random string) |
| `CLOUDINARY_CLOUD_NAME` | *(Your Cloudinary Cloud Name)* |
| `CLOUDINARY_API_KEY` | *(Your Cloudinary API Key)* |
| `CLOUDINARY_API_SECRET` | *(Your Cloudinary API Secret)* |
| `ADMIN_REGISTER_NUMBER` | `99240041375` |
| `ADMIN_PASSWORD` | `19012007` |

### 1.4 Deploy Backend
1.  Click **Deploy**.
2.  Wait for it to finish.
3.  **SUCCESS CHECK**:
    - Once finished, you will see a domain like `https://e-nexus-backend.vercel.app`.
    - Click it. It should show: **"Backend Server Running 🚀"**.
    - **Step 1 Complete! Copy this URL.**

---

## 🎨 Phase 2: Deploy Frontend (Second)

Now we deploy the website that students will see.

### 2.1 Create *Another* Project in Vercel
1.  Go back to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New** -> **Project**.
3.  Import the **SAME** repository again (`E-Nexus`).
4.  **Edit Root Directory**:
    - Click "Edit" next to Root Directory.
    - Select `frontend` folder.

### 2.2 Configure Build Settings (Frontend)
Vercel should auto-detect "Vite". If not, select it.

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Add Environment Variables (Frontend)
This is how we verify the connection.

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://YOUR-BACKEND-URL.vercel.app/api` |

> ⚠️ **IMPORTANT**: You MUST replace `YOUR-BACKEND-URL` with the URL you copied in Phase 1.
> **Example**: `https://e-nexus-backend.vercel.app/api` (Don't forget the `/api` at the end!)

### 2.4 Deploy Frontend
1.  Click **Deploy**.
2.  Wait for it to finish.
3.  **SUCCESS CHECK**:
    - Click the domain (e.g., `https://e-nexus-frontend.vercel.app`).
    - You should see the **Login Page**.
    - Try logging in with Admin credentials (`99240041375` / `19012007`).
    - If it works, **YOU ARE DONE!** 🎉

---

## 🔄 Troubleshooting

- **Backend 500 Error?**
  - Check `MONGODB_URI` in Vercel settings.
  - Check MongoDB Atlas Network Access (Allow `0.0.0.0/0`).
- **Frontend 404 Error?**
  - Check if `dist` was created. (The guide ensures it).
  - Check if `vercel.json` is in frontend folder (We added it earlier).
- **"Network Error" on Login?**
  - You probably messed up `VITE_API_URL`. Check deployment settings again.
