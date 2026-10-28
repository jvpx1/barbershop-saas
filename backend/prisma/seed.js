import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

// Senha de demonstração para todos os donos de exemplo
const passwordHash = await bcrypt.hash("123456", 10);

// Gera os horários de trabalho: para cada dia, um ou mais intervalos
const hours = (days, ranges) =>
  days.flatMap((weekday) =>
    ranges.map(([startTime, endTime]) => ({ weekday, startTime, endTime }))
  );

const SEG_A_SEX = [1, 2, 3, 4, 5];
const SEG_A_SAB = [1, 2, 3, 4, 5, 6];

const shops = [
  {
    name: "Barbearia do Zé",
    slug: "barbearia-do-ze",
    primaryColor: "#b45309",
    phone: "(92) 99999-0001",
    address: "Rua das Palmeiras, 120",
    owner: { name: "Zé Carlos", email: "ze@demo.com" },
    services: [
      { name: "Corte", price: 35, durationMinutes: 30 },
      { name: "Barba", price: 25, durationMinutes: 20 },
      { name: "Corte + Barba", price: 55, durationMinutes: 50 },
    ],
    barbers: [
      { name: "Zé Carlos", hours: hours(SEG_A_SAB, [["09:00", "12:00"], ["14:00", "19:00"]]) },
      { name: "Rafael", hours: hours(SEG_A_SEX, [["10:00", "12:00"], ["13:00", "18:00"]]) },
    ],
  },
  {
    name: "Navalha Club",
    slug: "navalha-club",
    primaryColor: "#0f766e",
    phone: "(92) 99999-0002",
    address: "Av. Central, 450",
    owner: { name: "Marcos Lima", email: "marcos@demo.com" },
    services: [
      { name: "Corte degradê", price: 45, durationMinutes: 40 },
      { name: "Barba completa", price: 30, durationMinutes: 30 },
      { name: "Sobrancelha", price: 15, durationMinutes: 15 },
      { name: "Pigmentação", price: 60, durationMinutes: 60 },
    ],
    barbers: [
      { name: "Marcos Lima", hours: hours(SEG_A_SAB, [["08:00", "12:00"], ["13:30", "18:00"]]) },
      { name: "Diego", hours: hours(SEG_A_SAB, [["12:00", "20:00"]]) },
      { name: "Bruno", hours: hours(SEG_A_SEX, [["09:00", "17:00"]]) },
    ],
  },
  {
    name: "Corte Fino",
    slug: "corte-fino",
    primaryColor: "#4338ca",
    phone: "(92) 99999-0003",
    address: "Rua do Comércio, 75",
    owner: { name: "André Souza", email: "andre@demo.com" },
    services: [
      { name: "Corte clássico", price: 40, durationMinutes: 30 },
      { name: "Barba na toalha quente", price: 35, durationMinutes: 30 },
    ],
    barbers: [
      { name: "André Souza", hours: hours(SEG_A_SAB, [["09:00", "13:00"], ["15:00", "19:00"]]) },
    ],
  },
];

// Limpa as barbearias existentes (o cascade apaga tudo que pertence a elas)
await prisma.barbershop.deleteMany();

for (const shop of shops) {
  await prisma.barbershop.create({
    data: {
      name: shop.name,
      slug: shop.slug,
      primaryColor: shop.primaryColor,
      phone: shop.phone,
      address: shop.address,
      users: {
        create: { ...shop.owner, passwordHash, role: "OWNER" },
      },
      services: { create: shop.services },
      barbers: {
        create: shop.barbers.map((b) => ({
          name: b.name,
          workingHours: { create: b.hours },
        })),
      },
    },
  });
  console.log(`Criada: ${shop.name}`);
}

await prisma.$disconnect();