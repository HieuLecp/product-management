
const axios = require('axios');
const { response } = require("express");
const { use } = require("../../routes/client/user.route");

// [GET] /user/leon
module.exports.index =  async (req, res) => {

    res.render("client/pages/leon/index.pug", {
        pageTitle: "Trợ lý ảo",

    });
};

// [POST] /user/leon
// module.exports.leon = async (req, res) => {
//     console.log(req.body);
//     try {
//         const userMessage = req.body.message;  // Lấy tin nhắn từ request
//         const response = await axios.post(
//             "http://127.0.0.1:5000/chatbot",  // Gửi đến Flask chatbot
//             { usr_req: userMessage },  // Định dạng JSON đúng
//             {
//                 headers: {
//                     "Content-Type": "application/json",
//                 }
//             }
//         );

//         console.log("Chatbot Response:", response.data);

//         // Kiểm tra phản hồi từ chatbot
//         if (response.data.bot_resp) {
//             res.json({ reply: response.data.bot_resp });
//         } else {
//             res.json({ reply: "Không có phản hồi từ chatbot." });
//         }

//     } catch (error) {
//         console.error("Lỗi kết nối với chatbot:", error.response ? error.response.data : error.message);
        
//         // Nếu có lỗi, trả về thông báo lỗi
//         res.status(500).json({ reply: "Lỗi kết nối với chatbot." });
//     }
// }
