const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images stock');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product', 'name images stock');
  }
  return cart;
}

exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => item.product._id.toString() === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + Number(quantity);
      if (newQuantity > product.stock) {
        return res.status(400).json({ success: false, message: 'Quantity exceeds available stock' });
      }
      existingItem.quantity = newQuantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({
        product: product._id,
        quantity: Number(quantity),
        price: product.price
      });
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images stock');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((entry) => entry._id.toString() === req.params.itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const product = await Product.findById(item.product._id);
    if (!product || quantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Quantity exceeds available stock' });
    }

    item.quantity = Number(quantity);
    item.price = product.price;

    await cart.save();
    const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images stock');

    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
    await cart.save();

    const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images stock');
    res.json({ success: true, cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
