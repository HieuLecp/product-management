// controllers/chatbotController.js
const ChatBot = require('../../services/chatbot');
const User = require("../../models/users.model");
const Product = require('../../models/product.model');

const chatbot = new ChatBot(Product);

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