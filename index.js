const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const cookieParser = require('cookie-parser')
const session = require("express-session");


require('dotenv').config();

const database = require('./config/database.js')

const systemConfig = require('./config/system.js');

const route = require("./routes/client/index.route");

const routeAdmin = require("./routes/admin/index.route");

database.connect();

const app = express();
const port = process.env.PORT;

app.use(methodOverride('_method'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

//flash 
app.use(cookieParser('HieuLe'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());
// end flash

// tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));
// end tinymce

app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

// app local variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;
// console.log(__dirname);

app.use(express.static(`${__dirname}/public`));

//Route
route(app);
routeAdmin(app);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// app.listen(3000)
// B19