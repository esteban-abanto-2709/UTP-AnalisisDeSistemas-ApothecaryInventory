import { INestApplication } from '@nestjs/common';
import { Agente, crearApp, hoy, nombreUnico, sesion } from './setup';

type Rotacion = {
  filas: { medicamentoId: number; unidades: number; importe: string }[];
  totales: { unidades: number; importe: string };
};

type VentasDiarias = {
  filas: { fecha: string; comprobantes: number; total: string }[];
  totales: { comprobantes: number; total: string };
};

describe('Reportes (e2e)', () => {
  let app: INestApplication;
  let admin: Agente;
  const rango = { desde: hoy(), hasta: hoy() };

  beforeAll(async () => {
    app = await crearApp();
    admin = await sesion(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const ventasDiarias = async (): Promise<VentasDiarias> => {
    const res = await admin
      .get('/reportes/ventas-diarias')
      .query(rango)
      .expect(200);
    return res.body;
  };

  const rotacion = async (): Promise<Rotacion> => {
    const res = await admin.get('/reportes/rotacion').query(rango).expect(200);
    return res.body;
  };

  it('el reporte diario refleja exactamente la venta registrada', async () => {
    const antes = await ventasDiarias();

    const producto = await admin
      .post('/productos')
      .send({ nombre: nombreUnico('Reportable'), precio: 12.5 })
      .expect(201);
    await admin
      .post('/lotes')
      .send({
        codigo: nombreUnico('LR'),
        medicamentoId: producto.body.id,
        fechaVencimiento: '2029-12-31',
        stockInicial: 20,
      })
      .expect(201);

    const venta = await admin
      .post('/ventas')
      .send({
        tipoComprobante: 'BOLETA',
        metodoPago: 'EFECTIVO',
        items: [{ medicamentoId: producto.body.id, cantidad: 4 }],
      })
      .expect(201);

    expect(Number(venta.body.total)).toBe(50);

    const despues = await ventasDiarias();
    expect(despues.totales.comprobantes).toBe(antes.totales.comprobantes + 1);
    expect(Number(despues.totales.total)).toBeCloseTo(
      Number(antes.totales.total) + 50,
      2,
    );

    const fila = despues.filas.find((f) => f.fecha === hoy());
    expect(fila).toBeDefined();
    expect(fila!.comprobantes).toBeGreaterThan(0);
  });

  it('la rotación acumula las unidades vendidas por producto', async () => {
    const producto = await admin
      .post('/productos')
      .send({ nombre: nombreUnico('Rotativo'), precio: 6 })
      .expect(201);
    await admin
      .post('/lotes')
      .send({
        codigo: nombreUnico('LT'),
        medicamentoId: producto.body.id,
        fechaVencimiento: '2029-12-31',
        stockInicial: 30,
      })
      .expect(201);

    const antes = await rotacion();

    for (const cantidad of [3, 5]) {
      await admin
        .post('/ventas')
        .send({
          tipoComprobante: 'BOLETA',
          metodoPago: 'EFECTIVO',
          items: [{ medicamentoId: producto.body.id, cantidad }],
        })
        .expect(201);
    }

    const despues = await rotacion();
    const fila = despues.filas.find(
      (f) => f.medicamentoId === producto.body.id,
    );

    expect(fila).toBeDefined();
    expect(fila!.unidades).toBe(8);
    expect(Number(fila!.importe)).toBe(48);
    expect(despues.totales.unidades).toBe(antes.totales.unidades + 8);
  });

  it('un rango sin ventas devuelve ceros', async () => {
    const res = await admin
      .get('/reportes/ventas-diarias')
      .query({ desde: '2001-01-01', hasta: '2001-01-03' })
      .expect(200);

    expect(res.body.filas).toHaveLength(3);
    expect(res.body.totales).toEqual({ comprobantes: 0, total: '0.00' });
  });

  it.each([['/reportes/ventas-diarias'], ['/reportes/rotacion']])(
    '%s rechaza rango invertido con 400',
    (ruta) =>
      admin
        .get(ruta)
        .query({ desde: '2025-05-10', hasta: '2025-05-01' })
        .expect(400),
  );

  it.each([['/reportes/ventas-diarias'], ['/reportes/rotacion']])(
    '%s rechaza rango mayor a 366 días con 400',
    (ruta) =>
      admin
        .get(ruta)
        .query({ desde: '2020-01-01', hasta: '2025-01-01' })
        .expect(400),
  );

  it.each([['/reportes/ventas-diarias'], ['/reportes/rotacion']])(
    '%s rechaza fechas inválidas con 400',
    (ruta) =>
      admin.get(ruta).query({ desde: 'ayer', hasta: 'hoy' }).expect(400),
  );
});
