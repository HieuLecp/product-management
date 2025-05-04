// controllers/chatbotController.js
const ChatBot = require('../../services/chatbot');
const User = require("../../models/users.model");
const Product = require('../../models/product.model');

// [POST] /chatbot
module.exports.index = async (req, res) => {
    const chatbot = new ChatBot(Product);

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Vui lòng gửi câu hỏi." });
    }

    try {
        // Kiểm tra nếu người dùng hỏi về laptop
        const isLaptopQuery = message.toLowerCase().includes('laptop') || 
                             ['dell', 'lenovo', 'hp', 'apple', 'asus'].some(brand => message.toLowerCase().includes(brand));
        
        let response;
        if (isLaptopQuery) {
            response = await chatbot.searchLaptops(message); // Gọi phương thức mới
        } else {
            response = await chatbot.chat_with_bot(message); // Gọi phương thức cũ
        }

        if (Array.isArray(response)) {
            res.json({ products: response, type: 'productList' });
        } else {
            res.json({ reply: response, type: 'text' });
        }
        
    } catch (error) {
        res.status(500).json({ error: `Lỗi: ${error.message}` });
    }
};