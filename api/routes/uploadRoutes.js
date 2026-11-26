const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `prod-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/product-images', (req, res) => {
  upload.array('images', 6)(req, res, (err) => {
    if (err) {
      console.error('Multer Upload Error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      console.warn('No files received in request payload');
      return res.status(400).json({ error: 'No files selected' });
    }

    console.log(`Successfully saved ${req.files.length} images to ${uploadDir}`);

    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    
    res.json({
      thumbnailUrl: fileUrls[0],
      galleryUrls: fileUrls
    });
  });
});

module.exports = router;