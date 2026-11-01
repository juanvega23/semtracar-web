import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import type { Invoice, InvoiceDetail } from '@/features/facturacion';
import { formatInvoiceNumber } from '@/lib/format';
import { ReceiptQr } from './ReceiptQr';

export function ReceiptActions({ invoice, detail }: { invoice: Invoice; detail: InvoiceDetail }) {
  const [generating, setGenerating] = useState(false);
  const toast = useToast();
  async function downloadPdf() {
    if (generating) return;
    setGenerating(true);
    try {
      const [{ pdf }, { ReceiptPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ReceiptPdf'),
      ]);
      const blob = await pdf(<ReceiptPdf invoice={invoice} detail={detail} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formatInvoiceNumber(invoice.invoice_number)}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" loading={generating} onClick={() => void downloadPdf()}>
          Descargar PDF
        </Button>
        <p className="text-sm text-slate-500">Abre el PDF descargado para imprimirlo.</p>
      </div>
      {invoice.status === 'anulada' && (
        <p className="text-sm text-amber-700">Recibo anulado: su QR no autoriza el retiro.</p>
      )}
      {invoice.invoice_number != null ? (
        <ReceiptQr invoiceNumber={invoice.invoice_number} />
      ) : (
        <p className="text-sm text-amber-700">Este recibo no tiene un QR válido para retiro.</p>
      )}
    </div>
  );
}
