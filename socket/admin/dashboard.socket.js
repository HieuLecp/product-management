const Product = require('../../models/product.model');
const Order = require('../../models/orders.model');
const User = require('../../models/users.model');
const Accounts = require('../../models/accounts.model');

async function getDashboardStatistic() {
    try {
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
            recentlyUpdatedProducts: [],
            paymentTypeStats: {
                cod: 0,
                momo: 0,
                zalopay: 0
            },
            categorySalesRatio: [], // Thêm categorySalesRatio vào statistic
            orderPlacementRate: { // Thay orderCompletionRate bằng orderPlacementRate
                inDay: 0,
                inMonth: 0
            }
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
            statistic.totalRevenue.inDay = recordInDay[0].totalRevenue.toLocaleString("vi-VN");
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
            statistic.totalRevenue.inMonth = recordInMonth[0].totalRevenue.toLocaleString("vi-VN");
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
        
        statistic.revenuePerDay = revenuePerDay;

        // Số lượng người dùng
        statistic.user.total = await User.countDocuments({
            deleted: false
        });

        statistic.user.statusOnline = await User.countDocuments({
            statusOnline: "online",
            deleted: false
        });

        // Thống kê phương thức thanh toán
        const paymentTypeStats = await Order.aggregate([
            {
                $group: {
                    _id: "$paymentType",
                    count: { $sum: 1 }
                }
            }
        ]);

        paymentTypeStats.forEach(stat => {
            if (stat._id) {
                statistic.paymentTypeStats[stat._id] = stat.count;
            }
        });

        // Tỷ lệ đặt hàng
        const totalOrdersInDay = await Order.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
        statistic.orderPlacementRate.inDay = totalOrdersInDay;

        const totalOrdersInMonth = await Order.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        statistic.orderPlacementRate.inMonth = totalOrdersInMonth;

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

        return statistic;
    } catch (error) {
        console.error('Error in getDashboardStatistic:', error);
        return {
            products: [],
            totalRevenue: { inDay: 0, inMonth: 0 },
            user: { total: 0, statusOnline: 0 },
            revenuePerDay: [],
            recentlyUpdatedProducts: [],
            paymentTypeStats: { cod: 0, momo: 0, zalopay: 0 },
            categorySalesRatio: [],
            orderPlacementRate: { inDay: 0, inMonth: 0 }
        };
    }
}

module.exports = {
    getDashboardStatistic,
    setupSocket: () => {
        global._io.on('connection', async (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('requestInitialData', async () => {
                const statistic = await getDashboardStatistic();
                socket.emit('initialDashboardData', statistic);
            });

            const changeStream = Order.watch();
            changeStream.on('change', async (change) => {
                console.log('Order change detected:', change);
                if (change.operationType === 'insert') {
                    const updatedStatistic = await getDashboardStatistic();
                    console.log('Emitting updateDashboard with paymentTypeStats:', updatedStatistic.paymentTypeStats);
                    global._io.emit('updateDashboard', updatedStatistic);
                }
            });

            socket.on('productDeleted', (data) => {
                console.log('Product deleted:', data.id);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
};