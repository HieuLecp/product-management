import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

// Xử lý mở/đóng chatbot
document.getElementById("chat-toggle").addEventListener("click", function() {
    let chatContainer = document.getElementById("chat-container");
    chatContainer.classList.toggle("open");

    if (chatContainer.classList.contains("open")) {
        chatContainer.style.display = "block";
    } else {
        setTimeout(() => chatContainer.style.display = "none", 300);
    }
});
document.getElementById("close-chatbot").addEventListener("click", function () {
    document.getElementById("chat-container").style.display = "none";
});

// Xử lý gửi tin nhắn
document.getElementById("chatForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Ngăn tải lại trang

    let userMessage = document.getElementById("userInput").value.trim();
    if (!userMessage) return; // Không gửi tin nhắn trống

    let chatbox = document.getElementById("chatbox");

    // Thêm tin nhắn người dùng vào giao diện
    let userMsgElement = document.createElement("p");
    userMsgElement.classList.add("user-message");
    userMsgElement.innerHTML = userMessage;
    chatbox.appendChild(userMsgElement);

    try {
        const response = await axios.post("http://127.0.0.1:5000/chatbot", { usr_req: userMessage });

        // Hiển thị phản hồi chatbot
        let botMsgElement = document.createElement("p");
        botMsgElement.classList.add("bot-message");
        botMsgElement.innerHTML = `<img src="/images/chatBot.jpeg" class="avatar"> <strong>Leo:</strong> ${response.data.bot_resp}`;
        chatbox.appendChild(botMsgElement);

    } catch (error) {
        console.error("Lỗi kết nối chatbot:", error);
        chatbox.innerHTML += `<p style="color: red;"><strong>Lỗi:</strong> Không thể kết nối chatbot!</p>`;
    }

    document.getElementById("userInput").value = ""; // Xóa input
    chatbox.scrollTop = chatbox.scrollHeight; // Cuộn xuống tin nhắn mới
});
