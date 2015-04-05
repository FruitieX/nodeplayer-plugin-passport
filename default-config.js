var crypto = require('crypto');
var path = require('path');
var nodeplayerConfig = require('nodeplayer').config;

var defaultConfig = {};

defaultConfig.sessionStore = path.join(nodeplayerConfig.getBaseDir(), 'sessions');
defaultConfig.secret = crypto.randomBytes(20).toString('hex');
defaultConfig.users = [
    {
        // keyboard cat
        hashedPassword: 'sha1$9b174107$1$321fe4590c39d4ae5dbdc0a42e0b4471b59176c0',
        userName: 'changeMe'
    }
];
defaultConfig.protectedPaths = {
    express: [
        '/song',
        '/queue/del',
        '/queue/move',
        '/playctl',
        '/volume'
    ],
    socketio: [
        'removeFromQueue',
        'moveInQueue',
        'startPlayback',
        'pausePlayback',
        'skipSongs',
        'shuffleQueue',
        'setVolume'
    ]
};

module.exports = defaultConfig;
