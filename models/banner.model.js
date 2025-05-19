const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['popup', 'ad-left', 'ad-right', 'slide-left', 'slide-right'],
        required: true
    },
    image: {
        type: String,
        required: true // Đường dẫn tới file ảnh
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    price: {
        type: String,
        required: false // Giá hoặc ưu đãi, ví dụ: "Giảm 20%"
    },
    link: {
        type: String,
        required: true // URL của nút "Mua ngay" hoặc "Khám phá"
    },
    gift: {
        image: String, // Ảnh quà tặng (nếu có)
        description: String // Mô tả quà tặng
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

bannerSchema.index({ type: 1, createdAt: -1 });

const Banner = mongoose.model('Banner', bannerSchema, 'banner');

module.exports = Banner;