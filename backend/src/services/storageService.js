import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
class StorageService {
    uploadDir;
    publicDir;
    constructor() {
        this.publicDir = path.join(process.cwd(), 'public');
        this.uploadDir = path.join(this.publicDir, 'uploads');
        this.ensureDirectoryExists(this.uploadDir);
    }
    ensureDirectoryExists(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    /**
     * Generates structured URLs for an image base key
     */
    getImageUrlObject(baseKey) {
        if (!baseKey)
            return null;
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
        // Base key is something like "business/logo/abc-123"
        // Folders are in uploads/webp/{size}/...
        return {
            baseKey,
            urls: {
                thumb: `${baseUrl}/uploads/webp/thumb/${baseKey}.webp`,
                medium: `${baseUrl}/uploads/webp/medium/${baseKey}.webp`,
                large: `${baseUrl}/uploads/webp/large/${baseKey}.webp`,
                xlarge: `${baseUrl}/uploads/webp/xlarge/${baseKey}.webp`,
            }
        };
    }
    /**
     * Uploads a file, processes multiple sizes as WebP, and stores original
     */
    async uploadImage(file, type) {
        const categoryPath = type.replace(/-/g, '/'); // e.g., 'business/logo'
        const fileName = uuidv4();
        const baseKey = `${categoryPath}/${fileName}`;
        // 1. Save Original Cropped Image
        const originalExt = path.extname(file.originalname) || '.png';
        const originalRelativePath = path.join('uploads', 'original', `${baseKey}${originalExt}`);
        const originalFullPath = path.join(this.publicDir, originalRelativePath);
        this.ensureDirectoryExists(path.dirname(originalFullPath));
        fs.writeFileSync(originalFullPath, file.buffer);
        // 2. Process WebP Sizes
        const sizes = {
            thumb: 150,
            medium: 500,
            large: 1000,
            xlarge: 1920
        };
        for (const [sizeName, width] of Object.entries(sizes)) {
            const webpRelativePath = path.join('uploads', 'webp', sizeName, `${baseKey}.webp`);
            const webpFullPath = path.join(this.publicDir, webpRelativePath);
            this.ensureDirectoryExists(path.dirname(webpFullPath));
            await sharp(file.buffer)
                .resize(width, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(webpFullPath);
        }
        return this.getImageUrlObject(baseKey);
    }
    /**
     * Standard file upload (non-processed)
     */
    async uploadFile(file, type) {
        const categoryPath = type.replace(/-/g, '/');
        const fullDirPath = path.join(this.uploadDir, categoryPath);
        this.ensureDirectoryExists(fullDirPath);
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const relativePath = path.join('uploads', categoryPath, fileName);
        const fullFilePath = path.join(this.publicDir, relativePath);
        fs.writeFileSync(fullFilePath, file.buffer);
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
        return {
            url: `${baseUrl}/${relativePath.replace(/\\/g, '/')}`,
            key: relativePath.replace(/\\/g, '/')
        };
    }
    async delete(key) {
        const fullPath = path.join(this.publicDir, key);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        // Also try to delete processed ones if it's a base key style
        const sizes = ['thumb', 'medium', 'large', 'xlarge'];
        for (const size of sizes) {
            const p = path.join(this.publicDir, 'uploads', 'webp', size, `${key}.webp`);
            if (fs.existsSync(p))
                fs.unlinkSync(p);
        }
    }
}
export default new StorageService();
//# sourceMappingURL=storageService.js.map