// api/controllers/expenseController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get All Expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expense records' });
  }
};

// 2. Add New Expense
// exports.addExpense = async (req, res) => {
//   try {
//     const { title, category, amount, notes, userId } = req.body;
//     const parsedAmount = parseFloat(amount);

//     if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
//       return res.status(400).json({ error: 'Valid title and amount are required' });
//     }

//     // Find a valid user to connect (fallback to the first user/admin in the database if userId is missing)
//     let targetUserId = userId;
//     if (!targetUserId) {
//       const defaultUser = await prisma.user.findFirst();
//       if (defaultUser) {
//         targetUserId = defaultUser.id;
//       }
//     }

//     if (!targetUserId) {
//       return res.status(400).json({ error: 'No user found in system to associate with this expense.' });
//     }

//     const expense = await prisma.expense.create({
//       data: {
//         title,
//         category: category || 'General',
//         amount: parsedAmount,
//         notes: notes || '',
//         recordedBy: {
//           connect: { id: targetUserId }
//         }
//       },
//     });

//     res.json({ success: true, message: 'Expense recorded successfully', expense });
//   } catch (error) {
//     console.error('Error adding expense:', error);
//     res.status(500).json({ error: 'Failed to record expense' });
//   }
// };

// 3. Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// 4. Get Daily Profit & Loss Summary
exports.getDailyProfitReport = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD format (defaults to today)
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch sales made today
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Fetch due payments collected today
    const dueCollections = await prisma.duePayment.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Fetch expenses logged today (Using `date` instead of `createdAt`)
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let totalRevenue = 0;
    let totalCOGS = 0;

    sales.forEach(sale => {
      totalRevenue += parseFloat(sale.totalAmount || 0);
      sale.items.forEach(item => {
        const buyingPrice = parseFloat(item.product?.buyingPrice || 0);
        totalCOGS += buyingPrice * item.quantity;
      });
    });

    const totalCollectedDues = dueCollections.reduce((acc, d) => acc + parseFloat(d.amountPaid || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      report: {
        date: startOfDay.toISOString().split('T')[0],
        totalSalesCount: sales.length,
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        totalCollectedDues,
        netProfit,
        expenses,
      },
    });
  } catch (error) {
    console.error('Error generating daily profit report:', error);
    res.status(500).json({ error: 'Failed to generate profit report' });
  }
};

// 5. Get Monthly Analytics
exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: { items: { include: { product: true } } }
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate } } // Using `date` instead of `createdAt`
      })
    ]);

    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' }),
      revenue: 0,
      cogs: 0,
      expenses: 0,
      netProfit: 0
    }));

    sales.forEach(sale => {
      const monthIdx = new Date(sale.createdAt).getMonth();
      const revenue = parseFloat(sale.totalAmount || 0);
      monthsData[monthIdx].revenue += revenue;

      sale.items.forEach(item => {
        const buyingPrice = parseFloat(item.product?.buyingPrice || 0);
        monthsData[monthIdx].cogs += buyingPrice * item.quantity;
      });
    });

    expenses.forEach(exp => {
      const monthIdx = new Date(exp.date).getMonth(); // Using `date` instead of `createdAt`
      monthsData[monthIdx].expenses += parseFloat(exp.amount || 0);
    });

    monthsData.forEach(m => {
      const grossProfit = m.revenue - m.cogs;
      m.netProfit = grossProfit - m.expenses;
    });

    res.json({ success: true, year: targetYear, analytics: monthsData });
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({ error: 'Failed to generate monthly analytics' });
  }
};

// Helper to calculate date ranges based on filter selection
// const getDateRangeFilter = (filter, customStart, customEnd) => {
//   const now = new Date();
//   let start = new Date();
//   let end = new Date();

//   end.setHours(23, 59, 59, 999);

//   switch (filter) {
//     case 'today':
//       start.setHours(0, 0, 0, 0);
//       break;
//     case 'yesterday':
//       start.setDate(now.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(now.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case 'this_week':
//       const firstDayOfWeek = now.getDate() - now.getDay();
//       start.setDate(firstDayOfWeek);
//       start.setHours(0, 0, 0, 0);
//       break;
//     case 'last_week':
//       start.setDate(now.getDate() - now.getDay() - 7);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(now.getDate() - now.getDay() - 1);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case 'this_month':
//       start = new Date(now.getFullYear(), now.getMonth(), 1);
//       break;
//     case 'last_month':
//       start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//       end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
//       break;
//     case 'this_year':
//       start = new Date(now.getFullYear(), 0, 1);
//       break;
//     case 'last_year':
//       start = new Date(now.getFullYear() - 1, 0, 1);
//       end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
//       break;
//     case 'custom':
//       if (customStart) start = new Date(customStart);
//       if (customEnd) {
//         end = new Date(customEnd);
//         end.setHours(23, 59, 59, 999);
//       }
//       break;
//     default:
//       start = new Date(now.getFullYear(), now.getMonth(), 1);
//   }
//   return { start, end };
// };

// Add Expense with Amortization Calculation
exports.addExpense = async (req, res) => {
  try {
    const { title, category, amount, notes, userId, spanType = 'DAILY', durationValue = 1, date } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid title and amount are required' });
    }

    let targetUserId = userId;
    if (!targetUserId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) targetUserId = defaultUser.id;
    }

    const startDateObj = date ? new Date(date) : new Date();
    let endDateObj = new Date(startDateObj);
    const durVal = parseInt(durationValue, 10) || 1;

    // Calculate span end date
    if (spanType === 'DAILY') endDateObj.setDate(startDateObj.getDate() + durVal - 1);
    else if (spanType === 'WEEKLY') endDateObj.setDate(startDateObj.getDate() + durVal * 7 - 1);
    else if (spanType === 'MONTHLY') endDateObj.setMonth(startDateObj.getMonth() + durVal);
    else if (spanType === 'YEARLY') endDateObj.setFullYear(startDateObj.getFullYear() + durVal);
    else endDateObj = null;

    const expense = await prisma.expense.create({
      data: {
        title,
        category: category || 'General',
        amount: parsedAmount,
        notes: notes || '',
        spanType,
        durationValue: durVal,
        date: startDateObj,
        endDate: endDateObj,
        recordedBy: { connect: { id: targetUserId } }
      }
    });

    res.json({ success: true, message: 'Expense recorded successfully with amortization', expense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
};

// Advanced Financial Analytics (Revenue, COGS, Amortized Expenses, Net Profit)
// exports.getFinancialAnalytics = async (req, res) => {
//   try {
//     const { filter = 'this_month', startDate, endDate } = req.query;
//     const { start, end } = getDateRangeFilter(filter, startDate, endDate);

//     const [sales, expenses] = await Promise.all([
//       prisma.sale.findMany({
//         where: { createdAt: { gte: start, lte: end } },
//         include: { items: { include: { product: true } } }
//       }),
//       prisma.expense.findMany({
//         where: {
//           OR: [
//             { date: { lte: end }, endDate: { gte: start } },
//             { date: { gte: start, lte: end } }
//           ]
//         }
//       })
//     ]);

//     // Group metrics by day / bucket for charts
//     const timelineMap = {};
//     let curr = new Date(start);
//     while (curr <= end) {
//       const key = curr.toISOString().split('T')[0];
//       timelineMap[key] = { date: key, revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
//       curr.setDate(curr.getDate() + 1);
//     }

//     let totalRevenue = 0;
//     let totalCOGS = 0;

//     sales.forEach(sale => {
//       const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
//       const rev = parseFloat(sale.totalAmount || 0);
//       totalRevenue += rev;

//       let saleCogs = 0;
//       sale.items.forEach(item => {
//         const buyingPrice = parseFloat(item.product?.buyingPrice || 0);
//         saleCogs += buyingPrice * item.quantity;
//       });
//       totalCOGS += saleCogs;

//       if (timelineMap[dateKey]) {
//         timelineMap[dateKey].revenue += rev;
//         timelineMap[dateKey].cogs += saleCogs;
//       }
//     });

//     let totalExpenses = 0;

//     // Prorate expenses across active days within the range
//     expenses.forEach(exp => {
//       const expStart = new Date(exp.date);
//       const expEnd = exp.endDate ? new Date(exp.endDate) : new Date(expStart);
//       const totalSpanDays = Math.max(1, Math.ceil((expEnd - expStart) / (1000 * 60 * 60 * 24)) + 1);
//       const dailyCost = parseFloat(exp.amount) / totalSpanDays;

//       let d = new Date(Math.max(expStart, start));
//       const rangeEndLimit = new Date(Math.min(expEnd, end));

//       while (d <= rangeEndLimit) {
//         const key = d.toISOString().split('T')[0];
//         if (timelineMap[key]) {
//           timelineMap[key].expenses += dailyCost;
//           totalExpenses += dailyCost;
//         }
//         d.setDate(d.getDate() + 1);
//       }
//     });

//     const chartData = Object.values(timelineMap).map(item => {
//       const gross = item.revenue - item.cogs;
//       item.netProfit = gross - item.expenses;
//       return item;
//     });

//     const grossProfit = totalRevenue - totalCOGS;
//     const netProfit = grossProfit - totalExpenses;

//     res.json({
//       success: true,
//       summary: {
//         totalRevenue,
//         totalCOGS,
//         grossProfit,
//         totalExpenses,
//         netProfit
//       },
//       chartData
//     });
//   } catch (error) {
//     console.error('Error fetching analytics:', error);
//     res.status(500).json({ error: 'Failed to generate analytics' });
//   }
// };

// Helper to calculate extended date ranges & grouping strategy
const getDateRangeFilter = (filter, customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let groupBy = 'day'; // 'day' or 'month'

  end.setHours(23, 59, 59, 999);

  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      groupBy = 'day';
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      groupBy = 'day';
      break;
    case 'this_week':
      const firstDayOfWeek = now.getDate() - now.getDay();
      start.setDate(firstDayOfWeek);
      start.setHours(0, 0, 0, 0);
      groupBy = 'day';
      break;
    case 'last_week':
      start.setDate(now.getDate() - now.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - now.getDay() - 1);
      end.setHours(23, 59, 59, 999);
      groupBy = 'day';
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      groupBy = 'day';
      break;
    case 'last_3_months':
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      groupBy = 'month';
      break;
    case 'last_6_months':
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupBy = 'month';
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      groupBy = 'month';
      break;
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      groupBy = 'month';
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      // Auto-detect grouping if custom range is greater than 45 days
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      groupBy = diffDays > 45 ? 'month' : 'day';
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
  }
  return { start, end, groupBy };
};

// Advanced Financial Analytics with Multi-Month & Multi-Year Aggregation
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const { filter = 'this_month', startDate, endDate } = req.query;
    const { start, end, groupBy } = getDateRangeFilter(filter, startDate, endDate);

    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { items: { include: { product: true } } }
      }),
      prisma.expense.findMany({
        where: {
          OR: [
            { date: { lte: end }, endDate: { gte: start } },
            { date: { gte: start, lte: end } }
          ]
        }
      })
    ]);

    // Build timeline buckets dynamically (Day-wise or Month-wise)
    // const timelineMap = {};
    // let curr = new Date(start);

    // if (groupBy === 'month') {
    //   // Normalize to the first day of each month in the range
    //   curr.setDate(1);
    //   curr.setHours(0, 0, 0, 0);
    //   while (curr <= end) {
    //     const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
    //     timelineMap[key] = { date: key, label: curr.toLocaleString('default', { month: 'short', year: 'numeric' }), revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
    //     curr.setMonth(curr.getMonth() + 1);
    //   }
    // } else {
    //   while (curr <= end) {
    //     const key = curr.toISOString().split('T')[0];
    //     timelineMap[key] = { date: key, label: key, revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
    //     curr.setDate(curr.getDate() + 1);
    //   }
    // }
    // Build timeline buckets dynamically (Day-wise or Month-wise)
    const timelineMap = {};
    let curr = new Date(start);

    if (groupBy === 'month') {
      curr.setDate(1);
      curr.setHours(0, 0, 0, 0);
      while (curr <= end) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        timelineMap[key] = { date: key, label: curr.toLocaleString('default', { month: 'short', year: 'numeric' }), revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      while (curr <= end) {
        const key = curr.toISOString().split('T')[0];
        // ADDED 'label: key' HERE SO DAY-WISE CHARTS RENDER PROPERLY:
        timelineMap[key] = { date: key, label: key, revenue: 0, cogs: 0, expenses: 0, netProfit: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    }

    let totalRevenue = 0;
    let totalCOGS = 0;

    // Aggregate Sales Revenue & COGS
    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      const dateKey = groupBy === 'month' 
        ? `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        : saleDate.toISOString().split('T')[0];

      const rev = parseFloat(sale.totalAmount || 0);
      totalRevenue += rev;

      let saleCogs = 0;
      sale.items.forEach(item => {
        const buyingPrice = parseFloat(item.product?.buyingPrice || 0);
        saleCogs += buyingPrice * item.quantity;
      });
      totalCOGS += saleCogs;

      if (timelineMap[dateKey]) {
        timelineMap[dateKey].revenue += rev;
        timelineMap[dateKey].cogs += saleCogs;
      }
    });

    let totalExpenses = 0;

    // Prorate expenses across buckets (daily or monthly distribution)
    expenses.forEach(exp => {
      const expStart = new Date(exp.date);
      const expEnd = exp.endDate ? new Date(exp.endDate) : new Date(expStart);
      const totalSpanDays = Math.max(1, Math.ceil((expEnd - expStart) / (1000 * 60 * 60 * 24)) + 1);
      const dailyCost = parseFloat(exp.amount) / totalSpanDays;

      let d = new Date(Math.max(expStart, start));
      const rangeEndLimit = new Date(Math.min(expEnd, end));

      while (d <= rangeEndLimit) {
        const key = groupBy === 'month'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : d.toISOString().split('T')[0];

        if (timelineMap[key]) {
          timelineMap[key].expenses += dailyCost;
          totalExpenses += dailyCost;
        }
        d.setDate(d.getDate() + 1);
      }
    });

    const chartData = Object.values(timelineMap).map(item => {
      const gross = item.revenue - item.cogs;
      item.netProfit = gross - item.expenses;
      return item;
    });

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit
      },
      chartData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
};