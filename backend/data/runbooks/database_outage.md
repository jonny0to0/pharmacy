# Runbook: Database Connection Outage

## 🚨 Scenario
The platform is reporting `database: DEGRADED` or 500 errors on all data-bound routes.

## 🛠️ Recovery Steps

### 1. Connectivity Check
Verify if the issue is Network or Process based.
- Ping the DB instance.
- Check connection pool saturation in `/system/health`.

### 2. Restart Protocol
If process is hung:
- Trigger instance restart.
- Monitor `connections` metric in health feed.

### 3. Failover Trigger
If primary instance is non-responsive:
- Promote Replica to Primary.
- Update `DATABASE_URL` and restart API services.

### 4. Backup Integrity
Verify no data loss occurred during the hang using `IntegrityService`.

---
*Created by: Platform Engineering*
