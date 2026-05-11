import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!', 'salt', 32);

/**
 * Encrypt a sensitive string
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Return IV + AuthTag + Ciphertext
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a sensitive string
 */
export const decrypt = (text: string): string => {
  const [ivHex, tagHex, encryptedHex] = text.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Mask a sensitive string (e.g., API key) 
 * Shows only the last 4 characters and masks the rest
 */
export const maskKey = (key: string): string => {
  if (!key || key.length < 8) return '********';
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
};
