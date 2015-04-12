nodeplayer-plugin-passport
==========================

[![Build Status](https://travis-ci.org/FruitieX/nodeplayer-plugin-passport.svg?branch=master)](https://travis-ci.org/FruitieX/nodeplayer-plugin-passport)

Provides authentication for express and/or socket.io

Setup
-----

TODO!

1. Enable the module in `core.json`, after `express` and `socketio` but before `rest`.
2. Create a user using `adduser.js`, otherwise default user is `changeMe` with password `keyboard cat`.
3. Decide which API calls should be protected. By default everything is password protected.
