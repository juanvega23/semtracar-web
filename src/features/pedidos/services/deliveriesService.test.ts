import {
  cancelDelivery,
  deliveryContactSchema,
  listDeliveryCandidates,
  notifyDeliverers,
  requestDelivery,
} from './deliveriesService';

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), invoke: vi.fn(), latest: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc, functions: { invoke: mocks.invoke } },
}));
vi.mock('@/features/paquetes', () => ({ getLatestStatuses: mocks.latest }));

function queryResult(result: unknown) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    neq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    maybeSingle: vi.fn(),
    then: (resolve: (value: unknown) => void) => Promise.resolve(result).then(resolve),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.neq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.range.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue(result);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.latest.mockResolvedValue({ p1: { status_id: 4 }, p2: { status_id: 4 } });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  mocks.invoke.mockResolvedValue({ data: { success: true }, error: null });
});

function prepare(invoices: unknown[]) {
  mocks.from.mockReturnValue(queryResult({ data: invoices, count: invoices.length, error: null }));
}

describe('solicitudes de delivery', () => {
  it('solicita un paquete y avisa a repartidores después del éxito', async () => {
    prepare([
      { id: 'i1', status: 'pendiente', has_delivery: false, items: [{ package_id: 'p1' }], payments: [] },
    ]);
    expect(await requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' })).toEqual({
      notified: true,
    });
    expect(mocks.rpc).toHaveBeenCalledWith('request_delivery', {
      p_invoice_id: 'i1',
      p_package_id: 'p1',
      p_delivery_address: 'Managua centro',
    });
    expect(mocks.invoke).toHaveBeenCalledWith('send-push-notification', {
      timeout: 10_000,
      body: { title: expect.any(String), body: expect.any(String), role: 'repartidor' },
    });
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.invoke.mock.invocationCallOrder[0]);
  });
  it('usa la RPC múltiple y conserva éxito si falla el push', async () => {
    prepare([
      {
        id: 'i1',
        status: 'pendiente',
        has_delivery: false,
        items: [{ package_id: 'p1' }, { package_id: 'p2' }],
        payments: [],
      },
    ]);
    mocks.invoke.mockRejectedValue(new Error('sin red'));
    await expect(
      requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' }),
    ).resolves.toEqual({ notified: false });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('request_delivery_multi', {
      p_package_ids: ['p1', 'p2'],
      p_delivery_address: 'Managua centro',
    });
  });
  it('no envía push si falla la creación del pedido', async () => {
    prepare([
      { id: 'i1', status: 'pendiente', has_delivery: false, items: [{ package_id: 'p1' }], payments: [] },
    ]);
    mocks.rpc.mockResolvedValue({ error: new Error('falló') });
    await expect(
      requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' }),
    ).rejects.toThrow();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('impide agrupar recibos con pagos y paquetes que no estén listos', async () => {
    prepare([
      {
        id: 'i1',
        status: 'parcial',
        has_delivery: false,
        items: [{ package_id: 'p1' }, { package_id: 'p2' }],
        payments: [{ id: 'pago' }],
      },
    ]);
    await expect(
      requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' }),
    ).rejects.toThrow(/sin pagos/);
    mocks.latest.mockResolvedValue({ p1: { status_id: 3 } });
    await expect(
      requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' }),
    ).rejects.toThrow(/listos/);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rechaza recibos ajenos, anulados o solicitados aunque cambie la selección', async () => {
    prepare([]);
    await expect(
      requestDelivery({ userId: 'u1', invoiceIds: ['ajeno'], address: 'Managua centro' }),
    ).rejects.toThrow(/disponible/);
    prepare([
      { id: 'i1', status: 'anulada', has_delivery: false, items: [{ package_id: 'p1' }], payments: [] },
    ]);
    await expect(
      requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' }),
    ).rejects.toThrow(/disponible/);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(['deliveries', 'delivery_packages'])(
    'rechaza pedidos previos, incluso cancelados, encontrados en %s',
    async (relation) => {
      prepare([
        {
          id: 'i1',
          status: 'pendiente',
          has_delivery: false,
          items: [
            {
              package_id: 'p1',
              package: { deliveries: [], delivery_packages: [], [relation]: [{ id: 'cancelado' }] },
            },
          ],
          payments: [],
        },
      ]);
      await expect(
        requestDelivery({ userId: 'u1', invoiceIds: ['i1'], address: 'Managua centro' }),
      ).rejects.toThrow(/aunque esté cancelado/);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it('deshabilita candidatos con un delivery previo y mantiene el retiro en sucursal', async () => {
    prepare([
      {
        id: 'i1',
        invoice_number: 1,
        total: 10,
        status: 'pendiente',
        delivery_choice: 'rechazado',
        items: [
          {
            id: 'item1',
            package_id: 'p1',
            description: 'Paquete',
            amount: 10,
            package: { deliveries: [], delivery_packages: [{ id: 'cancelado' }] },
          },
        ],
        payments: [],
      },
    ]);
    const result = await listDeliveryCandidates('u1', 0);
    expect(result.items[0]).toMatchObject({
      hasDelivery: true,
      canRequest: false,
      delivery_choice: 'rechazado',
    });
    expect(result.items[0].items[0]).not.toHaveProperty('package');
  });
  it('impide cancelar desde cliente o almacén', async () => {
    await expect(cancelDelivery('d1', 'cliente')).rejects.toThrow(/administración/);
    await expect(cancelDelivery('d1', 'almacen')).rejects.toThrow(/administración/);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('informa revisión administrativa si aparece un pago antes de cancelar', async () => {
    prepare([]);
    mocks.rpc.mockResolvedValue({
      error: { message: 'Este recibo tiene pagos: la cancelación requiere revisión administrativa' },
    });
    await expect(cancelDelivery('d1', 'admin')).rejects.toThrow(/revisión administrativa/);
    expect(mocks.rpc).toHaveBeenCalledWith('cancel_delivery', { p_delivery_id: 'd1' });
  });
  it('valida contacto y normaliza el teléfono antes de guardarlo', () => {
    expect(deliveryContactSchema.parse({ address: ' Managua centro ', phone: '+505 8888-1111' })).toEqual({
      address: 'Managua centro',
      phone: '88881111',
    });
    expect(deliveryContactSchema.safeParse({ address: '', phone: '123' }).success).toBe(false);
    expect(deliveryContactSchema.safeParse({ address: 'Managua centro', phone: '' }).success).toBe(false);
  });
  it('interpreta errores de aplicación del push aunque el HTTP sea exitoso', async () => {
    mocks.invoke.mockResolvedValue({ error: null, data: { success: false } });
    expect(await notifyDeliverers()).toBe(false);
  });
});
