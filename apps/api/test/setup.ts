import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

export const servidor = (app: INestApplication): App =>
  app.getHttpServer() as App;

export async function crearApp(): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = modulo.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

export const ADMIN = { dni: '12345678', password: 'Admin123' };

export async function sesion(
  app: INestApplication,
  dni = ADMIN.dni,
  password = ADMIN.password,
) {
  const agente = request.agent(servidor(app));
  await agente.post('/auth/login').send({ dni, password }).expect(200);
  return agente;
}

export type Agente = Awaited<ReturnType<typeof sesion>>;

let contador = 0;
const unico = () => `${Date.now()}${contador++}`;

export const dniUnico = () => unico().slice(-8);
export const rucUnico = () => unico().slice(-11);
export const nombreUnico = (base: string) => `${base}-${unico().slice(-8)}`;

export const hoy = () => new Date().toLocaleDateString('sv-SE');
