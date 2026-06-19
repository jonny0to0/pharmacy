/**
 * Universal PII Masking Utility
 * Ensures sensitive data is partially hidden during administrative impersonation.
 */
export declare const maskEmail: (email?: string | null) => string | null;
export declare const maskPhone: (phone?: string | null) => string | null;
export declare const maskGSTIN: (gstin?: string | null) => string | null;
export declare const maskAddress: (address?: string | null) => string | null;
export declare const maskObject: (obj: any) => any;
//# sourceMappingURL=masking.d.ts.map