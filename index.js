const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const hbs = require('hbs');
const flash = require('connect-flash');
const passport = require('./config/passport').passport;
const fs = require('fs');
//const argon2 = require('argon2');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
require('passport-local');


app.use(flash());
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}));
app.use(cookieParser());
//чтобы писать пост-реквесты нужны следующие мидлвари
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'hbs');
app.set('views', 'views');
hbs.registerPartials(__dirname+'/views/partials')

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send('Hello, i\'m so fucking scared');
})


app.listen(PORT,() => {
    console.log('server zapushen');
} );