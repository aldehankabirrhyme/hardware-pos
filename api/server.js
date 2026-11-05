// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Test Database Connection on Startup
async function checkDatabaseConnection() {
  try {
    // Run a lightweight query to test PostgreSQL connection
    await prisma.$connect();
    console.log('✅ Database connected successfully via Prisma!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

checkDatabaseConnection();

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Hardware POS API is running smoothly' });
});

// Add inside server.js
const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const settingsRoutes = require('./routes/settingsRoutes');
app.use('/api/settings', settingsRoutes);

const salesRoutes = require('./routes/salesRoutes');
app.use('/api/sales', salesRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

const expenseRoutes = require('./routes/expenseRoutes');
app.use('/api/expenses', expenseRoutes);

// Port & Server Startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});