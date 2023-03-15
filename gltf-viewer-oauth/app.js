// Imports
const path = require('path');
const uuid = require('uuid');

const express = require('express');
const session = require('express-session');  // manages sessions for this app server itself
const bodyParser = require('body-parser');

// Auth + session stuff
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const authentication = require('./authentication');

authentication.init(passport);
console.log(`Passport object: ${JSON.stringify(passport)}`);

const config = require('./config');

// Create the app
const app = express();

var env = config.env;
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// Middleware - rendering static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(bodyParser.json());

// Middleware - auth
app.set('trust proxy', 1); // To allow to run correctly behind Heroku

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
        maxAge: 1000 * 60 * 60 * 24 // 1 day  TODO[Zain][4]: uncomment later 
        // maxAge: 1000 * 60 * 2 // 2 min, b/c we're just testing for now 
    }
}));
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.use('/oauthSignin', (req, res) => {
    console.log(`This is the session BEFORE adding state: ${JSON.stringify(req.session)}`);
    const state = {
        docId: req.query.documentId,
        workId: req.query.workspaceId,
        elId: req.query.elementId
    };
    // ✅ the state var IS defined here
    req.session.onshapeDocParams = state;
    console.log(`This is the session AFTER adding state: ${JSON.stringify(req.session)}`);
    return passport.authenticate('onshape', { state: uuid.v4(state) })(req, res);
}, (req, res) => { /* redirected to Onshape for authentication */ });
/** TODO[Zain]: debug - passport.authenticate() below fails, which is where we visit 
 * the passport.strategy.authorizationURL
*/
app.use('/oauthRedirect', passport.authenticate('onshape', { failureRedirect: '/grantDenied' }), (req, res) => {
    // TODO[Zain][3]: handle the error where the session ids not found - so that app should not crash when folks try to authorize from their applications settings page in Onshape
    console.log(`This is the request session: ${[
        req.session?.onshapeDocParams?.docId,
        req.session?.onshapeDocParams?.workId,
        req.session?.onshapeDocParams?.elId
    ]}`);
    if (req.session.onshapeDocParams) {
        res.redirect(`/?documentId=${req.session.onshapeDocParams.docId}&workspaceId=${req.session.onshapeDocParams.workId}&elementId=${req.session.onshapeDocParams.elId}`);
    } else {
        res.redirect("/");
    }
});

app.get('/grantDenied', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'grantDenied.html'));
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.use('/api', require('./api'));

// catch 404s and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error logging - we only print stack traces for dev env
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log('****** Error ' + err.status, err.message);

        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler - no stacktraces leaked to user
app.use(function(err, req, res, next) {
    console.log('****** Error ' + err.status, err.message);

    res.status(err.status || 500).json('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

module.exports = app;
