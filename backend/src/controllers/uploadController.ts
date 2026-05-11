import { type Request, type Response } from 'express';
import storageService from '../services/storageService.js';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = (req.query.type as string) || 'general';
    
    // Check if it's an image type that needs processing
    const imageTypes = ['business-logo', 'user-avatar', 'product-image', 'business-banner', 'category-image', 'brand-image'];
    
    let result;
    if (imageTypes.includes(type) && req.file.mimetype.startsWith('image/')) {
      result = await storageService.uploadImage(req.file, type);
    } else {
      result = await storageService.uploadFile(req.file, type);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
};
