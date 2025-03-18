const mongoose= require('mongoose')

const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const orderSchema = new mongoose.Schema(
    {
        cart_id: String,
        momoOrderId: String,
        user_id: String,
        userInfo: {
            fullName: String,
            phone: String,
            address: String
        },
        products: [
            {
                product_id: String,
                price: Number,
                discountPercentage: Number,
                quantity: Number
            }
        ],
        totalPrice: Number,
        status: String
    }, 
    {
        timestamps : true
    }
);

const Order = mongoose.model('Order', orderSchema, "orders");

module.exports = Order;