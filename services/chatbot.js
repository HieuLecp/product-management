// services/chatbot.js
const fs = require('fs');
const path = require('path');
const fuzzball = require('fuzzball');
const axios = require('axios');

class ChatBot {
    static API_KEY = "3e95ca7740038bb5e66cf609dfaaf482";

    constructor(productModel) {
        this.qa_dict = {};
        this.last_request = null;
        this.last_city = null;
        this.productModel = productModel;
        this.productKeywordsMap = {}; // Lưu từ khóa sản phẩm

        // Load FAQ từ file chatbot.txt
        const file_path = path.join(__dirname, '../chatbot.txt');
        if (!fs.existsSync(file_path)) {
            throw new Error(`Lỗi: Không tìm thấy file ${file_path}`);
        }

        const lines = fs.readFileSync(file_path, 'utf-8').trim().split('\n');
        let current_question = null;
        for (const line of lines) {
            if (line.startsWith("Câu hỏi:")) {
                current_question = line.replace("Câu hỏi:", "").trim().toLowerCase();
            } else if (line.startsWith("Trả lời:") && current_question) {
                this.qa_dict[current_question] = line.replace("Trả lời:", "").trim();
            }
        }

        // Xây dựng từ khóa từ database
        this.buildProductKeywords();
    }

    // Cải thiện phương thức xây dựng từ khóa
    async buildProductKeywords() {
        if (!this.productModel) return;

        try {
            const products = await this.productModel.find({ deleted: false, status: 'active' }).lean();
            for (const product of products) {
                const searchText = `${product.title.toLowerCase()} ${product.description.toLowerCase()} ${product.product_category_id.toLowerCase()} ${product.brand || ''}`;
                const words = searchText.split(/\s+/).filter(word => word.length > 2);

                for (const word of words) {
                    if (!this.productKeywordsMap[word]) {
                        this.productKeywordsMap[word] = [];
                    }
                    this.productKeywordsMap[word].push(product);
                }
            }
        } catch (error) {
            console.error('Lỗi khi xây dựng từ khóa sản phẩm:', error.message);
        }
    }

    // Phương thức mới để tìm kiếm laptop
    async searchLaptops(user_input) {
        if (!this.productModel) {
            return "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm.";
        }

        user_input = user_input.toLowerCase().trim();
        const keywords = user_input.split(/\s+/).filter(word => word.length > 2);

        try {
            // Lọc sản phẩm laptop (giả định product_category_id chứa "laptop")
            const products = await this.productModel.find({
                deleted: false,
                status: 'active',
                $or: [
                    { product_category_id: { $regex: 'laptop', $options: 'i' } },
                    { title: { $regex: user_input, $options: 'i' } },
                    { description: { $regex: user_input, $options: 'i' } },
                    { brand: { $regex: user_input, $options: 'i' } }
                ]
            }).limit(5).lean();

            if (!products.length) {
                return "Không tìm thấy laptop phù hợp với yêu cầu của bạn. Bạn có thể thử từ khóa khác!";
            }

            const productList = products.map(product => {
                const price = product.price;
                const discount = product.discountPercentage || 0;
                const final_price = discount > 0 ? price * (1 - discount / 100) : price;
                return {
                    title: product.title,
                    final_price: final_price.toLocaleString('vi-VN'),
                    original_price: price.toLocaleString('vi-VN'),
                    discount: discount,
                    description: product.description.substring(0, 50) + '...',
                    thumbnail: product.thumbnail,
                    slug: product.slug
                };
            });
    
            return productList;
        } catch (error) {
            throw new Error(`Lỗi khi tìm kiếm laptop: ${error.message}`);
        }
    }

    // Cải thiện recommend_products để hỗ trợ tìm kiếm laptop
    async recommend_products(user_input) {
        if (!this.productModel) {
            return "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm.";
        }

        user_input = user_input.toLowerCase().trim();
        const keywords = user_input.split(/\s+/).filter(word => word.length > 2);

        try {
            const products = await this.productModel.find({ deleted: false, status: 'active' }).lean();
            if (!products.length) {
                return "Hiện tại không có sản phẩm nào trong hệ thống.";
            }

            const searchableProducts = products.map(product => ({
                product,
                searchText: `${product.title.toLowerCase()} ${product.description.toLowerCase()} ${product.product_category_id.toLowerCase()} ${product.brand || ''}`
            }));

            const searchResults = fuzzball.extract(
                user_input,
                searchableProducts.map(p => p.searchText),
                { scorer: fuzzball.ratio }
            );

            const topMatches = searchResults
                .filter(result => result[1] > 50)
                .slice(0, 3)
                .map(result => searchableProducts[result[2]].product);

            if (!topMatches.length) {
                return "Không tìm thấy sản phẩm phù hợp với yêu cầu của bạn. Bạn có thể thử lại với từ khóa khác!";
            }

            let response = "Dưới đây là một số sản phẩm tôi gợi ý cho bạn:\n";
            for (const product of topMatches) {
                const price = product.price;
                const discount = product.discountPercentage || 0;
                const final_price = discount > 0 ? price * (1 - discount / 100) : price;
                response += `- **${product.title}**: ${final_price.toLocaleString('vi-VN')} VNĐ `;
                if (discount > 0) {
                    response += `(Giá gốc: ${price.toLocaleString('vi-VN')} VNĐ, Giảm: ${discount}%) `;
                }
                response += `\n  Mô tả: ${product.description.substring(0, 50)}...\n`;
            }
            return response;
        } catch (error) {
            throw new Error(`Lỗi khi gợi ý sản phẩm: ${error.message}`);
        }
    }

    get_faq_response(user_input) {
        user_input = user_input.toLowerCase().trim();

        const keyword_mapping = {
            "hủy đơn": "Tôi có thể hủy đơn hàng sau khi đã đặt không?",
            "đổi trả": "Tôi muốn đổi trả hàng, phải làm sao?",
            "vận chuyển": "Phí vận chuyển được tính như thế nào?",
            "kiểm tra đơn": "Tôi có thể kiểm tra trạng thái đơn hàng của mình ở đâu?",
            "bảo hành": "Chính sách bảo hành sản phẩm như thế nào?",
            "thanh toán": "Tôi có thể thanh toán bằng phương thức nào?",
        };

        for (const [keyword, correct_question] of Object.entries(keyword_mapping)) {
            if (user_input.includes(keyword)) {
                return this.qa_dict[correct_question] || "Xin lỗi, tôi chưa hiểu câu hỏi của bạn.";
            }
        }

        const results = fuzzball.extract(user_input, Object.keys(this.qa_dict), { scorer: fuzzball.ratio });
        const best_match = results[0][0];
        const score = results[0][1];

        if (score > 80) {
            return this.qa_dict[best_match];
        }

        return "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?";
    }

    static greeting(sentence) {
        const GREETING_INPUTS = ["hello", "hi", "greetings", "sup", "what's up", "hey", "chào"];
        const GREETING_RESPONSES = ["Hi!", "Hey!", "Hello!", "Chào bạn!", "Xin chào!"];
        sentence = sentence.toLowerCase();

        const results = fuzzball.extract(sentence, GREETING_INPUTS, { scorer: fuzzball.ratio });
        const score = results[0][1];

        if (score > 80) {
            return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
        }
        return null;
    }

    async get_weather(city) {
        if (!city || city.split(/\s+/).length > 3) {
            return "Tên thành phố không hợp lệ. Hãy nhập lại tên thành phố ngắn gọn.";
        }

        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${ChatBot.API_KEY}&units=metric&lang=vi`;
        try {
            const response = await axios.get(url);
            const data = response.data;

            if (data.main) {
                const temp = data.main.temp;
                const weather = data.weather[0].description;
                return `🌤️ Thời tiết tại **${city.charAt(0).toUpperCase() + city.slice(1)}**: ${weather}, ${temp}°C.`;
            } else {
                return `Không tìm thấy thông tin thời tiết cho thành phố **${city}**. Hãy kiểm tra lại tên!`;
            }
        } catch (error) {
            if (error.response) {
                return `Lỗi: Thành phố **${city}** không tồn tại. Hãy kiểm tra lại tên!`;
            }
            return `Lỗi khi lấy dữ liệu thời tiết: ${error.message}`;
        }
    }

    extract_city(user_response) {
        const blacklist = ["thời tiết", "ở", "tại", "hôm nay", "hiện tại", "như thế nào", "?"];
        const words = user_response.toLowerCase().split(/\s+/);

        let city = words.filter(word => !blacklist.includes(word)).join(" ");

        if (!city) {
            const match = user_response.match(/thời tiết.*?ở (.+)/i);
            if (match) {
                city = match[1];
            }
        }

        return city && city.split(/\s+/).length <= 3 ? city.trim() : "";
    }

    async chat_with_bot(user_response) {
        user_response = user_response.toLowerCase().trim();

        if (this.last_request === "weather_request") {
            this.last_request = null;
            this.last_city = user_response;
            return await this.get_weather(user_response);
        }

        if (user_response === "thời tiết" && this.last_city) {
            return await this.get_weather(this.last_city);
        }

        if (user_response.includes("thời tiết")) {
            const city = this.extract_city(user_response);
            if (city) {
                this.last_city = city;
                return await this.get_weather(city);
            } else {
                this.last_request = "weather_request";
                return "Bạn muốn xem thời tiết ở đâu? Hãy nhập tên thành phố.";
            }
        }

        this.last_request = null;

        const greeting_res = ChatBot.greeting(user_response);
        if (greeting_res) {
            return greeting_res;
        }

        // Ưu tiên tìm kiếm laptop nếu có từ khóa liên quan
        const laptopKeywords = ["laptop", "dell", "lenovo", "hp", "apple", "asus"];
        if (laptopKeywords.some(keyword => user_response.includes(keyword))) {
            return await this.searchLaptops(user_response);
        }

        // Gợi ý sản phẩm chung nếu không phải laptop
        const product_keywords = ["áo thun", "quần jeans", "giày", "túi xách", "giảm giá", "khuyến mãi", "sản phẩm"];
        if (product_keywords.some(keyword => user_response.includes(keyword))) {
            return await this.recommend_products(user_response);
        }

        return this.get_faq_response(user_response);
    }
}

module.exports = ChatBot;