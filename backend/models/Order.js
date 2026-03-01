const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    name: {
      type: String,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'RAZORPAY'],
    default: 'COD',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    fullName: {
      type: String,
      required: [true, 'Please provide full name']
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    addressLine1: {
      type: String,
      required: [true, 'Please provide address line 1']
    },
    addressLine2: String,
    city: {
      type: String,
      required: [true, 'Please provide city']
    },
    state: {
      type: String,
      required: [true, 'Please provide state']
    },
    pincode: {
      type: String,
      required: [true, 'Please provide pincode'],
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    }
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
