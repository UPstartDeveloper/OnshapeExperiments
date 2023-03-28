// Imports
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');


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
app.set('trust proxy', 1); // To allow to run correctly behind Render

// Routes
// TODO[Zain][3] - in the future, add /oauthSignin, expect a query string akin to 
// ?companyId=cad&server=https%3A%2F%2Fcad.onshape.com&userId=62d6a218a83ae4209330d294&clientId=IB7YN7MPBBVP6MQ3ZVIJO3MWZZSZMDV6VCF6RBQ%3D&locale=en-US
app.use('/oauthRedirect', (req, res) => {
    res.status(600).send({ err: "Whaaaat? this route got called?" });
})
app.get('/grantDenied', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'grantDenied.html'));
});

// TODO[Zain][1] - debug this
app.use('/api', require('./api'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

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

    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: err
    });
});

module.exports = app;
