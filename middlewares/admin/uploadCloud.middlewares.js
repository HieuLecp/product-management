const uploadToCloudinary= require("../../helpers/uploadToCloudinary");
const multer = require('multer');

module.exports.upload= async(req, res, next) => {
    if(req.file){
        const result= await uploadToCloudinary(req.file.buffer);
        console.log(result);
        req.body[req.file.fieldname]= result;
        console.log(req.file.fieldname);
    }   
    
    next();
}

// Cấu hình multer để lưu vào memory (buffer)
const upload1 = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

// Middleware upload nhiều file
module.exports.uploadFields = upload1.fields([
    { name: 'image', maxCount: 1 },
    { name: 'giftImage', maxCount: 1 }
]);

module.exports.uploads = async (req, res, next) => {
    try {
        if (req.files) {
            // Xử lý image
            if (req.files.image) {
                const result = await uploadToCloudinary(req.files.image[0].buffer);
                req.body.image = result;
                console.log('Uploaded image:', result);
            }
            // Xử lý giftImage
            if (req.files.giftImage) {
                const result = await uploadToCloudinary(req.files.giftImage[0].buffer);
                req.body.giftImage = result;
                console.log('Uploaded giftImage:', result);
            }
        }
        next();
    } catch (error) {
        console.error('Upload error:', error);
        req.flash('error', 'Lỗi khi upload ảnh');
        res.redirect(req.originalUrl); // Redirect về trang hiện tại
    }
};