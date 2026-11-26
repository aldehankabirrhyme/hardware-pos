const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get Public Store Catalog
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true },
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Single Product Details
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, brand: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 4. Get Public System Settings (OTP & Gateway configs)
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 'global_config' }
    });
    res.json(settings || { requireOrderOtpVerify: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Send OTP Code for Verification
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  try {
    const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Upsert customer record if needed
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: 'Guest Customer', phone }
      });
    }

    // Save OTP verification code
    await prisma.oTPVerification.create({
      data: {
        customerId: customer.id,
        phone,
        code: demoCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // Expires in 5 minutes
      }
    });

    res.json({ success: true, message: 'OTP sent successfully', demoCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Place Online Order & Auto-Deduct Stock (Transaction)
router.post('/orders', async (req, res) => {
  const { 
    customerId: bodyCustomerId, 
    customerName, 
    customerPhone, 
    customerEmail, 
    items, 
    deliveryAddress, 
    shippingCharge, 
    paymentMethod, 
    transactionId,
    otpCode 
  } = req.body;

  try {
    // 1. Validate System Settings & OTP if required
    const settings = await prisma.systemSettings.findFirst({ where: { id: 'global_config' } });
    if (settings?.requireOrderOtpVerify) {
      if (!otpCode) return res.status(400).json({ error: 'OTP verification code is required.' });
      
      const validOtp = await prisma.oTPVerification.findFirst({
        where: {
          phone: customerPhone,
          code: otpCode,
          isVerified: false,
          expiresAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!validOtp) {
        return res.status(400).json({ error: 'Invalid or expired OTP code.' });
      }

      // Mark OTP as verified
      await prisma.oTPVerification.update({
        where: { id: validOtp.id },
        data: { isVerified: true }
      });
    }

    // 2. Execute Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create customer
      let customerId = bodyCustomerId;
      if (!customerId && customerPhone) {
        let customer = await tx.customer.findUnique({ where: { phone: customerPhone } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: customerName || 'Online Customer',
              phone: customerPhone,
              email: customerEmail || null,
              address: deliveryAddress || null
            }
          });
        }
        customerId = customer.id;
      }

      let totalAmount = Number(shippingCharge || 0);
      const saleItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockQuantity < item.quantity) {
          throw new Error(`Product ${product ? product.name : item.productId} is out of stock.`);
        }

        const lengthMultiplier = item.customLength ? Number(item.customLength) : 1;
        const subTotal = Number(product.sellingPrice) * item.quantity * lengthMultiplier;
        totalAmount += subTotal;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          customLength: item.customLength ? Number(item.customLength) : null,
          unitPrice: product.sellingPrice,
          subTotal: subTotal
        });

        // Deduct inventory stock
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: product.stockQuantity - item.quantity }
        });
      }

      const invoiceNo = `WEB-${Date.now().toString().slice(-8)}`;

      const newOrder = await tx.sale.create({
        data: {
          invoiceNo,
          customerId,
          userId: null,
          customerName,
          customerPhone,
          customerEmail,
          totalAmount,
          paidAmount: paymentMethod === 'CASH' ? 0 : totalAmount,
          dueAmount: paymentMethod === 'CASH' ? totalAmount : 0,
          paymentMethod: paymentMethod || 'CASH',
          status: 'ONLINE_PLACED', // Expanded lifecycle status
          isOnlineOrder: true,
          deliveryAddress,
          shippingCharge: Number(shippingCharge || 0),
          transactionId,
          items: {
            create: saleItemsData
          }
        },
        include: { items: true, customer: true }
      });

      if (bodyCustomerId) {
        await tx.cartItem.deleteMany({ where: { customerId: bodyCustomerId } });
      }

      return newOrder;
    });

    res.status(201).json({ success: true, message: 'Online order placed successfully!', order: result });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get All Active Delivery Zones
router.get('/delivery-zones', async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Active Delivery Zones
router.get('/delivery-zones', async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Delivery Zone (Admin)
router.post('/delivery-zones', async (req, res) => {
  try {
    const { name, charge, allowCashOnDelivery } = req.body;
    const newZone = await prisma.deliveryZone.create({
      data: {
        name,
        charge: parseFloat(charge),
        allowCashOnDelivery: allowCashOnDelivery ?? true
      }
    });
    res.json({ success: true, zone: newZone });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


// 3. Update Delivery Zone (Fixes your 404 error)
router.put('/delivery-zones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, charge, allowCashOnDelivery } = req.body;
    
    const updatedZone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        name,
        charge: charge !== undefined ? parseFloat(charge) : undefined,
        allowCashOnDelivery
      }
    });
    res.json({ success: true, zone: updatedZone });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete Delivery Zone (Admin)
router.delete('/delivery-zones/:id', async (req, res) => {
  try {
    await prisma.deliveryZone.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Delivery zone deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 1. Get All E-Commerce Orders for Admin
router.get('/admin/orders', async (req, res) => {
  try {
    const orders = await prisma.sale.findMany({
      where: { isOnlineOrder: true },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Update Order Parcel Lifecycle Status
// Update Order Parcel Lifecycle Status with Auto-Restock & Financial Settlement
router.put('/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = [
      'COMPLETED',
      'PENDING_VERIFICATION',
      'CANCELLED',
      'ONLINE_PLACED',
      'PENDING',
      'ACCEPTED',
      'PROCESSING',
      'ON_THE_WAY',
      'DELIVERED',
      'REJECTED',
      'DELIVERY_FAILED'
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${newStatus}'. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Execute atomic transaction for order status update & stock restoration/deduction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current sale order with items
      const existingOrder = await tx.sale.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const previousStatus = existingOrder.status;

      // Define terminal/restock statuses vs active order statuses
      const terminalRestockStatuses = ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'];
      const wasActive = !terminalRestockStatuses.includes(previousStatus);
      const isNowTerminal = terminalRestockStatuses.includes(newStatus);

      // --- CASE A: Restock Inventory (Active -> Cancelled/Rejected/Failed) ---
      if (wasActive && isNowTerminal) {
        for (const item of existingOrder.items) {
          // Add back stock (accounting for length multipliers if set)
          const qtyToRestore = item.quantity;
          
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: qtyToRestore
              }
            }
          });
        }
      }

      // --- CASE B: Re-Deduct Inventory (Cancelled/Rejected/Failed -> Active) ---
      if (!wasActive && !isNowTerminal) {
        for (const item of existingOrder.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.stockQuantity < item.quantity) {
            throw new Error(`Cannot reactivate order. Product '${product?.name || item.productId}' has insufficient stock.`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      // --- CASE C: Financial Settlement on Delivery ---
      const updateData = { status: newStatus };
      if (newStatus === 'DELIVERED') {
        updateData.paidAmount = existingOrder.totalAmount;
        updateData.dueAmount = 0;
      }

      // 2. Commit order update
      const updatedOrder = await tx.sale.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          items: { include: { product: true } }
        }
      });

      return updatedOrder;
    });

    res.json({
      success: true,
      message: `Order status updated to ${newStatus}. Inventory synced successfully.`,
      order: result
    });
  } catch (err) {
    console.error('Failed to update order status:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});
module.exports = router;