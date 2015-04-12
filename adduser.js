'use strict';

var passwordHash = require('password-hash');

var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var nodeplayerConfig = require('nodeplayer').config;
var defaultConfig = require('./default-config.js');
var config = nodeplayerConfig.getConfig('plugin-passport', defaultConfig);

var readlineSync = require('readline-sync');

var username = readlineSync.question('Username: ');

readlineSync.setMask('');
var password = readlineSync.question('Password: ', {noEchoBack: true});
var password2 = readlineSync.question('Retype password: ', {noEchoBack: true});

if (password !== password2) {
    console.log('\nPasswords mismatch, please try again');
} else {
    console.log('');

    var changeMeUserIndex = _.findIndex(config.users, function(user) {
        return user.userName === 'changeMe';
    });
    if (changeMeUserIndex >= 0) {
        console.log('Removing dummy changeMe user');
        config.users.splice(changeMeUserIndex, 1);
    }

    var oldUser = _.find(config.users, function(user) {
        return user.userName === username;
    });
    if (oldUser) {
        console.log('Updating existing user:', username);
        oldUser.hashedPassword = passwordHash.generate(password);
    } else {
        console.log('Creating new user:', username);
        config.users.push({
            userName: username,
            hashedPassword: passwordHash.generate(password)
        });
    }
    var configPath = path.join(nodeplayerConfig.getConfigDir(), 'plugin-passport.json');
    fs.writeFileSync(configPath, JSON.stringify(config, undefined, 4));
    console.log('Credentials written to:', configPath);
}
