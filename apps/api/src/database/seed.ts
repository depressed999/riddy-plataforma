import { resolve } from 'node:path';

import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { hashPassword } from '../modules/auth/auth.crypto';
import { hostProfiles, users, vehicleImages, vehicles } from './schema';

config({ path: resolve(process.cwd(), '../../.env') });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não foi definida.');
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.SEED_ALLOW_PRODUCTION !== 'true'
) {
  throw new Error(
    'O seed de demonstração não pode ser executado em produção sem SEED_ALLOW_PRODUCTION=true.',
  );
}

const client = postgres(databaseUrl, { max: 1 });
const database = drizzle(client);

const ownerId = '99999999-9999-4999-8999-999999999999';
const adminId = '77777777-7777-4777-8777-777777777777';

async function seed(): Promise<void> {
  const demoPasswordHash = await hashPassword('RiddyDemo@2026');
  const adminPasswordHash = await hashPassword('RiddyAdmin@2026');
  await database.transaction(async (transaction) => {
    await transaction
      .insert(users)
      .values({
        email: 'admin.demo@riddy.local',
        emailVerified: true,
        id: adminId,
        name: 'Admin Riddy',
        passwordHash: adminPasswordHash,
        role: 'admin',
        status: 'active',
      })
      .onConflictDoUpdate({
        set: {
          email: 'admin.demo@riddy.local',
          emailVerified: true,
          name: 'Admin Riddy',
          passwordHash: adminPasswordHash,
          role: 'admin',
          status: 'active',
          suspendedAt: null,
          suspensionReason: null,
          updatedAt: new Date(),
        },
        target: users.id,
      });

    await transaction
      .insert(users)
      .values({
        email: 'anfitriao.demo@riddy.local',
        emailVerified: true,
        id: ownerId,
        name: 'Marina Anfitriã',
        passwordHash: demoPasswordHash,
      })
      .onConflictDoUpdate({
        set: {
          email: 'anfitriao.demo@riddy.local',
          emailVerified: true,
          name: 'Marina Anfitriã',
          passwordHash: demoPasswordHash,
          updatedAt: new Date(),
        },
        target: users.id,
      });

    await transaction
      .insert(hostProfiles)
      .values({
        bio: 'Anfitriã de demonstração dos veículos do catálogo local.',
        displayName: 'Marina Anfitriã',
        id: '88888888-8888-4888-8888-888888888888',
        status: 'active',
        termsAcceptedAt: new Date('2026-08-25T10:00:00.000Z'),
        userId: ownerId,
      })
      .onConflictDoUpdate({
        set: {
          bio: 'Anfitriã de demonstração dos veículos do catálogo local.',
          displayName: 'Marina Anfitriã',
          status: 'active',
          updatedAt: new Date(),
        },
        target: hostProfiles.userId,
      });

    await transaction
      .insert(vehicles)
      .values([
        {
          amenities: [
            'Ar-condicionado',
            'Piloto automático adaptativo',
            'Câmera 360°',
            'Bluetooth',
            'Porta-malas elétrico',
            'Carregador USB-C',
          ],
          city: 'Manaus',
          createdAt: new Date('2026-08-25T12:00:00.000Z'),
          dailyRate: '450.00',
          description:
            'SUV elétrico espaçoso, silencioso e ideal para viagens com conforto.',
          fuelType: 'Elétrico',
          id: '11111111-1111-4111-8111-111111111111',
          location: { x: -60.0217, y: -3.119 },
          make: 'Tesla',
          model: 'Model Y',
          ownerId,
          seats: 5,
          state: 'AM',
          status: 'active',
          transmission: 'Automático',
          type: 'car',
          updatedAt: new Date('2026-08-25T12:00:00.000Z'),
          year: 2024,
        },
        {
          amenities: [
            'Ar-condicionado digital',
            'Câmera de ré',
            'Bluetooth',
            'Controle de cruzeiro',
            'Carregador USB',
            'Chave presencial',
          ],
          city: 'São Paulo',
          createdAt: new Date('2026-08-25T11:00:00.000Z'),
          dailyRate: '280.00',
          description:
            'Sedã híbrido econômico, confortável e equipado para a cidade.',
          fuelType: 'Híbrido',
          id: '22222222-2222-4222-8222-222222222222',
          location: { x: -46.6333, y: -23.5505 },
          make: 'Toyota',
          model: 'Corolla Hybrid',
          ownerId,
          seats: 5,
          state: 'SP',
          status: 'active',
          transmission: 'Automático',
          type: 'car',
          updatedAt: new Date('2026-08-25T11:00:00.000Z'),
          year: 2023,
        },
        {
          amenities: [
            'Ar-condicionado digital',
            'Bancos em couro',
            'Sensor de estacionamento',
            'Bluetooth',
            'Controle de cruzeiro',
            'Carregador sem fio',
          ],
          city: 'Brasília',
          createdAt: new Date('2026-08-25T10:00:00.000Z'),
          dailyRate: '600.00',
          description:
            'Sedã premium com desempenho esportivo e acabamento sofisticado.',
          fuelType: 'Gasolina',
          id: '33333333-3333-4333-8333-333333333333',
          location: { x: -47.8825, y: -15.7942 },
          make: 'BMW',
          model: 'Série 3',
          ownerId,
          seats: 5,
          state: 'DF',
          status: 'active',
          transmission: 'Automático',
          type: 'car',
          updatedAt: new Date('2026-08-25T10:00:00.000Z'),
          year: 2024,
        },
        {
          amenities: [
            'Ar-condicionado digital',
            'Câmera de ré',
            'Bluetooth',
            'Controle de cruzeiro',
            'Carregador USB',
          ],
          city: 'Recife',
          createdAt: new Date('2026-08-24T15:00:00.000Z'),
          dailyRate: '220.00',
          description:
            'Sedã confortável e confiável para deslocamentos urbanos ou viagens.',
          fuelType: 'Gasolina',
          id: '44444444-4444-4444-8444-444444444444',
          location: { x: -34.877, y: -8.0476 },
          make: 'Honda',
          model: 'Civic',
          ownerId,
          seats: 5,
          state: 'PE',
          status: 'active',
          transmission: 'Automático',
          type: 'car',
          updatedAt: new Date('2026-08-24T15:00:00.000Z'),
          year: 2022,
        },
        {
          amenities: [
            'Ar-condicionado',
            'Câmera de ré',
            'Bluetooth',
            'Controle de estabilidade',
            'Carregador USB',
          ],
          city: 'Rio de Janeiro',
          createdAt: new Date('2026-08-24T14:00:00.000Z'),
          dailyRate: '320.00',
          description:
            'SUV compacto com posição elevada e espaço para passeios em família.',
          fuelType: 'Flex',
          id: '55555555-5555-4555-8555-555555555555',
          location: { x: -43.1729, y: -22.9068 },
          make: 'Jeep',
          model: 'Renegade',
          ownerId,
          seats: 5,
          state: 'RJ',
          status: 'active',
          transmission: 'Automático',
          type: 'car',
          updatedAt: new Date('2026-08-24T14:00:00.000Z'),
          year: 2023,
        },
        {
          amenities: [
            'Freios ABS',
            'Painel digital',
            'Partida elétrica',
            'Indicador de marcha',
          ],
          city: 'Manaus',
          createdAt: new Date('2026-08-24T13:00:00.000Z'),
          dailyRate: '180.00',
          description:
            'Moto ágil e leve para explorar a cidade com economia e praticidade.',
          fuelType: 'Gasolina',
          id: '66666666-6666-4666-8666-666666666666',
          location: { x: -60.0217, y: -3.119 },
          make: 'Yamaha',
          model: 'MT-03',
          ownerId,
          seats: 2,
          state: 'AM',
          status: 'active',
          transmission: 'Manual',
          type: 'motorcycle',
          updatedAt: new Date('2026-08-24T13:00:00.000Z'),
          year: 2024,
        },
        {
          amenities: [
            'Freios ABS',
            'Controle de tração',
            'Painel digital',
            'Protetor de motor',
            'Tomada 12V',
          ],
          city: 'Brasília',
          createdAt: new Date('2026-08-24T12:00:00.000Z'),
          dailyRate: '360.00',
          description:
            'Moto versátil para cidade e estrada, com postura confortável de pilotagem.',
          fuelType: 'Gasolina',
          id: '77777777-7777-4777-8777-777777777777',
          location: { x: -47.8825, y: -15.7942 },
          make: 'Honda',
          model: 'CB 500X',
          ownerId,
          seats: 2,
          state: 'DF',
          status: 'active',
          transmission: 'Manual',
          type: 'motorcycle',
          updatedAt: new Date('2026-08-24T12:00:00.000Z'),
          year: 2023,
        },
        {
          amenities: [
            'Ar-condicionado',
            'Câmera de ré',
            'Bluetooth',
            'Computador de bordo',
            'Carregador USB',
          ],
          city: 'Belo Horizonte',
          createdAt: new Date('2026-08-24T11:00:00.000Z'),
          dailyRate: '190.00',
          description:
            'Hatch econômico e fácil de dirigir, ideal para o dia a dia.',
          fuelType: 'Flex',
          id: '88888888-8888-4888-8888-888888888888',
          location: { x: -43.9378, y: -19.9167 },
          make: 'Chevrolet',
          model: 'Onix',
          ownerId,
          seats: 5,
          state: 'MG',
          status: 'active',
          transmission: 'Automático',
          type: 'car',
          updatedAt: new Date('2026-08-24T11:00:00.000Z'),
          year: 2023,
        },
      ])
      .onConflictDoUpdate({
        set: { amenities: sql`excluded.amenities` },
        target: vehicles.id,
      });

    await transaction
      .insert(vehicleImages)
      .values([
        {
          altText: 'Tesla Model Y branco',
          id: 'a1111111-1111-4111-8111-111111111111',
          isCover: true,
          sortOrder: 0,
          storageKey: 'vehicles/tesla-model-y.jpg',
          vehicleId: '11111111-1111-4111-8111-111111111111',
        },
        {
          altText: 'Toyota Corolla Hybrid prata',
          id: 'a2222222-2222-4222-8222-222222222222',
          isCover: true,
          sortOrder: 0,
          storageKey: 'vehicles/toyota-corolla-hybrid.jpg',
          vehicleId: '22222222-2222-4222-8222-222222222222',
        },
        {
          altText: 'BMW Série 3 azul',
          id: 'a3333333-3333-4333-8333-333333333333',
          isCover: true,
          sortOrder: 0,
          storageKey: 'vehicles/bmw-serie-3.jpg',
          vehicleId: '33333333-3333-4333-8333-333333333333',
        },
      ])
      .onConflictDoNothing({ target: vehicleImages.id });
  });
}

async function main(): Promise<void> {
  try {
    await seed();
    console.log(
      'Seed concluído: administrador, anfitriã e 8 veículos de demonstração disponíveis.',
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

void main();
