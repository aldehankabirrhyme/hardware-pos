// api/controllers/salesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createSale = async (req, res) => {
  try {
    const { items, customerPhone, customerName, paymentMethod, paidAmount, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const saleItemsData = items.map(item => {
      const subTotal = item.sellingPrice * item.quantity;
      totalAmount += subTotal;
      return {
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        subTotal: subTotal,
      };
    });

    const paid = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, totalAmount - paid);
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

    // Handle Customer Lookup or Creation
    let targetCustomerId = null;
    if (customerPhone) {
      let customer = await prisma.customer.findUnique({
        where: { phone: String(customerPhone).trim() }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName || 'Walk-in Credit Customer',
            phone: String(customerPhone).trim(),
            address: 'Nawabpur Road, Dhaka',
          }
        });
      }
      targetCustomerId = customer.id;
    } else {
      // Fallback walk-in customer if no phone provided
      let defaultCust = await prisma.customer.findFirst({ where: { phone: '01700000001' } });
      if (!defaultCust) {
        defaultCust = await prisma.customer.create({
          data: {
            name: 'Walking Customer',
            phone: '01700000001',
            address: 'Dhaka',
          }
        });
      }
      targetCustomerId = defaultCust.id;
    }

    // Use a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: targetCustomerId,
          userId: userId || null,
          totalAmount,
          paidAmount: paid,
          dueAmount,
          paymentMethod: dueAmount > 0 ? 'CREDIT_DUE' : (paymentMethod || 'CASH'),
          status: 'COMPLETED',
          items: {
            create: saleItemsData,
          },
        },
        include: { items: true },
      });

      // 2. Deduct stock quantity for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Update customer total dues if there is a due amount
      if (dueAmount > 0) {
        await tx.customer.update({
          where: { id: targetCustomerId },
          data: {
            totalDues: {
              increment: dueAmount,
            },
          },
        });
      }

      return sale;
    });

    res.json({ success: true, message: 'Sale completed & stock updated!', sale: result });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to process checkout and update inventory' });
  }
};

// Helper to get or create a walk-in default customer
async function getDefaultCustomer(tx) {
  let customer = await tx.customer.findFirst({ where: { phone: '01700000001' } });
  if (!customer) {
    customer = await tx.customer.create({
      data: {
        name: 'Walking Customer',
        phone: '01700000001',
        address: 'Nawabpur Road, Dhaka',
      },
    });
  }
  return customer.id;
}