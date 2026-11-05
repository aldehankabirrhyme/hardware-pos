// api/controllers/settingsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// 1. Get All System Users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true
      }
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// 2. Create New User (Admin, Manager, or Salesman)
exports.createUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, permissions, isActive } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }

    // Check if phone or email already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] }
    });

    if (existing) {
      return res.status(400).json({ error: 'A user with this phone or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        passwordHash,
        role: role || 'SALESMAN',
        permissions: permissions || { canViewProfit: false, canEditStock: false },
        isActive: isActive ?? true
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({ success: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// 3. Update User (Role, Permissions, Status, Password)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, password, role, permissions, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updateData = {
      name,
      phone,
      email,
      role,
      permissions,
      isActive
    };

    // If a new password is provided, hash and update it
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// 4. Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself or the main administrator if needed
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user. User may be tied to existing sales records.' });
  }
};

// Get System Settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'global_config' }
    });

    // If no settings exist yet, create default configuration
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'global_config',
          shopName: 'Makkah Hardware & Tools',
          requireDueOtpVerify: true,
          smsSenderId: 'HARDWARE_BD',
          bkashMerchantId: '01700000000'
        }
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Update System Settings
exports.updateSettings = async (req, res) => {
  try {
    const {
      shopName,
      requireDueOtpVerify,
      smsGatewayApiKey,
      smsSenderId,
      bkashMerchantId,
      bkashAppKey
    } = req.body;

    const updatedSettings = await prisma.systemSettings.upsert({
      where: { id: 'global_config' },
      update: {
        shopName,
        requireDueOtpVerify,
        smsGatewayApiKey,
        smsSenderId,
        bkashMerchantId,
        bkashAppKey
      },
      create: {
        id: 'global_config',
        shopName: shopName || 'Makkah Hardware & Tools',
        requireDueOtpVerify: requireDueOtpVerify ?? true,
        smsGatewayApiKey,
        smsSenderId,
        bkashMerchantId,
        bkashAppKey
      }
    });

    res.json({ success: true, message: 'Settings updated successfully', settings: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};