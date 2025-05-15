const ChatBot = require('../../services/chatbot');
const User = require("../../models/users.model");
const Product = require('../../models/product.model');
const Cart = require("../../models/carts.model");

const chatbot = new ChatBot(Product);

// [POST]/chatbot/
module.exports.index = async (req, res) => {
    const { message, history = [], browsingHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ 
            error: "Vui lòng gửi câu hỏi hợp lệ.",
            type: 'text'
        });
    }

    try {
        const { intent, sentiment } = await chatbot.classifyIntentAndSentiment(message, history);
        let response;

        if (intent === 'productSearch') {
            response = await chatbot.searchLaptops(message, history);
        } else {
            response = await chatbot.chat_with_bot(message, history, browsingHistory);
        }

        if (response && typeof response === 'object') {
            if (response.type === 'productList') {
                res.json({ 
                    products: response.products || [], 
                    type: 'productList',
                    reply: response.reply || 'Dưới đây là một vài sản phẩm gợi ý:'
                });
            } else if (response.type === 'text') {
                res.json({ 
                    reply: response.reply || 'Không có phản hồi.', 
                    type: 'text',
                    sentiment
                });
            } else {
                res.json({ 
                    reply: 'Phản hồi không hợp lệ từ chatbot.', 
                    type: 'text',
                    sentiment
                });
            }
        } else if (typeof response === 'string') {
            res.json({ 
                reply: response, 
                type: 'text',
                sentiment
            });
        } else {
            res.json({ 
                reply: 'Phản hồi không hợp lệ từ chatbot.', 
                type: 'text',
                sentiment
            });
        }
    } catch (error) {
        console.error('Lỗi trong chatbotHandler:', {
            message: error.message,
            stack: error.stack,
            input: message,
            history: history
        });

        res.status(500).json({ 
            reply: 'Đã xảy ra lỗi server. Vui lòng thử lại sau.', 
            type: 'text',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// [POST]/chatbot/addCart/:productId
module.exports.addCart = async (req, res) => {

    try {
        const user = await User.findOne({ tokenUser: req.cookies.tokenUser });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không được xác thực.' });
        }

        const productId = req.params.productId;
        const quantity = parseInt(req.body.quantity) || 1;

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

        res.json({ success: true, message: 'Đã thêm sản phẩm vào giỏ hàng!' });
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        res.status(500).json({ success: false, message: 'Lỗi server. Vui lòng thử lại.' });
    }
};

//[GET] /chatbot/check-auth
module.exports.checkAuth= async (req, res) => {
    try {
        if (!req.cookies.tokenUser) {
            return res.json({ isLoggedIn: false });
        }
        const user = await User.findOne({ tokenUser: req.cookies.tokenUser });
        res.json({ isLoggedIn: !!user });
    } catch {
        res.json({ isLoggedIn: false });
    }
}