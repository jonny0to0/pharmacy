# Runbook: High Error Rate / API Instability

1. **Verify Deployment**: Check if a new version was pushed within the last 30m.
2. **Trace Correlations**: Use `requestId` from the alert to find the specific crash logs.
3. **Capacity Check**: Ensure memory usage isn't causing OOM restarts.
4. **Rollback**: If deployment-linked, revert to the previous Git SHA.

---

# Runbook: Impersonation Misuse / Session Anomaly

1. **Audit Logs**: Filter audit logs for `action: IMPERSONATION_STARTED`.
2. **Trace IP**: Check if the Admin's IP has changed (Geo-Velocity).
3. **Revoke Session**: Delete all sessions for the target Admin: `DELETE /auth/sessions/:adminId`.
4. **Notify Tenant**: Inform the tenant owner of the unauthorized access.
