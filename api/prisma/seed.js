// api/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash the password for the admin
  const passwordHash = await bcrypt.hash('1234', 10);

  // Upsert the admin user providing all required schema fields
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hardware.com' },
    update: {},
    create: {
      email: 'admin@hardware.com',
      name: 'Store Administrator',
      phone: '01700000000',
      passwordHash: passwordHash,
      role: 'ADMIN',
      permissions: {
        canViewProfit: true,
        canEditStock: true,
        canManageUsers: true,
        canApproveDues: true
      },
    },
  });

  console.log('✅ Created admin user:', adminUser.email);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });