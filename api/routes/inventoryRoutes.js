// api/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const inventoryController = require('../controllers/inventoryController');

// Memory storage for parsing file buffer
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', inventoryController.getAllProducts);
router.post('/', upload.single('image'), inventoryController.addProduct);
router.put('/:id', upload.single('image'), inventoryController.updateProduct);
router.post('/import-excel', upload.single('file'), inventoryController.importExcel);
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;