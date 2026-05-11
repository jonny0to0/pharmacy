# Runbook: Audit Integrity Failure (Forensic Protocol)

## 🚨 Scenario
Crytographic verification has failed for the Audit Log chain or an Anchor signature is invalid. This indicates potential database tampering or an unauthorized HSM access attempt.

## 🛠️ Recovery Steps

### 1. Identify the Breach Latitude
Verify precisely at which Log ID the chain broke.
- Use: `POST /api/v1/system/integrity/verify`
- Note the `brokenAt` ID.

### 2. Verify External Anchors
Check the `/secure-hsm-store/` for the corresponding date.
- Match the signed hash against the primary DB entry.
- If HSM matches the DB but verification fails, the Private Key may be compromised.

### 3. System Isolation
If forensics confirm unauthorized mutation:
- Suspend all Super Admin sessions.
- Rotate the Anchor Key immediately: `POST /api/v1/system/integrity/rotate-keys`.

### 4. Forensic Restoration
Restore the Audit Log table from the last known healthy backup (verified by HSM anchor).

### 5. Post-Mortem
Document the intrusion vector and update the Geo-Velocity thresholds if applicable.

---
*Created by: Security Operations Center (SOC)*
