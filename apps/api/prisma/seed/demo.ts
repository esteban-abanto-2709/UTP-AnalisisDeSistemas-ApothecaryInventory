import * as bcrypt from 'bcrypt';
import type { PrismaClient, Rol } from '../../src/generated/prisma/client';

const vendedores: { dni: string; nombre: string; rol: Rol }[] = [
  { dni: '40123456', nombre: 'María Quispe Huamán', rol: 'VENDEDOR' },
  { dni: '41234567', nombre: 'Jorge Ramos Torres', rol: 'VENDEDOR' },
  { dni: '42345678', nombre: 'Lucía Fernández Rojas', rol: 'VENDEDOR' },
  { dni: '43456789', nombre: 'Carlos Mendoza Paredes', rol: 'VENDEDOR' },
];

type SeedLote = {
  codigo: string;
  mesesParaVencer: number;
  stock: number;
  descuento?: number;
};
type SeedMed = { nombre: string; precio: string; lotes: SeedLote[] };

const medicamentos: SeedMed[] = [
  {
    nombre: 'Paracetamol 500mg x 10 tab',
    precio: '2.50',
    lotes: [
      { codigo: 'L01', mesesParaVencer: 2, stock: 40, descuento: 15 },
      { codigo: 'L02', mesesParaVencer: 14, stock: 80 },
    ],
  },
  {
    nombre: 'Ibuprofeno 400mg x 10 tab',
    precio: '3.80',
    lotes: [
      { codigo: 'L01', mesesParaVencer: 3, stock: 30, descuento: 10 },
      { codigo: 'L02', mesesParaVencer: 12, stock: 60 },
    ],
  },
  {
    nombre: 'Amoxicilina 500mg x 10 cap',
    precio: '8.50',
    lotes: [{ codigo: 'L01', mesesParaVencer: 10, stock: 60 }],
  },
  {
    nombre: 'Omeprazol 20mg x 10 cap',
    precio: '5.00',
    lotes: [{ codigo: 'L01', mesesParaVencer: 12, stock: 75 }],
  },
  {
    nombre: 'Loratadina 10mg x 10 tab',
    precio: '4.20',
    lotes: [{ codigo: 'L01', mesesParaVencer: 9, stock: 80 }],
  },
  {
    nombre: 'Dexametasona 4mg x 10 tab',
    precio: '6.90',
    lotes: [{ codigo: 'L01', mesesParaVencer: 6, stock: 40 }],
  },
  {
    nombre: 'Azitromicina 500mg x 3 tab',
    precio: '12.00',
    lotes: [{ codigo: 'L01', mesesParaVencer: 8, stock: 35 }],
  },
  {
    nombre: 'Salbutamol inhalador 100mcg',
    precio: '18.50',
    lotes: [{ codigo: 'L01', mesesParaVencer: 18, stock: 25 }],
  },
  {
    nombre: 'Metformina 850mg x 30 tab',
    precio: '9.80',
    lotes: [{ codigo: 'L01', mesesParaVencer: 12, stock: 50 }],
  },
  {
    nombre: 'Losartán 50mg x 30 tab',
    precio: '11.50',
    lotes: [{ codigo: 'L01', mesesParaVencer: 11, stock: 45 }],
  },
  {
    nombre: 'Panadol Antigripal x 6 tab',
    precio: '7.00',
    lotes: [{ codigo: 'L01', mesesParaVencer: 7, stock: 100 }],
  },
  {
    nombre: 'Sal de Andrews x 1 sobre',
    precio: '1.00',
    lotes: [{ codigo: 'L01', mesesParaVencer: 24, stock: 200 }],
  },
  {
    nombre: 'Alcohol medicinal 70° 250ml',
    precio: '4.50',
    lotes: [{ codigo: 'L01', mesesParaVencer: 24, stock: 60 }],
  },
  {
    nombre: 'Gasa estéril 10x10cm x 5 und',
    precio: '3.00',
    lotes: [{ codigo: 'L01', mesesParaVencer: 24, stock: 70 }],
  },
  { nombre: 'Vitamina C 1g x 10 tab', precio: '5.50', lotes: [] },
];

function vencimiento(meses: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d;
}

export async function seedDemo(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('Demo1234', 10);

  for (const v of vendedores) {
    await prisma.empleado.upsert({
      where: { dni: v.dni },
      update: {},
      create: { ...v, passwordHash },
    });
  }

  let totalLotes = 0;
  for (const m of medicamentos) {
    const stock = m.lotes.reduce((s, l) => s + l.stock, 0);
    const med = await prisma.medicamento.upsert({
      where: { nombre: m.nombre },
      update: {},
      create: { nombre: m.nombre, precio: m.precio, stock },
    });
    for (const l of m.lotes) {
      await prisma.lote.upsert({
        where: {
          medicamentoId_codigo: { medicamentoId: med.id, codigo: l.codigo },
        },
        update: {},
        create: {
          codigo: l.codigo,
          medicamentoId: med.id,
          fechaVencimiento: vencimiento(l.mesesParaVencer),
          stockInicial: l.stock,
          stockActual: l.stock,
          descuento: l.descuento ?? 0,
        },
      });
      totalLotes++;
    }
  }

  console.log(
    `Seed demo OK: ${vendedores.length} vendedores (dni/Demo1234), ${medicamentos.length} medicamentos, ${totalLotes} lotes`,
  );
}
