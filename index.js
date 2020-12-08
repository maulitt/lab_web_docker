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
const Article = require('./models/articles')(sequelize, Sequelize);

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

app.use(logToConsole);

app.options("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.sendStatus(200);
});


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
app.get('/api/proverka', (req, res) => {
    res.send({ success: true });
})
app.get('/api/resource', passport.authenticate('cookie', {
    failureRedirect: '/signin',
    failureFlash: true
}),(req, res) => {
    res.send({ success: true , resp: req.user.name });
})

//регистрация
app.post('/api/resource', passport.authenticate('registration', {
    failureRedirect: '/api/error',
    failureFlash: true }), (req, res) => {
    console.log("this is post-handler for regi");
    res.send({ success: true , message: 'okey'}); // ----------experiment
})


//cookie-check for adding news
app.get('/api/cookiecheck', passport.authenticate('cookie', {
    failureRedirect: '/api/error',
    failureFlash: true }), (req, res) => {
    res.send({ message: 'okey'});
})




//авторизация
app.post('/api/login', passport.authenticate('local', {
    failureRedirect: '/api/error',
    failureFlash: true}), (req, res) => {
    res.send({ success: true, message: 'fine' });
})

//отправка сообщения об ошибке
app.get('/api/error', (req, res)=> {
    res.send({message: req.flash('error')});
})


// для работы с таблицей статьи
app.post('/api/add', passport.authenticate('cookie',{
    failureRedirect: '/api/error',
    failureFlash: true}), (req, res) => {
    Article.findOne( {where: {title: req.body.title} })
        .then(function(article) {
            if(article) {
                res.send({message : 'This title\'s already been added'});
            }
            else {
                const newArticle = new Article({
                    author: req.body.author,
                    title: req.body.title,
                    preview: req.body.preview,
                    text: req.body.text
                });
                newArticle.save().then(() => {
                    res.send({message: 'Saved successfully'});
                })
            }
        })
        .catch((err) => {console.log(err); res.send({message: 'some error occurred, try again later'})});
})



//обновление и удаление
app.put('/api/resource', passport.authenticate('local', {
    failureRedirect: '/signin',
    failureFlash: true
}), (req, res, next) => {
    User.update(
        { name: req.query.name },
        { where: { email: req.body.email } }
    ).then( (updatedField) => {
        res.json(updatedField)
    }).catch(next);
})
app.delete('/api/resource', passport.authenticate('cookie', {
    failureRedirect: '/signin',
    failureFlash: true
}), (req, res) => {
    if(req.user.email === 'admin') {
        User.destroy({
            where: {
                id: req.query.id
            }
        }).then(() => {
            res.json({ success: true });
        }).catch(err => {
                res.json({ success: false, error: err });
            })
    }
    else {
        res.json({ success: false, error: 'you\'re not an admin! ' });
    }
})


//мидлвари для ошибок
app.use(function(req, res, next) {       // ошибка 404 обрабатывается по-особенному 0_о
    const err = new Error('Not Found');
    err.statusCode = 404;
    res.send({message: 'What?'});
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

function logToConsole(req, res, next) {
    let date = new Date();
    let data = `${date} ${req.method} request at ${req.url}`;
    console.log(data);
    next();
}