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
        this.productKeywordsMap = {};
        this.brandVariants = {
            'delll': 'dell',
            'deell': 'dell',
            'del': 'dell',
            'asuss': 'asus',
            'assus': 'asus'
        };

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

        this.buildProductKeywords();
    }

    async buildProductKeywords() {
        if (!this.productModel) return;

        try {
            const products = await this.productModel.find({ deleted: false, status: 'active' }).lean();
            for (const product of products) {
                const searchText = `${product.title.toLowerCase()} ${product.description.toLowerCase()} ${product.brand?.toLowerCase() || ''}`;
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

    async searchLaptops(user_input) {
        if (!this.productModel) {
            return "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm.";
        }

        user_input = user_input.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
        const keywords = user_input.split(/\s+/).filter(word => word.length > 0);
        const normalizedKeywords = keywords.map(keyword => this.brandVariants[keyword] || keyword);

        try {
            const products = await this.productModel.find({
                deleted: false,
                status: 'active'
            }).lean();

            const matchedProducts = [];
            for (const product of products) {
                const title = product.title.toLowerCase();
                const description = product.description.toLowerCase();
                const brand = product.brand ? product.brand.toLowerCase() : '';

                let isMatch = false;
                for (const keyword of normalizedKeywords) {
                    // Kiểm tra từ khóa có xuất hiện trong title, description, hoặc brand
                    if (title.includes(keyword) || description.includes(keyword) || brand.includes(keyword)) {
                        isMatch = true;
                        break;
                    }
                    // Kiểm tra tương đồng với brand (cho lỗi chính tả như "delll")
                    if (brand) {
                        const brandScore = fuzzball.ratio(keyword, brand);
                        if (brandScore > 80) {
                            isMatch = true;
                            break;
                        }
                    }
                }

                if (isMatch) {
                    matchedProducts.push(product);
                }
            }

            const sortedProducts = matchedProducts
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 3);

            if (!sortedProducts.length) {
                return "Không tìm thấy laptop phù hợp với yêu cầu của bạn. Bạn có thể thử từ khóa khác!";
            }

            const productList = sortedProducts.map(product => {
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

    async recommend_products(user_input) {
        if (!this.productModel) {
            return "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm.";
        }

        user_input = user_input.toLowerCase().trim();
        const keywords = user_input.split(/\s+/).filter(word => word.length > 2);

        try {
            const products = await this.productModel.find({ deleted: false, status: 'active' })
                .sort({ sold: -1 })
                .limit(5)
                .lean();

            if (!products.length) {
                return "Hiện tại không có sản phẩm nào trong hệ thống.";
            }

            let response = "Dưới đây là 5 sản phẩm bán chạy nhất tôi gợi ý cho bạn:\n";
            for (const product of products) {
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

    async chat_with_bot(user_response) {
        user_response = user_response.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

        const greeting_res = ChatBot.greeting(user_response);
        if (greeting_res) {
            return greeting_res;
        }

        const laptopRelatedKeywords = ["laptop", "lap", "máy", "computer", "mua", "tìm", "cần"];
        const laptopBrands = ["dell", "lenovo", "msi", "apple", "acer", "hp", "asus"];
        const productKeywords = ["áo thun", "quần jeans", "giày", "túi xách", "giảm giá", "khuyến mãi", "sản phẩm"];
        const genericKeywords = ["mua", "máy", "tìm", "cần"];

        const words = user_response.split(/\s+/).filter(word => word.length > 0);

        let matchedKeyword = null;
        let matchedBrand = null;
        let matchedProductKeyword = null;
        let isGeneric = true;

        for (const word of words) {
            const laptopKeywordMatches = fuzzball.extract(word, laptopRelatedKeywords, { scorer: fuzzball.ratio });
            const bestLaptopMatch = laptopKeywordMatches[0];
            if (bestLaptopMatch[1] > 50) {
                matchedKeyword = bestLaptopMatch[0];
            }

            const brandMatches = fuzzball.extract(word, laptopBrands, { scorer: fuzzball.ratio });
            const bestBrandMatch = brandMatches[0];
            if (bestBrandMatch[1] > 50) {
                matchedBrand = bestBrandMatch[0];
                isGeneric = false;
            }

            const productKeywordMatches = fuzzball.extract(word, productKeywords, { scorer: fuzzball.ratio });
            const bestProductMatch = productKeywordMatches[0];
            if (bestProductMatch[1] > 50) {
                matchedProductKeyword = bestProductMatch[0];
                isGeneric = false;
            }

            if (!genericKeywords.includes(word)) {
                isGeneric = false;
            }
        }

        if (matchedProductKeyword) {
            return await this.recommend_products(user_response);
        }

        // Tìm kiếm sản phẩm với bất kỳ từ khóa nào
        const searchResults = await this.searchLaptops(user_response);
        if (Array.isArray(searchResults) && searchResults.length > 0) {
            return searchResults;
        }

        // Nếu chỉ có từ khóa chung hoặc không tìm thấy sản phẩm
        if (isGeneric || matchedKeyword) {
            return "Bạn muốn mua máy loại nào ạ? Hãy thử nhập tên thương hiệu (như Dell, Acer) hoặc loại máy (như laptop)!";
        }

        return "Không tìm thấy sản phẩm phù hợp. Bạn muốn mua máy loại nào ạ? Hãy thử nhập tên thương hiệu (như Dell, Acer) hoặc loại máy (như laptop)!";
    }
}

module.exports = ChatBot;