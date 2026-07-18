import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, Agente, crearApp, dniUnico, servidor, sesion } from './setup';

describe('Autenticación y permisos (e2e)', () => {
  let app: INestApplication;
  let admin: Agente;
  const vendedor = { dni: dniUnico(), password: 'Vendedor123' };

  beforeAll(async () => {
    app = await crearApp();
    admin = await sesion(app);
    await admin
      .post('/usuarios')
      .send({
        dni: vendedor.dni,
        nombre: 'Vendedor de Prueba',
        rol: 'VENDEDOR',
        password: vendedor.password,
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('login', () => {
    it('devuelve el empleado y una cookie httpOnly', async () => {
      const res = await request(servidor(app))
        .post('/auth/login')
        .send(ADMIN)
        .expect(200);

      expect(res.body).toMatchObject({
        dni: ADMIN.dni,
        rol: 'ADMINISTRADOR',
      });
      expect(res.body).not.toHaveProperty('passwordHash');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.join(';')).toMatch(/token=.+HttpOnly/i);
    });

    it('rechaza contraseña incorrecta', () =>
      request(servidor(app))
        .post('/auth/login')
        .send({ dni: ADMIN.dni, password: 'incorrecta' })
        .expect(401));

    it('rechaza DNI inexistente', () =>
      request(servidor(app))
        .post('/auth/login')
        .send({ dni: '00000000', password: 'loquesea' })
        .expect(401));

    it('rechaza DNI con formato inválido', () =>
      request(servidor(app))
        .post('/auth/login')
        .send({ dni: '123', password: 'loquesea' })
        .expect(400));
  });

  describe('sesión', () => {
    it('/auth/me sin cookie devuelve 401', () =>
      request(servidor(app)).get('/auth/me').expect(401));

    it('/auth/me con cookie inválida devuelve 401', () =>
      request(servidor(app))
        .get('/auth/me')
        .set('Cookie', 'token=basura')
        .expect(401));

    it('/auth/me con sesión válida devuelve el usuario', async () => {
      const res = await admin.get('/auth/me').expect(200);
      expect(res.body).toMatchObject({ dni: ADMIN.dni, rol: 'ADMINISTRADOR' });
    });

    it('logout invalida la sesión del agente', async () => {
      const efimero = await sesion(app);
      await efimero.get('/auth/me').expect(200);
      await efimero.post('/auth/logout').expect(200);
      await efimero.get('/auth/me').expect(401);
    });
  });

  describe('roles', () => {
    let vendedorAgente: Agente;

    beforeAll(async () => {
      vendedorAgente = await sesion(app, vendedor.dni, vendedor.password);
    });

    it('el vendedor accede a rutas sin restricción de rol', async () => {
      await vendedorAgente.get('/productos').expect(200);
      await vendedorAgente.get('/clientes').expect(200);
    });

    it.each([
      ['/usuarios', 'usuarios'],
      ['/proveedores', 'proveedores'],
      ['/lotes', 'lotes'],
      ['/dashboard', 'dashboard'],
    ])('el vendedor recibe 403 en %s', (ruta) =>
      vendedorAgente.get(ruta).expect(403),
    );

    it('el vendedor recibe 403 al listar todas las ventas', () =>
      vendedorAgente.get('/ventas').expect(403));

    it('el administrador sí accede a esas rutas', async () => {
      await admin.get('/usuarios').expect(200);
      await admin.get('/proveedores').expect(200);
      await admin.get('/lotes').expect(200);
      await admin.get('/dashboard').expect(200);
    });

    it('sin sesión, una ruta protegida devuelve 401 y no 403', () =>
      request(servidor(app)).get('/usuarios').expect(401));
  });
});
