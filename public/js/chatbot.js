// public/js/chatbot.js
document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.chatbot-toggle');
    const toggleOutsideBtn = document.querySelector('.chatbot-toggle-outside');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotBody = document.querySelector('.chatbot-body');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotMessages = document.getElementById('chatbotMessages');

    // Load lịch sử chat từ localStorage
    const savedMessages = localStorage.getItem('chatbotMessages');
    if (savedMessages) {
        chatbotMessages.innerHTML = savedMessages;
    } else {
        chatbotMessages.innerHTML = '<div class="chatbot-message bot">Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</div>';
    }

    // Đảm bảo nút bên ngoài hiển thị mặc định khi tải trang
    toggleOutsideBtn.classList.remove('hidden');

    // Toggle chatbot khi nhấp vào nút bên ngoài hoặc trong header
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            chatbotContainer.classList.toggle('active');
            if (chatbotContainer.classList.contains('active')) {
                chatbotBody.classList.remove('hidden');
                toggleOutsideBtn.classList.add('hidden');
            } else {
                chatbotBody.classList.add('hidden');
                toggleOutsideBtn.classList.remove('hidden');
            }
        });
    });

    // Gửi câu hỏi
    const sendMessage = async () => {
        const message = chatbotInput.value.trim();
        if (!message) return;

        // Thêm tin nhắn của người dùng
        const userMsg = document.createElement('div');
        userMsg.className = 'chatbot-message user';
        userMsg.textContent = message;
        chatbotMessages.appendChild(userMsg);

        // Gửi yêu cầu đến server
        try {
            const response = await fetch('/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();

            // Thêm phản hồi của bot
            const botMsg = document.createElement('div');
            botMsg.className = 'chatbot-message bot';

            if (data.type === 'productList') {
                // Hiển thị danh sách sản phẩm
                const productList = document.createElement('div');
                productList.className = 'product-list';

                data.products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
                        <img src="${product.thumbnail}" alt="${product.title}" class="product-image" onerror="this.src='/images/default.jpg'">
                        <div class="product-info">
                            <a href="/product/${product.slug}" class="product-title">${product.title}</a>
                            <div class="product-price">
                                ${product.final_price} VNĐ
                                ${product.discount > 0 ? `<span class="original-price">(${product.original_price} VNĐ)</span>` : ''}
                                ${product.discount > 0 ? `<span class="discount">(-${product.discount}%)</span>` : ''}
                            </div>
                            <div class="product-description">${product.description}</div>
                        </div>
                    `;
                    productList.appendChild(productCard);
                });

                botMsg.appendChild(productList);
            } else {
                // Hiển thị văn bản thông thường
                botMsg.textContent = data.reply || 'Có lỗi xảy ra, vui lòng thử lại.';
            }

            chatbotMessages.appendChild(botMsg);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

            // Lưu lịch sử chat vào localStorage
            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
        } catch (error) {
            const botMsg = document.createElement('div');
            botMsg.className = 'chatbot-message bot';
            botMsg.textContent = 'Lỗi: Không thể kết nối với server.';
            chatbotMessages.appendChild(botMsg);

            localStorage.setItem('chatbotMessages', chatbotMessages.innerHTML);
        }

        // Xóa input
        chatbotInput.value = '';
    };

    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});