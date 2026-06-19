import multer from 'multer';
// Use memory storage as it's more scalable for S3-ready architectures
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
        }
    },
});
//# sourceMappingURL=uploadMiddleware.js.map