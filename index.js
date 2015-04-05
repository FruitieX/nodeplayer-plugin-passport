'use strict';

var MODULE_NAME = 'plugin-passport';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passwordHash = require('password-hash');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var FileStore = require('session-file-store')(session);
var passportSocketIo = require('passport.socketio');

var _ = require('underscore');
var fs = require('fs');

var nodeplayerConfig = require('nodeplayer').config;
var coreConfig = nodeplayerConfig.getConfig();
var defaultConfig = require('./default-config.js');
var config = nodeplayerConfig.getConfig(MODULE_NAME, defaultConfig);

exports.init = function(player, logger, callback) {
    var storeInstance = new FileStore();

    // socketio protection
    if (config.protectedPaths.socketio && !player.plugins.socketio) {
        logger.warn('socketio paths configured to be protected, module must be ' +
                'initialized after socketio module! Disabling socketio paths protection. ' +
                'To remove this warning, remove the "socketio" property of ' +
                '"protectedPaths" in plugin-passport.json.');
    } else {
        var onAuthorizeSuccess = function(data, accept) {
            accept();
        };
        var onAuthorizeFail = function(data, message, error, accept) {
            if (error) {throw new Error(message);}
            // accept everyone
            return accept();
        };
        player.socketio.use(passportSocketIo.authorize({
            cookieParser: cookieParser,
            key:         'connect.sid',
            secret:      config.secret,
            store:       storeInstance,
            success:     onAuthorizeSuccess,
            fail:        onAuthorizeFail,
        }));
        player.socketio.protectedPaths = config.protectedPaths.socketio;
        _.each(config.protectedPaths.socketio, function(path) {
            logger.verbose('protecting socketio path: ' + path);
        });
    }

    // expressjs protection
    if (config.protectedPaths.express && !player.plugins.express) {
        logger.warn('express paths configured to be protected, module must be ' +
                'initialized after express module! Disabling express paths protection. ' +
                'To remove this warning, remove the "express" property of ' +
                '"protectedPaths" in plugin-passport.json.');
    } else {
        player.app.use(session({
            secret: config.secret,
            resave: true,
            saveUninitialized: false,
            store: storeInstance
        }));
        player.app.use(passport.initialize());
        player.app.use(passport.session());

        passport.use(new LocalStrategy(
            function(userName, password, done) {
                // read config file again
                config = nodeplayerConfig.getConfig(MODULE_NAME, defaultConfig);

                var user = _.find(config.users, function(user) {
                    return user.userName === userName;
                });
                if (!user) {
                    return done(null, false);
                }
                if (!passwordHash.verify(password, user.hashedPassword)) {
                    return done(null, false);
                }
                return done(null, user);
            }
        ));
        passport.serializeUser(function(user, done) {
            done(null, user.userName);
        });
        passport.deserializeUser(function(userName, done) {
            config = nodeplayerConfig.getConfig(MODULE_NAME, defaultConfig);
            var user = _.find(config.users, function(user) {
                return user.userName === userName;
            });
            done(user ? null : 'Invalid user', user);
        });

        player.app.post('/login', function(req, res, next) {
            passport.authenticate('local', function(err, user, info) {
                if (err) {return next(err);}
                if (!user) {
                    return res.status(403).end('Invalid credentials');
                }
                req.logIn(user, function(err) {
                    if (err) {return next(err);}
                    res.cookie('username', user.userName);
                    return res.end('Login successful');
                });
            })(req, res, next);
        });
        player.app.get('/logout', function(req, res) {
            req.logout();
            res.clearCookie('username');
            res.redirect('/');
        });

        var ensureAuthenticated = function(req, res, next) {
            if (req.isAuthenticated()) {return next();}
            res.status(403).end('Login required');
        };

        _.each(config.protectedPaths.express, function(path) {
            logger.verbose('protecting express path: ' + path);
            player.app.use(path, ensureAuthenticated);
        });

    }

    callback();
};
