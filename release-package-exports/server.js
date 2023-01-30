const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Auth middleware
const uuid = require('uuid');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const OnshapeStrategy = require('passport-onshape');
const config = require('./config');

app.set('trust proxy', 1); // To allow to run correctly behind Render

app.use(session({
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: config.sessionSecret,
    saveUninitialized: false,
    resave: false,
    cookie: {
        name: 'app-gltf-viewer',
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OnshapeStrategy({
        clientID: config.oauthClientId,
        clientSecret: config.oauthClientSecret,
        callbackURL: config.oauthCallbackUrl,
        authorizationURL: `${config.oauthUrl}/oauth/authorize`,
        tokenURL: `${config.oauthUrl}/oauth/token`,
        userProfileURL: `${config.oauthUrl}/api/users/sessioninfo`
    },
    (accessToken, refreshToken, profile, done) => {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        return done(null, profile);
    }
));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Other middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());

// Controller functions
app.use('/oauthSignin', (req, res) => {
    const state = {
        docId: req.query.documentId,
        workId: req.query.workspaceId,
        elId: req.query.elementId
    };
    req.session.state = state;
    return passport.authenticate('onshape', { state: uuid.v4(state) })(req, res);
}, (req, res) => { /* redirected to Onshape for authentication */ });

app.use('/oauthRedirect', passport.authenticate('onshape', { failureRedirect: '/grantDenied' }), (req, res) => {
    res.redirect(`/?documentId=${req.session.state.docId}&workspaceId=${req.session.state.workId}&elementId=${req.session.state.elId}`);
});

app.get('/grantDenied', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'grantDenied.html'));
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

module.exports = app;