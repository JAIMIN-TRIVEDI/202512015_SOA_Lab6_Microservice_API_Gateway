const mongoose = require('mongoose');
const Order = require('../models/Order');
const { fetchUser, fetchProduct } = require('../services/client');

// Helper to find order by custom orderId or MongoDB _id
const findOrderByIdOrCustomId = async (id) => {
  let order = await Order.findOne({ orderId: id });
  if (!order && mongoose.Types.ObjectId.isValid(id)) {
    order = await Order.findById(id);
  }
  return order;
};

// GET /orders - Retrieve all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      service: 'order-service',
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'order-service',
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
};

// GET /orders/:id - Retrieve order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await findOrderByIdOrCustomId(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        service: 'order-service',
        message: `Order with ID '${id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      service: 'order-service',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'order-service',
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// POST /orders - Create order with synchronous inter-service validation
exports.createOrder = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // 1. Basic Payload Validation
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        service: 'order-service',
        message: 'Both userId and productId are required to place an order.'
      });
    }

    const orderQty = parseInt(quantity, 10) || 1;
    if (orderQty <= 0) {
      return res.status(400).json({
        success: false,
        service: 'order-service',
        message: 'Quantity must be at least 1.'
      });
    }

    console.log(`\n======================================================`);
    console.log(`🛒 [Order Service] Processing new order:`);
    console.log(`   User: ${userId} | Product: ${productId} | Quantity: ${orderQty}`);
    console.log(`======================================================`);

    // 2. Inter-Service Call: Validate User with User Service
    const userResult = await fetchUser(userId);
    if (!userResult.success) {
      console.warn(`[Order Service] ⚠️ User validation failed: ${userResult.message}`);
      return res.status(userResult.status || 500).json({
        success: false,
        service: 'order-service',
        targetService: 'user-service',
        message: userResult.message
      });
    }
    const user = userResult.data;
    console.log(`[Order Service] ✅ User validated: ${user.name} (${user.email})`);

    // 3. Inter-Service Call: Validate Product with Product Service
    const productResult = await fetchProduct(productId);
    if (!productResult.success) {
      console.warn(`[Order Service] ⚠️ Product validation failed: ${productResult.message}`);
      return res.status(productResult.status || 500).json({
        success: false,
        service: 'order-service',
        targetService: 'product-service',
        message: productResult.message
      });
    }
    const product = productResult.data;
    console.log(`[Order Service] ✅ Product validated: ${product.name} ($${product.price})`);

    // 4. Stock Availability Check
    if (product.stock !== undefined && product.stock < orderQty) {
      return res.status(400).json({
        success: false,
        service: 'order-service',
        message: `Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${orderQty}`
      });
    }

    // 5. Calculate Pricing & Create Order
    const unitPrice = product.price;
    const totalAmount = unitPrice * orderQty;
    const orderId = 'ord_' + Date.now().toString().slice(-6);

    const order = new Order({
      orderId,
      userId: user.userId || userId,
      productId: product.productId || productId,
      quantity: orderQty,
      unitPrice,
      totalAmount,
      status: 'CONFIRMED',
      userDetails: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      productDetails: {
        name: product.name,
        category: product.category,
        unitPrice: product.price
      }
    });

    const savedOrder = await order.save();
    console.log(`[Order Service] 📦 Order created successfully: ID ${savedOrder.orderId}`);

    res.status(201).json({
      success: true,
      service: 'order-service',
      message: 'Order placed successfully after inter-service validation',
      data: savedOrder
    });
  } catch (error) {
    console.error(`[Order Service] ❌ Order creation error: ${error.message}`);
    res.status(500).json({
      success: false,
      service: 'order-service',
      message: 'Internal server error while processing order',
      error: error.message
    });
  }
};
