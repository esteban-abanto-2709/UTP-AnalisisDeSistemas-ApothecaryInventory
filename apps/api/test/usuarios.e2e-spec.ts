import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Agente, crearApp, dniUnico, servidor, sesion } from './setup';

describe('Registro y baja de usuarios (e2e)', () => {
  let app: INestApplication;
  let admin: Agente;

  beforeAll(async () => {
    app = await crearApp();
    admin = await sesion(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('flujo completo: alta → login → baja lógica → login bloqueado', async () => {
    const dni = dniUnico();
    const password = 'Secreto123';

    const alta = await admin
      .post('/usuarios')
      .send({ dni, nombre: 'María Pérez Ñuñez', rol: 'VENDEDOR', password })
      .expect(201);

    expect(alta.body).toMatchObject({
      dni,
      rol: 'VENDEDOR',
      activo: true,
    });
    expect(alta.body).not.toHaveProperty('passwordHash');
    const id: number = alta.body.id;

    await request(servidor(app))
      .post('/auth/login')
      .send({ dni, password })
      .expect(200);

    const lista = await admin.get('/usuarios').expect(200);
    expect(lista.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id, dni })]),
    );

    await admin.patch(`/usuarios/${id}`).send({ activo: false }).expect(200);

    const bloqueado = await request(servidor(app))
      .post('/auth/login')
      .send({ dni, password })
      .expect(401);
    expect(bloqueado.body.message).toMatch(/inactivo/i);

    const listaTrasBaja = await admin.get('/usuarios').expect(200);
    expect(
      listaTrasBaja.body.find((u: { id: number }) => u.id === id),
    ).toMatchObject({ activo: false });
  });

  it('cambiar la contraseña invalida la anterior y habilita la nueva', async () => {
    const dni = dniUnico();
    const alta = await admin
      .post('/usuarios')
      .send({
        dni,
        nombre: 'Carlos Rojas',
        rol: 'VENDEDOR',
        password: 'Antigua123',
      })
      .expect(201);

    await admin
      .patch(`/usuarios/${alta.body.id}`)
      .send({ password: 'Nueva123456' })
      .expect(200);

    await request(servidor(app))
      .post('/auth/login')
      .send({ dni, password: 'Antigua123' })
      .expect(401);

    await request(servidor(app))
      .post('/auth/login')
      .send({ dni, password: 'Nueva123456' })
      .expect(200);
  });

  it('rechaza DNI duplicado con 409', async () => {
    const dni = dniUnico();
    const usuario = {
      dni,
      nombre: 'Ana Torres',
      rol: 'VENDEDOR',
      password: 'Secreto123',
    };

    await admin.post('/usuarios').send(usuario).expect(201);
    await admin
      .post('/usuarios')
      .send({ ...usuario, nombre: 'Otra Persona' })
      .expect(409);
  });

  it('el administrador no puede desactivarse a sí mismo', async () => {
    const yo = await admin.get('/auth/me').expect(200);
    await admin
      .patch(`/usuarios/${yo.body.id}`)
      .send({ activo: false })
      .expect(400);
  });

  it('devuelve 404 al actualizar un empleado inexistente', () =>
    admin.patch('/usuarios/999999').send({ nombre: 'Fantasma' }).expect(404));

  describe('validaciones de alta', () => {
    const base = {
      nombre: 'Persona Válida',
      rol: 'VENDEDOR',
      password: 'Secreto123',
    };

    const casos: [string, Record<string, unknown>][] = [
      ['DNI de menos de 8 dígitos', { dni: '123' }],
      ['DNI no numérico', { dni: 'abcdefgh' }],
      ['nombre con dígitos', { nombre: 'Usuario 123' }],
      ['nombre vacío', { nombre: '' }],
      ['rol inexistente', { rol: 'SUPERVISOR' }],
      ['contraseña de menos de 6 caracteres', { password: 'abc' }],
    ];

    it.each(casos)('rechaza %s con 400', (_caso, patch) =>
      admin
        .post('/usuarios')
        .send({ dni: dniUnico(), ...base, ...patch })
        .expect(400),
    );

    it('ignora campos no declarados en el DTO (whitelist)', async () => {
      const res = await admin
        .post('/usuarios')
        .send({
          ...base,
          dni: dniUnico(),
          activo: false,
          passwordHash: 'inyectado',
        })
        .expect(201);

      expect(res.body.activo).toBe(true);
    });
  });
});
