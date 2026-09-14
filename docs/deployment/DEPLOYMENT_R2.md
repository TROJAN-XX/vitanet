# Deployment Guide: Cloudflare R2 (Private Media Storage)

VitaNet stores all photos, videos, and avatars in a private Cloudflare R2 bucket. Media never passes through Express server memory.

---

## 1. Bucket Provisioning

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the sidebar, select **R2 Storage** → **Overview**.
3. Click **Create bucket**.
4. **Bucket name**: `vitanet-media-prod`.
5. **Location**: Automatic or choose `WNAM` / `WEUR` based on your core user base.
6. Click **Create bucket**.

---

## 2. Public Access Settings (CRITICAL)

> [!CAUTION]
> Do NOT enable public bucket access (`r2.dev`) or bind a public custom domain. VitaNet enforces strict time-limited access control via presigned GET URLs (15-minute validity).

1. In bucket settings, ensure **Public Access** is **Disabled**.
2. Public bucket URL (`pub-...r2.dev`) must remain **Off**.

---

## 3. CORS Configuration

Because web browsers directly upload to R2 using presigned PUT URLs, and display media from presigned GET URLs, R2 requires explicit CORS headers:

1. In bucket settings, click **Settings** tab.
2. Scroll to **CORS Policy** and click **Add CORS rule**.
3. Paste the following JSON policy:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://vitanet.pages.dev",
         "http://localhost:5173",
         "http://localhost:3000"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "HEAD"
       ],
       "AllowedHeaders": [
         "Content-Type"
       ],
       "ExposeHeaders": [
         "ETag"
       ],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Click **Save**.

---

## 4. R2 API Token Generation

1. In R2 Overview, click **Manage R2 API Tokens** on the right side.
2. Click **Create API token**.
3. **Token name**: `vitanet-server-presigner`.
4. **Permissions**: `Object Read & Write`.
5. **Specify bucket**: `vitanet-media-prod`.
6. Click **Create API Token**.
7. Note down the credentials:
   - **Access Key ID**: `R2_ACCESS_KEY_ID`
   - **Secret Access Key**: `R2_SECRET_ACCESS_KEY`
   - **Endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 5. Server Environment Configuration

Add these variables to `server/.env` and Render dashboard:

```env
R2_ACCOUNT_ID=<YOUR_CLOUDFLARE_ACCOUNT_ID>
R2_ACCESS_KEY_ID=<YOUR_ACCESS_KEY_ID>
R2_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY>
R2_BUCKET_NAME=vitanet-media-prod
```
