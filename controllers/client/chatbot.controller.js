// controllers/chatbotController.js
const ChatBot = require('../../services/chatbot');
const User = require("../../models/users.model");
const Product = require('../../models/product.model');
const Cart= require("../../models/carts.model");

const chatbot = new ChatBot(Product);

// [POST]/chatbot/
module.exports.index = async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Vui lòng gửi câu hỏi." });
    }

    try {
        const isLaptopQuery = message.toLowerCase().includes('laptop') || 
                            ['dell', 'lenovo', 'hp', 'apple', 'asus'].some(brand => message.toLowerCase().includes(brand));
        
        let response;
        if (isLaptopQuery) {
            response = await chatbot.searchLaptops(message);
        } else {
            response = await chatbot.chat_with_bot(message);
        }

        // Xử lý phản hồi
        if (Array.isArray(response)) {
            res.json({ products: response, type: 'productList' });
        } else if (response && typeof response === 'object' && response.type === 'text') {
            res.json({ reply: response.reply || 'Không có phản hồi.', type: 'text' });
        } else if (response && typeof response === 'object' && response.type === 'productList') {
            res.json({ products: response.products || [], type: 'productList' });
        } else if (typeof response === 'string') {
            res.json({ reply: response, type: 'text' });
        } else {
            res.json({ reply: 'Phản hồi không hợp lệ.', type: 'text' });
        }
    } catch (error) {
        console.error('Lỗi trong chatbotHandler:', error);
        res.status(500).json({ reply: 'Đã xảy ra lỗi server. Vui lòng thử lại.', type: 'text' });
    }
};

// [POST]/chatbot/addCart/:productId
module.exports.addCart =  async (req, res) => {
    try {
        const user = await User.findOne({ tokenUser: req.cookies.tokenUser });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không được xác thực.' });
        }

        const productId = req.params.productId;
        const quantity = parseInt(req.body.quantity) || 1; // Mặc định quantity là 1 nếu không có

        const cart = await Cart.findOne({ userId: user.id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại.' });
        }

        const existsProductCart = cart.products.find(item => item.product_id == productId);

        if (existsProductCart) {
            const newQuantity = quantity + existsProductCart.quantity;
            await Cart.updateOne(
                { userId: user.id, 'products.product_id': productId },
                { 'products.$.quantity': newQuantity }
            );
        } else {
            const objectCart = { product_id: productId, quantity: quantity };
            await Cart.updateOne(
                { userId: user.id },
                { $push: { products: objectCart } }
            );
        }

        // Trả về JSON thay vì redirect
        res.json({ success: true, message: 'Đã thêm sản phẩm vào giỏ hàng!' });
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
    }
};