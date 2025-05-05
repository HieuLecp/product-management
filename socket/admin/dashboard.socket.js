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

        return statistic;
    } catch (error) {
        console.error('Error in getDashboardStatistic:', error);
        return {
            products: [],
            totalRevenue: { inDay: 0, inMonth: 0 },
            user: { total: 0, statusOnline: 0 },
            revenuePerDay: []
        };
    }
}

module.exports = {
    setupSocket: () => {
        global._io.on('connection', async (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('requestInitialData', async () => {
                const statistic = await getDashboardStatistic();
                socket.emit('initialDashboardData', statistic);
            });

            Order.watch().on('change', async (change) => {
                if (change.operationType === 'insert') {
                    const updatedStatistic = await getDashboardStatistic();
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