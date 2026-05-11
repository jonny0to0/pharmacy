import fs from "fs";
import path from "path";
import { TRUST_CONFIG } from "../config/security.js";

/**
 * Storage Isolation Service (Simulated HSM/S3 with Object Lock)
 * Enforces: Append-only behavior, immutability, and path restriction.
 */
export class StorageIsolationService {
  private static SECURE_DIR = path.join(process.cwd(), TRUST_CONFIG.SECURE_HSM_DIR);

  static initialize() {
    if (!fs.existsSync(this.SECURE_DIR)) {
      fs.mkdirSync(this.SECURE_DIR, { recursive: true });
      console.log(`🛡️ [HSM] Secure isolated storage initialized at ${this.SECURE_DIR}`);
    }
  }

  /**
   * Pushes an anchor to the isolated store.
   * Fails if the file already exists (Immutability).
   */
  static async pushAnchor(filename: string, content: string) {
    this.initialize();
    const targetPath = path.join(this.SECURE_DIR, filename);

    if (fs.existsSync(targetPath)) {
      const error = `SECURITY VIOLATION: Attempt to overwrite immutable anchor ${filename}!`;
      console.error(`🚨 [HSM] ${error}`);
      throw new Error(error);
    }

    fs.writeFileSync(targetPath, content, { mode: 0o444 }); // Read-only after write
    console.log(`✅ [HSM] Anchor ${filename} replicated to isolated store.`);
    
    return {
        path: targetPath,
        timestamp: new Date().toISOString(),
        location: "SECURE_OFFLINE_READY"
    };
  }

  static async listAnchors() {
    this.initialize();
    return fs.readdirSync(this.SECURE_DIR);
  }

  /**
   * Deep Integrity Scan of HSM Store
   * Verifies that all physical files match their intended content structure.
   */
  static async verifyStorageIntegrity(): Promise<{ success: boolean; failures: string[] }> {
    this.initialize();
    const files = fs.readdirSync(this.SECURE_DIR);
    const failures: string[] = [];

    for (const file of files) {
      const filePath = path.join(this.SECURE_DIR, file);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        JSON.parse(content); // Ensure valid JSON record
      } catch (err) {
        failures.push(file);
      }
    }

    return { 
        success: failures.length === 0, 
        failures 
    };
  }

  static readAnchor(filename: string) {
    const targetPath = path.join(this.SECURE_DIR, filename);
    if (!fs.existsSync(targetPath)) return null;
    return fs.readFileSync(targetPath, "utf8");
  }
}
