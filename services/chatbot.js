const fs = require('fs');
const path = require('path');
const fuzzball = require('fuzzball');
const axios = require('axios');
require('dotenv').config(); // Thêm để tải biến môi trường

class ChatBot {
    static API_KEY = "3e95ca7740038bb5e66cf609dfaaf482";
    static HF_API_KEY = process.env.HF_API_KEY;

    constructor(productModel) {
        this.qa_dict = {};
        this.qa_keywords = {}; // Lưu từ khóa cho mỗi câu hỏi
        this.last_request = null;
        this.last_city = null;
        this.productModel = productModel;
        this.productKeywordsMap = {};
        this.brandVariants = {
            'delll': 'dell',
            'deell': 'dell',
            'del': 'dell',
            'asuss': 'asus',
            'assus': 'asus',
            'acerr': 'acer',
            'aceer': 'acer'
        };
    
        this.intentKeywords = {
            productSearch: [
                'laptop', 'máy tính', 'dell', 'asus', 'hp', 'lenovo', 'apple', 
                'acer', 'msi', 'gaming', 'rẻ', 'giá rẻ', 'đắt', 'cao cấp', 'xps', 
                'vivobook', 'thinkpad', 'sản phẩm', 'mua', 'tìm'
            ],
            faqSupport: [
                'hủy đơn', 'đổi trả', 'vận chuyển', 'kiểm tra đơn', 'bảo hành', 
                'thanh toán', 'mật khẩu', 'đăng nhập', 'tài khoản', 'khôi phục', 
                'hỗ trợ', 'liên hệ', 'chính sách', 'quên', 'đặt hàng', 'đặt', 'mua hàng'
            ],
            greeting: ['hello', 'hi', 'greetings', 'sup', "what's up", 'hey', 'chào', 'xin chào', 'chào bạn']
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
                // Trích xuất từ khóa từ câu hỏi
                const words = current_question.split(/\s+/).filter(word => word.length > 2); // Lấy từ dài hơn 2 ký tự
                this.qa_keywords[current_question] = words;
            } else if (line.startsWith("Trả lời:") && current_question) {
                this.qa_dict[current_question] = line.replace("Trả lời:", "").trim();
            }
        }
    
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
            const stopWords = ['hello', 'hi', 'greetings', 'sup', "what's up", 'hey', 'chào', 'xin', 'bạn', 'tại sao', 'làm sao', 'vì sao', 'như thế nào'];
            for (const product of products) {
                const searchText = `${product.title?.toLowerCase() || ''} ${product.brand?.toLowerCase() || ''}`;
                const words = searchText.split(/\s+/).filter(word => 
                    word.length > 2 && 
                    !commonWords.includes(word) && 
                    !stopWords.includes(word)
                );

                for (const word of words) {
                    if (!this.productKeywordsMap[word]) {
                        this.productKeywordsMap[word] = [];
                    }
                    this.productKeywordsMap[word].push(product);
                }
            }
            // console.log('Product Keywords Map:', this.productKeywordsMap);
        } catch (error) {
            console.error('Lỗi khi xây dựng từ khóa sản phẩm:', error.message);
        }
    }

    async classifyIntent(user_input) {
        user_input = user_input.toLowerCase().trim();
        console.log('Original user_input before sending to API:', user_input); // Thêm log để kiểm tra
    
        try {
            console.log('Sending request to Hugging Face API for intent classification:', user_input);
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                {
                    inputs: `Phân loại ý định của câu sau thành một trong các loại: greeting, productSearch, faqSupport, technicalQuestion, hoặc chitchat. 
                    - greeting: lời chào trực tiếp như "xin chào", "hi".
                    - chitchat: trò chuyện thông thường, ví dụ về thời tiết, tâm trạng.
                    - productSearch: yêu cầu tìm kiếm sản phẩm, ví dụ "tìm máy tính", "laptop giá rẻ".
                    Chỉ trả về tên ý định, không thêm ngữ cảnh.\nCâu: ${user_input}`,
                    parameters: { max_length: 50, temperature: 0.1 }
                },
                {
                    headers: {
                        Authorization: `Bearer ${ChatBot.HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // Timeout 10 giây
                }
            );
    
            console.log('Hugging Face API Response for intent:', response.data);
            const generatedText = response.data[0].generated_text.trim();
            // Mở rộng biểu thức chính quy để khớp với các định dạng
            const intentMatch = generatedText.match(/(?:Phân loại|Chức năng|Chít|Answer|Chi tiết):\s*(\w+)/i);
            const intent = intentMatch ? intentMatch[1].toLowerCase() : generatedText.toLowerCase(); // Nếu không khớp, lấy trực tiếp generatedText
    
            console.log('Extracted intent:', intent); // Thêm log để kiểm tra
    
            if (['greeting', 'productSearch', 'faqSupport', 'technicalQuestion', 'chitchat'].includes(intent)) {
                return intent;
            }
            return 'unknown';
        } catch (error) {
            console.error('Lỗi khi gọi Hugging Face API để phân loại ý định:', error.message);
            if (error.response) {
                console.log('Error details:', error.response.status, error.response.data);
            } else if (error.code === 'ECONNABORTED') {
                console.log('Request timed out, using fallback logic');
            }
            // Logic dự phòng
            const words = user_input.split(/\s+/).filter(word => word.length > 0);
            let productScore = 0;
            let faqScore = 0;
            let greetingScore = 0;
            let technicalScore = 0;
            let chitchatScore = 0;
    
            const chitchatKeywords = ['trời đẹp', 'hôm nay', 'thời tiết', 'tâm trạng', 'cảm giác'];
            for (const word of words) {
                const greetingMatch = fuzzball.extract(word, this.intentKeywords.greeting, { scorer: fuzzball.ratio })[0];
                if (greetingMatch[1] > 80) greetingScore += greetingMatch[1];
    
                const productMatch = fuzzball.extract(word, this.intentKeywords.productSearch, { scorer: fuzzball.ratio })[0];
                if (productMatch[1] > 60) productScore += productMatch[1];
                if (this.productKeywordsMap[word] && this.productKeywordsMap[word].length > 0) productScore += 50;
    
                const faqMatch = fuzzball.extract(word, this.intentKeywords.faqSupport, { scorer: fuzzball.ratio })[0];
                if (faqMatch[1] > 60) faqScore += faqMatch[1];
                if (this.intentKeywords.faqSupport.includes(word)) faqScore += 100;
    
                if (['tại sao', 'làm sao', 'vì sao', 'như thế nào'].some(q => user_input.includes(q))) technicalScore += 120;
    
                const chitchatMatch = fuzzball.extract(word, chitchatKeywords, { scorer: fuzzball.ratio })[0];
                if (chitchatMatch[1] > 60) chitchatScore += chitchatMatch[1];
            }
    
            console.log('Scores:', { greetingScore, productScore, faqScore, technicalScore, chitchatScore });
    
            if (chitchatScore > 50) return 'chitchat';
            if (greetingScore > 0) return 'greeting';
            if (technicalScore > 0) return 'technicalQuestion';
            if (productScore > 250 && faqScore === 0 && technicalScore === 0) return 'productSearch';
            if (faqScore > productScore && faqScore > 0) return 'faqSupport';
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
    
        // Kiểm tra xem có từ khóa sản phẩm rõ ràng không
        const hasProductKeyword = keywords.some(keyword => this.intentKeywords.productSearch.includes(keyword));
        if (!hasProductKeyword) {
            return { type: 'text', reply: "Mình không thấy bạn nhắc đến sản phẩm nào. Bạn muốn tìm laptop hay thiết bị gì?" };
        }
    
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
                const brandKeywords = this.intentKeywords.productSearch.filter(keyword => 
                    ['dell', 'asus', 'hp', 'lenovo', 'apple', 'acer', 'msi'].includes(keyword)
                );
    
                const brandKeyword = specificKeywords.find(keyword => 
                    brandKeywords.includes(this.brandVariants[keyword] || keyword)
                );
    
                if (brandKeyword) {
                    const normalizedBrand = this.brandVariants[brandKeyword] || brandKeyword;
                    for (const product of products) {
                        const brand = product.brand?.toLowerCase() || '';
                        const brandScore = brand ? fuzzball.ratio(normalizedBrand, brand) : 0;
                        if (brandScore >= 90) {
                            matchedProducts.push(product);
                        }
                    }
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
    
                            if (titleScore > 90 || descriptionScore > 90 || brandScore > 90) {
                                isMatch = true;
                                break;
                            }
                        }
    
                        if (isMatch) {
                            matchedProducts.push(product);
                        }
                    }
                }
    
                if (matchedProducts.length === 0 && specificKeywords.length > 0) {
                    return { type: 'text', reply: "Không tìm thấy sản phẩm phù hợp với yêu cầu của bạn." };
                }
            }
    
            // Lọc theo giá nếu có yêu cầu
            if (user_input.includes('1 - 150 triệu')) {
                matchedProducts = matchedProducts.filter(product => {
                    const price = product.price * (1 - (product.discountPercentage || 0) / 100);
                    return price >= 1000 && price <= 150000000;
                });
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
                    id: product._id,
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
    
        // Bước 1: Tách từ khóa từ input của người dùng
        const user_keywords = user_input.split(/\s+/).filter(word => word.length > 2);
    
        // Bước 2: Tìm câu hỏi có từ khóa khớp
        let best_match = null;
        let highest_keyword_score = 0;
    
        for (const [question, keywords] of Object.entries(this.qa_keywords)) {
            let keyword_score = 0;
            for (const user_keyword of user_keywords) {
                for (const keyword of keywords) {
                    const score = fuzzball.ratio(user_keyword, keyword);
                    if (score > 80) {
                        keyword_score += score;
                    }
                }
            }
            if (keyword_score > highest_keyword_score) {
                highest_keyword_score = keyword_score;
                best_match = question;
            }
        }
    
        // Bước 3: Nếu tìm thấy câu hỏi với từ khóa khớp, trả về câu trả lời
        if (best_match && highest_keyword_score > 100) { // Ngưỡng điểm từ khóa
            return { type: 'text', reply: this.qa_dict[best_match] };
        }
    
        // Bước 4: Nếu không tìm thấy từ khóa khớp, dùng fuzzball để so sánh toàn bộ câu
        const results = fuzzball.extract(user_input, Object.keys(this.qa_dict), { scorer: fuzzball.token_sort_ratio });
        const best_fuzz_match = results[0][0];
        const fuzz_score = results[0][1];
    
        if (fuzz_score > 60) {
            return { type: 'text', reply: this.qa_dict[best_fuzz_match] };
        }
    
        return { type: 'text', reply: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?" };
    }

    static greeting(sentence) {
        const GREETING_INPUTS = ["hello", "hi", "greetings", "sup", "what's up", "hey", "chào", "xin chào", "chào bạn"];
        const GREETING_RESPONSES = ["Hi!", "Hey!", "Hello!", "Chào bạn!", "Xin chào!"];
        sentence = sentence.toLowerCase();

        const results = fuzzball.extract(sentence, GREETING_INPUTS, { scorer: fuzzball.ratio });
        const score = results[0][1];

        if (score > 80) {
            return { type: 'text', reply: GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)] };
        }
        return null;
    }

    async generate_nlp_response(user_input) {
        try {
            console.log('Sending request to Hugging Face API with input:', user_input);
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
                {
                    inputs: `Trả lời thân thiện bằng tiếng Việt cho câu hỏi: ${user_input}`,
                    parameters: { max_length: 150, temperature: 0.7 }
                },
                {
                    headers: {
                        Authorization: `Bearer ${ChatBot.HF_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
    
            console.log('Hugging Face API Response:', response.data);
            const generated_text = response.data[0].generated_text || "Xin lỗi, tôi chưa hiểu rõ. Bạn có thể hỏi lại không?";
            return { type: 'text', reply: generated_text };
        } catch (error) {
            console.error('Lỗi khi gọi Hugging Face API:', error.message);
            if (error.response) {
                console.log('Error details:', error.response.status, error.response.data);
            }
    
            // Logic dự phòng: Tìm câu hỏi chitchat tương tự từ qa_dict
            user_input = user_input.toLowerCase().trim();
            const user_keywords = user_input.split(/\s+/).filter(word => word.length > 2);
    
            let best_match = null;
            let highest_keyword_score = 0;
    
            for (const [question, keywords] of Object.entries(this.qa_keywords)) {
                let keyword_score = 0;
                for (const user_keyword of user_keywords) {
                    for (const keyword of keywords) {
                        const score = fuzzball.ratio(user_keyword, keyword);
                        if (score > 80) {
                            keyword_score += score;
                        }
                    }
                }
                if (keyword_score > highest_keyword_score) {
                    highest_keyword_score = keyword_score;
                    best_match = question;
                }
            }
    
            if (best_match && highest_keyword_score > 100) {
                return { type: 'text', reply: this.qa_dict[best_match] };
            }
    
            // Logic dự phòng bổ sung nếu không tìm thấy câu hỏi tương tự
            if (user_input.includes('thời tiết')) {
                return { type: 'text', reply: 'Hôm nay thời tiết khá đẹp, bạn thấy sao?' };
            }
            if (user_input.includes('xin chào')) {
                return { type: 'text', reply: 'Chào bạn! Rất vui được trò chuyện với bạn.' };
            }
            if (user_input.includes('tâm trạng') || user_input.includes('cảm giác')) {
                return { type: 'text', reply: 'Mình hiểu, bạn đang cảm thấy thế nào? Có muốn chia sẻ không?' };
            }
            if (user_input.includes('hôm nay')) {
                return { type: 'text', reply: 'Hôm nay là một ngày đẹp, bạn có kế hoạch gì thú vị không?' };
            }
            if (user_input.includes('tại sao') || user_input.includes('làm sao')) {
                return { type: 'text', reply: 'Mình sẽ cố giải thích nhé, bạn có thể nói rõ hơn không?' };
            }
            return { type: 'text', reply: "Hiện tại mình gặp chút vấn đề kỹ thuật, hãy thử lại sau nhé!" };
        }
    }

    async chat_with_bot(user_response) {
        user_response = user_response.toLowerCase().trim();
    
        if (this.last_request === user_response) {
            return { type: 'text', reply: "Mình vừa trả lời câu này rồi, bạn muốn hỏi thêm gì không?" };
        }
        this.last_request = user_response;
    
        const intent = await this.classifyIntent(user_response);
        console.log('Detected Intent:', intent);
    
        if (intent === 'greeting') {
            const greetingResponse = ChatBot.greeting(user_response);
            if (greetingResponse) {
                return greetingResponse;
            }
            return await this.generate_nlp_response(user_response);
        } else if (intent === 'faqSupport') {
            const faqResponse = this.get_faq_response(user_response);
            return faqResponse;
        } else if (intent === 'technicalQuestion' || intent === 'chitchat') {
            return await this.generate_nlp_response(user_response);
        } else if (intent === 'productSearch') {
            const searchResults = await this.searchLaptops(user_response);
            return searchResults;
        } else {
            const faqResponse = this.get_faq_response(user_response);
            if (faqResponse.reply !== "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?") {
                return faqResponse;
            }
            const hasProductKeyword = this.intentKeywords.productSearch.some(keyword => user_response.includes(keyword));
            if (hasProductKeyword) {
                const searchResults = await this.searchLaptops(user_response);
                if (searchResults.type === 'productList' && searchResults.products.length > 0) {
                    return searchResults;
                }
            }
            return await this.generate_nlp_response(user_response);
        }
    }
}

module.exports = ChatBot;