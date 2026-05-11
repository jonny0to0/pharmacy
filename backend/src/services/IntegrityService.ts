import { createHash, sign, verify, constants } from "crypto";
import prisma from "../db.js";
import { AlertingService } from "./AlertingService.js";
import { KeyManagementService } from "./KeyManagementService.js";
import { StorageIsolationService } from "./StorageIsolationService.js";
import fs from "fs";
import path from "path";

const ANCHOR_FILE = path.join(process.cwd(), "data", "integrity_anchors.json");

export class IntegrityService {
  /**
   * Initializes the security context and ensures platform keys are available
   */
  static initialize() {
    KeyManagementService.initialize();
    StorageIsolationService.initialize();
    console.log("✅ [IntegrityService] Security environment (KMS + HSM) initialized.");
  }

  /**
   * Periodically traverses the entire hash chain to detect tampering
   */
  static async verifyChainIntegrity(): Promise<{ success: boolean; brokenAt?: string; message: string }> {
    try {
      const logs = await prisma.auditlog.findMany({
        orderBy: { createdAt: "asc" }
      });

      let expectedPrevHash = "0".repeat(64);

      for (const log of logs) {
        const metadata = log.metadata as any;
        if (!metadata || !metadata.currentHash || !metadata.prevHash) {
          await this.reportViolation(log.id, "Missing integrity metadata");
          return { success: false, brokenAt: log.id, message: "Audit metadata corruption detected." };
        }

        if (metadata.prevHash !== expectedPrevHash) {
          await this.reportViolation(log.id, "Hash chain link broken");
          return { success: false, brokenAt: log.id, message: `Integrity breach at Log ID: ${log.id}` };
        }

        const logData = JSON.stringify({
          userId: log.userId,
          module: log.module,
          action: log.action,
          targetId: log.entityId,
          severity: log.severity,
          ipAddress: log.ipAddress,
          impersonatedBy: (log as any).impersonatedBy,
          details: this.extractOriginalDetails(metadata)
        });

        const calculatedHash = createHash("sha256")
          .update(metadata.prevHash + logData)
          .digest("hex");

        if (calculatedHash !== metadata.currentHash) {
          await this.reportViolation(log.id, "Hash mismatch (Record tampered)");
          return { success: false, brokenAt: log.id, message: `Record tampering detected at Log ID: ${log.id}` };
        }

        expectedPrevHash = calculatedHash;
      }

      // Check against Anchor signature
      const anchorVerdict = await this.verifyAgainstAnchor(expectedPrevHash);
      if (!anchorVerdict.success) return anchorVerdict;

      return { success: true, message: "Audit chain integrity and key signatures verified." };
    } catch (error) {
      console.error("[IntegrityService] Verification failed:", error);
      return { success: false, message: "Verification process failed internally." };
    }
  }

  /**
   * Stores a signed anchor hash for daily state validation.
   * Replicates to HSM Isolated Store.
   */
  static async createDailyAnchor() {
    const latestLog = await prisma.auditlog.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!latestLog) return;

    const lastHash = (latestLog.metadata as any)?.currentHash;
    const activeKey = KeyManagementService.getActiveKey();
    
    // Sign the anchor hash to prevent forgery
    const signature = sign("sha256", Buffer.from(lastHash), {
        key: activeKey.privateKey,
        padding: constants.RSA_PKCS1_PSS_PADDING,
    }).toString("base64");

    const anchor = {
      date: new Date().toISOString().split('T')[0],
      keyId: activeKey.id,
      lastLogId: latestLog.id,
      hash: lastHash,
      signature,
      timestamp: new Date().toISOString()
    };

    // 1. Primary Store (Local)
    if (!fs.existsSync(path.dirname(ANCHOR_FILE))) {
        fs.mkdirSync(path.dirname(ANCHOR_FILE), { recursive: true });
    }
    const anchors = fs.existsSync(ANCHOR_FILE) ? JSON.parse(fs.readFileSync(ANCHOR_FILE, 'utf8')) : [];
    anchors.push(anchor);
    if (anchors.length > 30) anchors.shift();
    fs.writeFileSync(ANCHOR_FILE, JSON.stringify(anchors, null, 2));

    // 2. Secondary Store (HSM Isolated)
    const hsmFilename = `anchor-${anchor.date}.json`;
    await StorageIsolationService.pushAnchor(hsmFilename, JSON.stringify(anchor, null, 2));
  }

  /**
   * Performs a deep content scan of the isolated HSM store
   */
  static async verifyStorageIntegrity() {
    console.log("🔍 [IntegrityService] Starting deep HSM content scan...");
    const result = await StorageIsolationService.verifyStorageIntegrity();
    
    if (!result.success) {
      await AlertingService.notify(`🚨 [STORAGE BREACH] HSM content corruption detected in files: ${result.failures.join(', ')}`, "CRITICAL", "HSM_CORRUPTION");
    } else {
      console.log("✅ [IntegrityService] HSM store content verified.");
    }
    
    return result;
  }

  /**
   * Administrative Key Revocation
   */
  static async revokeKey(keyId: string, reason: string) {
    KeyManagementService.revokeKey(keyId, reason);
    await AlertingService.notify(`🚨 [KMS] Security Revocation: Key ${keyId} has been invalidated. Reason: ${reason}`, "CRITICAL", `REVOKE_${keyId}`);
  }

  private static async verifyAgainstAnchor(finalHash: string): Promise<{ success: boolean; message: string }> {
     if (!fs.existsSync(ANCHOR_FILE)) return { success: true, message: "No anchors to verify" };
     
     const anchors = JSON.parse(fs.readFileSync(ANCHOR_FILE, 'utf8'));
     if (anchors.length === 0) return { success: true, message: "Anchor list empty" };

     const latestAnchor = anchors[anchors.length - 1];
     const publicKey = KeyManagementService.getPublicKey(latestAnchor.keyId);

     // Check for Revocation
     const keyStatus = KeyManagementService.listKeys().find(k => k.id === latestAnchor.keyId)?.status;
     if (keyStatus === 'revoked') {
        return { success: false, message: `Anchor signed by REVOKED key: ${latestAnchor.keyId}. Audit trail status: CONTESTED.` };
     }

     // Validate Signature using the specific keyId that signed it
     const isSignedCorrectly = verify(
       "sha256",
       Buffer.from(latestAnchor.hash),
       {
         key: publicKey,
         padding: constants.RSA_PKCS1_PSS_PADDING,
       },
       Buffer.from(latestAnchor.signature, "base64")
     );

     if (!isSignedCorrectly) {
       await AlertingService.notify(`CRITICAL: Audit Anchor Signature Invalid! Key ID: ${latestAnchor.keyId}. Possible forgery.`, "CRITICAL");
       return { success: false, message: "Anchor signature verification failed." };
     }

     return { success: true, message: "Anchor signature matched." };
  }

  private static async reportViolation(logId: string, reason: string) {
    console.error(`🚨 [INTEGRITY BREACH] ${reason} at Log ${logId}`);
    await AlertingService.notify(`CRITICAL: Audit Integrity Breach: ${reason} at Log ID ${logId}.`, "CRITICAL", `BREACH_${logId}`);
  }

  private static extractOriginalDetails(metadata: any) {
    const { prevHash, currentHash, ...details } = metadata;
    return details;
  }
}
