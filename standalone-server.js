const path = require('path');
const uuid = require('uuid');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

// const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const OnshapeStrategy = require('passport-onshape');

const config = require('./config');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'standalone')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());

app.set('trust proxy', 1); // To allow to run correctly behind Heroku

// TODO[decide if we need to re-insert Redis & OAuth middleware]
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Controller functions
app.get('/grantDenied', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'grantDenied.html'));
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'standalone', 'html', 'index.html'));
});

app.get('/truck-viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'standalone', 'html', 'viewer.html'));
});

app.use('/api', require('./api'));

module.exports = app;
