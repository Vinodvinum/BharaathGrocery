const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Product = require('../models/Product');

const getRazorpayClient = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

const validateItemsAndTotal = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Order items are required' };
  }

  const invalidQty = items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1);
  if (invalidQty) {
    return { error: 'Each order item must have quantity of at least 1' };
  }

  const invalidProductId = items.some((item) => !mongoose.Types.ObjectId.isValid(String(item.product || '')));
  if (invalidProductId) {
    return { error: 'One or more products have invalid identifiers' };
  }

  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  let totalAmount = 0;
  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product || !product.isActive) {
      return { error: 'One or more products are unavailable' };
    }

    if (product.stock < Number(item.quantity)) {
      return { error: `${product.name} has insufficient stock` };
    }

    totalAmount += product.price * Number(item.quantity);
  }

  return { totalAmount };
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay is not configured on server'
      });
    }

    const { items } = req.body;
    const { error, totalAmount } = await validateItemsAndTotal(items);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${req.user._id}_${Date.now()}`
    });

    res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
      currency: 'INR',
      razorpayOrder: order
    });
  } catch (error) {
    const message = error?.error?.description || error?.message || 'Razorpay order creation failed';
    res.status(500).json({ success: false, message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification fields are required'
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error?.message || 'Payment verification failed' });
  }
};
