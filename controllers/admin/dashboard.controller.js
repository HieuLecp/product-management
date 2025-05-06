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
        revenuePerDay: [],
        orderCompletionRate: { // Thêm orderCompletionRate vào cấu trúc
            inDay: 0,
            inMonth: 0
        },
        lowStockProducts: []
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

    const startOfMarch = new Date(2025, 2, 1); // Tháng 3/2025 (tháng 2 trong JavaScript vì index bắt đầu từ 0)
    startOfMarch.setHours(0, 0, 0, 0);

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
        statistic.totalRevenue.inDay = recordInDay[0].totalRevenue.toLocaleString("vi-VN");
    }

    const revenuePerDay = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfMarch, $lte: endOfDay }
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
    // console.log('Revenue per day:', revenuePerDay);

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
        statistic.totalRevenue.inMonth = recordInMonth[0].totalRevenue.toLocaleString("vi-VN");
    }

    // Số lượng người dùng
    statistic.user.total = await User.countDocuments({
        deleted: false
    });

    statistic.user.statusOnline = await User.countDocuments({
        statusOnline: "online",
        deleted: false
    });

    // Tỷ lệ hoàn thành đơn hàng
    const totalOrdersInDay = await Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const completedOrdersInDay = await Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: "completed"
    });

    statistic.orderCompletionRate.inDay = totalOrdersInDay > 0 ? (completedOrdersInDay / totalOrdersInDay * 100).toFixed(2) : 0;

    const totalOrdersInMonth = await Order.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const completedOrdersInMonth = await Order.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: "completed"
    });

    statistic.orderCompletionRate.inMonth = totalOrdersInMonth > 0 ? (completedOrdersInMonth / totalOrdersInMonth * 100).toFixed(2) : 0;

    // Sản phẩm tồn kho thấp
    try {
        const lowStock = await Product.find({ stock: { $lte: 10, $gte: 0 } })
            .sort({ stock: 1 })
            .limit(5)
            .select("title stock id")
            .lean();
        statistic.lowStockProducts = lowStock || []; // Đảm bảo luôn là mảng
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        statistic.lowStockProducts = []; // Nếu có lỗi, gán mảng rỗng
    }
    // console.log(statistic.lowStockProducts)

    // Tỷ lệ bán theo danh mục (product_category_id)
    const categorySales = await Product.aggregate([
        {
            $match: {
                sold: { $gt: 0 },
                deleted: false,
                product_category_id: { $ne: "" }
            }
        },
        {
            // Ép kiểu product_category_id từ String sang ObjectId
            $addFields: {
                categoryObjectId: { $toObjectId: "$product_category_id" }
            }
        },
        {
            $group: {
                _id: "$categoryObjectId",
                totalSold: { $sum: "$sold" }
            }
        },
        {
            $lookup: {
                from: "products-category", // Collection đúng
                localField: "_id",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                categoryId: "$_id",
                categoryName: { $ifNull: ["$category.title", "Không xác định"] },
                totalSold: 1
            }
        }
    ]);
    
    const totalSoldOverall = categorySales.reduce((sum, item) => sum + item.totalSold, 0);
    
    statistic.categorySalesRatio = categorySales.map(item => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalSold: item.totalSold,
        percentage: totalSoldOverall > 0
            ? ((item.totalSold / totalSoldOverall) * 100).toFixed(2)
            : "0.00"
    }));
    
    // console.log('Category sales ratio:', statistic.categorySalesRatio);

    res.render("admin/pages/dashboard/index", {
        pageTitle: "Trang chủ",
        statistic
    });
};