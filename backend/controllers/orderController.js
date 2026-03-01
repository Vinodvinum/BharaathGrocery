const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendMail } = require('../utils/mailer');
const { generateInvoicePdfBuffer, getInvoiceFileName } = require('../utils/invoice');

const ALLOWED_PAYMENT_METHODS = ['COD', 'RAZORPAY'];

const normalizeShippingAddress = (shippingAddress = {}) => ({
  fullName: String(shippingAddress.fullName || '').trim(),
  phone: String(shippingAddress.phone || '').trim(),
  addressLine1: String(shippingAddress.addressLine1 || '').trim(),
  addressLine2: String(shippingAddress.addressLine2 || '').trim(),
  city: String(shippingAddress.city || '').trim(),
  state: String(shippingAddress.state || '').trim(),
  pincode: String(shippingAddress.pincode || '').trim()
});

const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress.fullName || shippingAddress.fullName.length < 2) {
    return 'Please provide a valid full name';
  }

  if (!/^[0-9]{10}$/.test(shippingAddress.phone)) {
    return 'Please provide a valid 10-digit phone number';
  }

  if (!shippingAddress.addressLine1 || shippingAddress.addressLine1.length < 5) {
    return 'Please provide a valid address line 1';
  }

  if (!shippingAddress.city || shippingAddress.city.length < 2) {
    return 'Please provide a valid city';
  }

  if (!shippingAddress.state || shippingAddress.state.length < 2) {
    return 'Please provide a valid state';
  }

  if (!/^[0-9]{6}$/.test(shippingAddress.pincode)) {
    return 'Please provide a valid 6-digit pincode';
  }

  return null;
};

const buildEmailHtml = ({ heading, order, message }) => {
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleString('en-IN');
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
      <h2>${heading}</h2>
      <p>${message}</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Date:</strong> ${orderDate}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
      <p><strong>Total:</strong> INR ${Number(order.totalAmount || 0).toFixed(2)}</p>
      <p>Invoice is attached in this email.</p>
    </div>
  `;
};

const sendOrderInvoiceEmail = async (order, type) => {
  try {
    const email = order?.user?.email;
    if (!email) return;

    const pdfBuffer = generateInvoicePdfBuffer(order);

    let heading = 'Order Confirmation';
    let message = 'Your order has been placed successfully.';
    if (type === 'paid') {
      heading = 'Payment Confirmation';
      message = 'Your payment is confirmed. Please find your invoice attached.';
    } else if (type === 'delivered') {
      heading = 'Order Delivered';
      message = 'Your order has been delivered. Please find your invoice attached.';
    }

    await sendMail({
      to: email,
      subject: `Bharat Basket - ${heading} (${String(order._id).slice(-8).toUpperCase()})`,
      html: buildEmailHtml({ heading, order, message }),
      attachments: [{
        filename: getInvoiceFileName(order),
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    console.log(`[mail] Invoice email sent (${type}) to ${email} for order ${order._id}`);
  } catch (error) {
    console.error(`[mail] Failed to send invoice email (${type}) for order ${order?._id}: ${error.message}`);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = 'COD',
      paymentStatus,
      paymentDetails = {}
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
    const shippingValidationError = validateShippingAddress(normalizedShippingAddress);
    if (shippingValidationError) {
      return res.status(400).json({ success: false, message: shippingValidationError });
    }

    const hasInvalidQuantity = items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1);
    if (hasInvalidQuantity) {
      return res.status(400).json({ success: false, message: 'Each order item must have quantity of at least 1' });
    }

    const hasInvalidProductId = items.some((item) => !mongoose.Types.ObjectId.isValid(String(item.product || '')));
    if (hasInvalidProductId) {
      return res.status(400).json({ success: false, message: 'One or more products have invalid identifiers' });
    }

    const productIds = items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const itemMap = new Map(products.map((p) => [p._id.toString(), p]));

    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = itemMap.get(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: 'One or more products are unavailable' });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `${product.name} has insufficient stock` });
      }

      const orderItem = {
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        name: product.name
      };

      validatedItems.push(orderItem);
      totalAmount += product.price * item.quantity;
    }

    const finalPaymentStatus = paymentMethod === 'COD'
      ? 'pending'
      : (paymentStatus === 'paid' ? 'paid' : 'pending');

    const order = await Order.create({
      user: req.user._id,
      items: validatedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      paymentDetails: paymentMethod === 'RAZORPAY' ? {
        razorpayOrderId: paymentDetails.razorpayOrderId || '',
        razorpayPaymentId: paymentDetails.razorpayPaymentId || '',
        razorpaySignature: paymentDetails.razorpaySignature || ''
      } : {},
      status: 'pending',
      shippingAddress: normalizedShippingAddress,
      statusHistory: [{
        status: 'pending',
        comment: paymentMethod === 'COD' ? 'Order placed (Cash on Delivery)' : 'Order placed (Online Payment)'
      }]
    });

    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity }
      });
    }

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { upsert: true }
    );

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    // Fire-and-forget mail: do not block order placement.
    sendOrderInvoiceEmail(populatedOrder, 'placed');

    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;

    if (status) {
      order.status = status;
      order.statusHistory.push({ status, comment: `Updated by admin to ${status}` });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (previousPaymentStatus !== 'paid' && populatedOrder.paymentStatus === 'paid') {
      sendOrderInvoiceEmail(populatedOrder, 'paid');
    }

    if (previousStatus !== 'delivered' && populatedOrder.status === 'delivered') {
      sendOrderInvoiceEmail(populatedOrder, 'delivered');
    }

    res.json({ success: true, message: 'Order updated successfully', order: populatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this invoice' });
    }

    const pdfBuffer = generateInvoicePdfBuffer(order);
    const fileName = getInvoiceFileName(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
