const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      revenueAgg,
      recentOrders,
      topProducts
    ] = await Promise.all([
      User.countDocuments({}),
      Order.countDocuments({}),
      Product.countDocuments({}),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },   // ✅ Only paid
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
      ]),
      Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(8),
      Product.find({})
        .sort({ sold: -1 })
        .limit(8)
        .populate('category', 'name')
    ]);

    const totalRevenue = revenueAgg.length ? revenueAgg[0].revenue : 0;

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalProducts
      },
      recentOrders,
      topProducts
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};