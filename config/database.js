const mongoose = require('mongoose');


module.exports.connect = async () => {
    try {
        mongoose.connect(process.env.MONGO_URL);
        console.log("connect Success!")
    } catch(error) {
        console.log("connet Faild!")
    }
}
