/**
 * Encrypt a sensitive string
 */
export declare const encrypt: (text: string) => string;
/**
 * Decrypt a sensitive string
 */
export declare const decrypt: (text: string) => string;
/**
 * Mask a sensitive string (e.g., API key)
 * Shows only the last 4 characters and masks the rest
 */
export declare const maskKey: (key: string) => string;
//# sourceMappingURL=encryption.d.ts.map