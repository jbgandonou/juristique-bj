import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalText } from './entities/legal-text.entity';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(LegalText)
    private readonly repo: Repository<LegalText>,
  ) {}

  private async getText(id: string): Promise<LegalText> {
    const text = await this.repo.findOne({
      where: { id },
      relations: ['country', 'themes'],
    });
    if (!text) throw new NotFoundException(`LegalText ${id} not found`);
    return text;
  }

  async exportPdf(id: string): Promise<Buffer> {
    const text = await this.getText(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(10).fillColor('#5F6477')
        .text('Juristique.bj — Droit africain francophone', { align: 'center' });
      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#E2E5EF');
      doc.moveDown(1);

      // Country & Type
      const country = text.country?.name || '';
      const textType = text.textType?.replace('_', ' ').toUpperCase() || '';
      doc.fontSize(9).fillColor('#5F6477')
        .text(`${country} — ${textType}`, { align: 'center' });
      doc.moveDown(0.5);

      // Title
      doc.fontSize(16).fillColor('#1A237E')
        .text(text.title, { align: 'center' });
      doc.moveDown(0.3);

      // Reference & Date
      if (text.reference) {
        doc.fontSize(10).fillColor('#5F6477')
          .text(text.reference, { align: 'center' });
      }
      if (text.promulgationDate) {
        const date = new Date(text.promulgationDate).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        doc.fontSize(10).fillColor('#5F6477')
          .text(`Promulgué le ${date}`, { align: 'center' });
      }
      doc.moveDown(0.5);

      // Status
      const status = text.isInForce ? 'EN VIGUEUR' : 'ABROGÉ';
      doc.fontSize(9).fillColor(text.isInForce ? '#2E7D32' : '#C62828')
        .text(status, { align: 'center' });
      doc.moveDown(1);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#E2E5EF');
      doc.moveDown(1);

      // Summary
      if (text.summary) {
        doc.fontSize(11).fillColor('#1A237E').text('Résumé', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#1A1D2E').text(text.summary, { lineGap: 4 });
        doc.moveDown(1);
      }

      // Content
      if (text.contentText) {
        doc.fontSize(11).fillColor('#1A237E').text('Texte intégral', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#1A1D2E').text(text.contentText, { lineGap: 4 });
      }

      // Themes
      if (text.themes?.length) {
        doc.moveDown(1);
        doc.fontSize(9).fillColor('#5F6477')
          .text(`Thèmes : ${text.themes.map(t => t.name).join(', ')}`);
      }

      // Footer
      doc.moveDown(2);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke('#E2E5EF');
      doc.moveDown(0.5);
      doc.fontSize(8).fillColor('#9CA3AF')
        .text(`Document généré par Juristique.bj le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.fontSize(8).text('Ce document est fourni à titre informatif. Seul le texte publié au Journal Officiel fait foi.', { align: 'center' });

      doc.end();
    });
  }

  async exportWord(id: string): Promise<Buffer> {
    const text = await this.getText(id);

    const children: any[] = [];

    // Header
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Juristique.bj — Droit africain francophone', size: 18, color: '5F6477' })],
    }));

    // Country & Type
    const country = text.country?.name || '';
    const textType = text.textType?.replace('_', ' ').toUpperCase() || '';
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: `${country} — ${textType}`, size: 18, color: '5F6477' })],
    }));

    // Title
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: text.title, bold: true, size: 28, color: '1A237E' })],
    }));

    // Reference
    if (text.reference) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: text.reference, size: 20, color: '5F6477' })],
      }));
    }

    // Date
    if (text.promulgationDate) {
      const date = new Date(text.promulgationDate).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Promulgué le ${date}`, size: 20, color: '5F6477' })],
      }));
    }

    // Status
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      children: [new TextRun({
        text: text.isInForce ? 'EN VIGUEUR' : 'ABROGÉ',
        bold: true,
        size: 18,
        color: text.isInForce ? '2E7D32' : 'C62828',
      })],
    }));

    // Summary
    if (text.summary) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
        children: [new TextRun({ text: 'Résumé', bold: true, size: 24, color: '1A237E' })],
      }));
      children.push(new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [new TextRun({ text: text.summary, size: 20 })],
      }));
    }

    // Content
    if (text.contentText) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
        children: [new TextRun({ text: 'Texte intégral', bold: true, size: 24, color: '1A237E' })],
      }));

      const paragraphs = text.contentText.split('\n').filter(p => p.trim());
      for (const para of paragraphs) {
        children.push(new Paragraph({
          spacing: { before: 80 },
          children: [new TextRun({ text: para.trim(), size: 20 })],
        }));
      }
    }

    // Footer
    children.push(new Paragraph({
      spacing: { before: 400 },
      children: [new TextRun({
        text: `Document généré par Juristique.bj le ${new Date().toLocaleDateString('fr-FR')}. Ce document est fourni à titre informatif.`,
        size: 16, color: '9CA3AF', italics: true,
      })],
    }));

    const doc = new Document({
      sections: [{ children }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }

  formatCitation(text: LegalText): string {
    const parts: string[] = [];
    if (text.reference) parts.push(text.reference);
    parts.push(text.title);
    if (text.country?.name) parts.push(text.country.name);
    if (text.promulgationDate) {
      const date = new Date(text.promulgationDate).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      parts.push(date);
    }
    parts.push('[En ligne] Juristique.bj');
    return parts.join(', ');
  }
}
