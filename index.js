const express = require('express');
const cors = require('cors');
const path = require('path');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const cookieParser = require('cookie-parser')
const session = require("express-session");
const moment= require("moment");
const http= require("http");
const { Server } = require("socket.io")


require('dotenv').config();

const database = require('./config/database.js')

const systemConfig = require('./config/system.js');

const route = require("./routes/client/index.route");

const routeAdmin = require("./routes/admin/index.route");

database.connect();

const app = express();
const port = process.env.PORT;

app.use(methodOverride('_method'));

app.use(cors());
app.use(express.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

const server= http.createServer(app);
const io= new Server(server, {
});
global._io = io;


//flash 
app.use(cookieParser('HieuLe'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
// end flash

// sesion
app.use(session({
  secret: 'HieuLeSessionSecret', // Bí mật cho session, nên lưu trong biến môi trường
  resave: false, // Không lưu lại session nếu không có thay đổi
  saveUninitialized: false, // Không tạo session cho đến khi có dữ liệu
  cookie: {
    maxAge: 3 * 60 * 1000, // lưu trong 3 phút
    httpOnly: true, // Ngăn JavaScript truy cập cookie
    secure: false, // Đặt true nếu dùng HTTPS
    sameSite: 'strict', // Bảo vệ chống CSRF
  },
}));
// end session

// tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
// end tinymce

// app local variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.moment = moment;

// console.log(__dirname);

app.use(express.static(`${__dirname}/public`));

//Route
route(app);
routeAdmin(app);
app.get("*", (req, res) => {
  res.render("client/pages/error/404", {
    pageTitle: "404 Not Found"
  });
})


server.listen(port, '0.0.0.0', () => {
  console.log(`App listening on port ${port}`);
});

// app.listen(3000)
