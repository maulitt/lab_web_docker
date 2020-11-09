const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const hbs = require('hbs');
const flash = require('connect-flash');
const passport = require('./config/passport').passport;
const fs = require('fs');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
require('passport-local');
const connecting = require('./for_sequelize').connecting;

//     экспериментально!  удалить, когда всё сломается!!!!!
const sequelize = require('./for_sequelize').sequelize;
const Sequelize = require('sequelize');
const User = require('./models/user')(sequelize, Sequelize);


app.use(express.static(__dirname+'/public'));

app.use(flash());
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 5*60*1000
}));
app.use(cookieParser());
//чтобы писать пост-реквесты нужны следующие мидлвари
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


app.set('view engine', 'hbs');
app.set('views', 'views');
hbs.registerPartials(__dirname+'/views/partials');



app.use(passport.initialize());
app.use(passport.session());


//                        было
app.get('/registration', function (req, res) {
    res.render('registration.hbs', { message: req.flash('error')});
})
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})
app.post('/registration', passport.authenticate('registration', { successRedirect: '/',
    failureRedirect: '/registration', failureFlash: true }))
app.get('/signin', function (req, res) {
    res.render('signin.hbs', { message: req.flash('error') });
    console.log(req.flash());
})
app.post('/signin', passport.authenticate('local', { successRedirect: '/personal', failureRedirect: '/signin',
    failureFlash: true }))

app.get('/personal', passport.authenticate('cookie', { failureRedirect: '/signin',
    failureFlash: true }), function(req, res) {
    res.render('personalpage.hbs', { name: 'Regina', username: req.user.name, useremail: req.user.email });
})
app.get('/', function (req, res) {
    res.render('mainpage.hbs', { title: 'Главная страница приложения', name: 'Регины'})
})




//                       стало
app.get('/proverka', (req, res) => {
    res.send({ success: true });
})
app.get('/resource', passport.authenticate('cookie', {
    failureRedirect: '/signin',
    failureFlash: true
}),(req, res) => {
    res.send({ success: true , resp: req.user.name });
})
app.post('/resource', passport.authenticate('registration', {
    successRedirect: '/',
    failureRedirect: '/registration',
    failureFlash: true }), (req, res) => {
    res.json({ succeeded: true } );
})
app.post('/login', passport.authenticate('local', {
    successRedirect: '/personal',
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    res.json({ succeeded: true });
})
app.put('/resource', passport.authenticate('cookie', {
    failureRedirect: '/signin',
    failureFlash: true
}), (req, res, next) => {
    User.update(
        { name: req.query.name },
        { where: req.user.id }
    ).then( (updatedField) => {
        res.json(updatedField)
    }).catch(next);
})
app.delete('/resource', passport.authenticate('cookie', {
    failureRedirect: '/signin',
    failureFlash: true
}), (req, res) => {
    if(req.user.email === 'admin') {
        User.destroy({
            where: {
                id: req.query.id
            }
        }).then(() => {
            res.json({ succeded: true });
        }).catch(err => {
                res.json({ succeded: false, error: err });
            })
    }
    else {
        res.json({ succeded: false, error: 'you\'re not an admin! ' });
    }
})


//мидлвари для ошибок
app.use(function(req, res, next) {       // ошибка 404 обрабатывается по-особенному 0_о
    const err = new Error('Not Found');
    err.statusCode = 404;
    res.send('What?');
    next(err);
});

app.use(function(err, req, res, next) {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500;  //  если нет какого-то кода, то это 500
    res.status(err.statusCode).send(err.message);
    next(err);
})

app.use(function (err, req, res, next) {
    let now = Date();
    fs.appendFile('logging.txt', 'Error '+ now, function(err) {
        if (err)
        {
            console.log('failed to save in log');
            throw err;
        }
        console.log('(saved to log)');
    });
})




app.listen(PORT,() => {
    console.log('server zapushen');
    connecting().then(() => {
        console.log('connected database');
    }).catch((err) => {
        console.log(err);
    });
} );