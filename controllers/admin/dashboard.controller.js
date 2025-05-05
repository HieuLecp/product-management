const Product = require("../../models/product.model");
const Order = require("../../models/orders.model");
const User = require("../../models/users.model");

module.exports.dashboard = async (req, res) => {
    const statistic = {
        products: {
            title: "",
            thumbnail: "",
            sold: ""
        },
        totalRevenue: {
            inDay: 0,
            inMonth: 0
        },
        user: {
            total: 0,
            statusOnline: 0,
        },
        revenuePerDay: []
    };

    // Sản phẩm bán chạy
    statistic.products = await Product.find({ sold: { $gt: 0 } })
        .sort({ sold: -1 })
        .limit(5)
        .select("title thumbnail price sold")
        .lean();

    if (!statistic.products || statistic.products.length === 0) {
        statistic.products = [];
    }

    // Doanh thu
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const recordInDay = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalPrice" }
            }
        }
    ]);

    if (recordInDay.length > 0) {
        statistic.totalRevenue.inDay = recordInDay[0].totalRevenue;
    }

    const revenuePerDay = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfCurrentMonth, $lte: endOfMonth }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalRevenue: { $sum: "$totalPrice" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    if (revenuePerDay.length > 0) {
        statistic.revenuePerDay = revenuePerDay;
    }

    const recordInMonth = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalPrice" }
            }
        }
    ]);

    if (recordInMonth.length > 0) {
        statistic.totalRevenue.inMonth = recordInMonth[0].totalRevenue;
    }

    // Số lượng người dùng
    statistic.user.total = await User.countDocuments({
        deleted: false
    });

    statistic.user.statusOnline = await User.countDocuments({
        statusOnline: "online",
        deleted: false
    });

    res.render("admin/pages/dashboard/index", {
        pageTitle: "Trang chủ",
        statistic
    });
};