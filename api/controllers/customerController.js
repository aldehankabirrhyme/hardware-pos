// api/controllers/customerController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get All Customers (with outstanding due balances)
// exports.getCustomers = async (req, res) => {
//   try {
//     const customers = await prisma.customer.findMany({
//       include: {
//         sales: {
//           orderBy: { createdAt: 'desc' },
//           include: { items: { include: { product: true } } }
//         },
//         duePayments: {
//           orderBy: { createdAt: 'desc' }
//         }
//       },
//       orderBy: { totalDues: 'desc' }
//     });

//     res.json({ success: true, customers });
//   } catch (error) {
//     console.error('Error fetching customers:', error);
//     res.status(500).json({ error: 'Failed to fetch customer ledgers' });
//   }
// };
// Backend Controller: getCustomers with Pagination & Search
exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';

    // Build search filter condition
    const whereCondition = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    // Fetch total matching count & paginated customers concurrently
    const [totalCustomers, customers] = await Promise.all([
      prisma.customer.count({ where: whereCondition }),
      prisma.customer.findMany({
        where: whereCondition,
        include: {
          sales: {
            orderBy: { createdAt: 'desc' },
            include: { items: { include: { product: true } } }
          },
          duePayments: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { totalDues: 'desc' },
        skip,
        take: limit
      })
    ]);

    res.json({
      success: true,
      customers,
      pagination: {
        total: totalCustomers,
        page,
        limit,
        totalPages: Math.ceil(totalCustomers / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customer ledgers' });
  }
};

exports.collectDuePayment = async (req, res) => {
  try {
    const { customerId, amountPaid, paymentMethod, notes } = req.body;

    const paid = parseFloat(amountPaid);
    if (!customerId || isNaN(paid) || paid <= 0) {
      return res.status(400).json({ error: 'Valid customer ID and payment amount are required.' });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the due payment collection record (omitting userId)
      const duePayment = await tx.duePayment.create({
        data: {
          customerId,
          amountPaid: paid,
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || 'Counter due collection',
        },
      });

      // 2. Decrement customer total dues
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          totalDues: {
            decrement: paid,
          },
        },
      });

      return { duePayment, updatedCustomer };
    });

    res.json({
      success: true,
      message: `Successfully collected ৳${paid.toFixed(2)}. Customer due balance updated!`,
      result,
    });
  } catch (error) {
    console.error('Error recording due payment collection:', error);
    res.status(500).json({ error: 'Failed to process due payment collection in database.' });
  }
};

// api/controllers/customerController.js (Add this function)
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: { product: true }
            }
          }
        },
        duePayments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true, customer });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ error: 'Failed to fetch customer profile details' });
  }
};