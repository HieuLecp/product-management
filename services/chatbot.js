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

        this.intentKeywords = {
            productSearch: [
                'laptop', 'máy tính', 'dell', 'asus', 'hp', 'lenovo', 'macbook', 
                'acer', 'msi', 'gaming', 'rẻ', 'giá rẻ', 'đắt', 'cao cấp', 'xps', 
                'vivobook', 'thinkpad', 'sản phẩm', 'mua', 'tìm'
            ],
            faqSupport: [
                'hủy đơn', 'đổi trả', 'vận chuyển', 'kiểm tra đơn', 'bảo hành', 
                'thanh toán', 'mật khẩu', 'đăng nhập', 'tài khoản', 'khôi phục', 
                'hỗ trợ', 'liên hệ', 'chính sách', 'quên', 'đặt hàng', 'đặt', 'mua hàng'
            ],
            greeting: ['hello', 'hi', 'greetings', 'sup', "what's up", 'hey', 'chào']
        };

        const file_path = path.join(__dirname, '../chatbot.txt');
        if (!fs.existsSync(file_path)) {
            throw new Error(`Lỗi: Không tìm thấy file ${file_path}`);
        }

        const lines = fs.readFileSync(file_path, 'utf-8').trim().split('\n');
        let current_question = null;
        for (const line of lines) {
            if (line.startsWith("Câu hỏi:")) {
                current_question = line.replace("Câu hỏi:", "").trim().toLowerCase().replace(/\s+/g, ' ');
                console.log('Processing question:', current_question);
            } else if (line.startsWith("Trả lời:") && current_question) {
                this.qa_dict[current_question] = line.replace("Trả lời:", "").trim();
            }
        }
        // console.log('qa_dict:', JSON.stringify(this.qa_dict, null, 2));

        this.buildProductKeywords();
    }

    async buildProductKeywords() {
        if (!this.productModel) {
            console.warn('Không có productModel, bỏ qua xây dựng từ khóa sản phẩm.');
            return;
        }

        try {
            const products = await this.productModel.find({ 
                deleted: false, 
                status: 'active'
            }).lean();
            const commonWords = ['hàng', 'máy', 'tính'];
            for (const product of products) {
                const searchText = `${product.title?.toLowerCase() || ''} ${product.brand?.toLowerCase() || ''}`;
                const words = searchText.split(/\s+/).filter(word => word.length > 2 && !commonWords.includes(word));

                for (const word of words) {
                    if (!this.productKeywordsMap[word]) {
                        this.productKeywordsMap[word] = [];
                    }
                    this.productKeywordsMap[word].push(product);
                }
            }
            // console.log('productKeywordsMap:', Object.keys(this.productKeywordsMap));
        } catch (error) {
            console.error('Lỗi khi xây dựng từ khóa sản phẩm:', error.message);
        }
    }

    classifyIntent(user_input) {
        user_input = user_input.toLowerCase().trim();
        const words = user_input.split(/\s+/).filter(word => word.length > 0);

        let productScore = 0;
        let faqScore = 0;
        let greetingScore = 0;

        for (const word of words) {
            const productMatch = fuzzball.extract(word, this.intentKeywords.productSearch, { scorer: fuzzball.ratio })[0];
            if (productMatch[1] > 60) {
                productScore += productMatch[1];
            }

            if (this.productKeywordsMap[word] && this.productKeywordsMap[word].length > 0) {
                productScore += 80;
            }

            const faqMatch = fuzzball.extract(word, this.intentKeywords.faqSupport, { scorer: fuzzball.ratio })[0];
            if (faqMatch[1] > 60) {
                faqScore += faqMatch[1];
            }

            if (this.intentKeywords.faqSupport.includes(word)) {
                faqScore += 100;
            }

            const greetingMatch = fuzzball.extract(word, this.intentKeywords.greeting, { scorer: fuzzball.ratio })[0];
            if (greetingMatch[1] > 80) {
                greetingScore += greetingMatch[1];
            }
        }

        if (greetingScore > 0) {
            return 'greeting';
        } else if (faqScore > productScore && faqScore > 0) {
            return 'faqSupport';
        } else if (productScore > 0) {
            return 'productSearch';
        } else {
            return 'unknown';
        }
    }

    async searchLaptops(user_input) {
        if (!this.productModel) {
            return { type: 'text', reply: "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm." };
        }

        user_input = user_input.toLowerCase().trim();
        if (!user_input) {
            return { type: 'text', reply: "Vui lòng nhập thông tin tìm kiếm." };
        }

        const keywords = user_input.split(/\s+/).filter(word => word.length > 0);
        const normalizedKeywords = keywords.map(keyword => this.brandVariants[keyword] || keyword);

        const expensiveKeywords = ['đắt', 'cao cấp', 'giá cao', 'đắt tiền', 'cao giá'];
        const cheapKeywords = ['rẻ', 'giá thấp', 'bình dân', 'giá rẻ', 'thấp giá'];
        const isExpensive = keywords.some(keyword => expensiveKeywords.includes(keyword));
        const isCheap = keywords.some(keyword => cheapKeywords.includes(keyword));

        try {
            const products = await this.productModel.find({
                deleted: false,
                status: 'active'
            }).lean();

            if (!products) {
                return { type: 'text', reply: "Lỗi: Không thể truy vấn dữ liệu sản phẩm." };
            }

            if (!products.length) {
                return { type: 'productList', products: [] };
            }

            let matchedProducts = [];

            const specificKeywords = keywords.filter(keyword => !cheapKeywords.includes(keyword) && !expensiveKeywords.includes(keyword));

            if (specificKeywords.length === 0 && (isCheap || isExpensive)) {
                matchedProducts = products;
            } else {
                for (const product of products) {
                    const title = product.title?.toLowerCase() || '';
                    const description = product.description?.toLowerCase() || '';
                    const brand = product.brand?.toLowerCase() || '';

                    let isMatch = false;
                    for (const keyword of specificKeywords) {
                        const titleWords = title.split(/\s+/);
                        const descriptionWords = description.split(/\s+/);

                        const titleScore = Math.max(...titleWords.map(word => fuzzball.ratio(keyword, word)), 0);
                        const descriptionScore = Math.max(...descriptionWords.map(word => fuzzball.ratio(keyword, word)), 0);
                        const brandScore = brand ? fuzzball.ratio(keyword, brand) : 0;

                        if (titleScore > 60 || descriptionScore > 60 || brandScore > 60) {
                            isMatch = true;
                            break;
                        }
                    }

                    if (isMatch) {
                        matchedProducts.push(product);
                    }
                }

                if (matchedProducts.length === 0 && specificKeywords.length > 0) {
                    return { type: 'text', reply: "Không tìm thấy sản phẩm phù hợp với yêu cầu của bạn." };
                }
            }

            let sortedProducts;
            if (isExpensive) {
                sortedProducts = matchedProducts.sort((a, b) => {
                    const priceA = a.price * (1 - (a.discountPercentage || 0) / 100);
                    const priceB = b.price * (1 - (b.discountPercentage || 0) / 100);
                    return priceB - priceA;
                });
            } else if (isCheap) {
                sortedProducts = matchedProducts.sort((a, b) => {
                    const priceA = a.price * (1 - (a.discountPercentage || 0) / 100);
                    const priceB = b.price * (1 - (b.discountPercentage || 0) / 100);
                    return priceA - priceB;
                });
            } else {
                sortedProducts = matchedProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
            }

            sortedProducts = sortedProducts.slice(0, 3);

            const productList = sortedProducts.map(product => {
                const price = product.price || 0;
                const discount = product.discountPercentage || 0;
                const final_price = discount > 0 ? price * (1 - discount / 100) : price;
                return {
                    title: product.title || 'Không có tiêu đề',
                    final_price: final_price.toLocaleString('vi-VN'),
                    original_price: price.toLocaleString('vi-VN'),
                    discount: discount,
                    description: (product.description || 'Không có mô tả').substring(0, 50) + '...',
                    thumbnail: product.thumbnail || '',
                    slug: product.slug || ''
                };
            });

            return { type: 'productList', products: productList };
        } catch (error) {
            console.error('Lỗi khi tìm kiếm laptop:', error.message);
            return { type: 'text', reply: "Lỗi: Không thể tìm kiếm sản phẩm. Vui lòng thử lại." };
        }
    }

    async recommend_products(user_input) {
        if (!this.productModel) {
            return { type: 'text', reply: "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm." };
        }

        try {
            const products = await this.productModel.find({ 
                deleted: false, 
                status: 'active',
                category: { $regex: '^laptop$', $options: 'i' }
            })
                .sort({ sold: -1 })
                .limit(5)
                .lean();

            if (!products) {
                return { type: 'text', reply: "Lỗi: Không thể truy vấn dữ liệu sản phẩm." };
            }

            if (!products.length) {
                return { type: 'productList', products: [] };
            }

            const productList = products.map(product => {
                const price = product.price || 0;
                const discount = product.discountPercentage || 0;
                const final_price = discount > 0 ? price * (1 - discount / 100) : price;
                return {
                    title: product.title || 'Không có tiêu đề',
                    final_price: final_price.toLocaleString('vi-VN'),
                    original_price: price.toLocaleString('vi-VN'),
                    discount: discount,
                    description: (product.description || 'Không có mô tả').substring(0, 50) + '...',
                    thumbnail: product.thumbnail || '',
                    slug: product.slug || ''
                };
            });

            return { type: 'productList', products: productList };
        } catch (error) {
            console.error('Lỗi khi gợi ý sản phẩm:', error.message);
            return { type: 'text', reply: "Lỗi: Không thể gợi ý sản phẩm. Vui lòng thử lại." };
        }
    }

    get_faq_response(user_input) {
        user_input = user_input.toLowerCase().trim();

        const keyword_mapping = {
            "hủy đơn": "tôi có thể hủy đơn hàng sau khi đã đặt không?",
            "đổi trả": "tôi muốn đổi trả hàng, phải làm sao?",
            "vận chuyển": "phí vận chuyển được tính như thế nào?",
            "kiểm tra đơn": "tôi có thể kiểm tra trạng thái đơn hàng của mình ở đâu?",
            "bảo hành": "chính sách bảo hành sản phẩm như thế nào?",
            "thanh toán": "tôi có thể thanh toán bằng phương thức nào?",
            "quên mật khẩu": "tôi quên mật khẩu, làm sao để khôi phục?",
            "đặt hàng": "làm thế nào để đặt hàng?",
            "mua hàng": "làm thế nào để đặt hàng?",
        };

        // console.log('user_input:', user_input);
        // console.log('keyword_mapping:', JSON.stringify(keyword_mapping, null, 2));
        // console.log('qa_dict keys:', Object.keys(this.qa_dict));

        for (const [keyword, correct_question] of Object.entries(keyword_mapping)) {
            if (user_input.includes(keyword)) {
                const reply = this.qa_dict[correct_question] || "Xin lỗi, tôi chưa hiểu câu hỏi của bạn.";
                // console.log('Matched keyword:', keyword, 'Question:', correct_question, 'Reply:', reply);
                return { type: 'text', reply };
            }
        }

        const results = fuzzball.extract(user_input, Object.keys(this.qa_dict), { scorer: fuzzball.token_sort_ratio });
        const best_match = results[0][0];
        const score = results[0][1];

        // console.log('Fuzzball best match:', best_match, 'Score:', score);

        if (score > 60) {
            return { type: 'text', reply: this.qa_dict[best_match] };
        }

        return { type: 'text', reply: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?" };
    }

    static greeting(sentence) {
        const GREETING_INPUTS = ["hello", "hi", "greetings", "sup", "what's up", "hey", "chào"];
        const GREETING_RESPONSES = ["Hi!", "Hey!", "Hello!", "Chào bạn!", "Xin chào!"];
        sentence = sentence.toLowerCase();

        const results = fuzzball.extract(sentence, GREETING_INPUTS, { scorer: fuzzball.ratio });
        const score = results[0][1];

        if (score > 80) {
            return { type: 'text', reply: GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)] };
        }
        return null;
    }

    async chat_with_bot(user_response) {
        user_response = user_response.toLowerCase().trim();

        const intent = this.classifyIntent(user_response);

        if (intent === 'greeting') {
            return ChatBot.greeting(user_response);
        } else if (intent === 'faqSupport') {
            const faqResponse = this.get_faq_response(user_response);
            return faqResponse;
        } else if (intent === 'productSearch') {
            const searchResults = await this.searchLaptops(user_response);
            return searchResults;
        } else {
            const faqResponse = this.get_faq_response(user_response);
            if (faqResponse.reply !== "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?") {
                return faqResponse;
            }
            const searchResults = await this.searchLaptops(user_response);
            if (searchResults.type === 'productList' && searchResults.products.length > 0) {
                return searchResults;
            }
            return { type: 'text', reply: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về laptop hoặc các chính sách hỗ trợ." };
        }
    }
}

module.exports = ChatBot;