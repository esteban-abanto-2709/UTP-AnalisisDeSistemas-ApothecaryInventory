import { INestApplication } from '@nestjs/common';
import { Agente, crearApp, nombreUnico, rucUnico, sesion } from './setup';

const stockDe = async (admin: Agente, id: number): Promise<number> => {
  const res = await admin.get('/productos').expect(200);
  return res.body.find((p: { id: number }) => p.id === id).stock;
};

describe('Catálogo: proveedores, productos y lotes (e2e)', () => {
  let app: INestApplication;
  let admin: Agente;

  beforeAll(async () => {
    app = await crearApp();
    admin = await sesion(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('proveedores', () => {
    it('alta, listado y baja lógica', async () => {
      const ruc = rucUnico();
      const alta = await admin
        .post('/proveedores')
        .send({
          ruc,
          razonSocial: 'Droguería del Norte S.A.C.',
          asesorNombre: 'Luis Vega',
          asesorTelefono: '+51 999-888-777',
          asesorEmail: 'luis@drogueria.pe',
        })
        .expect(201);

      expect(alta.body).toMatchObject({ ruc, activo: true });

      await admin
        .patch(`/proveedores/${alta.body.id}`)
        .send({ activo: false })
        .expect(200);

      const lista = await admin.get('/proveedores').expect(200);
      expect(
        lista.body.find((p: { id: number }) => p.id === alta.body.id),
      ).toMatchObject({ activo: false });
    });

    it('rechaza RUC duplicado con 409', async () => {
      const ruc = rucUnico();
      await admin
        .post('/proveedores')
        .send({ ruc, razonSocial: 'Primera' })
        .expect(201);
      await admin
        .post('/proveedores')
        .send({ ruc, razonSocial: 'Segunda' })
        .expect(409);
    });

    it.each([
      ['RUC de 10 dígitos', { ruc: '1234567890' }],
      ['RUC con letras', { ruc: 'ABC12345678' }],
      ['razón social vacía', { razonSocial: '' }],
      ['email inválido', { asesorEmail: 'no-es-email' }],
      ['teléfono con letras', { asesorTelefono: 'llamar ya' }],
    ])('rechaza %s con 400', (_caso, patch) =>
      admin
        .post('/proveedores')
        .send({ ruc: rucUnico(), razonSocial: 'Válida', ...patch })
        .expect(400),
    );

    it('devuelve 404 al actualizar un proveedor inexistente', () =>
      admin
        .patch('/proveedores/999999')
        .send({ razonSocial: 'Fantasma' })
        .expect(404));
  });

  describe('productos', () => {
    it('nace con stock 0 hasta que tenga lotes', async () => {
      const res = await admin
        .post('/productos')
        .send({
          nombre: nombreUnico('Paracetamol 500mg'),
          precio: 1.5,
          stockMinimo: 10,
        })
        .expect(201);

      expect(res.body).toMatchObject({ stock: 0, activo: true });
      expect(Number(res.body.precio)).toBe(1.5);
    });

    it('rechaza nombre duplicado con 409', async () => {
      const nombre = nombreUnico('Ibuprofeno 400mg');
      await admin.post('/productos').send({ nombre, precio: 2 }).expect(201);
      await admin.post('/productos').send({ nombre, precio: 3 }).expect(409);
    });

    it.each([
      ['precio negativo', { precio: -1 }],
      ['precio con 3 decimales', { precio: 1.234 }],
      ['precio fuera de rango', { precio: 1000000 }],
      ['nombre vacío', { nombre: '' }],
      ['stock mínimo negativo', { stockMinimo: -5 }],
      ['stock mínimo decimal', { stockMinimo: 1.5 }],
    ])('rechaza %s con 400', (_caso, patch) =>
      admin
        .post('/productos')
        .send({ nombre: nombreUnico('Producto'), precio: 5, ...patch })
        .expect(400),
    );

    it('no permite fijar el stock directamente (whitelist)', async () => {
      const res = await admin
        .post('/productos')
        .send({ nombre: nombreUnico('Amoxicilina'), precio: 4, stock: 999 })
        .expect(201);

      expect(res.body.stock).toBe(0);
    });

    it('devuelve 404 al actualizar un producto inexistente', () =>
      admin.patch('/productos/999999').send({ precio: 9 }).expect(404));
  });

  describe('lotes y sincronía de stock', () => {
    let medicamentoId: number;

    beforeAll(async () => {
      const res = await admin
        .post('/productos')
        .send({ nombre: nombreUnico('Loratadina 10mg'), precio: 3 })
        .expect(201);
      medicamentoId = res.body.id;
    });

    it('cada lote suma su stock inicial al producto', async () => {
      await admin
        .post('/lotes')
        .send({
          codigo: nombreUnico('L1'),
          medicamentoId,
          fechaVencimiento: '2027-12-31',
          stockInicial: 40,
        })
        .expect(201);

      expect(await stockDe(admin, medicamentoId)).toBe(40);

      await admin
        .post('/lotes')
        .send({
          codigo: nombreUnico('L2'),
          medicamentoId,
          fechaVencimiento: '2028-06-30',
          stockInicial: 25,
          descuento: 15,
        })
        .expect(201);

      expect(await stockDe(admin, medicamentoId)).toBe(65);
    });

    it('ajustar el stock de un lote reajusta el del producto', async () => {
      const lote = await admin
        .post('/lotes')
        .send({
          codigo: nombreUnico('L3'),
          medicamentoId,
          fechaVencimiento: '2029-01-31',
          stockInicial: 10,
        })
        .expect(201);

      const antes = await stockDe(admin, medicamentoId);

      await admin
        .patch(`/lotes/${lote.body.id}`)
        .send({ stockActual: 4 })
        .expect(200);
      expect(await stockDe(admin, medicamentoId)).toBe(antes - 6);

      await admin
        .patch(`/lotes/${lote.body.id}`)
        .send({ activo: false })
        .expect(200);
      expect(await stockDe(admin, medicamentoId)).toBe(antes - 10);

      await admin
        .patch(`/lotes/${lote.body.id}`)
        .send({ activo: true })
        .expect(200);
      expect(await stockDe(admin, medicamentoId)).toBe(antes - 6);
    });

    it('no deja subir el stock del lote por encima de su stock inicial', async () => {
      const lote = await admin
        .post('/lotes')
        .send({
          codigo: nombreUnico('L4'),
          medicamentoId,
          fechaVencimiento: '2029-02-28',
          stockInicial: 5,
        })
        .expect(201);

      await admin
        .patch(`/lotes/${lote.body.id}`)
        .send({ stockActual: 6 })
        .expect(409);
    });

    it('rechaza código de lote duplicado para el mismo producto con 409', async () => {
      const codigo = nombreUnico('L5');
      const lote = {
        codigo,
        medicamentoId,
        fechaVencimiento: '2029-03-31',
        stockInicial: 3,
      };
      await admin.post('/lotes').send(lote).expect(201);
      await admin.post('/lotes').send(lote).expect(409);
    });

    it('rechaza un lote de un producto inexistente con 404', () =>
      admin
        .post('/lotes')
        .send({
          codigo: nombreUnico('L6'),
          medicamentoId: 999999,
          fechaVencimiento: '2029-04-30',
          stockInicial: 3,
        })
        .expect(404));

    it.each([
      ['stock inicial 0', { stockInicial: 0 }],
      ['stock inicial negativo', { stockInicial: -3 }],
      ['fecha inválida', { fechaVencimiento: 'ayer' }],
      ['descuento mayor a 100', { descuento: 120 }],
      ['descuento negativo', { descuento: -1 }],
      ['código vacío', { codigo: '' }],
    ])('rechaza %s con 400', (_caso, patch) =>
      admin
        .post('/lotes')
        .send({
          codigo: nombreUnico('LX'),
          medicamentoId,
          fechaVencimiento: '2029-05-31',
          stockInicial: 5,
          ...patch,
        })
        .expect(400),
    );

    it('filtra lotes por medicamentoId', async () => {
      const res = await admin
        .get('/lotes')
        .query({ medicamentoId })
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      expect(
        res.body.every(
          (l: { medicamentoId: number }) => l.medicamentoId === medicamentoId,
        ),
      ).toBe(true);
    });
  });
});
