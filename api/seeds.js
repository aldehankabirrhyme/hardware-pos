const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data to avoid unique constraint violations
  await prisma.auditLog.deleteMany();
  await prisma.duePayment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  // 2. Seed System Settings
  await prisma.systemSettings.create({
    data: {
      id: 'global_config',
      shopName: 'Dhaka Hardware & Machinery POS',
      requireDueOtpVerify: true,
    },
  });

  // 3. Seed Users (Admin & Salesman)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      phone: '01700000001',
      email: 'admin@hardwarepos.com',
      passwordHash,
      role: 'ADMIN',
      permissions: { canViewProfit: true, canEditStock: true },
    },
  });

  const salesman = await prisma.user.create({
    data: {
      name: 'Rahim Salesman',
      phone: '01700000002',
      email: 'rahim@hardwarepos.com',
      passwordHash,
      role: 'SALESMAN',
      permissions: { canViewProfit: false, canEditStock: false },
    },
  });

  // 4. Seed Categories
  const catTools = await prisma.category.create({ data: { name: 'Hand Tools & Hardware' } });
  const catPlumbing = await prisma.category.create({ data: { name: 'Plumbing & Pipes' } });
  const catElectrical = await prisma.category.create({ data: { name: 'Electrical & Cables' } });

  // 5. Seed Brands
  const brandBosch = await prisma.brand.create({ data: { name: 'Bosch' } });
  const brandNational = await prisma.brand.create({ data: { name: 'National Pipe' } });
  const brandBRB = await prisma.brand.create({ data: { name: 'BRB Cable' } });

  // 6. Seed Products
  const drill = await prisma.product.create({
    data: {
      sku: 'TOOL-001',
      name: 'Bosch Impact Drill Machine 13mm',
      categoryId: catTools.id,
      brandId: brandBosch.id,
      size: '13mm',
      color: 'Blue',
      unit: 'pieces',
      buyingPrice: 3800.00,
      sellingPrice: 4600.00,
      stockQuantity: 15,
      reorderLevel: 3,
    },
  });

  const pvePipe = await prisma.product.create({
    data: {
      sku: 'PIPE-002',
      name: 'PVC Water Pipe 2 inch',
      categoryId: catPlumbing.id,
      brandId: brandNational.id,
      size: '20 feet',
      color: 'White',
      unit: 'pieces',
      buyingPrice: 450.00,
      sellingPrice: 580.00,
      stockQuantity: 120,
      reorderLevel: 20,
    },
  });

  const cable = await prisma.product.create({
    data: {
      sku: 'CBL-003',
      name: 'BRB 2.5mm Copper Wire',
      categoryId: catElectrical.id,
      brandId: brandBRB.id,
      size: '100 meter roll',
      color: 'Red',
      unit: 'pieces',
      buyingPrice: 2200.00,
      sellingPrice: 2750.00,
      stockQuantity: 25,
      reorderLevel: 5,
    },
  });

  // 7. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Kamal Hossain',
      phone: '01811112222',
      email: 'kamal@gmail.com',
      address: 'Uttara, Dhaka',
      totalDues: 1200.00,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Aminul Islam',
      phone: '01922223333',
      email: 'aminul@yahoo.com',
      address: 'Mirpur 10, Dhaka',
      totalDues: 0.00,
    },
  });

  // 8. Seed Sales & Sale Items
  const sale1 = await prisma.sale.create({
    data: {
      invoiceNo: 'INV-2026-001',
      customerId: customer1.id,
      userId: salesman.id,
      totalAmount: 5180.00,
      paidAmount: 3980.00,
      dueAmount: 1200.00,
      paymentMethod: 'CREDIT_DUE',
      status: 'COMPLETED',
      items: {
        create: [
          { productId: drill.id, quantity: 1, unitPrice: 4600.00, subTotal: 4600.00 },
          { productId: pvePipe.id, quantity: 1, unitPrice: 580.00, subTotal: 580.00 },
        ],
      },
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      invoiceNo: 'INV-2026-002',
      customerId: customer2.id,
      userId: admin.id,
      totalAmount: 2750.00,
      paidAmount: 2750.00,
      dueAmount: 0.00,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      items: {
        create: [
          { productId: cable.id, quantity: 1, unitPrice: 2750.00, subTotal: 2750.00 },
        ],
      },
    },
  });

  // 9. Seed Amortized & Standard Expenses
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 5);

  await prisma.expense.createMany({
    data: [
      {
        title: 'Shop Rent - November',
        category: 'Rent',
        amount: 15000.00,
        recordedById: admin.id,
        date: pastDate,
        spanType: 'MONTHLY',
        durationValue: 1,
        notes: 'Monthly commercial storefront lease',
      },
      {
        title: 'Electricity & Generator Bill',
        category: 'Utilities',
        amount: 3200.00,
        recordedById: admin.id,
        date: today,
        spanType: 'DAILY',
        durationValue: 1,
        notes: 'DESCO electricity monthly billing',
      },
      {
        title: 'Delivery Van Fuel & Transport',
        category: 'Logistics',
        amount: 1200.00,
        recordedById: salesman.id,
        date: today,
        spanType: 'DAILY',
        durationValue: 1,
        notes: 'Delivery of pipes to Uttara project site',
      },
    ],
  });

  console.log('✅ Database successfully seeded with test data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });