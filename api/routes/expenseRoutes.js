// api/routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/daily-report', expenseController.getDailyProfitReport);
router.get('/monthly-analytics', expenseController.getMonthlyAnalytics);
router.get('/financial-analytics', expenseController.getFinancialAnalytics);
router.get('/', expenseController.getExpenses);
router.post('/', expenseController.addExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

// getDateRangeFilter
// getFinancialAnalytics