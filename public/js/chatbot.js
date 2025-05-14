document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.chatbot-toggle');
    const toggleOutsideBtn = document.querySelector('.chatbot-toggle-outside');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotBody = document.querySelector('.chatbot-body');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const clearChatBtn = document.getElementById('clearChat');

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        });
    };

    const savedMessages = localStorage.getItem('chatbotMessages');
    if (savedMessages) {
        chatbotMessages.innerHTML = savedMessages;
        scrollToBottom();
    } else {
        chatbotMessages.innerHTML = '<div class="chatbot-message bot">Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</div>';
        scrollToBottom();
    }

    toggleOutsideBtn.classList.remove('hidden');

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            chatbotContainer.classList.toggle('active');
            if (chatbotContainer.classList.contains('active')) {
                chatbotBody.classList.remove('hidden');
                toggleOutsideBtn.classList.add('hidden');
                scrollToBottom();
                chatbotInput.focus();
            } else {
                chatbotBody.classList.add('hidden');
                toggleOutsideBtn.classList.remove('hidden');
            }
        });
    });

    const showTypingIndicator = () => {
        const typingMsg = document.createElement('div');
        typingMsg.className = 'chatbot-message bot typing';
        typingMsg.innerHTML = '<span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>';
        chatbotMessages.appendChild(typingMsg);
        scrollToBottom();
        return typingMsg;
    };

    const removeTypingIndicator = () => {
        const typingMsg = chatbotMessages.querySelector('.typing');
        if (typingMsg) typingMsg.remove();
    };

    const getConversationHistory = () => {
        const messages = chatbotMessages.querySelectorAll('.chatbot-message');
        return Array.from(messages)
            .slice(-5) // Lấy 5 tin nhắn gần nhất
            .map(msg => msg.textContent)
            .filter(text => !text.includes('Đang xử lý') && !text.includes('...')); // Loại bỏ tin nhắn loading
    };

    const sendMessage = async () => {
        const message = chatbotInput.value.trim();
        if (!message) return;

        const userMsg = document.createElement('div');
        userMsg.className = 'chatbot-message user';
        userMsg.textContent = message;
        chatbotMessages.appendChild(userMsg);
        scrollToBottom();

        const typingMsg = showTypingIndicator();

        try {
            const history = getConversationHistory();
            const response = await fetch('/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history })
            });

            if (!response.ok) throw new Error('Lỗi kết nối server');

            const data = await response.json();
            console.log(data);

            removeTypingIndicator();

            const botMsg = document.createElement('div');
            botMsg.className = 'chatbot-message bot';

            if (data.type === 'productList' && Array.isArray(data.products)) {
                if (data.products.length > 0) {
                    const messageText = document.createElement('div');
                    messageText.textContent = 'Dưới đây là một vài sản phẩm liên quan tìm được:';
                    botMsg.appendChild(messageText);
                    const productList = document.createElement('div');
                    productList.className = 'product-list';
                    productList.style.maxHeight = '300px';
                    productList.style.overflowY = 'auto';
                    data.products.forEach(product => {
                        const productCard = document.createElement('div');
                        productCard.className = 'product-card';
                        productCard.innerHTML = `
                            <div class="product-image-container">
                                <img src="${product.thumbnail || '/images/default.jpg'}" alt="${product.title || 'Sản phẩm'}" class="product-image" onerror="this.src='/images/default.jpg'">
                                <button class="add-to-cart-btn" data-product-id="${product.id}" title="Thêm vào giỏ hàng">
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                            <div class="product-info">
                                <a href="/product/detail/${product.slug || '#'}" class="product-title">${product.title || 'Sản phẩm'}</a>
                                <div class="product-price">
                                    ${product.final_price || 'N/A'} VNĐ
                                    ${product.discount > 0 ? `<span class="original-price">(${product.original_price || 'N/A'} VNĐ)</span>` : ''}
                                    ${product.discount > 0 ? `<span class="discount">(-${product.discount}%)</span>` : ''}
                                </div>
                            </div>
                        `;
                        productList.appendChild(productCard);
                    });
                    botMsg.appendChild(productList);

                    const addToCartButtons = productList.querySelectorAll('.add-to-cart-btn');
                    addToCartButtons.forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const productId = btn.getAttribute('data-product-id');
                            if (!productId) {
                                const errorMsg = document.createElement('div');
                                errorMsg.className = 'chatbot-message bot';
                                errorMsg.textContent = 'Lỗi: Không thể thêm sản phẩm vào giỏ hàng (thiếu thông tin sản phẩm).';
                                chatbotMessages.appendChild(errorMsg);
                                scrollToBottom();
                                return;
                            }

                            const typingMsg = showTypingIndicator();
                            try {
                                const response = await fetch(`/chatbot/addCart/${productId}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ quantity: 1 })
                                });

                                if (!response.ok) throw new Error('Lỗi khi thêm vào giỏ hàng');

                                const data = await response.json();
                                removeTypingIndicator();

                                const successMsg = document.createElement('div');
                                successMsg.className = 'chatbot-message bot';
                                successMsg.textContent = data.message || 'Sản phẩm đã được thêm vào giỏ hàng!';
                                chatbotMessages.appendChild(successMsg);
                                scrollToBottom();
                            } catch (error) {
                                removeTypingIndicator();
                                const errorMsg = document.createElement('div');
                                errorMsg.className = 'chatbot-message bot';
                                errorMsg.textContent = 'Lỗi: Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.';
                                chatbotMessages.appendChild(errorMsg);
                                scrollToBottom();
                            }
                        });
                    });
                } else {
                    botMsg.textContent = 'Không tìm thấy sản phẩm phù hợp.';
                }
            } else if (data.type === 'text' && data.reply) {
                botMsg.textContent = data.reply;
            } else {
                botMsg.textContent = 'Không có phản hồi từ server.';
            }

            chatbotMessages.appendChild(botMsg);
            scrollToBottom();

            const maxMessages = 50;
            const messages = chatbotMessages.querySelectorAll('.chatbot-message');
            if (messages.length > maxMessages) {
                for (let i = 0; i < messages.length - maxMessages; i++) {
                    messages[i].remove();
                }
            }
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
        } catch (error) {
            removeTypingIndicator();
            const botMsg = document.createElement('div');
            botMsg.className = 'chatbot-message bot';
            botMsg.textContent = 'Lỗi: Không thể kết nối với server. Vui lòng thử lại.';
            chatbotMessages.appendChild(botMsg);
            scrollToBottom();
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
        }

        chatbotInput.value = '';
    };

    let isSending = false;
    const debouncedSendMessage = async () => {
        if (isSending) return;
        isSending = true;
        await sendMessage();
        isSending = false;
    };

    chatbotSend.addEventListener('click', debouncedSendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') debouncedSendMessage();
    });

    clearChatBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa lịch sử chat?')) {
            localStorage.removeItem('chatbotMessages');
            chatbotMessages.innerHTML = '<div class="chatbot-message bot">Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</div>';
            scrollToBottom();
        }
    });
});