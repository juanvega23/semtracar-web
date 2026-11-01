import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Invoice, InvoiceDetail } from '@/features/facturacion';
import { formatDateTime, formatInvoiceNumber, formatUSD } from '@/lib/format';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#172940' },
  title: { fontSize: 24, color: '#ef7b20', marginBottom: 6 },
  heading: { fontSize: 14, marginBottom: 12 },
  section: { marginTop: 18, marginBottom: 6, fontSize: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  description: { flex: 1 },
  amount: { width: 90, textAlign: 'right' },
  total: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  note: { marginTop: 20, color: '#64748b', fontSize: 9 },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 8, color: '#64748b' },
});

export function ReceiptPdf({ invoice, detail }: { invoice: Invoice; detail: InvoiceDetail }) {
  const paid = detail.payments.reduce((sum, payment) => sum + Math.round(Number(payment.amount) * 100), 0);
  const balance = Math.max(0, Math.round(Number(invoice.total) * 100) - paid);
  return (
    <Document
      title={`${formatInvoiceNumber(invoice.invoice_number)} · SEMTRACAR`}
      author="SEMTRACAR"
      language="es"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>SEMTRACAR</Text>
        <Text style={styles.heading}>Recibo {formatInvoiceNumber(invoice.invoice_number)}</Text>
        <Text>Fecha: {formatDateTime(invoice.created_at)} (Managua)</Text>
        <Text>Estado: {invoice.status}</Text>
        {invoice.notes && <Text>{invoice.notes}</Text>}
        {detail.client && (
          <View>
            <Text>
              Cliente: {detail.client.name} {detail.client.last_name}
            </Text>
            <Text>Casillero: {detail.client.casillero}</Text>
          </View>
        )}
        <Text style={styles.section}>Detalle de paquetes</Text>
        {detail.items.map((item) => (
          <View key={item.id} style={styles.row} wrap={false}>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.amount}>{formatUSD(item.amount)}</Text>
          </View>
        ))}
        {[
          ['Subtotal', invoice.subtotal],
          ['Impuesto', invoice.tax_amount],
          ['Delivery', invoice.has_delivery ? invoice.delivery_cost : 0],
          ['Total', invoice.total],
          ['Pagado', paid / 100],
          ['Saldo pendiente', balance / 100],
        ].map(([label, amount]) => (
          <View key={label} style={styles.row} wrap={false}>
            <Text>{label}</Text>
            <Text style={styles.total}>{formatUSD(amount)}</Text>
          </View>
        ))}
        <Text style={styles.section}>Pagos registrados</Text>
        {detail.payments.length ? (
          detail.payments.map((payment) => (
            <View key={payment.id} style={styles.row} wrap={false}>
              <Text style={styles.description}>
                {formatDateTime(payment.paid_at)} · {payment.method.replaceAll('_', ' ')}
                {payment.reference ? ` · ${payment.reference}` : ''}
              </Text>
              <Text style={styles.amount}>{formatUSD(payment.amount)}</Text>
            </View>
          ))
        ) : (
          <Text>No hay pagos registrados.</Text>
        )}
        <Text style={styles.note}>
          {invoice.status === 'anulada'
            ? 'RECIBO ANULADO. No válido para retiro.'
            : 'El retiro se valida en sucursal con el número REC y el estado actualizado del pago.'}
        </Text>
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `SEMTRACAR · USD · ${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
