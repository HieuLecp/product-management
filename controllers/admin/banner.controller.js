const Banner = require('../../models/banner.model');

// [GET] /admin/banners
module.exports.index = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.render('admin/pages/banners/index', {
            pageTitle: 'Quản lý Banner',
            banners
        });
    } catch (error) {
        req.flash('error', 'Lỗi khi tải danh sách banner');
        res.redirect('/admin');
    }
};

// [GET] /admin/banners/create
module.exports.create = (req, res) => {
    res.render('admin/pages/banners/create', {
        pageTitle: 'Thêm Banner'
    });
};

// [POST] /admin/banners/create
module.exports.createPost = async (req, res) => {
    try {
        const { type, title, description, price, link, status, giftDescription } = req.body;
        const banner = new Banner({
            type,
            image: req.body.image || '', // URL từ Cloudinary
            title,
            description,
            price,
            link,
            gift: {
                image: req.body.giftImage || '',
                description: giftDescription || ''
            },
            status
        });
        await banner.save();
        req.flash('success', 'Thêm banner thành công!');
        res.redirect('/admin/banner');
    } catch (error) {
        console.error('Error in createPost:', error);
        req.flash('error', 'Thêm banner thất bại');
        res.redirect('/admin/banner/create');
    }
};

// [GET] /admin/banners/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            req.flash('error', 'Banner không tồn tại');
            return res.redirect('/admin/banner');
        }
        res.render('admin/pages/banners/edit', {
            pageTitle: 'Sửa Banner',
            banner
        });
    } catch (error) {
        req.flash('error', 'Lỗi khi tải banner');
        res.redirect('/admin/banner');
    }
};

// [PATCH] /admin/banner/edit/:id
module.exports.editPost = async (req, res) => {
    // res.send("ok");
    try {
        const { type, title, description, price, link, status, giftDescription } = req.body;
        const updateData = {
            type,
            title,
            description,
            price,
            link,
            status,
            gift: {
                description: giftDescription || ''
            }
        };
        if (req.body.image) {
            updateData.image = req.body.image;
        }
        if (req.body.giftImage) {
            updateData.gift.image = req.body.giftImage;
        }
        await Banner.updateOne({_id: req.params.id}, updateData);
        req.flash('success', 'Cập nhật banner thành công!');
        res.redirect('/admin/banner');
    } catch (error) {
        console.error('Error in editPost:', error);
        req.flash('error', 'Cập nhật banner thất bại');
        res.redirect(`/admin/banner/edit/${req.params.id}`);
    }
};

// [DELETE] /admin/banners/delete/:id
module.exports.delete = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        req.flash('success', 'Xóa banner thành công!');
        res.redirect('/admin/banner');
    } catch (error) {
        req.flash('error', 'Xóa banner thất bại');
        res.redirect('/admin/banner');
    }
};