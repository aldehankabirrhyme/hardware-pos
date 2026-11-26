const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xlsx = require('xlsx');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Helper to process & auto-crop image to 1:1 ratio (600x600 px)
const processProductImage = async (fileBuffer) => {
  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const outputPath = path.join(uploadDir, filename);

  // Crop to 600x600 square (1:1 ratio) with gravity 'center'
  await sharp(fileBuffer)
    .resize(600, 600, {
      fit: 'cover',        // Scales image to fill dimensions and crops overflow
      position: 'center',  // Keeps the center of the image
    })
    .toFormat('webp', { quality: 80 })
    .toFile(outputPath);

  return `/uploads/${filename}`;
};

// Helper to sanitize array of image URLs
const parseImageUrls = (imageUrls) => {
  if (!imageUrls) return [];
  if (Array.isArray(imageUrls)) return imageUrls;
  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If not JSON, split comma-separated string
      return imageUrls.split(',').map((url) => url.trim()).filter(Boolean);
    }
  }
  return [];
};

// 1. Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch inventory products' });
  }
};

// 2. Add Single Product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      sellingPrice,
      buyingPrice,
      stockQuantity,
      reorderLevel,
      brandId,
      categoryId,
      size,
      color,
      unit,
      description,
      isPublished,
      allowCustomLength,
      imageUrl: bodyImageUrl,
      imageUrls: bodyImageUrls,
    } = req.body;

    // 1. Ensure SKU is provided or generate a unique random fallback SKU
    const finalSku =
      sku && sku.trim() !== ''
        ? sku.trim()
        : `SKU-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Check explicitly if SKU exists before creating
    const existingProduct = await prisma.product.findUnique({
      where: { sku: finalSku },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: `A product with SKU "${finalSku}" already exists. Please use a unique SKU.`,
      });
    }

    let imageUrl = bodyImageUrl || null;
    if (req.file) {
      imageUrl = await processProductImage(req.file.buffer);
    }

    const formattedImageUrls = parseImageUrls(bodyImageUrls);

    // 3. Create Product in DB
    const newProduct = await prisma.product.create({
      data: {
        name,
        sku: finalSku,
        sellingPrice: parseFloat(sellingPrice),
        buyingPrice: parseFloat(buyingPrice || 0),
        stockQuantity: parseInt(stockQuantity || 0, 10),
        reorderLevel: parseInt(reorderLevel || 5, 10),
        unit: unit || 'pieces',
        size: size || null,
        color: color || null,
        description: description || null,
        isPublished: isPublished === 'true' || isPublished === true,
        allowCustomLength: allowCustomLength === 'true' || allowCustomLength === true,
        imageUrl,
        imageUrls: formattedImageUrls,
        ...(brandId && { brand: { connect: { id: brandId } } }),
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      },
    });

    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);

    // Catch Prisma P2002 Unique Constraint Fallback
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      return res.status(400).json({
        success: false,
        error: 'Product SKU must be unique. Duplicate SKU detected.',
      });
    }

    return res
      .status(500)
      .json({ success: false, error: 'Internal server error while creating product.' });
  }
};

// 3. Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      size,
      color,
      unit,
      buyingPrice,
      sellingPrice,
      stockQuantity,
      reorderLevel,
      description,
      isPublished,
      allowCustomLength,
      imageUrl: bodyImageUrl,
      imageUrls: bodyImageUrls,
      brandId,
      categoryId,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let imageUrl = bodyImageUrl !== undefined ? bodyImageUrl : existingProduct.imageUrl;
    if (req.file) {
      imageUrl = await processProductImage(req.file.buffer);
    }

    const formattedImageUrls =
      bodyImageUrls !== undefined
        ? parseImageUrls(bodyImageUrls)
        : existingProduct.imageUrls;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        size: size || null,
        color: color || null,
        unit: unit || 'pieces',
        buyingPrice: parseFloat(buyingPrice),
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseInt(stockQuantity, 10),
        reorderLevel: parseInt(reorderLevel, 10),
        description: description || null,
        isPublished: isPublished === 'true' || isPublished === true,
        allowCustomLength: allowCustomLength === 'true' || allowCustomLength === true,
        imageUrl,
        imageUrls: formattedImageUrls,
        ...(brandId ? { brand: { connect: { id: brandId } } } : { brand: { disconnect: true } }),
        ...(categoryId ? { category: { connect: { id: categoryId } } } : { category: { disconnect: true } }),
      },
    });

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product details.' });
  }
};

// 4. Import Products from Excel Sheet
exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to array of arrays to find the real header row dynamically
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let headerRowIndex = -1;
    let headers = [];

    // Search for the row that contains column headers like 'SKU' or 'Product Name'
    for (let i = 0; i < rows.length; i++) {
      const rowStr = rows[i].map((cell) => String(cell || '').trim().toLowerCase());
      if (rowStr.includes('sku') || rowStr.includes('product name') || rowStr.includes('name')) {
        headerRowIndex = i;
        headers = rows[i].map((h) => String(h || '').trim());
        break;
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({
        error: 'Could not find valid column headers (SKU, Product Name) in the Excel sheet.',
      });
    }

    // Map the remaining rows using the detected headers
    let importedCount = 0;
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const rowValues = rows[i];
      if (!rowValues || rowValues.length === 0) continue;

      const rowObj = {};
      headers.forEach((header, index) => {
        if (header) {
          rowObj[header.toLowerCase()] = rowValues[index];
        }
      });

      const name = rowObj['product name'] || rowObj['name'] || rowObj['item name'];
      if (!name) continue;

      const sku =
        rowObj['sku'] || rowObj['code'] || `HW-${Math.floor(100000 + Math.random() * 900000)}`;
      const size = rowObj['size'] || 'N/A';
      const color = rowObj['color'] || 'N/A';
      const unit = rowObj['unit'] || 'pieces';
      const buyingPrice = parseFloat(
        rowObj['buying price (৳)'] || rowObj['buying price'] || rowObj['cost'] || 0
      );
      const sellingPrice = parseFloat(
        rowObj['selling price (৳)'] || rowObj['selling price'] || rowObj['price'] || 0
      );
      const stockQuantity = parseInt(
        rowObj['stock quantity'] || rowObj['stock'] || rowObj['quantity'] || 0,
        10
      );
      const reorderLevel = parseInt(rowObj['reorder level'] || rowObj['reorder'] || 5, 10);

      await prisma.product.upsert({
        where: { sku: String(sku) },
        update: {
          name: String(name),
          size: String(size),
          color: String(color),
          buyingPrice,
          sellingPrice,
          stockQuantity,
        },
        create: {
          sku: String(sku),
          name: String(name),
          size: String(size),
          color: String(color),
          unit: String(unit),
          buyingPrice,
          sellingPrice,
          stockQuantity,
          reorderLevel,
        },
      });

      importedCount++;
    }

    res.json({
      success: true,
      message: `Successfully imported and synced ${importedCount} items into PostgreSQL database.`,
    });
  } catch (error) {
    console.error('Excel Import Error:', error);
    res.status(500).json({ error: 'Failed to process Excel spreadsheet.' });
  }
};

// 5. Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};