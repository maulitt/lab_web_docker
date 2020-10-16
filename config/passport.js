const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const CookieStrategy = require('passport-cookie').Strategy;
const mongoose = require('mongoose');
const User = require('../models/user')(sequelize, sequelize.DataTypes);
const argon2 = require('argon2');
const sequelize = require("sequelize");

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
        if(user.getDataValue('password') !== password) {
            return done(null, false, {message: 'Incorrect password.'});
        }
        return done(null, user);
    }).catch(err => {console.log(err);});
}));


passport.use('registration', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function(email, password, done) {
    if(!email) {
        return done(null, false, {message: 'email is needed'});
    }
    if(!password) {
        return done(null, false, {message: 'password is needed'});
    }
    User.findOne( {where: { email: email }}).then( (user) => {
        //if(err) {throw err;}
        if(user) {
            console.log('user is used');
            return done(null, false, { message: 'Email is used by smn else.'});
        }
        else {
            console.log(typeof password);
            argon2.hash(password).then((password) => {
                console.log('passwd is set');
                const newUser = new User({
                    email: email,
                    password: password
                });
                newUser.save().then(() => { console.log('user\'s saved '); });
                return done(null, newUser);
            });
        }
    }).catch((err) => {console.log(err);});
}))


passport.use('cookie', new CookieStrategy({
    cookieName: 'session',
    passReqToCallback: true
}, function(req, session, done) {
    console.log('it\'s cookie strategy');
    //console.log(req.user.email + ' ' + req.user.password);
    User.findOne({where: { email: req.user.email }}).then( (user) => {
        //if(err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user);
    }).catch((err) => {console.log(err);});
}))

passport.serializeUser((user, done) => {
    done(null, user.id);
})
passport.deserializeUser((id, done) => {
    User.findOne({where: {id: id}}).then( (user) => {
        done(null,user);
    }).catch((err) => {done(err);});
})

module.exports.passport = passport;