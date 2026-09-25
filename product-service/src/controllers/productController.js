const mongoose = require('mongoose');
const Product = require('../models/Product');

// Helper to find product by custom productId or MongoDB _id
const findProductByIdOrCustomId = async (id) => {
  let product = await Product.findOne({ productId: id });
  if (!product && mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id);
  }
  return product;
};

// GET /products - Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      service: 'product-service',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'product-service',
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
};

// GET /products/:id - Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await findProductByIdOrCustomId(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        service: 'product-service',
        message: `Product with ID '${id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      service: 'product-service',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'product-service',
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// POST /products - Create new product
exports.createProduct = async (req, res) => {
  try {
    let { productId, name, description, price, category, stock, isAvailable } = req.body;

    if (!productId) {
      productId = 'p_' + Math.floor(100 + Math.random() * 900);
    }

    const existingProduct = await Product.findOne({ productId });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        service: 'product-service',
        message: `Product with ID '${productId}' already exists`
      });
    }

    const product = new Product({
      productId,
      name,
      description: description || '',
      price: Number(price),
      category: category || 'General',
      stock: stock !== undefined ? Number(stock) : 10,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      service: 'product-service',
      message: 'Product created successfully',
      data: savedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      service: 'product-service',
      message: 'Validation failed',
      error: error.message
    });
  }
};

// PUT /products/:id - Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let product = await findProductByIdOrCustomId(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        service: 'product-service',
        message: `Product with ID '${id}' not found`
      });
    }

    Object.assign(product, updates);
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      service: 'product-service',
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      service: 'product-service',
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// DELETE /products/:id - Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await findProductByIdOrCustomId(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        service: 'product-service',
        message: `Product with ID '${id}' not found`
      });
    }

    await Product.deleteOne({ _id: product._id });

    res.status(200).json({
      success: true,
      service: 'product-service',
      message: `Product '${id}' deleted successfully`,
      data: { productId: product.productId, name: product.name }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'product-service',
      message: 'Failed to delete product',
      error: error.message
    });
  }
};
