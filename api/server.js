require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// 1. Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allows loading product thumbnail uploads across ports
}));

// 2. General Rate Limiter (Prevent DoS & Brute Force)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', globalLimiter);

// 3. Strict Rate Limiter for Authentication (Protect Login / OTP against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit login attempts
  message: { error: 'Too many login attempts, please try again after 15 minutes.' }
});

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// app.use(cors({ origin: '*' }));

// Body parser with size limits to prevent payload flood attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test Database Connection on Startup
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully via Prisma!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

checkDatabaseConnection();

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Hardware POS API is running securely' });
});

// Register Application Routes
const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes); // Apply strict limiter to auth

const settingsRoutes = require('./routes/settingsRoutes');
app.use('/api/settings', settingsRoutes);

const salesRoutes = require('./routes/salesRoutes');
app.use('/api/sales', salesRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

const expenseRoutes = require('./routes/expenseRoutes');
app.use('/api/expenses', expenseRoutes);

const ecommerceRoutes = require('./routes/ecommerceRoutes');
app.use('/api/ecommerce', ecommerceRoutes);

const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// Global Error Handling Middleware (Never leak stack traces in production)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Port & Server Startup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Secured production server running on port ${PORT}`);
});