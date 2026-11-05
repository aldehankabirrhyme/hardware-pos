const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
// const userController = require('../controllers/userController');

// System Settings Endpoints
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// User Management Endpoints (Admin Control Panel)
router.get('/users', settingsController.getUsers);
router.post('/users', settingsController.createUser);
router.put('/users/:id', settingsController.updateUser);
router.delete('/users/:id', settingsController.deleteUser);

module.exports = router;