import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BRANDING_DIR } from '../services/certificateBrandingService.js';

if (!fs.existsSync(BRANDING_DIR)) {
    fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

const imageFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const signatureStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BRANDING_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        cb(null, `signatory-signature${ext}`);
    },
});

const logoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BRANDING_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        cb(null, `verble-logo${ext}`);
    },
});

export const uploadCertificateSignature = multer({
    storage: signatureStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
}).single('signature');

export const uploadCertificateLogo = multer({
    storage: logoStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
}).single('logo');
