# VitaNet — Backup & Disaster Recovery Guide

Procedures for snapshotting data and restoring platform operations in the event of an infrastructure incident.

---

## 1. Backup Strategy

VitaNet data is decoupled into two independent persistence layers:
1. **Metadata & Graph State**: Stored in MongoDB Atlas M0.
2. **Media Binaries**: Stored in Cloudflare R2 object storage.

### Automated Atlas Snapshots
MongoDB Atlas provides automated daily snapshots on the M0 tier. For offline contingency copies, use `mongodump`:

```bash
# Export collections
mongodump --uri="$MONGODB_URI" --gzip --archive=vitanet_backup_$(date +%Y%m%d).gz
```

### R2 Object Retention
Cloudflare R2 provides 99.999999999% (11 9s) of durability across multiple facilities. Accidental deletion is mitigated through soft deletion (`status: 'pending_delete'`) before permanent sweeps.

---

## 2. Disaster Recovery Protocol

If an unexpected outage or corrupted state occurs:

### Step 1: Drain Incoming Traffic
Deploy a maintenance page on Cloudflare Pages or set `_redirects` to point traffic to a maintenance banner.

### Step 2: Database Restoration
Restore from the latest `mongodump` archive:
```bash
mongorestore --uri="$MONGODB_URI" --drop --gzip --archive=vitanet_backup_YYYYMMDD.gz
```

### Step 3: Ledger Reconciliation
Execute the orphan media cleanup script to synchronize MongoDB's `MediaUsage` ledger with the physical R2 bucket contents:
```bash
node -e "import('./src/jobs/orphanCleanup.js').then(m => m.cleanOrphanMedia())"
```

### Step 4: Health Probe Verification
Verify `/health` and `/ready` return HTTP 200 before reopening client traffic.
