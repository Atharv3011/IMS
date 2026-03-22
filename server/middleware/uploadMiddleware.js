import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadDir = path.join(process.cwd(), 'uploads', 'products');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const safeExt = extension || '.jpg';
        const baseName = path
            .basename(file.originalname || 'product-image', extension)
            .replace(/[^a-zA-Z0-9_-]/g, '-');
        cb(null, `${Date.now()}-${baseName}${safeExt}`);
    }
});

const imageFileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        return cb(null, true);
    }

    return cb(new Error('Only image files are allowed'), false);
};

const uploadProductImage = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export default uploadProductImage;
