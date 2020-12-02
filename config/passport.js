const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const CookieStrategy = require('passport-cookie').Strategy;
const sequelize = require('../for_sequelize').sequelize;
const Sequelize = require('sequelize');
const User = require('../models/user')(sequelize, Sequelize);
const argon2 = require('argon2');


//для проверки старых пользователей (из документации)
passport.use('local',new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {
    console.log('proverka');
    User.findOne( {where: {email: email} })
        .then( function (user) {
        if(!user) {
            return done(null, false, {message: 'Incorrect username.'});
        }
        argon2.verify(user.getDataValue('password'), password).then((comparison) => {
            if(!comparison) {
                console.log('wrong password');
                return done(null, false, {message: 'Incorrect password.'});
            }
            else {
                return done(null, user);
            }
        });
        //return done(null, user);
    }).catch(err => {console.log(err);});
}));


passport.use('registration', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, function(req, email, password, done) {
    console.log('this is regis strategy');
    //if(!email) {
      //  return done(null, false, {message: 'email is needed'});
    //}
    //if(!password) {
      //  return done(null, false, {message: 'password is needed'});
    //}
    User.findOne( {where: { email: email }}).then( (user) => {
        if(user) {
            console.log('user is used');
            return done(null, false, { message: 'Email is used by smn else.'});
        }
        else {
            console.log(typeof password);
            argon2.hash(password).then((password) => {
                console.log('passwd is set');
                const newUser = new User({
                    name: req.body.name,
                    email: email,
                    password: password
                });
                newUser.save().then(() => {
                    console.log('user\'s saved ');
                    return done(null, newUser);
                });
                //return done(null, newUser);
            });
        }
    }).catch((err) => {console.log(err); return done(null, false, { message: 'Error occurred. Try later.'});});
}))


passport.use('cookie', new CookieStrategy({
    cookieName: 'session',
    passReqToCallback: true
}, function(req, session, done) {
    console.log('it\'s cookie strategy');
    //console.log(req.user.email + ' ' + req.user.password);
    if(req.user) {
    User.findOne({where: { email: req.user.email }}).then( (user) => {
        //if(err) { return done(err); }
        if (!user) { return done(null, false, { message: 'You tried to get access without authorization(.'}); }
        return done(null, user);
    }).catch((err) => {console.log(err);});
    }
    else {
        return done(null, false, { message: 'You tried to get access without authorization(.'});
    }
}))

passport.serializeUser((user, done) => {
    console.log('trying to serialize '+user.email+' '+user.name);
    done(null, user.id);
})
passport.deserializeUser((id, done) => {
    console.log('trying to deserialize, my id '+id);
    User.findOne({where: {id: id}}).then( (user) => {
        done(null,user);
    }).catch((err) => {done(err);});
})


module.exports.passport = passport;