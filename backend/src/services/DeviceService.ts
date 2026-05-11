import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import crypto from 'crypto';
import { TRUSTED_DEVICE_CONFIG } from '../config/security.js';

interface DeviceTokenPayload {
  userId: string;
  deviceId: string;
  fingerprint: string;
}

export class DeviceService {
  private static SECRET = process.env.JWT_SECRET || 'trusted-device-secret-key-123';

  /**
   * Generates a signed token for a trusted device
   */
  static generateToken(userId: string, deviceId: string): string {
    const payload: DeviceTokenPayload = {
      userId,
      deviceId,
      fingerprint: `dev_${Math.random().toString(36).slice(2, 10)}` // Random unique salt
    };

    return jwt.sign(payload, this.SECRET, { expiresIn: `${TRUSTED_DEVICE_CONFIG.EXPIRY_DAYS}d` });
  }

  /**
   * Registers a device in the DB and returns the signed token
   */
  static async registerDevice(userId: string, deviceName: string): Promise<string> {
    const deviceId = `device_${Date.now()}`;
    const token = this.generateToken(userId, deviceId);
    
    await prisma.trusteddevice.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        fingerprint: token, // We use the signed token itself as the unique fingerprint
        deviceName,
        expiresAt: new Date(Date.now() + TRUSTED_DEVICE_CONFIG.EXPIRY_DAYS * 86400000)
      }
    });

    return token;
  }

  /**
   * Verifies if a token is valid and matches the user
   */
  static async verifyDevice(userId: string, token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.SECRET) as DeviceTokenPayload;
      if (decoded.userId !== userId) return false;

      const device = await prisma.trusteddevice.findUnique({
        where: { fingerprint: token }
      });

      if (!device || device.userId !== userId || new Date() > device.expiresAt) {
        return false;
      }

      // Update lastUsed (non-blocking)
      prisma.trusteddevice.update({
        where: { id: device.id },
        data: { lastUsed: new Date() }
      }).catch(() => {});

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Revokes all trusted devices for a user
   */
  static async revokeAll(userId: string) {
    await prisma.trusteddevice.deleteMany({
      where: { userId }
    });
  }

  /**
   * Lists all recognized hardware for a target user
   */
  static async listUserDevices(userId: string) {
    return await prisma.trusteddevice.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
      select: {
        id: true,
        deviceName: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true
      }
    });
  }

  /**
   * Granular Revocation: Invalidates trust for a specific hardware id
   */
  static async revokeDevice(id: string) {
    await prisma.trusteddevice.delete({
      where: { id }
    });
    console.warn(`🛡️ [DeviceService] Revoked trust for device ID: ${id}`);
  }
}
