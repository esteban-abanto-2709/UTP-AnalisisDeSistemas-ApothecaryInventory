import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedBase } from './seed/base';
import { seedDemo } from './seed/demo';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const mode = process.env.SEED_MODE ?? 'demo';

async function main() {
  if (!['none', 'base', 'demo'].includes(mode)) {
    throw new Error(`SEED_MODE inválido: "${mode}" (none | base | demo)`);
  }
  if (mode === 'none') return;
  await seedBase(prisma);
  if (mode === 'demo') await seedDemo(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
