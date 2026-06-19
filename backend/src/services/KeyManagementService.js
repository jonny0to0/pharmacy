import { generateKeyPairSync } from "crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import fs from "fs";
const KEY_DIR = path.join(process.cwd(), "data", "keys");
const MANIFEST_PATH = path.join(KEY_DIR, "manifest.json");
export class KeyManagementService {
    static manifest = [];
    /**
     * Initializes the key directory and loads the manifest
     */
    static initialize() {
        if (!existsSync(KEY_DIR))
            mkdirSync(KEY_DIR, { recursive: true });
        if (existsSync(MANIFEST_PATH)) {
            this.manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
        }
        else {
            this.rotateKey("initial-root-key"); // Bootstrap
        }
    }
    /**
     * Generates a new RSA-4096 key pair and updates the manifest
     */
    static rotateKey(reason) {
        const keyId = `anchor-key-${Date.now()}`;
        console.log(`🔐 [KMS] Rotating key: ${keyId} (Reason: ${reason})`);
        const { privateKey, publicKey } = generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: { type: "pkcs1", format: "pem" },
            privateKeyEncoding: { type: "pkcs1", format: "pem" },
        });
        // Archive previous active keys
        this.manifest = this.manifest.map(kv => kv.status === 'active' ? { ...kv, status: 'archived' } : kv);
        const newVersion = {
            id: keyId,
            publicKey,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        this.manifest.push(newVersion);
        // Persist
        writeFileSync(path.join(KEY_DIR, `${keyId}.priv.pem`), privateKey, { mode: 0o600 });
        writeFileSync(path.join(KEY_DIR, `${keyId}.pub.pem`), publicKey);
        this.saveManifest();
        return keyId;
    }
    /**
     * Immediately invalidates a key for signing
     */
    static revokeKey(id, reason) {
        this.ensureInitialized();
        console.warn(`🚨 [KMS] REVOKING KEY: ${id} (Reason: ${reason})`);
        const index = this.manifest.findIndex(k => k.id === id);
        if (index === -1)
            throw new Error(`Key ${id} not found`);
        this.manifest[index].status = 'revoked';
        this.manifest[index].revokedAt = new Date().toISOString();
        this.manifest[index].revokedReason = reason;
        this.saveManifest();
    }
    static getActiveKey() {
        this.ensureInitialized();
        const active = this.manifest.find(k => k.status === 'active');
        if (!active)
            throw new Error("No active key found in KMS");
        return {
            id: active.id,
            privateKey: readFileSync(path.join(KEY_DIR, `${active.id}.priv.pem`), "utf8"),
            publicKey: active.publicKey
        };
    }
    static getPublicKey(id) {
        this.ensureInitialized();
        const key = this.manifest.find(k => k.id === id);
        if (!key)
            throw new Error(`Key version ${id} not found in manifest`);
        return key.publicKey;
    }
    static listKeys() {
        this.ensureInitialized();
        return this.manifest.map(({ id, createdAt, status }) => ({ id, createdAt, status }));
    }
    /**
     * Diagnostic: Assessment of revocation blast radius
     */
    static getKeyImpactReport(id) {
        this.ensureInitialized();
        // 1. Load Anchors (Local copy for speed)
        const anchorPath = path.join(process.cwd(), "data", "integrity_anchors.json");
        const anchors = fs.existsSync(anchorPath) ? JSON.parse(fs.readFileSync(anchorPath, "utf8")) : [];
        // 2. Filter for key exposure
        const dependentAnchors = anchors.filter((a) => a.keyId === id);
        const anchorCount = dependentAnchors.length;
        // 3. Last Usage
        const lastUsedAt = anchorCount > 0
            ? dependentAnchors[dependentAnchors.length - 1].timestamp
            : this.manifest.find(k => k.id === id)?.createdAt;
        // 4. Log Estimate (Conservative heuristic: Avg 150 logs per anchor in our simulation)
        const estimatedLogs = anchorCount * 180;
        return {
            id,
            anchorCount,
            estimatedLogs,
            lastUsedAt,
            isHighlyExposed: anchorCount > 10
        };
    }
    static saveManifest() {
        writeFileSync(MANIFEST_PATH, JSON.stringify(this.manifest, null, 2));
    }
    static ensureInitialized() {
        if (this.manifest.length === 0)
            this.initialize();
    }
}
//# sourceMappingURL=KeyManagementService.js.map