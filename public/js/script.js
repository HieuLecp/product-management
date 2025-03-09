// show alert
const showAlert = document.querySelector("[show-alert]");
if(showAlert){
    const time = parseInt(showAlert.getAttribute("data-time"));
    const closeAlert = showAlert.querySelector("[close-alert]");

    setTimeout(() => {
        showAlert.classList.add("alert-hidden");
    }, time)

    closeAlert.addEventListener("click", () => {
        showAlert.classList.add("alert-hidden");
    })

}
// end show alert


// button-go-back
const buttonGoback= document.querySelectorAll("[button-go-back]");
if(buttonGoback.length > 0){
    buttonGoback.forEach(button => {
        button.addEventListener("click", () => {
            history.back();
        })
    })
}
// end button-go-back

// document.getElementById("sendButton").addEventListener("click", async () => {
//     const messageInput = document.getElementById("message");
//     const chatbox = document.getElementById("chatbox");

//     const message = messageInput.value.trim();
//     if (!message) return;

//     // Hiển thị tin nhắn của người dùng
//     chatbox.innerHTML += `<p><b>Bạn:</b> ${message}</p>`;
//     messageInput.value = "";

//     try {
//         const response = await fetch("/chatbot", { // Đổi "/chatbot" thành "/chat" nếu backend của bạn dùng đường dẫn đó
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ message })
//         });

//         if (!response.ok) throw new Error(`Lỗi API: ${response.statusText}`);

//         const data = await response.json();
//         chatbox.innerHTML += `<p><b>Leon:</b> ${data.reply || "Không có phản hồi."}</p>`;
//     } catch (error) {
//         console.error("Lỗi kết nối với API:", error);
//         chatbox.innerHTML += `<p><b>Leon:</b> Lỗi kết nối với server.</p>`;
//     }
// });
