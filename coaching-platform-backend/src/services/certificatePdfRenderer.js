import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { getBrandingForPdf } from './certificateBrandingService.js';

const PAGE_W = 842;
const PAGE_H = 595;

const COLORS = {
    navy: '#0f172a',
    blue: '#1d4ed8',
    gold: '#c9a227',
    slate: '#334155',
    muted: '#64748b',
    panel: '#f8fafc',
    watermark: '#94a3b8',
};

const fileExists = async (p) => {
    if (!p) return false;
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
};

const drawOuterFrame = (doc) => {
    doc.save();
    doc.rect(22, 22, PAGE_W - 44, PAGE_H - 44).lineWidth(1.5).stroke(COLORS.gold);
    doc.rect(30, 30, PAGE_W - 60, PAGE_H - 60).lineWidth(0.75).stroke(COLORS.navy);
    doc.restore();
};

const drawCornerWatermarks = (doc, logoPath) => {
    if (!logoPath) return;
    const corners = [
        [42, 38],
        [PAGE_W - 118, 38],
        [42, PAGE_H - 108],
        [PAGE_W - 118, PAGE_H - 108],
    ];
    doc.save();
    doc.opacity(0.12);
    corners.forEach(([x, y]) => {
        try {
            doc.image(logoPath, x, y, { width: 76, height: 76, fit: [76, 76] });
        } catch {
            /* skip bad image */
        }
    });
    doc.restore();
};

const drawDiagonalWatermark = (doc) => {
    doc.save();
    doc.opacity(0.055);
    doc.fillColor(COLORS.blue);
    doc.font('Helvetica-Bold').fontSize(86);
    const text = 'VERBLE';
    const cx = PAGE_W / 2;
    const cy = PAGE_H / 2;
    doc.rotate(-32, { origin: [cx, cy] });
    doc.text(text, cx - 200, cy - 40, { width: 400, align: 'center' });
    doc.restore();
};

const drawInnerPanel = (doc) => {
    const x = 52;
    const y = 52;
    const w = PAGE_W - 104;
    const h = PAGE_H - 104;
    doc.save();
    doc.roundedRect(x, y, w, h, 6).fill(COLORS.panel);
    doc.roundedRect(x, y, w, h, 6).lineWidth(2.5).stroke(COLORS.navy);
    doc.moveTo(x + 40, y + 18).lineTo(x + w - 40, y + 18).lineWidth(1).stroke(COLORS.gold);
    doc.restore();
    return { x, y, w, h };
};

/**
 * Renders an official-style course completion certificate PDF.
 */
export const renderCourseCertificatePdf = async ({
    outputPath,
    userName,
    courseTitle,
    certificateNumber,
    verificationCode,
    completionPercent,
    assessmentScore,
    issuedAt = new Date(),
}) => {
    const branding = await getBrandingForPdf();
    const hasLogo = await fileExists(branding.logoPath);
    const hasSignature = await fileExists(branding.signaturePath);

    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    doc.rect(0, 0, PAGE_W, PAGE_H).fill('#ffffff');

    drawDiagonalWatermark(doc);
    if (hasLogo) drawCornerWatermarks(doc, branding.logoPath);
    drawOuterFrame(doc);
    drawInnerPanel(doc);

    const centerY = (y) => y;

    if (hasLogo) {
        try {
            doc.image(branding.logoPath, PAGE_W / 2 - 44, 68, { width: 88, fit: [88, 88] });
        } catch {
            /* skip */
        }
    }

    doc.font('Helvetica').fontSize(11).fillColor(COLORS.muted).text(
        branding.issuerTagline.toUpperCase(),
        0,
        centerY(118),
        { align: 'center', characterSpacing: 1.2 }
    );

    doc.font('Helvetica-Bold').fontSize(30).fillColor(COLORS.navy).text(
        'Certificate of Completion',
        0,
        centerY(142),
        { align: 'center' }
    );

    doc.moveTo(PAGE_W / 2 - 120, centerY(178)).lineTo(PAGE_W / 2 + 120, centerY(178)).lineWidth(1).stroke(COLORS.gold);

    doc.font('Helvetica').fontSize(14).fillColor(COLORS.slate).text('This is to certify that', 0, centerY(198), {
        align: 'center',
    });

    doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.blue).text(
        String(userName).toUpperCase(),
        0,
        centerY(222),
        { align: 'center' }
    );

    doc.font('Helvetica').fontSize(14).fillColor(COLORS.slate).text('has successfully completed', 0, centerY(262), {
        align: 'center',
    });

    doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.navy).text(courseTitle, 72, centerY(286), {
        align: 'center',
        width: PAGE_W - 144,
    });

    const statsY = centerY(340);
    doc.font('Helvetica').fontSize(12).fillColor(COLORS.slate);
    doc.text(`Course completion: ${completionPercent}%`, 0, statsY, { align: 'center' });
    if (typeof assessmentScore === 'number') {
        doc.text(`Final assessment score: ${assessmentScore}%`, 0, statsY + 18, { align: 'center' });
    }

    const issuedStr = issuedAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.muted).text(`Issued on ${issuedStr}`, 0, centerY(378), {
        align: 'center',
    });

    const sigX = 118;
    const sigY = centerY(418);
    if (hasSignature) {
        try {
            doc.image(branding.signaturePath, sigX, sigY - 8, { width: 120, height: 48, fit: [120, 48] });
        } catch {
            doc.moveTo(sigX, sigY + 28).lineTo(sigX + 160, sigY + 28).lineWidth(0.75).stroke(COLORS.navy);
        }
    } else {
        doc.moveTo(sigX, sigY + 28).lineTo(sigX + 160, sigY + 28).lineWidth(0.75).stroke(COLORS.navy);
    }

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.navy).text(branding.signatoryName, sigX, sigY + 36, {
        width: 200,
    });
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text(branding.signatoryTitle, sigX, sigY + 52, {
        width: 220,
    });

    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
    doc.text(`Certificate No. ${certificateNumber}`, 0, centerY(468), { align: 'center' });
    doc.text(`Verify: ${verificationCode}`, 0, centerY(484), { align: 'center' });

    doc.end();

    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });

    return { pdfPath: outputPath };
};
