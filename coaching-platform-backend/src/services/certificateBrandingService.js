import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import CertificateBranding from '../models/CertificateBranding.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BRANDING_DIR = path.join(__dirname, '../../uploads/certificates/branding');
export const DEFAULT_LOGO_FILENAME = 'verble-logo.png';
export const SIGNATURE_FILENAME = 'signatory-signature.png';

const DEFAULT_LOGO_CANDIDATES = [
    path.join(BRANDING_DIR, DEFAULT_LOGO_FILENAME),
    path.join(__dirname, '../../../coaching-platform-frontend/public/verble-logo.png'),
    path.join(__dirname, '../../../coaching-platform-frontend/src/assets/images/primary-logo.png'),
];

export const getBrandingDir = () => BRANDING_DIR;

const validateBrandingAsset = async (absolutePath) => {
    const resolved = path.resolve(absolutePath);
    const brandingRoot = `${path.resolve(BRANDING_DIR)}${path.sep}`;
    if (!resolved.startsWith(brandingRoot)) throw new Error('Invalid branding asset path.');
    const metadata = await sharp(resolved, { failOn: 'error' }).metadata();
    if (!['png', 'jpeg', 'webp'].includes(metadata.format)) {
        throw new Error('Branding asset must be PNG, JPEG, or WebP.');
    }
    if (!metadata.width || !metadata.height || metadata.width > 5000 || metadata.height > 5000) {
        throw new Error('Branding image dimensions are invalid or too large.');
    }
    return resolved;
};

export const getDefaultLogoPath = async () => {
    const branding = await getCertificateBranding();
    if (branding.logoImagePath) {
        try {
            await fs.access(branding.logoImagePath);
            return branding.logoImagePath;
        } catch {
            /* fall through */
        }
    }
    for (const candidate of DEFAULT_LOGO_CANDIDATES) {
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            /* try next */
        }
    }
    return null;
};

export const getCertificateBranding = async () => {
    let doc = await CertificateBranding.findOne({ key: 'default' });
    if (!doc) {
        doc = await CertificateBranding.create({ key: 'default' });
    }
    return doc;
};

export const updateCertificateBranding = async (payload, userId) => {
    const doc = await getCertificateBranding();
    if (typeof payload.signatoryName === 'string') doc.signatoryName = payload.signatoryName.trim();
    if (typeof payload.signatoryTitle === 'string') doc.signatoryTitle = payload.signatoryTitle.trim();
    if (typeof payload.issuerTagline === 'string') doc.issuerTagline = payload.issuerTagline.trim();
    if (userId) doc.updatedBy = userId;
    await doc.save();
    return doc;
};

export const setSignatureImagePath = async (absolutePath, userId) => {
    absolutePath = await validateBrandingAsset(absolutePath);
    const doc = await getCertificateBranding();
    doc.signatureImagePath = absolutePath;
    if (userId) doc.updatedBy = userId;
    await doc.save();
    return doc;
};

export const setLogoImagePath = async (absolutePath, userId) => {
    absolutePath = await validateBrandingAsset(absolutePath);
    const doc = await getCertificateBranding();
    doc.logoImagePath = absolutePath;
    if (userId) doc.updatedBy = userId;
    await doc.save();
    return doc;
};

export const ensureBrandingAssets = async () => {
    await fs.mkdir(BRANDING_DIR, { recursive: true });
    const destLogo = path.join(BRANDING_DIR, DEFAULT_LOGO_FILENAME);
    try {
        await fs.access(destLogo);
    } catch {
        for (const candidate of DEFAULT_LOGO_CANDIDATES) {
            if (candidate === destLogo) continue;
            try {
                await fs.copyFile(candidate, destLogo);
                const doc = await getCertificateBranding();
                doc.logoImagePath = destLogo;
                await doc.save();
                break;
            } catch {
                /* try next */
            }
        }
    }
};

export const brandingForApi = async (branding) => {
    await ensureBrandingAssets();
    const logoPath = await getDefaultLogoPath();
    return {
        signatoryName: branding.signatoryName,
        signatoryTitle: branding.signatoryTitle,
        issuerTagline: branding.issuerTagline,
        hasSignature: Boolean(branding.signatureImagePath),
        hasLogo: Boolean(logoPath),
        signatureUrl: branding.signatureImagePath
            ? '/api/admin/certificates/branding/signature-image'
            : null,
        logoUrl: logoPath ? '/api/admin/certificates/branding/logo-image' : null,
        updatedAt: branding.updatedAt,
    };
};

export const getBrandingForPdf = async () => {
    await ensureBrandingAssets();
    const branding = await getCertificateBranding();
    const logoPath = await getDefaultLogoPath();
    let signaturePath = null;
    if (branding.signatureImagePath) {
        try {
            await fs.access(branding.signatureImagePath);
            signaturePath = branding.signatureImagePath;
        } catch {
            signaturePath = null;
        }
    }
    return {
        signatoryName: branding.signatoryName || 'Authorized Signatory',
        signatoryTitle: branding.signatoryTitle || 'Verble',
        issuerTagline: branding.issuerTagline || 'Speak with confidence.',
        logoPath,
        signaturePath,
    };
};
