const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.set('trust proxy', 1); // To allow to run correctly behind Heroku

app.use(express.static(path.join(__dirname, 'standalone')));
app.use(bodyParser.json());

// Controller functions
app.use('/api', require('./api'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'standalone', 'html', 'index.html'));
});

app.get('/truck-viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'standalone', 'html', 'viewer.html'));
});

module.exports = app;
