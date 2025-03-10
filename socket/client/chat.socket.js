const Chat= require("../../models/chat.model");

const uploadToCloudinary= require("../../helpers/uploadToCloudinary");

module.exports= async (res) => {
    const userId= res.locals.user.id;
    const fullName= res.locals.user.fullName;

    _io.once('connection', (socket) => {
        // console.log(`Total connections: ${_io.engine.clientsCount}`);
        socket.on("client_send_message", async (data) => {
            console.log(data);

            let imageList= []

            for (const imageBuffer of data.images){
                const link= await uploadToCloudinary(imageBuffer);
                imageList.push(link);
            }
            console.log(imageList);
            
            // lưu vào db
            const chat= new Chat({
                user_id: userId,
                content: data.content,
                images: imageList
            });
            await chat.save();

            // Trả về client
            _io.emit("server_return_message", {
                userId: userId,
                fullName: fullName,
                content: data.content,
                images: imageList
            });

        });

        socket.on("client_send_typing", (type) => {
            socket.broadcast.emit("server_return_typing", {
                userId: userId,
                fullName: fullName,
                type: type
            })
        })
        
      });
}