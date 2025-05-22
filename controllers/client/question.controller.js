const Question = require("../../models/question.model");
const User = require("../../models/users.model");

// [GET] /questions - Trang danh sách câu hỏi (Client)
module.exports.index = async (req, res) => {
    const questions = await Question.find({ status: { $in: ['answered', 'closed'] } })
        .sort({ createdAt: -1 })
        .populate('userId', 'fullName')
        .populate('answeredBy', 'fullName');

    res.render("client/pages/questions/index", {
        pageTitle: "Giải đáp thắc mắc",
        questions
    });
};

// [POST] /questions/create - Gửi câu hỏi mới (Client)
module.exports.create = async (req, res) => {
    const user = await User.findOne({ tokenUser: req.cookies.tokenUser });

    if (!user) {
        req.flash('error', 'Vui lòng đăng nhập để đặt câu hỏi.');
        return res.redirect('/user/login');
    }

    const questionData = {
        content: req.body.content,
        userId: user._id,
        userName: user.fullName,
        status: 'pending'
    };

    const question = new Question(questionData);
    await question.save();

    req.flash('success', 'Câu hỏi của bạn đã được gửi thành công! Vui lòng chờ admin trả lời.');
    res.redirect('/questions');
};

