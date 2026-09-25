const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      trim: true
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'DELIVERED'],
      default: 'CONFIRMED'
    },
    // Snapshot of validated inter-service data
    userDetails: {
      name: String,
      email: String,
      role: String,
      department: String
    },
    productDetails: {
      name: String,
      category: String,
      unitPrice: Number
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('Order', orderSchema);
