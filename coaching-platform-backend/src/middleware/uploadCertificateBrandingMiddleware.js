import multer from 'multer';
import fs from 'fs';
import { BRANDING_DIR } from '../services/certificateBrandingService.js';

if (!fs.existsSync(BRANDING_DIR)) {
    fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

const imageFilter = (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed.'), false);
    }
};

const signatureStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BRANDING_DIR),
    filename: (_req, file, cb) => {
        const ext = file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/webp' ? '.webp' : '.png';
        cb(null, `signatory-signature${ext}`);
    },
});

const logoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BRANDING_DIR),
    filename: (_req, file, cb) => {
        const ext = file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/webp' ? '.webp' : '.png';
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
