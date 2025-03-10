const socket= io();

// const socket = io("ws://localhost:3000", {
//     reconnection: true,        // Cho phép tự động kết nối lại
//     reconnectionAttempts: 5,   // Số lần thử lại tối đa
//     reconnectionDelay: 3000    // Thời gian chờ giữa các lần thử (3s)
// });

// let socket;

// window.addEventListener("load", () => {
//     if (socket) {
//         socket.disconnect();
//     }
//     socket = io(); // Tạo kết nối WebSocket mới
// });

// var socket = io({ reconnection: false }); 
