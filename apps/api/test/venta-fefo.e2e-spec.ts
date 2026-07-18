import { INestApplication } from '@nestjs/common';
import { Agente, crearApp, dniUnico, nombreUnico, sesion } from './setup';

type Lote = { id: number; codigo: string; stockActual: number };

describe('Venta con descuento FEFO (e2e)', () => {
  let app: INestApplication;
  let admin: Agente;
  let vendedor: Agente;

  beforeAll(async () => {
    app = await crearApp();
    admin = await sesion(app);

    const dni = dniUnico();
    await admin
      .post('/usuarios')
      .send({
        dni,
        nombre: 'Vendedor Caja',
        rol: 'VENDEDOR',
        password: 'Caja123456',
      })
      .expect(201);
    vendedor = await sesion(app, dni, 'Caja123456');
  });

  afterAll(async () => {
    await app.close();
  });

  const crearProducto = async (precio: number) => {
    const res = await admin
      .post('/productos')
      .send({ nombre: nombreUnico('Medicamento'), precio })
      .expect(201);
    return res.body.id as number;
  };

  const crearLote = async (
    medicamentoId: number,
    fechaVencimiento: string,
    stockInicial: number,
    descuento = 0,
  ) => {
    const res = await admin
      .post('/lotes')
      .send({
        codigo: nombreUnico('LOTE'),
        medicamentoId,
        fechaVencimiento,
        stockInicial,
        descuento,
      })
      .expect(201);
    return res.body.id as number;
  };

  const lotesDe = async (medicamentoId: number): Promise<Lote[]> => {
    const res = await admin.get('/lotes').query({ medicamentoId }).expect(200);
    return res.body;
  };

  const stockDe = async (medicamentoId: number): Promise<number> => {
    const res = await admin.get('/productos').expect(200);
    return res.body.find((p: { id: number }) => p.id === medicamentoId).stock;
  };

  it('descuenta primero el lote que vence antes y aplica su descuento', async () => {
    const medicamentoId = await crearProducto(10);
    const loteTardio = await crearLote(medicamentoId, '2028-01-01', 5);
    const loteProximo = await crearLote(medicamentoId, '2027-01-01', 3, 10);

    expect(await stockDe(medicamentoId)).toBe(8);

    const venta = await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [{ medicamentoId, cantidad: 5 }],
      })
      .expect(201);

    expect(Number(venta.body.total)).toBe(47);
    expect(Number(venta.body.detalles[0].subtotal)).toBe(47);
    expect(venta.body.detalles[0].cantidad).toBe(5);
    expect(Number(venta.body.detalles[0].precioUnitario)).toBe(10);

    const lotes = await lotesDe(medicamentoId);
    expect(lotes.find((l) => l.id === loteProximo)!.stockActual).toBe(0);
    expect(lotes.find((l) => l.id === loteTardio)!.stockActual).toBe(3);
    expect(await stockDe(medicamentoId)).toBe(3);
  });

  it('registra la venta a nombre del empleado autenticado', async () => {
    const medicamentoId = await crearProducto(5);
    await crearLote(medicamentoId, '2028-02-01', 10);

    const yo = await vendedor.get('/auth/me').expect(200);
    const venta = await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'TARJETA',
        items: [{ medicamentoId, cantidad: 1 }],
      })
      .expect(201);

    expect(venta.body.empleado.id).toBe(yo.body.id);
  });

  it('con stock insuficiente devuelve 409 y no descuenta nada', async () => {
    const medicamentoId = await crearProducto(20);
    await crearLote(medicamentoId, '2028-03-01', 4);

    const res = await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [{ medicamentoId, cantidad: 5 }],
      })
      .expect(409);

    expect(res.body.message).toMatch(/stock/i);
    expect(await stockDe(medicamentoId)).toBe(4);
    expect((await lotesDe(medicamentoId))[0].stockActual).toBe(4);
  });

  it('revierte la transacción completa si falla un ítem posterior', async () => {
    const bueno = await crearProducto(10);
    const escaso = await crearProducto(10);
    await crearLote(bueno, '2028-04-01', 10);
    await crearLote(escaso, '2028-04-01', 1);

    await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [
          { medicamentoId: bueno, cantidad: 5 },
          { medicamentoId: escaso, cantidad: 3 },
        ],
      })
      .expect(409);

    expect(await stockDe(bueno)).toBe(10);
    expect(await stockDe(escaso)).toBe(1);
  });

  it('no vende un producto dado de baja', async () => {
    const medicamentoId = await crearProducto(10);
    await crearLote(medicamentoId, '2028-05-01', 10);
    await admin
      .patch(`/productos/${medicamentoId}`)
      .send({ activo: false })
      .expect(200);

    await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [{ medicamentoId, cantidad: 1 }],
      })
      .expect(404);
  });

  it('ignora los lotes inactivos al calcular disponibilidad', async () => {
    const medicamentoId = await crearProducto(10);
    const loteA = await crearLote(medicamentoId, '2028-06-01', 5);
    await crearLote(medicamentoId, '2028-07-01', 5);

    await admin.patch(`/lotes/${loteA}`).send({ activo: false }).expect(200);
    expect(await stockDe(medicamentoId)).toBe(5);

    await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [{ medicamentoId, cantidad: 6 }],
      })
      .expect(409);

    const venta = await vendedor
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [{ medicamentoId, cantidad: 5 }],
      })
      .expect(201);

    expect(Number(venta.body.total)).toBe(50);
    const lotes = await lotesDe(medicamentoId);
    expect(lotes.find((l) => l.id === loteA)!.stockActual).toBe(5);
  });

  describe('comprobantes', () => {
    let medicamentoId: number;

    beforeAll(async () => {
      medicamentoId = await crearProducto(10);
      await crearLote(medicamentoId, '2029-01-01', 100);
    });

    const venta = (extra: Record<string, unknown>) => ({
      tipoComprobante: 'BOLETA',
      metodoPago: 'EFECTIVO',
      items: [{ medicamentoId, cantidad: 1 }],
      ...extra,
    });

    it('la boleta no exige cliente y usa la serie B001', async () => {
      const res = await vendedor.post('/ventas').send(venta({})).expect(201);
      expect(res.body.serie).toBe('B001');
      expect(res.body.cliente).toBeNull();
    });

    it('numera los comprobantes de forma correlativa por serie', async () => {
      const primera = await vendedor
        .post('/ventas')
        .send(venta({}))
        .expect(201);
      const segunda = await vendedor
        .post('/ventas')
        .send(venta({}))
        .expect(201);

      expect(segunda.body.serie).toBe(primera.body.serie);
      expect(segunda.body.numero).toBe(primera.body.numero + 1);
    });

    it('la factura sin cliente devuelve 400', () =>
      vendedor
        .post('/ventas')
        .send(venta({ tipoComprobante: 'FACTURA' }))
        .expect(400));

    it('la factura con cliente sin RUC devuelve 400', async () => {
      const cliente = await vendedor
        .post('/clientes')
        .send({
          tipoDocumento: 'DNI',
          numeroDocumento: dniUnico(),
          nombre: 'Cliente Con DNI',
        })
        .expect(201);

      await vendedor
        .post('/ventas')
        .send(venta({ tipoComprobante: 'FACTURA', clienteId: cliente.body.id }))
        .expect(400);
    });

    it('la factura con cliente RUC usa la serie F001', async () => {
      const cliente = await vendedor
        .post('/clientes')
        .send({
          tipoDocumento: 'RUC',
          numeroDocumento: `20${dniUnico()}0`,
          nombre: 'Empresa Cliente S.A.C.',
        })
        .expect(201);

      const res = await vendedor
        .post('/ventas')
        .send(venta({ tipoComprobante: 'FACTURA', clienteId: cliente.body.id }))
        .expect(201);

      expect(res.body.serie).toBe('F001');
      expect(res.body.cliente.id).toBe(cliente.body.id);
    });

    it('no vende a un cliente dado de baja', async () => {
      const cliente = await vendedor
        .post('/clientes')
        .send({
          tipoDocumento: 'DNI',
          numeroDocumento: dniUnico(),
          nombre: 'Cliente De Baja',
        })
        .expect(201);

      await admin
        .patch(`/clientes/${cliente.body.id}`)
        .send({ activo: false })
        .expect(200);

      await vendedor
        .post('/ventas')
        .send(venta({ clienteId: cliente.body.id }))
        .expect(404);
    });

    it.each([
      ['sin ítems', { items: [] }],
      ['cantidad 0', { items: [{ medicamentoId: 1, cantidad: 0 }] }],
      ['cantidad decimal', { items: [{ medicamentoId: 1, cantidad: 1.5 }] }],
      ['comprobante inválido', { tipoComprobante: 'TICKET' }],
      ['método de pago inválido', { metodoPago: 'TRUEQUE' }],
    ])('rechaza %s con 400', (_caso, patch) =>
      vendedor.post('/ventas').send(venta(patch)).expect(400),
    );
  });

  describe('consulta de ventas', () => {
    it('devuelve la venta con sus detalles', async () => {
      const medicamentoId = await crearProducto(8);
      await crearLote(medicamentoId, '2029-02-01', 10);

      const creada = await vendedor
        .post('/ventas')
        .send({
          tipoComprobante: 'BOLETA',
          metodoPago: 'YAPE_PLIN',
          items: [{ medicamentoId, cantidad: 2 }],
        })
        .expect(201);

      const leida = await vendedor.get(`/ventas/${creada.body.id}`).expect(200);
      expect(leida.body.detalles).toHaveLength(1);
      expect(Number(leida.body.total)).toBe(16);
    });

    it('devuelve 404 para una venta inexistente', () =>
      vendedor.get('/ventas/999999').expect(404));

    it('el administrador lista las ventas del día', async () => {
      const res = await admin.get('/ventas').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
