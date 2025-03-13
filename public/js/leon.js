import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';


document.getElementById("chatForm").addEventListener("submit", async function (e) {
    e.preventDefault(); // Ngăn chặn reload trang

    let userMessage = document.getElementById("userInput").value.trim();
    console.log(userMessage);
    if (!userMessage) return; // Không gửi nếu input trống

    let chatbox = document.getElementById("chatbox");

    // Hiển thị tin nhắn người dùng
    // chatbox.innerHTML += `<p><strong>Bạn:</strong> ${userMessage}</p>`;
    let userMsgElement = document.createElement("p");
    userMsgElement.classList.add("user-message");
    userMsgElement.innerHTML = `${userMessage}`;
    chatbox.appendChild(userMsgElement);

    try {
        // const response = await axios.post("http://127.0.0.1:5000/chatbot", { usr_req: userMessage });
        const response = await axios.post(
            "http://127.0.0.1:5000/chatbot",  // Gửi đến Flask chatbot
            { usr_req: userMessage },  // Định dạng JSON đúng
            {
                headers: {
                    "Content-Type": "application/json",
                },
                mode: "cors"
            }
        );

        // Hiển thị phản hồi từ chatbot
        // chatbox.innerHTML += `<p><strong>Leon:</strong> ${response.data.bot_resp}</p>`;
        let botMsgElement = document.createElement("p");
        botMsgElement.classList.add("message","bot-message");
        botMsgElement.innerHTML = `
            <img src="/images/chatBot.jpeg" class="avatar">
            <strong>Leo:</strong> ${response.data.bot_resp}
        `;
        chatbox.appendChild(botMsgElement);

    } catch (error) {
        console.error("Lỗi kết nối chatbot:", error);
        chatbox.innerHTML += `<p style="color: red;"><strong>Lỗi:</strong> Không thể kết nối đến chatbot!</p>`;
    }

    document.getElementById("userInput").value = ""; // Xóa input sau khi gửi
    chatbox.scrollTop = chatbox.scrollHeight; // Cuộn xuống tin nhắn mới nhất
});

