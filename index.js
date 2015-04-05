'use strict';

var MODULE_NAME = 'plugin-passport';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var passwordHash = require('password-hash');
var express = require('express');
var session = require('express-session');

var _ = require('underscore');
var fs = require('fs');

var nodeplayerConfig = require('nodeplayer').config;
var coreConfig = nodeplayerConfig.getConfig();
var defaultConfig = require('./default-config.js');
var config = nodeplayerConfig.getConfig(MODULE_NAME, defaultConfig);

exports.init = function(player, logger, callback) {
    // dependencies
    if (!player.plugins.express) {
        callback('module must be initialized after express module!');
    } else {
        player.app.use(session({
            secret: config.secret,
            resave: true,
            saveUninitialized: false
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

        _.each(config.protectedPaths, function(path) {
            player.app.use(path, ensureAuthenticated);
        });

        callback();
    }
};
