'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Button } from '@/ascendra-ui/components/ui/button';
import { LuDownload, LuLoader } from 'react-icons/lu';

interface ReportPdfExportButtonProps {
  /** PDF file name (without .pdf extension) */
  fileName: string;
  /** Button label — defaults to "Export PDF" */
  title?: string;
}

export function ReportPdfExportButton({
  fileName,
  title = 'Export PDF',
}: ReportPdfExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    const element = document.getElementById('report-content');
    if (!element) {
      alert('Report element not found');
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });

      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const printableW = pageW - margin * 2;
      const printableH = pageH - margin * 2;
      const pxToMm = printableW / img.naturalWidth;
      const totalHeightMm = img.naturalHeight * pxToMm;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      let offsetMm = 0;
      let isFirstPage = true;

      while (offsetMm < totalHeightMm) {
        const sliceHmm = Math.min(printableH, totalHeightMm - offsetMm);
        const sliceHpx = Math.round(sliceHmm / pxToMm);
        const offsetPx = Math.round(offsetMm / pxToMm);

        const slice = document.createElement('canvas');
        slice.width = img.naturalWidth;
        slice.height = sliceHpx;
        const ctx = slice.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(img, 0, -offsetPx);

        if (!isFirstPage) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, printableW, sliceHmm);

        offsetMm += sliceHmm;
        isFirstPage = false;
      }

      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(`PDF export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-print flex justify-end mt-6">
      <Button variant="secondary" size="sm" onClick={handleExport} disabled={loading}>
        {loading ? (
          <LuLoader className="size-3.5 animate-spin" />
        ) : (
          <LuDownload className="size-3.5" />
        )}
        {loading ? 'Generating…' : title}
      </Button>
    </div>
  );
}
