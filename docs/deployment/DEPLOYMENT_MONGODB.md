# Deployment Guide: MongoDB Atlas Free (M0)

VitaNet relies on MongoDB Atlas Free Tier (M0) exclusively for lightweight structured documents, relational edges, and interaction metadata. **No media binaries, base64 payloads, or files are ever stored in MongoDB.**

---

## 1. Cluster Provisioning

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new organization and project named `vitanet-prod`.
3. Create a cluster:
   - **Tier**: `M0 Sandbox` (Free Forever)
   - **Provider**: AWS or Google Cloud (choose region closest to Render service, e.g., `us-east-1` or `eu-central-1`)
   - **Cluster Name**: `vitanet-cluster`
4. Wait 2–3 minutes for cluster provisioning to complete.

---

## 2. Network Security & IP Access

Render web services use dynamic outbound IP addresses unless a static egress proxy is provisioned. For MongoDB Atlas Free:

1. Navigate to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Set description to `Render Web Service DynIP`.
5. Click **Confirm**.

> [!NOTE]
> MongoDB database users are protected by strong cryptographic SCRAM authentication (username + 32-character random password). `0.0.0.0/0` is safe when paired with high-entropy credentials.

---

## 3. Database User Credentials

1. Navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. **Authentication Method**: Password.
4. **Username**: `vitanet_app`.
5. **Password**: Click **Autogenerate Secure Password** and copy it to a secure password manager.
6. **Database User Privileges**: `Read and write to any database`.
7. Click **Add User**.

---

## 4. Connection String

1. Navigate to **Deployments** → **Database**.
2. Click **Connect** on `vitanet-cluster`.
3. Choose **Drivers** (Node.js, version 5.5 or later).
4. Copy the connection string URI:
   ```env
   mongodb+srv://vitanet_app:<password>@vitanet-cluster.xxxxx.mongodb.net/vitanet?retryWrites=true&w=majority&appName=vitanet
   ```
5. Replace `<password>` with the password generated in step 3.
6. Set this value in `server/.env` as `MONGODB_URI`.

---

## 5. Mongoose Connection Constraints

The VitaNet server configures Mongoose with conservative connection pool settings in `src/server.js`:
- `maxPoolSize: 5` (stays well below M0 connection cap of 500 concurrent connections).
- `minPoolSize: 1`.
- `serverSelectionTimeoutMS: 5000`.

TTL indices (`Session` expires in 30 days, `EmailToken` in 24 hours, `UploadSession` in 15 minutes) are built automatically on startup.
