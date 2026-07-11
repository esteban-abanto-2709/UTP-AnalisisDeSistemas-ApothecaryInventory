import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const admin = await prisma.empleado.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Administrador',
      passwordHash: await bcrypt.hash('Admin123', 10),
      rol: 'ADMINISTRADOR',
    },
  });
  console.log(`Seed OK: ${admin.nombre} (dni ${admin.dni})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
