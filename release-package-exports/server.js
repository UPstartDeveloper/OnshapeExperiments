const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.set('trust proxy', 1); // To allow to run correctly behind (Render?)

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Controller functions
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

module.exports = app;