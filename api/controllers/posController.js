// controllers/posController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSmsOtp } = require('../services/smsService');

/**
 * Process POS Sale Transaction
 */
exports.createSale = async (req, res) => {
  const { 
    customerPhone, 
    customerName, 
    items, 
    paidAmount, 
    paymentMethod, 
    userId 
  } = req.body;

  try {
    // 1. Run all database operations inside the transaction (NO 'res' object here)
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Fetch Admin System Settings
      let settings = await tx.systemSettings.findUnique({ where: { id: 'global_config' } });
      if (!settings) {
        settings = await tx.systemSettings.create({ data: { id: 'global_config' } });
      }

      // Auto-Create or Fetch Customer Account
      let customer = await tx.customer.findUnique({ where: { phone: customerPhone } });
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName || 'Walk-in Customer',
            phone: customerPhone,
          }
        });
      }

      // Calculate Item Totals & Verify Stock
      let totalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product ? product.name : item.productId}`);
        }

        const subTotal = Number(product.sellingPrice) * item.quantity;
        totalAmount += subTotal;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          subTotal: subTotal
        });
      }

      const dueAmount = totalAmount - Number(paidAmount);
      const hasDue = dueAmount > 0;

      // Check Admin Verification Settings for Due Payments
      const requiresOtp = hasDue && settings.requireDueOtpVerify;
      const orderStatus = requiresOtp ? 'PENDING_VERIFICATION' : 'COMPLETED';

      // Generate Invoice & Create Sale Record
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: customer.id,
          userId,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentMethod,
          status: orderStatus,
          items: { create: saleItemsData }
        }
      });

      // Handle Pending Verification (OTP Flow)
      if (requiresOtp) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await tx.oTPVerification.create({
          data: {
            customerId: customer.id,
            phone: customer.phone,
            code: otpCode,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 Minutes Expiry
          }
        });

        return { requiresOtp: true, customer, sale, otpCode };
      }

      // If no OTP required, deduct stock & update customer dues immediately
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }

      if (hasDue) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { totalDues: { increment: dueAmount } }
        });
      }

      return { requiresOtp: false, sale };
    });

    // 2. Handle External Services and HTTP Responses OUTSIDE the transaction block
    if (transactionResult.requiresOtp) {
      await sendSmsOtp(
        transactionResult.customer.phone, 
        `Your hardware bill due verification OTP is: ${transactionResult.otpCode}`
      );

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        saleId: transactionResult.sale.id,
        message: 'Dues detected. OTP sent to customer phone for verification.'
      });
    }

    return res.status(201).json({
      success: true,
      requiresOtp: false,
      sale: transactionResult.sale,
      message: 'Transaction completed successfully.'
    });

  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};