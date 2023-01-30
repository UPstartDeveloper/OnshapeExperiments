const path = require('path');
const uuid = require('uuid');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

// const RedisStore = require('connect-redis')(session);  // [Zain] old stuff
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
// const OnshapeStrategy = require('passport-onshape');
const OAuth2Strategy = require('passport-onshape');

const config = require('./config');

// const redisClient = require('./redis-client');  // [Zain] old stuff

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());

app.set('trust proxy', 1); // To allow to run correctly behind Heroku

app.use(session({
    // [Zain] old stuff
    // store: new RedisStore({
    //     client: redisClient
    // }),
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
// ***** OLD VERSION ***
// passport.use(
//     new OnshapeStrategy({
//         clientID: config.oauthClientId,
//         clientSecret: config.oauthClientSecret,
//         callbackURL: config.oauthCallbackUrl,
//         authorizationURL: `${config.oauthUrl}/oauth/authorize`,
//         tokenURL: `${config.oauthUrl}/oauth/token`,
//         userProfileURL: `${config.oauthUrl}/api/users/sessioninfo`
//     },
//     (accessToken, refreshToken, profile, done) => {
//         profile.accessToken = accessToken;
//         profile.refreshToken = refreshToken;
//         return done(null, profile);
//     }
// ));
// *** NEW CHANGE - Zain ***
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://oauth.onshape.com/oauth/authorize',
    tokenURL: 'https://oauth.onshape.com/oauth/token',
    clientID: config.oauthClientId,
    clientSecret: config.oauthClientSecret,
    callbackURL: config.oauthCallbackUrl
  },
  (accessToken, refreshToken, profile, done) => {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        return done(null, profile);
    }
));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// TODO[Zain] - see Slack dm to Ron, the error is somewhere here - we go to signin/then redirect after we have the code
// BUT then for some reason the redirection fails and we do not get the access token - resulting in an error
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

app.use('/api', require('./api'));

module.exports = app;
