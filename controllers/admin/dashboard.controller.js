const ProductCategory= require("../../models/product-category.model");
const Product= require("../../models/product.model");
const Accounts= require("../../models/accounts.model");
const User= require("../../models/users.model");
const Order= require("../../models/orders.model");

// GET /admin/dashboard
module.exports.dashboard = async (req, res) => {

    const statistic= {
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
    };

    // sp bán chạy
    statistic.products = await Product.find({ sold: { $gt: 0 } })
    .sort({ sold: -1 })
    .limit(5)
    .select("title thumbnail price sold");
    // console.log(statistic.products);

    if (!statistic.products || statistic.products.length === 0) {
        statistic.products = [];
    }

    // end sp bán chạy

    // doanh thu
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Đầu ngày

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Cuối ngày

    const startOfMonth = new Date();
    startOfMonth.setDate(1); // Ngày đầu tiên của tháng
    startOfMonth.setHours(0, 0, 0, 0); // 00:00:00.000

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0); // Ngày cuối cùng của tháng
    endOfMonth.setHours(23, 59, 59, 999); // 23:59:59.999

    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const recordInDay= await Order.aggregate([
        {
            $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay } // Lọc đơn hàng trong ngày hôm nay
            }
        },
        {
            $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" } // Tính tổng totalPrice
            }
        }
    ]);
    
    if(recordInDay.length > 0){
        statistic.totalRevenue.inDay= recordInDay[0].totalRevenue;
        console.log(recordInDay[0]);
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
    if(revenuePerDay.length > 0){
        statistic.revenuePerDay = revenuePerDay;
    }
    
    const recordInMonth= await Order.aggregate([
        {
            $match: {
            createdAt: { $gte: startOfMonth, $lte: endOfMonth } // Lọc đơn hàng trong ngày hôm nay
            }
        },
        {
            $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" } // Tính tổng totalPrice
            }
        }
    ]);
    if(recordInMonth.length > 0){
        statistic.totalRevenue.inMonth= recordInMonth[0].totalRevenue;
        // console.log(statistic.totalRevenue.inMonth);
    }
    

    // end doanh thu

    // Số lượng người dùng
    statistic.user.total= await User.countDocuments({
        deleted: false
    });
    statistic.user.statusOnline= await User.countDocuments({
        statusOnline: "online",
        deleted: false
    });
    // end số lượng người dùng


    res.render("admin/pages/dashboard/index", {
        pageTitle: "Trang chủ",
        statistic: statistic
    });
}