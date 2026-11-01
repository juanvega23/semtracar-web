import { render, screen } from '@testing-library/react';
import { ToastProvider } from '@/components/ui';
import type { Invoice } from '../services/invoicesService';
import { InvoiceDetailModal } from './InvoiceDetailModal';

const mocks = vi.hoisted(() => ({ role: 'cliente', detail: { items: [], payments: [] } }));
vi.mock('@/features/acceso', () => ({ useRequiredCurrentUser: () => ({ role: mocks.role }) }));
vi.mock('@/features/recibos', () => ({ ReceiptActions: () => <div>Descargas de recibo</div> }));
vi.mock('../hooks/useInvoices', () => ({
  useInvoiceDetail: () => ({ data: mocks.detail, isPending: false, isError: false }),
  useRegisterInvoicePayment: () => ({ isPending: false }),
  useCancelUnpaidInvoice: () => ({ isPending: false }),
}));
const invoice: Invoice = {
  id: 'i1',
  user_id: 'u1',
  invoice_number: 42,
  subtotal: 10,
  tax_amount: 0,
  has_delivery: false,
  delivery_cost: 0,
  total: 10,
  status: 'pendiente',
  created_at: '2026-11-01T12:00:00Z',
};

describe('recibo por rol', () => {
  it('cliente consulta importes y descargas sin controles de pago ni anulación', () => {
    mocks.role = 'cliente';
    render(
      <ToastProvider>
        <InvoiceDetailModal invoice={invoice} onClose={() => {}} />
      </ToastProvider>,
    );
    expect(screen.getByText('Saldo pendiente')).toBeInTheDocument();
    expect(screen.getByText('Descargas de recibo')).toBeInTheDocument();
    expect(screen.queryByText('Registrar pago')).not.toBeInTheDocument();
    expect(screen.queryByText('Anular recibo')).not.toBeInTheDocument();
  });
  it('admin conserva el cobro y anulación del T2', () => {
    mocks.role = 'admin';
    render(
      <ToastProvider>
        <InvoiceDetailModal invoice={invoice} onClose={() => {}} />
      </ToastProvider>,
    );
    expect(screen.getAllByText('Registrar pago').length).toBeGreaterThan(0);
    expect(screen.getByText('Anular recibo')).toBeInTheDocument();
  });
});
