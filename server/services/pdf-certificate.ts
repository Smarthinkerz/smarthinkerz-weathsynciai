import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface CertificateData {
  userName: string;
  trackTitle: string;
  certificationName: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  completionDate: string;
  certificateId: string;
}

export function streamCertificatePdf(res: Response, data: CertificateData) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="WealthSync-Certificate-${data.certificateId}.pdf"`);

  doc.on('error', (err) => {
    console.error('[pdf-certificate] doc error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Certificate generation failed' });
    } else {
      res.end();
    }
  });
  res.on('error', (err) => {
    console.error('[pdf-certificate] response error:', err);
    try { doc.end(); } catch {}
  });

  doc.pipe(res);

  const w = doc.page.width;
  const h = doc.page.height;
  const gold = '#c9a961';
  const dark = '#1a1a1a';
  const muted = '#666666';

  // Outer ornamental border
  doc.lineWidth(4).strokeColor(gold).rect(30, 30, w - 60, h - 60).stroke();
  doc.lineWidth(1).strokeColor(gold).rect(40, 40, w - 80, h - 80).stroke();

  // Header — brand
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(36)
    .text('WealthSync AI', 0, 70, { align: 'center', width: w });

  doc.fillColor(muted).font('Helvetica').fontSize(10)
    .text('CERTIFICATE  OF  COMPLETION', 0, 120, { align: 'center', width: w, characterSpacing: 6 });

  // Decorative line
  doc.moveTo(w / 2 - 80, 145).lineTo(w / 2 + 80, 145).strokeColor(gold).lineWidth(1).stroke();

  // Awarded to
  doc.fillColor(muted).font('Helvetica').fontSize(14)
    .text('This certificate is proudly presented to', 0, 170, { align: 'center', width: w });

  // Recipient name (large + colored)
  doc.fillColor(gold).font('Helvetica-BoldOblique').fontSize(40)
    .text(data.userName, 0, 200, { align: 'center', width: w });

  // Underline below name
  doc.moveTo(w / 2 - 200, 260).lineTo(w / 2 + 200, 260).strokeColor('#dddddd').lineWidth(1).stroke();

  // Description
  doc.fillColor('#444444').font('Helvetica').fontSize(13)
    .text('For successfully completing the learning track', 0, 280, { align: 'center', width: w });

  doc.fillColor(dark).font('Helvetica-Bold').fontSize(22)
    .text(data.trackTitle, 0, 305, { align: 'center', width: w });

  doc.fillColor(muted).font('Helvetica').fontSize(11)
    .text(
      `Demonstrating proficiency in ${data.category} at the ${data.difficulty} level   ·   ${data.estimatedHours} hours of structured learning`,
      0, 345, { align: 'center', width: w }
    );

  // Badge box
  const badgeY = 380;
  const badgeText = data.certificationName;
  const badgeW = doc.widthOfString(badgeText, { font: 'Helvetica-Bold', size: 12 } as any) + 60;
  const badgeX = (w - badgeW) / 2;
  doc.roundedRect(badgeX, badgeY, badgeW, 30, 15).fillColor(gold).fill();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
    .text(badgeText, badgeX, badgeY + 9, { width: badgeW, align: 'center', characterSpacing: 2 });

  // Footer signature lines
  const footerY = h - 100;
  const colWidth = (w - 100) / 3;

  function footerCol(x: number, label: string, value: string) {
    doc.moveTo(x, footerY).lineTo(x + colWidth, footerY).strokeColor('#999999').lineWidth(0.5).stroke();
    doc.fillColor(muted).font('Helvetica').fontSize(9)
      .text(label, x, footerY + 6, { width: colWidth, align: 'center' });
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11)
      .text(value, x, footerY + 20, { width: colWidth, align: 'center' });
  }

  footerCol(50, 'DATE', data.completionDate);
  footerCol(50 + colWidth, 'CERTIFICATE ID', data.certificateId);
  footerCol(50 + colWidth * 2, 'ISSUED BY', 'WealthSync AI');

  doc.end();
}
