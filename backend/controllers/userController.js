const User = require('../models/User');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const userIds = users.map((user) => user._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ]);

    const statsMap = new Map(orderStats.map((entry) => [entry._id.toString(), entry]));

    const usersWithStats = users.map((user) => {
      const stats = statsMap.get(user._id.toString());
      return {
        ...user.toObject(),
        totalOrders: stats ? stats.totalOrders : 0,
        totalSpent: stats ? stats.totalSpent : 0
      };
    });

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const orders = await Order.find({ user: user._id })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    const cart = await Cart.findOne({ user: user._id }).populate('items.product', 'name images stock');

    res.json({
      success: true,
      user,
      orders,
      cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, name, phone, isBlocked } = req.body;

    const update = {};
    if (role) update.role = role;
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (typeof isBlocked === 'boolean') update.isBlocked = isBlocked;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
