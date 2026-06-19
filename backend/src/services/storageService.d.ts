export interface ImageObject {
    baseKey: string;
    urls: {
        thumb: string;
        medium: string;
        large: string;
        xlarge: string;
    };
}
declare class StorageService {
    private uploadDir;
    private publicDir;
    constructor();
    private ensureDirectoryExists;
    /**
     * Generates structured URLs for an image base key
     */
    getImageUrlObject(baseKey: string | null): ImageObject | null;
    /**
     * Uploads a file, processes multiple sizes as WebP, and stores original
     */
    uploadImage(file: Express.Multer.File, type: string): Promise<ImageObject>;
    /**
     * Standard file upload (non-processed)
     */
    uploadFile(file: Express.Multer.File, type: string): Promise<{
        url: string;
        key: string;
    }>;
    delete(key: string): Promise<void>;
}
declare const _default: StorageService;
export default _default;
//# sourceMappingURL=storageService.d.ts.map