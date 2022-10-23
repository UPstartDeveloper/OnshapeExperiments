const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.set('trust proxy', 1); // To allow to run correctly behind Heroku

/**
 * [Challenge 2]: Express Middleware
 *
 * Part a: Tell Express to serve the static files in our
 * 'standalone' directory. 
 *
 * Part b: Then, let's tell Express we want to 
 * use the bodyParser.json() function, so that we can
 * parse the contents of our API requests via HTTP.
 *
 */
/** your code goes here */

/**
 * [Challenge 3]: Controller functions
 *
 * Part a: Add a namespace for the controller functions in
 * api.js, so our Express can route request towards them.
 * (note: we will see more of api.js in just a sec!)
 *
 * Part b: using res.sendFile(), add route handlers so 
 * that our app can server our index.html and viewer.html pages.
 */
/** your code goes here */



module.exports = app;
