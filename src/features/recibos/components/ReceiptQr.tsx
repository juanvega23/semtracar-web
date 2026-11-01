import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, useToast } from '@/components/ui';
import { formatInvoiceNumber } from '@/lib/format';

/** El QR contiene solo el número REC que se valida en Retiro; nunca datos personales. */
export function ReceiptQr({ invoiceNumber }: { invoiceNumber: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const toast = useToast();
  const number = formatInvoiceNumber(invoiceNumber);
  function download() {
    try {
      if (!ref.current) return;
      const link = document.createElement('a');
      link.href = ref.current.toDataURL('image/png');
      link.download = `${number}-QR.png`;
      document.body.append(link);
      link.click();
      link.remove();
    } catch {
      toast.error('No se pudo descargar el QR. Intenta de nuevo.');
    }
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-4">
      <QRCodeCanvas ref={ref} value={number} size={192} marginSize={4} level="M" title={`QR de ${number}`} />
      <p className="font-mono text-sm">{number}</p>
      <Button variant="outline" size="sm" onClick={download}>
        Descargar QR (PNG)
      </Button>
    </div>
  );
}
