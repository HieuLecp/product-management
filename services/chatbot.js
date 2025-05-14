const fs = require('fs');
const path = require('path');
const fuzzball = require('fuzzball');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class ChatBot {
    static API_KEY = "3e95ca7740038bb5e66cf609dfaaf482";
    static GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    constructor(productModel) {
        this.qa_dict = {};
        this.qa_keywords = {};
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
        this.conversationContext = {
            lastProduct: null,
            lastBrand: null,
            lastIntent: null,
            lastSentiment: null
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

        this.sentimentKeywords = {
            positive: ['vui', 'hạnh phúc', 'tốt', 'tuyệt', 'hài lòng', 'thích', 'yêu', 'hứng thú', 'vui vẻ', 'đẹp'],
            negative: ['buồn', 'tệ', 'kém', 'khó chịu', 'tức', 'chán', 'thất vọng', 'mệt', 'tồi', 'khó'],
            neutral: ['ok', 'bình thường', 'ổn', 'được', 'tạm', 'khá']
        };

        this.suggestionTriggers = ['không biết', 'gợi ý', 'đề xuất', 'chọn gì', 'mua gì'];

        // Khởi tạo Gemini client
        this.gemini = new GoogleGenerativeAI(ChatBot.GEMINI_API_KEY);

        const file_path = path.join(__dirname, '../chatbot.txt');
        if (!fs.existsSync(file_path)) {
            throw new Error(`Lỗi: Không tìm thấy file ${file_path}`);
        }

        const lines = fs.readFileSync(file_path, 'utf-8').trim().split('\n');
        let current_question = null;
        for (const line of lines) {
            if (line.startsWith("Câu hỏi:")) {
                current_question = line.replace("Câu hỏi:", "").trim().toLowerCase().replace(/\s+/g, ' ');
                const words = current_question.split(/\s+/).filter(word => word.length > 2);
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
        } catch (error) {
            console.error('Lỗi khi xây dựng từ khóa sản phẩm:', error.message);
        }
    }

    async analyzeSentiment(user_input) {
        try {
            const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `Phân tích cảm xúc của câu sau và trả về một trong các giá trị: positive, negative, neutral. Chỉ trả về tên cảm xúc, không giải thích.\nCâu: ${user_input}`;
            const result = await model.generateContent(prompt);
            const sentiment = result.response.text().trim().toLowerCase();
            return ['positive', 'negative', 'neutral'].includes(sentiment) ? sentiment : 'neutral';
        } catch (error) {
            console.error('Lỗi khi gọi Gemini API (analyzeSentiment):', error.message);
            user_input = user_input.toLowerCase().trim();
            const words = user_input.split(/\s+/);
            let positiveScore = 0;
            let negativeScore = 0;
            for (const word of words) {
                if (this.sentimentKeywords.positive.includes(word)) positiveScore += 1;
                if (this.sentimentKeywords.negative.includes(word)) negativeScore += 1;
            }
            if (positiveScore > negativeScore) return 'positive';
            if (negativeScore > positiveScore) return 'negative';
            return 'neutral';
        }
    }

    async classifyIntentAndSentiment(user_input, history = []) {
        user_input = user_input.toLowerCase().trim();
        let contextScore = 0;
        let contextBrand = null;
        let contextIntent = this.conversationContext.lastIntent;
    
        for (const msg of history) {
            const words = msg.toLowerCase().split(/\s+/);
            for (const word of words) {
                if (this.intentKeywords.productSearch.includes(word)) {
                    contextScore += 50;
                    if (this.brandVariants[word] || this.intentKeywords.productSearch.includes(word)) {
                        contextBrand = this.brandVariants[word] || word;
                    }
                }
                if (this.intentKeywords.faqSupport.includes(word)) contextScore += 30;
            }
        }
    
        try {
            const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const context = history.slice(-3).join(' | ');
            const prompt = `Phân tích câu sau và trả về JSON chứa ý định và cảm xúc:
            - Ý định: Một trong các loại: greeting, productSearch, faqSupport, technicalQuestion, chitchat.
            - Cảm xúc: positive, negative, neutral.
            - greeting: lời chào trực tiếp như "xin chào", "hi".
            - chitchat: trò chuyện thông thường, ví dụ về thời tiết, tâm trạng.
            - productSearch: yêu cầu tìm kiếm sản phẩm, ví dụ "tìm máy tính", "laptop giá rẻ".
            Ngữ cảnh từ lịch sử trò chuyện: ${context}.
            Câu: ${user_input}
            Trả về định dạng: {"intent": "tên_ý_định", "sentiment": "tên_cảm_xúc"}`;
    
            const result = await model.generateContent(prompt);
            let generatedText = result.response.text().trim();
    
            // Làm sạch chuỗi: loại bỏ ```json, ``` và các ký tự xuống dòng không cần thiết
            generatedText = generatedText
                .replace(/```json\s*/, '') // Loại bỏ ```json
                .replace(/```\s*$/, '')   // Loại bỏ ```
                .replace(/\n/g, '')       // Loại bỏ xuống dòng
                .trim();
    
            let resultJson;
            try {
                resultJson = JSON.parse(generatedText);
            } catch (e) {
                console.error('Lỗi parse JSON từ Gemini:', {
                    error: e.message,
                    rawText: generatedText,
                    input: user_input,
                    timestamp: new Date().toISOString()
                });
                resultJson = { intent: 'unknown', sentiment: 'neutral' };
            }
    
            let intent = resultJson.intent?.toLowerCase() || 'unknown';
            let sentiment = resultJson.sentiment?.toLowerCase() || 'neutral';
    
            if (contextScore > 100 && contextBrand && user_input.includes(contextBrand)) {
                intent = 'productSearch';
            } else if (contextScore > 50 && contextIntent === 'faqSupport' && this.intentKeywords.faqSupport.some(keyword => user_input.includes(keyword))) {
                intent = 'faqSupport';
            }
    
            if (['greeting', 'productSearch', 'faqSupport', 'technicalQuestion', 'chitchat'].includes(intent)) {
                this.conversationContext.lastIntent = intent;
                this.conversationContext.lastSentiment = sentiment;
                if (contextBrand) this.conversationContext.lastBrand = contextBrand;
                return { intent, sentiment };
            }
            return { intent: 'unknown', sentiment: 'neutral' };
        } catch (error) {
            console.error('Lỗi khi gọi Gemini API (classifyIntentAndSentiment):', {
                error: error.message,
                input: user_input,
                history,
                timestamp: new Date().toISOString()
            });
            const words = user_input.split(/\s+/).filter(word => word.length > 0);
            let productScore = contextScore;
            let faqScore = contextScore;
            let greetingScore = 0;
            let technicalScore = 0;
            let chitchatScore = 0;
    
            const chitchatKeywords = ['trời đẹp', 'hôm nay', 'thời tiết', 'tâm trạng', 'cảm giác', 'thế nào', 'ngày mới'];
            for (const word of words) {
                const greetingMatch = fuzzball.extract(word, this.intentKeywords.greeting, { scorer: fuzzball.ratio })[0];
                if (greetingMatch[1] > 80) greetingScore += greetingMatch[1];
    
                const productMatch = fuzzball.extract(word, this.intentKeywords.productSearch, { scorer: fuzzball.ratio })[0];
                if (productMatch[1] > 60) productScore += productMatch[1];
                if (this.productKeywordsMap[word] && this.productKeywordsMap[word].length > 0) productScore += 50;
    
                const faqMatch = fuzzball.extract(word, this.intentKeywords.faqSupport, { scorer: fuzzball.ratio })[0];
                if (faqMatch[1] > 60) faqScore += faqMatch[1];
    
                if (['tại sao', 'làm sao', 'vì sao', 'như thế nào'].some(q => user_input.includes(q))) technicalScore += 120;
    
                const chitchatMatch = fuzzball.extract(word, chitchatKeywords, { scorer: fuzzball.ratio })[0];
                if (chitchatMatch[1] > 60) chitchatScore += chitchatMatch[1];
            }
    
            const scores = [
                { intent: 'greeting', score: greetingScore },
                { intent: 'productSearch', score: productScore },
                { intent: 'faqSupport', score: faqScore },
                { intent: 'technicalQuestion', score: technicalScore },
                { intent: 'chitchat', score: chitchatScore }
            ];
            const topIntent = scores.sort((a, b) => b.score - a.score)[0];
    
            let sentiment = 'neutral';
            let positiveScore = 0;
            let negativeScore = 0;
            for (const word of words) {
                if (this.sentimentKeywords.positive.includes(word)) positiveScore += 1;
                if (this.sentimentKeywords.negative.includes(word)) negativeScore += 1;
            }
            if (positiveScore > negativeScore) sentiment = 'positive';
            if (negativeScore > positiveScore) sentiment = 'negative';
    
            if (topIntent.score > 50) {
                this.conversationContext.lastIntent = topIntent.intent;
                this.conversationContext.lastSentiment = sentiment;
                if (contextBrand) this.conversationContext.lastBrand = contextBrand;
                return { intent: topIntent.intent, sentiment };
            }
            return { intent: 'unknown', sentiment: 'neutral' };
        }
    }

    async getBrowsingHistoryRecommendations(browsingHistory = []) {
        if (!this.productModel) {
            return { type: 'text', reply: "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm." };
        }

        try {
            const categories = browsingHistory
                .filter(item => item.category)
                .map(item => item.category)
                .reduce((acc, cat) => {
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                }, {});

            const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0];

            let query = {
                deleted: false,
                status: 'active'
            };
            if (topCategory) {
                query.category = { $regex: topCategory, $options: 'i' };
            }

            const products = await this.productModel.find(query)
                .sort({ sold: -1 })
                .limit(3)
                .lean();

            if (!products || products.length === 0) {
                return { type: 'text', reply: "Hiện tại không có sản phẩm nào phù hợp để gợi ý." };
            }

            const productList = products.map(product => {
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
            console.error('Lỗi khi gợi ý dựa trên lịch sử duyệt web:', error.message);
            return { type: 'text', reply: "Lỗi: Không thể gợi ý sản phẩm. Vui lòng thử lại." };
        }
    }

    async recommend_products(user_input, history = []) {
        if (!this.productModel) {
            return { type: 'text', reply: "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm." };
        }

        let brandFilter = this.conversationContext.lastBrand;
        for (const msg of history) {
            if (msg.toLowerCase().includes('dell') || msg.toLowerCase().includes('asus') || msg.toLowerCase().includes('acer')) {
                brandFilter = msg.toLowerCase().match(/dell|asus|acer|hp|lenovo|apple|msi/)?.[0] || brandFilter;
            }
        }

        try {
            let query = {
                deleted: false,
                status: 'active',
                category: { $regex: '^laptop$', $options: 'i' }
            };
            if (brandFilter) {
                query.brand = { $regex: brandFilter, $options: 'i' };
            }

            const products = await this.productModel.find(query)
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
            console.error('Lỗi khi gợi ý sản phẩm:', error.message);
            return { type: 'text', reply: "Lỗi: Không thể gợi ý sản phẩm. Vui lòng thử lại." };
        }
    }

    async searchLaptops(user_input, history = []) {
        if (!this.productModel) {
            return { type: 'text', reply: "Hệ thống chưa kết nối với cơ sở dữ liệu sản phẩm." };
        }
    
        user_input = user_input.toLowerCase().trim();
        if (!user_input) {
            return { type: 'text', reply: "Vui lòng nhập thông tin tìm kiếm." };
        }
    
        const keywords = user_input.split(/\s+/).filter(word => word.length > 0);
        const normalizedKeywords = keywords.map(keyword => this.brandVariants[keyword] || keyword);
    
        let contextBrand = this.conversationContext.lastBrand;
        if (history.length > 0) {
            for (const msg of history) {
                if (msg.toLowerCase().includes('dell') || msg.toLowerCase().includes('asus') || msg.toLowerCase().includes('acer')) {
                    contextBrand = msg.toLowerCase().match(/dell|asus|acer|hp|lenovo|apple|msi/)?.[0] || contextBrand;
                }
            }
        }
    
        const expensiveKeywords = ['đắt', 'cao cấp', 'giá cao', 'đắt tiền', 'cao giá'];
        const cheapKeywords = ['rẻ', 'giá thấp', 'bình dân', 'giá rẻ', 'thấp giá'];
        const isExpensive = keywords.some(keyword => expensiveKeywords.includes(keyword));
        const isCheap = keywords.some(keyword => cheapKeywords.includes(keyword));
    
        const hasProductKeyword = keywords.some(keyword => this.intentKeywords.productSearch.includes(keyword));
        if (!hasProductKeyword && !contextBrand) {
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
    
            const categoryKeywords = {
                'laptop': ['laptop', 'máy tính'],
                'desktop': ['desktop', 'máy bàn']
            };
            const brandKeywords = this.intentKeywords.productSearch.filter(keyword =>
                ['dell', 'asus', 'hp', 'lenovo', 'apple', 'acer', 'msi'].includes(keyword)
            );
    
            let containsProductOrBrand = false;
            let detectedCategory = null;
            let detectedBrand = null;
    
            for (const keyword of specificKeywords) {
                if (brandKeywords.includes(this.brandVariants[keyword] || keyword)) {
                    containsProductOrBrand = true;
                    detectedBrand = this.brandVariants[keyword] || keyword;
                }
                for (const [category, synonyms] of Object.entries(categoryKeywords)) {
                    if (synonyms.includes(keyword)) {
                        detectedCategory = category;
                        containsProductOrBrand = true;
                        break;
                    }
                }
                if (containsProductOrBrand) break;
    
                if (!detectedCategory && !brandKeywords.includes(keyword)) {
                    for (const product of products) {
                        const title = product.title?.toLowerCase() || '';
                        const description = product.description?.toLowerCase() || '';
                        const brand = product.brand?.toLowerCase() || '';
    
                        const titleWords = title.split(/\s+/);
                        const descriptionWords = description.split(/\s+/);
    
                        const titleScore = Math.max(...titleWords.map(word => fuzzball.ratio(keyword, word)), 0);
                        const descriptionScore = Math.max(...descriptionWords.map(word => fuzzball.ratio(keyword, word)), 0);
                        const brandScore = brand ? fuzzball.ratio(keyword, brand) : 0;
    
                        if (titleScore > 90 || descriptionScore > 90 || brandScore > 90) {
                            containsProductOrBrand = true;
                            break;
                        }
                    }
                }
                if (containsProductOrBrand) break;
            }
    
            // Chỉ lấy toàn bộ sản phẩm nếu không có thương hiệu và có yêu cầu giá
            if (!detectedBrand && (detectedCategory === 'laptop' || !containsProductOrBrand) && (isCheap || isExpensive)) {
                matchedProducts = products;
            } else {
                const categoryKeyword = specificKeywords.find(keyword =>
                    Object.values(categoryKeywords).flat().includes(keyword)
                );
                const brandKeyword = specificKeywords.find(keyword =>
                    brandKeywords.includes(this.brandVariants[keyword] || keyword)
                ) || contextBrand;
    
                if (brandKeyword) {
                    const normalizedBrand = this.brandVariants[brandKeyword] || brandKeyword;
                    this.conversationContext.lastBrand = normalizedBrand;
                    for (const product of products) {
                        const brand = product.brand?.toLowerCase() || '';
                        const brandScore = brand ? fuzzball.ratio(normalizedBrand, brand) : 0;
                        if (brandScore >= 90) {
                            matchedProducts.push(product);
                        }
                    }
                } else if (categoryKeyword && detectedCategory !== 'laptop') {
                    for (const product of products) {
                        const category = product.category?.toLowerCase() || '';
                        for (const [cat, synonyms] of Object.entries(categoryKeywords)) {
                            if (synonyms.includes(categoryKeyword) && category === cat) {
                                matchedProducts.push(product);
                                break;
                            }
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
                    return { type: 'text', reply: "Bạn có thể gợi ý về nhãn hàng bạn muốn mua hoặc một số thông tin về sản phẩm không?" };
                }
            }
    
            matchedProducts = matchedProducts.filter(product => {
                const price = product.price || 0;
                const discount = product.discountPercentage || 0;
                const finalPrice = price * (1 - discount / 100);
                // console.log(`Product: ${product.title}, Final Price: ${finalPrice}`);
                return finalPrice >= 1000;
            });
    
            let sortedProducts;
            if (isExpensive) {
                sortedProducts = matchedProducts.sort((a, b) => {
                    const priceA = a.price * (1 - (a.discountPercentage || 0) / 100);
                    const priceB = b.price * (1 - (b.discountPercentage || 0) / 100);
                    // console.log(`Sorting: ${a.title} (${priceA}) vs ${b.title} (${priceB})`);
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
    
            this.conversationContext.lastProduct = productList[0]?.title || null;
            return { type: 'productList', products: productList };
        } catch (error) {
            console.error('Lỗi khi tìm kiếm laptop:', error.message);
            return { type: 'text', reply: "Lỗi: Không thể tìm kiếm sản phẩm. Vui lòng thử lại." };
        }
    }

    get_faq_response(user_input, sentiment) {
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

        let reply;
        if (best_match && highest_keyword_score > 100) {
            reply = this.qa_dict[best_match];
        } else {
            const results = fuzzball.extract(user_input, Object.keys(this.qa_dict), { scorer: fuzzball.token_sort_ratio });
            const best_fuzz_match = results[0][0];
            const fuzz_score = results[0][1];
            reply = fuzz_score > 60 ? this.qa_dict[best_fuzz_match] : "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?";
        }

        if (sentiment === 'positive') {
            return { type: 'text', reply: `Rất vui khi bạn hào hứng! ${reply}` };
        } else if (sentiment === 'negative') {
            return { type: 'text', reply: `Mình hiểu bạn đang không vui, mình sẽ cố gắng giúp nhé. ${reply}` };
        }
        return { type: 'text', reply };
    }

    static greeting(sentence, sentiment) {
        const GREETING_INPUTS = ["hello", "hi", "greetings", "sup", "what's up", "hey", "chào", "xin chào", "chào bạn"];
        const GREETING_RESPONSES = {
            positive: ["Chào bạn! Thật tuyệt khi bạn vui vẻ hôm nay!", "Hey! Năng lượng tích cực của bạn làm mình hào hứng!"],
            negative: ["Chào bạn! Mình hy vọng có thể làm bạn vui hơn!", "Hi! Có gì thú vị đang xảy ra không?"],
            neutral: ["Hi!", "Hey!", "Hello!", "Chào bạn!", "Xin chào!"]
        };
        sentence = sentence.toLowerCase();

        const results = fuzzball.extract(sentence, GREETING_INPUTS, { scorer: fuzzball.ratio });
        const score = results[0][1];

        if (score > 80) {
            const responses = GREETING_RESPONSES[sentiment] || GREETING_RESPONSES.neutral;
            return { type: 'text', reply: responses[Math.floor(Math.random() * responses.length)] };
        }
        return null;
    }

    async generate_nlp_response(user_input, history = [], sentiment) {
        try {
            const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const context = history.slice(-3).join(' | ');
            const prompt = `Trả lời thân thiện bằng tiếng Việt cho câu hỏi: ${user_input}. Ngữ cảnh từ lịch sử trò chuyện: ${context}. ${sentiment === 'negative' ? 'Dùng giọng điệu đồng cảm.' : ''} Trả về câu trả lời ngắn gọn, tối đa 150 ký tự.`;
            const result = await model.generateContent(prompt);
            let reply = result.response.text().trim() || "Xin lỗi, tôi chưa hiểu rõ. Bạn có thể hỏi lại không?";
            if (sentiment === 'positive') {
                reply = `Thật tuyệt khi bạn đang vui! ${reply}`;
            } else if (sentiment === 'negative') {
                reply = `Mình hiểu bạn đang không vui lắm, ${reply}`;
            }
            return { type: 'text', reply };
        } catch (error) {
            console.error('Lỗi khi gọi Gemini API (generate_nlp_response):', error.message);
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

            let reply;
            if (best_match && highest_keyword_score > 100) {
                reply = this.qa_dict[best_match];
            } else if (user_input.includes('thời tiết')) {
                reply = 'Hôm nay thời tiết khá đẹp, bạn thấy sao?';
            } else if (user_input.includes('xin chào')) {
                reply = 'Chào bạn! Rất vui được trò chuyện với bạn.';
            } else if (user_input.includes('tâm trạng') || user_input.includes('cảm giác')) {
                reply = 'Mình hiểu, bạn đang cảm thấy thế nào? Có muốn chia sẻ không?';
            } else if (user_input.includes('hôm nay')) {
                reply = 'Hôm nay là một ngày đẹp, bạn có kế hoạch gì thú vị không?';
            } else if (user_input.includes('tại sao') || user_input.includes('làm sao')) {
                reply = 'Mình sẽ cố giải thích nhé, bạn có thể nói rõ hơn không?';
            } else {
                reply = "Hiện tại mình gặp chút vấn đề kỹ thuật, hãy thử lại sau nhé!";
            }

            if (sentiment === 'positive') {
                reply = `Thật tuyệt khi bạn đang vui! ${reply}`;
            } else if (sentiment === 'negative') {
                reply = `Mình hiểu bạn đang không vui lắm, ${reply}`;
            }
            return { type: 'text', reply };
        }
    }

    async chat_with_bot(user_input, history = [], browsingHistory = []) {
        user_input = user_input.toLowerCase().trim();
    
        if (this.last_request === user_input) {
            return { type: 'text', reply: "Mình vừa trả lời câu này rồi, bạn muốn hỏi thêm gì không?" };
        }
        this.last_request = user_input;
    
        const { intent, sentiment } = await this.classifyIntentAndSentiment(user_input, history);
        console.log('Detected Intent:', intent, 'Sentiment:', sentiment);
    
        // Chỉ kích hoạt gợi ý sản phẩm nếu người dùng rõ ràng yêu cầu (ví dụ: chứa "gợi ý", "không biết")
        const needsSuggestion = intent === 'chitchat' && 
            this.suggestionTriggers.some(trigger => user_input.includes(trigger));
    
        if (needsSuggestion) {
            const browsingRecommendations = await this.getBrowsingHistoryRecommendations(browsingHistory);
            if (browsingRecommendations.type === 'productList' && browsingRecommendations.products.length > 0) {
                let reply = sentiment === 'negative' 
                    ? "Mình thấy bạn đang không vui, đây là vài sản phẩm nổi bật có thể làm bạn thích thú!"
                    : "Mình gợi ý vài sản phẩm đang hot dựa trên sở thích của bạn nhé!";
                return { 
                    type: 'productList', 
                    products: browsingRecommendations.products, 
                    reply: reply 
                };
            }
            const trendingProducts = await this.recommend_products(user_input, history);
            let reply = sentiment === 'negative' 
                ? "Mình thấy bạn đang phân vân, đây là vài sản phẩm bán chạy nhất!"
                : "Đây là vài sản phẩm đang rất được ưa chuộng!";
            return { 
                type: 'productList', 
                products: trendingProducts.products, 
                reply: reply 
            };
        }
    
        if (intent === 'greeting') {
            const greetingResponse = ChatBot.greeting(user_input, sentiment);
            if (greetingResponse) {
                return greetingResponse;
            }
            return await this.generate_nlp_response(user_input, history, sentiment);
        } else if (intent === 'faqSupport') {
            return this.get_faq_response(user_input, sentiment);
        } else if (intent === 'technicalQuestion' || intent === 'chitchat') {
            return await this.generate_nlp_response(user_input, history, sentiment);
        } else if (intent === 'productSearch') {
            const searchResults = await this.searchLaptops(user_input, history);
            if (searchResults.products?.length === 0 && this.conversationContext.lastBrand) {
                return await this.recommend_products(user_input, history);
            }
            if (sentiment === 'negative' && searchResults.type === 'text') {
                searchResults.reply = `Mình hiểu bạn đang không hài lòng, ${searchResults.reply} Bạn muốn mình gợi ý thêm sản phẩm không?`;
            }
            return searchResults;
        } else {
            const faqResponse = this.get_faq_response(user_input, sentiment);
            if (faqResponse.reply !== "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi lại theo cách khác không?") {
                return faqResponse;
            }
            const hasProductKeyword = this.intentKeywords.productSearch.some(keyword => user_input.includes(keyword));
            if (hasProductKeyword) {
                const searchResults = await this.searchLaptops(user_input, history);
                if (searchResults.type === 'productList' && searchResults.products.length > 0) {
                    return searchResults;
                }
            }
            return await this.generate_nlp_response(user_input, history, sentiment);
        }
    }
}

module.exports = ChatBot;