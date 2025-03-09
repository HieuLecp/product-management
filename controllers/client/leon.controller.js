
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
module.exports.leon= async (req, res) => {
    console.log(req.body);
    try {
        const userMessage = req.body.message;
        const response = await axios.post(
            "http://localhost:1337/api/v1/utterance",
            { utterance: userMessage },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": "lehieucp123456789" // Bỏ "Bearer"
                }
            }
        );
        console.log(response.data);

        // Kiểm tra nếu không có trả lời từ Leon
        if (response.data.answers && response.data.answers.length > 0) {
            res.json({ reply: response.data.answers[0] });
        } else {
            res.render("ok");
            res.json({ reply: "Không có phản hồi từ Leon." });
        }

    } catch (error) {
        console.error("Lỗi kết nối với Leon:", error.response ? error.response.data : error.message);
        
        // Nếu có lỗi, trả về thông báo lỗi
        res.status(500).json({ reply: "Lỗi kết nối với Leon." });
    }
    
}
