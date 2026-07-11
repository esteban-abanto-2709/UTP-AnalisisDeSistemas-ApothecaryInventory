import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma/client';

export async function seedBase(prisma: PrismaClient) {
  await prisma.empleado.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Administrador',
      rol: 'ADMINISTRADOR',
      passwordHash: await bcrypt.hash('Admin123', 10),
    },
  });
  console.log('Seed base OK: admin 12345678/Admin123');
}
