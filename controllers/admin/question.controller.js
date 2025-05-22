const Question = require("../../models/question.model");
const User = require("../../models/users.model");


// [GET] /admin/questions - Trang quản lý câu hỏi (Admin)
module.exports.index = async (req, res) => {
    const questions = await Question.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName')
        .populate('answeredBy', 'fullName');

    res.render("admin/pages/questions/index", {
        pageTitle: "Quản lý câu hỏi",
        questions
    });
};

// [POST] /admin/questions/answer/:id - Trả lời câu hỏi (Admin)
module.exports.answer = async (req, res) => {
    const questionId = req.params.id;
    const admin = await User.findOne({ tokenUser: req.cookies.tokenUser });
    

    await Question.updateOne(
        { _id: questionId },
        {
            answer: req.body.answer,
            answeredBy: admin._id,
            answeredAt: new Date(),
            status: 'answered'
        }
    );

    req.flash('success', 'Đã trả lời câu hỏi thành công.');
    res.redirect('/admin/questions');
};