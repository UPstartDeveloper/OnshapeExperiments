// Imports
const path = require('path');
const uuid = require('uuid');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

// Auth + session stuff
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const authentication = require('./authentication');

authentication.init(passport);
console.log(JSON.stringify(passport));  // TODO[Zain]: see if this has the correct OAuth creds?

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
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));
app.use(passport.initialize());
app.use(passport.session());


// Routes
app.use('/oauthSignin', (req, res) => {
    const state = {
        docId: req.query.documentId,
        workId: req.query.workspaceId,
        elId: req.query.elementId
    };
    // ✅ the state var IS defined here
    req.session.state = state;
    return passport.authenticate('onshape', { state: uuid.v4(state) })(req, res);
}, (req, res) => { /* redirected to Onshape for authentication */ });
/** TODO[Zain]: debug - the log line below is not called, 
 * which tells me there is something wrong with how
 * passport is configured - could this be related to failing to fetch the user profile?
 * 
 * ****** Error undefined Failed to fetch user profile
Feb 3 02:05:29 PM  node:_http_server:339
Feb 3 02:05:29 PM      throw new ERR_HTTP_INVALID_STATUS_CODE(originalStatusCode);
Feb 3 02:05:29 PM      ^
Feb 3 02:05:29 PM  
Feb 3 02:05:29 PM  RangeError [ERR_HTTP_INVALID_STATUS_CODE]: Invalid status code: error
Feb 3 02:05:29 PM      at new NodeError (node:internal/errors:399:5)
Feb 3 02:05:29 PM      at ServerResponse.writeHead (node:_http_server:339:11)
Feb 3 02:05:29 PM      at ServerResponse.writeHead (/opt/render/project/src/gltf-viewer-oauth/node_modules/on-headers/index.js:44:26)
Feb 3 02:05:29 PM      at ServerResponse._implicitHeader (node:_http_server:330:8)
Feb 3 02:05:29 PM      at write_ (node:_http_outgoing:907:9)
Feb 3 02:05:29 PM      at ServerResponse.end (node:_http_outgoing:1015:5)
Feb 3 02:05:29 PM      at writeend (/opt/render/project/src/gltf-viewer-oauth/node_modules/express-session/index.js:262:22)
Feb 3 02:05:29 PM      at Immediate.ontouch (/opt/render/project/src/gltf-viewer-oauth/node_modules/express-session/index.js:349:11)
Feb 3 02:05:29 PM      at process.processImmediate (node:internal/timers:477:21) {
Feb 3 02:05:29 PM    code: 'ERR_HTTP_INVALID_STATUS_CODE'
Feb 3 02:05:29 PM  }
 */
app.use('/oauthRedirect', passport.authenticate('onshape', { failureRedirect: '/grantDenied' }), (req, res) => {
    console.log(`This is the request session: ${[req.session.state.docId, req.session.state.workId, req.session.state.elId]}`);
    res.redirect(`/?documentId=${req.session.state.docId}&workspaceId=${req.session.state.workId}&elementId=${req.session.state.elId}`);
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
